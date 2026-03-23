const paletteGeneratorTemperatureHelpers = window.PaletteGeneratorTemperatureHelpers || {};
if (
  typeof paletteGeneratorTemperatureHelpers.getRandomSteppedValue !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.getRandomTemperatureSelection !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.getTemperatureSelectionKey !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.getTemperatureTargetLightness !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.getTemperatureTargetChroma !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.createTemperatureOklchHex !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.getTemperatureBasedHue !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.buildAlternativeMonochromePaletteForSettings !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.buildTemperatureColorFromSettings !== "function" ||
  typeof paletteGeneratorTemperatureHelpers.buildTemperaturePaletteForSettings !== "function"
) {
  throw new Error("PaletteGeneratorTemperatureHelpers are required before palette-generator-temperature.js loads.");
}

function getRandomSteppedValue(min = 0, max = 100, step = 5) {
  return paletteGeneratorTemperatureHelpers.getRandomSteppedValue(min, max, step);
}

function getRandomTemperatureSelection() {
  return paletteGeneratorTemperatureHelpers.getRandomTemperatureSelection();
}

function getCurrentTemperatureSelectionKey() {
  return paletteGeneratorTemperatureHelpers.getTemperatureSelectionKey({
    warm: temperature.warm,
    cool: temperature.cool,
  });
}

function withTemporaryTemperatureSelection(nextSelection, callback) {
  const previousSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  temperature = {
    warm: !!nextSelection?.warm,
    cool: !!nextSelection?.cool,
  };

  try {
    return callback();
  } finally {
    temperature = previousSelection;
  }
}

