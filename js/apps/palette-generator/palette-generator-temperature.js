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

  setPaletteAdjustmentControls({
    brightness: getRandomSteppedValue(0, 100, 5),
    saturation: getRandomSteppedValue(0, 100, 5),
  });

  return regeneratePinnedPaletteSlots();
}

async function surpriseImagePalette() {
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
  setPaletteAdjustmentControls(bestCandidate.settings);
  imagePaletteVariantIndex = bestCandidate.variantIndex;
  commitGeneratedPalette(bestCandidate.palette, {
    previousPalette: currentPalette,
  });
}

async function applyInspiredImagePalette() {
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
  rememberInspiredPalette(result.palette);
  setPaletteAdjustmentControls(result.settings);
  commitGeneratedPalette(result.palette, {
    previousPalette: currentPalette,
  });
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
  const centerLightness = 10 + (getCurrentBrightnessValue() / 100) * 80;
  const monochromeSaturation = clampControlValue(
    getCurrentSaturationValue(),
    0,
    LOW_SATURATION_FALLBACK_THRESHOLD
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 8, 36, 72);

  let minLightness = clampControlValue(centerLightness - spread / 2, 10, 90);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 10, 90);

  if (maxLightness - minLightness < 24) {
    minLightness = 10;
    maxLightness = 90;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -6, 6, -12, 12, -18, 18];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const candidate = controlsNormalizeHexColor(
        controlsHslToHex(
          baseHue,
          monochromeSaturation,
          clampControlValue(baseLightness + adjustment, 10, 90)
        )
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
  const saturation = Number.isFinite(settings?.saturation)
    ? settings.saturation
    : getCurrentSaturationValue();
  const brightness = Number.isFinite(settings?.brightness)
    ? settings.brightness
    : getCurrentBrightnessValue();
  const lightness = 10 + (brightness / 100) * 80;

  return controlsHslToHex(hue, saturation, lightness);
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
  const centerLightness = 10 + (settings.brightness / 100) * 80;
  const monochromeSaturation = clampControlValue(
    settings.saturation,
    0,
    LOW_SATURATION_FALLBACK_THRESHOLD
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 8, 36, 72);

  let minLightness = clampControlValue(centerLightness - spread / 2, 10, 90);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 10, 90);

  if (maxLightness - minLightness < 24) {
    minLightness = 10;
    maxLightness = 90;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -6, 6, -12, 12, -18, 18];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const candidate = controlsNormalizeHexColor(
        controlsHslToHex(
          baseHue,
          monochromeSaturation,
          clampControlValue(baseLightness + adjustment, 10, 90)
        )
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
