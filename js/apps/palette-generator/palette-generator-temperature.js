function getRandomSteppedValue(min = 0, max = 100, step = 5) {
  const steps = Math.round((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function getRandomTemperatureSelection() {
  return [
    { warm: true, cool: false },
    { warm: false, cool: true },
    { warm: true, cool: true },
  ][Math.floor(Math.random() * 3)];
}

function getCurrentTemperatureSelectionKey() {
  return `${temperature.warm ? 1 : 0}:${temperature.cool ? 1 : 0}`;
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
  return mapBrightnessValueToOklchLightness(
    Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    {
      minLightness: 0.2,
      maxLightness: 0.92,
      gamma: 0.86,
    }
  );
}

function getTemperatureTargetChroma(settings, options = {}) {
  return mapSaturationValueToOklchChroma(
    Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
    {
      minChroma: Number.isFinite(options.minChroma) ? options.minChroma : 0.0015,
      maxChroma: Number.isFinite(options.maxChroma) ? options.maxChroma : 0.22,
      gamma: Number.isFinite(options.gamma) ? options.gamma : 1.7,
    }
  );
}

function createTemperatureOklchHex(hue, lightness, chroma) {
  return controlsNormalizeHexColor(
    controlsOklchToHex(lightness, chroma, hue, {
      minLightness: 0.12,
      maxLightness: 0.94,
      maxChroma: 0.24,
    })
  );
}

function getTemperatureBasedHue() {
  const useWarmPalette =
    temperature.warm && (!temperature.cool || Math.random() < 0.5);

  if (useWarmPalette) {
    return Math.random() < 0.2
      ? 300 + Math.random() * 60
      : Math.random() * 60;
  }

  return 120 + Math.random() * 180;
}

function buildAlternativeMonochromePalette(targetCount) {
  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = getTemperatureTargetLightness({
    brightness: getCurrentBrightnessValue(),
  });
  const monochromeChroma = getTemperatureTargetChroma(
    {
      saturation: clampControlValue(
        getCurrentSaturationValue(),
        0,
        LOW_SATURATION_FALLBACK_THRESHOLD
      ),
    },
    {
      minChroma: 0.001,
      maxChroma: 0.05,
      gamma: 1.5,
    }
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 0.07, 0.28, 0.56);

  let minLightness = clampControlValue(centerLightness - spread / 2, 0.14, 0.9);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 0.18, 0.94);

  if (maxLightness - minLightness < 0.24) {
    minLightness = 0.14;
    maxLightness = 0.94;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -0.018, 0.018, -0.036, 0.036, -0.054, 0.054];
  const chromaAdjustments = [0, -0.004, 0.004, -0.008, 0.008];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const chromaAdjustment =
        chromaAdjustments[
          Math.abs(Math.round((adjustment || 0) * 1000)) % chromaAdjustments.length
        ];
      const candidate = createTemperatureOklchHex(
        baseHue,
        clampControlValue(baseLightness + adjustment, 0.12, 0.94),
        clampControlValue(monochromeChroma + chromaAdjustment, 0.004, 0.07)
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function buildTemperatureColorFromSettings(settings) {
  const hue = getTemperatureBasedHue();
  const lightness = getTemperatureTargetLightness(settings);
  const chroma = getTemperatureTargetChroma(settings);

  return createTemperatureOklchHex(hue, lightness, chroma);
}

function buildAlternativeMonochromePaletteForSettings(targetCount, settings) {
  if (!settings) {
    return buildAlternativeMonochromePalette(targetCount);
  }

  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = getTemperatureTargetLightness(settings);
  const monochromeChroma = getTemperatureTargetChroma(
    {
      saturation: clampControlValue(
        settings.saturation,
        0,
        LOW_SATURATION_FALLBACK_THRESHOLD
      ),
    },
    {
      minChroma: 0.001,
      maxChroma: 0.05,
      gamma: 1.5,
    }
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 0.07, 0.28, 0.56);

  let minLightness = clampControlValue(centerLightness - spread / 2, 0.14, 0.9);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 0.18, 0.94);

  if (maxLightness - minLightness < 0.24) {
    minLightness = 0.14;
    maxLightness = 0.94;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -0.018, 0.018, -0.036, 0.036, -0.054, 0.054];
  const chromaAdjustments = [0, -0.004, 0.004, -0.008, 0.008];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const chromaAdjustment =
        chromaAdjustments[
          Math.abs(Math.round((adjustment || 0) * 1000)) % chromaAdjustments.length
        ];
      const candidate = createTemperatureOklchHex(
        baseHue,
        clampControlValue(baseLightness + adjustment, 0.12, 0.94),
        clampControlValue(monochromeChroma + chromaAdjustment, 0.004, 0.07)
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function buildTemperaturePaletteForSettings(targetCount, settings) {
  const resolvedSettings = {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
  };
  const usedColors = new Set();
  const nextPalette = [];
  const maxRetriesPerColor = 12;

  for (let index = 0; index < targetCount; index += 1) {
    let color = null;
    let retries = 0;

    while (!color && retries < maxRetriesPerColor) {
      const candidate = buildTemperatureColorFromSettings(resolvedSettings);
      if (!usedColors.has(candidate)) {
        color = candidate;
      }
      retries += 1;
    }

    if (!color) {
      break;
    }

    usedColors.add(color);
    nextPalette.push(color);
  }

  let usedAlternativePalette = false;
  if (
    nextPalette.length < targetCount &&
    resolvedSettings.saturation <= LOW_SATURATION_FALLBACK_THRESHOLD
  ) {
    const alternativePalette = buildAlternativeMonochromePaletteForSettings(
      targetCount,
      resolvedSettings
    );

    if (alternativePalette.length === targetCount) {
      return {
        palette: alternativePalette,
        usedAlternativePalette: true,
      };
    }
  }

  return {
    palette: nextPalette,
    usedAlternativePalette,
  };
}