function createTemperatureCandidate(settings, options = {}) {
  const attemptCount = Number.isFinite(options.attemptCount)
    ? Math.max(1, options.attemptCount)
    : Math.max(24, paletteSize * 8);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  let bestDistinctCandidate = null;
  let bestFallbackCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const candidateResult = buildTemperaturePaletteForSettings(paletteSize, settings);
    if (candidateResult.palette.length === 0) {
      continue;
    }

    const renderedPalette = buildRenderedPaletteFromBaseColors(
      candidateResult.palette,
      settings
    );
    const comparableRenderedPalette = getComparableMergedPaletteSlice(
      renderedPalette,
      pinnedEntries
    );
    const similarityMetrics = getPaletteSimilarityMetrics(comparableRenderedPalette, referencePalette);
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      comparableRenderedPalette,
      referencePalette
    );
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(comparableRenderedPalette.length, 1);
    const candidate = {
      palette: candidateResult.palette,
      renderedPalette,
      usedAlternativePalette: candidateResult.usedAlternativePalette,
      score: scorePaletteHarmony(renderedPalette) - similarityPenalty * 0.85,
      samePositionCount: positionalSimilarityMetrics.samePositionCount,
      isTooSimilar: arePalettesTooSimilar(comparableRenderedPalette, referencePalette),
    };

    if (isBetterPaletteFallbackCandidate(candidate, bestFallbackCandidate)) {
      bestFallbackCandidate = candidate;
    }

    if (
      candidate.samePositionCount === 0 &&
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

async function regenerateTemperaturePaletteKeepingPreferences() {
  const lockedSettings = {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const candidate = createTemperatureCandidate(lockedSettings, {
    referencePalette: currentPalette,
    pinnedEntries,
  });

  if (!candidate) {
    await generatePalette();
    return;
  }

  commitGeneratedPalette(candidate.palette, {
    usedAlternativePalette: candidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

async function surpriseTemperaturePalette() {
  const currentTemperatureKey = getCurrentTemperatureSelectionKey();
  const currentSettings = getCurrentPaletteAdjustmentSnapshot();
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(currentPalette, pinnedEntries)
  );
  let bestCandidate = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nextTemperatureSelection = getRandomTemperatureSelection();
    const nextSettings = {
      brightness: getRandomSteppedValue(0, 100, 5),
      saturation: getRandomSteppedValue(0, 100, 5),
    };
    const temperatureSelectionKey =
      `${nextTemperatureSelection.warm ? 1 : 0}:${nextTemperatureSelection.cool ? 1 : 0}`;
    const candidate = withTemporaryTemperatureSelection(
      nextTemperatureSelection,
      () =>
        createTemperatureCandidate(nextSettings, {
          referencePalette,
          pinnedEntries,
          attemptCount: 10,
        })
    );

    if (!candidate) {
      continue;
    }

    const controlDistance =
      Math.abs(nextSettings.brightness - currentSettings.brightness) +
      Math.abs(nextSettings.saturation - currentSettings.saturation);
    const temperatureBonus = temperatureSelectionKey !== currentTemperatureKey ? 0.28 : 0;
    const noveltyBonus = Math.min(controlDistance / 120, 0.75);
    const score = candidate.score + noveltyBonus + temperatureBonus;

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        temperatureSelection: nextTemperatureSelection,
        settings: nextSettings,
        palette: candidate.palette,
        usedAlternativePalette: candidate.usedAlternativePalette,
        score,
      };
    }
  }

  if (!bestCandidate) {
    await regenerateTemperaturePaletteKeepingPreferences();
    return;
  }

  setTemperatureSelection(bestCandidate.temperatureSelection);
  setPaletteAdjustmentControls(bestCandidate.settings);
  commitGeneratedPalette(bestCandidate.palette, {
    usedAlternativePalette: bestCandidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

function surprisePinnedTemperaturePaletteSlots() {
  if (
    typeof getCurrentPaletteCardEntries !== "function" ||
    typeof getRegeneratedColorForCard !== "function"
  ) {
    return false;
  }

  const cardEntries = getCurrentPaletteCardEntries();
  const mutableEntries = cardEntries.filter((entry) => !entry.pinned);

  if (mutableEntries.length === 0) {
    return false;
  }

  setTemperatureSelection(getRandomTemperatureSelection());
  setPaletteAdjustmentControls({
    brightness: getRandomSteppedValue(0, 100, 5),
    saturation: getRandomSteppedValue(0, 100, 5),
  });

  const nextColors = cardEntries.map((entry) => normalizeHexColor(entry.hex));
  let hasChanged = false;

  mutableEntries.forEach((entry) => {
    const candidate = getRegeneratedColorForCard(entry.card, new Set(nextColors));

    if (!candidate || candidate === entry.hex) {
      return;
    }

    setCardColor(entry.card, candidate);
    nextColors[entry.index] = normalizeHexColor(candidate);
    hasChanged = true;
  });

  if (hasChanged) {
    persistCurrentPaletteSnapshot();
  }

  return hasChanged;
}

function surprisePinnedImagePaletteSlots() {
  if (
    typeof regeneratePinnedPaletteSlots !== "function" ||
    !uploadedBaseImage?.dataUrl
  ) {
    return false;
  }

  const nextPriorityPreference = Math.random() < 0.5;
  prioritizeImageDominantColors = nextPriorityPreference;
  if (paletteImageDominantToggle) {
    paletteImageDominantToggle.checked = nextPriorityPreference;
  }
  syncPaletteGeneratorStoreState(
    {
      prioritizeImageDominantColors,
    },
    {
      scope: "image-dominant-toggle",
    }
  );

  setPaletteAdjustmentControls({
    brightness: getRandomSteppedValue(0, 100, 5),
    saturation: getRandomSteppedValue(0, 100, 5),
  });

  return regeneratePinnedPaletteSlots();
}

async function surpriseImagePalette() {
  const runSurprise = async () => {
    if (!uploadedBaseImage?.dataUrl) {
      return;
    }

    const originalPriorityPreference = prioritizeImageDominantColors;
    const pinnedEntries = getPinnedPaletteEntriesSnapshot();
    const referencePalette = normalizePaletteHexCollection(
      getComparablePaletteSlice(currentPalette, pinnedEntries)
    );
    const currentSettings = getCurrentPaletteAdjustmentSnapshot();
    let bestCandidate = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidatePriorityPreference = Math.random() < 0.5;
      const candidateSettings = {
        brightness: getRandomSteppedValue(0, 100, 5),
        saturation: getRandomSteppedValue(0, 100, 5),
      };
      const candidateVariantIndex =
        imagePaletteVariantIndex +
        1 +
        Math.floor(Math.random() * IMAGE_PALETTE_VARIANT_PROFILES.length * 2);

      prioritizeImageDominantColors = candidatePriorityPreference;
      const candidateResult = await buildImageBasedPaletteCandidate(paletteSize, {
        startVariantIndex: candidateVariantIndex,
        referencePalette,
        pinnedEntries,
        maxVariantAttempts: IMAGE_PALETTE_VARIANT_PROFILES.length * 3,
      });

      if (candidateResult.palette.length === 0) {
        continue;
      }

      const renderedPalette = buildRenderedPaletteFromBaseColors(
        candidateResult.palette,
        candidateSettings
      );
      const comparableRenderedPalette = getComparableMergedPaletteSlice(
        renderedPalette,
        pinnedEntries
      );
      const similarityMetrics = getPaletteSimilarityMetrics(comparableRenderedPalette, referencePalette);
      const similarityPenalty =
        similarityMetrics.sharedColorCount / Math.max(comparableRenderedPalette.length, 1);
      const controlDistance =
        Math.abs(candidateSettings.brightness - currentSettings.brightness) +
        Math.abs(candidateSettings.saturation - currentSettings.saturation);
      const priorityBonus =
        candidatePriorityPreference !== originalPriorityPreference ? 0.16 : 0;
      const score =
        scorePaletteHarmony(renderedPalette) -
        similarityPenalty * 0.7 +
        Math.min(controlDistance / 120, 0.8) +
        priorityBonus;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          prioritizeDominant: candidatePriorityPreference,
          settings: candidateSettings,
          palette: candidateResult.palette,
          variantIndex: candidateResult.variantIndex,
          score,
        };
      }
    }

    prioritizeImageDominantColors = originalPriorityPreference;

    if (!bestCandidate) {
      await syncImagePaletteFromSource({ advanceVariant: true });
      return;
    }

    prioritizeImageDominantColors = bestCandidate.prioritizeDominant;
    if (paletteImageDominantToggle) {
      paletteImageDominantToggle.checked = bestCandidate.prioritizeDominant;
    }
    syncPaletteGeneratorStoreState(
      {
        prioritizeImageDominantColors,
      },
      {
        scope: "image-dominant-toggle",
      }
    );
    setPaletteAdjustmentControls(bestCandidate.settings);
    imagePaletteVariantIndex = bestCandidate.variantIndex;
    syncPaletteGeneratorStoreState(
      {
        imagePaletteVariantIndex,
      },
      {
        scope: "image-palette-variant",
      }
    );
    commitGeneratedPalette(bestCandidate.palette, {
      previousPalette: currentPalette,
    });
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runSurprise);
  }

  return runSurprise();
}

async function applyInspiredImagePalette() {
  const runInspiration = async () => {
    const targetCount = Number.isFinite(paletteSize) && paletteSize > 0 ? paletteSize : 5;
    const result = await buildInspiredImagePaletteCandidate(targetCount, {
      referencePalette: currentPalette,
    });

    if (!Array.isArray(result.palette) || result.palette.length === 0) {
      setPaletteImageExtractionFeedback(true, IMAGE_EXTRACTION_ERROR_MESSAGE);
      revealPaletteImageDropzoneForRetry();
      return;
    }

    imageInspirationVariantIndex = result.variantIndex + 1;
    syncPaletteGeneratorStoreState(
      {
        imageInspirationVariantIndex,
      },
      {
        scope: "image-inspiration-variant",
      }
    );
    rememberInspiredPalette(result.palette);
    setPaletteAdjustmentControls(result.settings);
    commitGeneratedPalette(result.palette, {
      previousPalette: currentPalette,
    });
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runInspiration);
  }

  return runInspiration();
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.addEventListener("click", () => {
    if (surpriseBtn.disabled) {
      return;
    }

    if (paletteBaseMode === "temperature" && getPinnedPaletteEntriesSnapshot().length > 0) {
      if (surprisePinnedTemperaturePaletteSlots()) {
        return;
      }
    }

    if (paletteBaseMode === "image" && getPinnedPaletteEntriesSnapshot().length > 0) {
      surprisePinnedImagePaletteSlots();
      return;
    }

    if (paletteBaseMode === "image") {
      void surpriseImagePalette();
      return;
    }

    void surpriseTemperaturePalette();
  });
}
function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}

function getTemperatureTargetLightness(settings) {
  return paletteGeneratorTemperatureHelpers.getTemperatureTargetLightness(settings, {
    fallbackBrightness: getCurrentBrightnessValue(),
    minLightness: 0.2,
    maxLightness: 0.92,
    gamma: 0.86,
  });
}

function getTemperatureTargetChroma(settings, options = {}) {
  return paletteGeneratorTemperatureHelpers.getTemperatureTargetChroma(settings, {
    fallbackSaturation: getCurrentSaturationValue(),
    minChroma: Number.isFinite(options.minChroma) ? options.minChroma : 0.0015,
    maxChroma: Number.isFinite(options.maxChroma) ? options.maxChroma : 0.22,
    gamma: Number.isFinite(options.gamma) ? options.gamma : 1.7,
  });
}

function createTemperatureOklchHex(hue, lightness, chroma) {
  return paletteGeneratorTemperatureHelpers.createTemperatureOklchHex(
    hue,
    lightness,
    chroma
  );
}

function getTemperatureBasedHue() {
  return paletteGeneratorTemperatureHelpers.getTemperatureBasedHue({
    warm: temperature.warm,
    cool: temperature.cool,
  });
}

function buildAlternativeMonochromePalette(targetCount) {
  return paletteGeneratorTemperatureHelpers.buildAlternativeMonochromePaletteForSettings(
    targetCount,
    {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    },
    {
      temperatureSelection: {
        warm: temperature.warm,
        cool: temperature.cool,
      },
      fallbackBrightness: getCurrentBrightnessValue(),
      fallbackSaturation: getCurrentSaturationValue(),
      lowSaturationThreshold: LOW_SATURATION_FALLBACK_THRESHOLD,
      isDisallowedColor,
    }
  );
}

function buildTemperatureColorFromSettings(settings) {
  return paletteGeneratorTemperatureHelpers.buildTemperatureColorFromSettings(settings, {
    temperatureSelection: {
      warm: temperature.warm,
      cool: temperature.cool,
    },
    fallbackBrightness: getCurrentBrightnessValue(),
    fallbackSaturation: getCurrentSaturationValue(),
  });
}

function buildAlternativeMonochromePaletteForSettings(targetCount, settings) {
  return paletteGeneratorTemperatureHelpers.buildAlternativeMonochromePaletteForSettings(
    targetCount,
    settings,
    {
      temperatureSelection: {
        warm: temperature.warm,
        cool: temperature.cool,
      },
      fallbackBrightness: getCurrentBrightnessValue(),
      fallbackSaturation: getCurrentSaturationValue(),
      lowSaturationThreshold: LOW_SATURATION_FALLBACK_THRESHOLD,
      isDisallowedColor,
    }
  );
}

function buildTemperaturePaletteForSettings(targetCount, settings) {
  return paletteGeneratorTemperatureHelpers.buildTemperaturePaletteForSettings(
    targetCount,
    settings,
    {
      temperatureSelection: {
        warm: temperature.warm,
        cool: temperature.cool,
      },
      fallbackBrightness: getCurrentBrightnessValue(),
      fallbackSaturation: getCurrentSaturationValue(),
      lowSaturationThreshold: LOW_SATURATION_FALLBACK_THRESHOLD,
      isDisallowedColor,
      maxRetriesPerColor: 12,
    }
  );
}
