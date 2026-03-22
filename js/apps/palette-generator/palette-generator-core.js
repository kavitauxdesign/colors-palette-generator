// Palette generator core: shared state helpers, adjustments, scoring and commit flow.
const controlsHslToHex = window.AppColorUtils?.hslToHex;
const controlsNormalizeHexColor = window.AppColorUtils?.normalizeHexColor;
const controlsIsValidHexColor = window.AppColorUtils?.isValidHexColor;
const controlsHexToRgb = window.AppColorUtils?.hexToRgb;
const controlsHexToHsl = window.AppColorUtils?.hexToHsl;
const controlsHexToOklch = window.AppColorUtils?.hexToOklch;
const controlsOklchToHex = window.AppColorUtils?.oklchToHex;
const controlsGetRgbDistance = window.AppColorUtils?.getRgbDistance;
if (
  typeof controlsHslToHex !== "function" ||
  typeof controlsNormalizeHexColor !== "function" ||
  typeof controlsIsValidHexColor !== "function" ||
  typeof controlsHexToRgb !== "function" ||
  typeof controlsHexToHsl !== "function" ||
  typeof controlsHexToOklch !== "function" ||
  typeof controlsOklchToHex !== "function" ||
  typeof controlsGetRgbDistance !== "function"
) {
  throw new Error("AppColorUtils helpers are required before script-controls.js loads.");
}

let saturationAttentionTimeout = null;
let isPaletteImageDropzoneVisible = true;
let isReplaceImagePending = false;
let isPaletteAdjustPanelOpen = false;
let paletteLoadingOverlayDepth = 0;
const imagePanelTransitionMs = 320;
const allowedPaletteImageTypes = new Set(["image/jpeg", "image/png", "image/svg+xml", "image/webp"]);
const allowedPaletteImageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
const IMAGE_EXTRACTION_ERROR_MESSAGE =
  "No se ha podido extraer colores. Has de intentar subir otra imagen.";
const IMAGE_PALETTE_VARIANT_PROFILES = [
  { hueShift: 0, saturationShift: 0, lightnessShift: 0, stagger: [0, 0, 0, 0] },
  { hueShift: 4, saturationShift: -6, lightnessShift: 8, stagger: [0, 6, -4, 10] },
  { hueShift: -5, saturationShift: 8, lightnessShift: -6, stagger: [0, -8, 6, -12] },
  { hueShift: 10, saturationShift: -10, lightnessShift: 4, stagger: [0, 10, -6, 14] },
  { hueShift: -12, saturationShift: 6, lightnessShift: 10, stagger: [0, -10, 8, -6] },
  { hueShift: 16, saturationShift: -4, lightnessShift: -10, stagger: [0, 12, -10, 6] },
];
const IMAGE_INSPIRATION_VARIANT_PROFILES = [
  { hueShift: 10, saturationShift: 10, lightnessShift: 8, accentHueShift: 22, accentBoost: 18, neutralLift: 8 },
  { hueShift: -14, saturationShift: 6, lightnessShift: -6, accentHueShift: -24, accentBoost: 20, neutralLift: 3 },
  { hueShift: 18, saturationShift: -8, lightnessShift: 10, accentHueShift: 28, accentBoost: 16, neutralLift: 10 },
  { hueShift: -20, saturationShift: 12, lightnessShift: 4, accentHueShift: -26, accentBoost: 22, neutralLift: 4 },
  { hueShift: 8, saturationShift: -6, lightnessShift: -10, accentHueShift: 18, accentBoost: 14, neutralLift: -2 },
  { hueShift: 24, saturationShift: 4, lightnessShift: -4, accentHueShift: 34, accentBoost: 24, neutralLift: 6 },
  { hueShift: -26, saturationShift: -2, lightnessShift: 12, accentHueShift: -32, accentBoost: 18, neutralLift: 11 },
];
const MAX_RECENT_INSPIRED_PALETTES = 8;

function blendControlValue(fromValue, toValue, ratio) {
  return fromValue + (toValue - fromValue) * ratio;
}

function setPaletteLoadingOverlayState(isVisible) {
  if (!paletteLoadingOverlay || !paletteViewport) {
    return;
  }

  paletteLoadingOverlay.hidden = !isVisible;
  paletteLoadingOverlay.setAttribute("aria-hidden", isVisible ? "false" : "true");
  paletteViewport.classList.toggle("is-loading", isVisible);
}

function waitForPaletteLoadingOverlayPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function withPaletteLoadingOverlay(task) {
  const shouldWaitForPaint = paletteLoadingOverlayDepth === 0;
  paletteLoadingOverlayDepth += 1;
  setPaletteLoadingOverlayState(true);

  try {
    if (shouldWaitForPaint) {
      await waitForPaletteLoadingOverlayPaint();
    }

    return await task();
  } finally {
    paletteLoadingOverlayDepth = Math.max(0, paletteLoadingOverlayDepth - 1);
    if (paletteLoadingOverlayDepth === 0) {
      setPaletteLoadingOverlayState(false);
    }
  }
}

function resolvePaletteAdjustmentSettings(settings = {}) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
  };
}

function isValidPaletteHex(hex) {
  return controlsIsValidHexColor(hex);
}

function updateUploadedImageAnalysisCache(cachePatch) {
  if (!uploadedBaseImage) {
    return;
  }

  uploadedBaseImage.analysisCache = {
    ...(uploadedBaseImage.analysisCache || {}),
    ...cachePatch,
  };

  syncPaletteGeneratorStoreState(
    {
      uploadedBaseImage,
    },
    {
      scope: "uploaded-image-cache",
    }
  );
}

function updateRangeControl(input, valueLabel, lowIcon, highIcon) {
  if (!input) {
    return;
  }

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);

  // Update slider fill based on current value
  const percent = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--value", percent + "%");
  if (valueLabel) {
    valueLabel.textContent = `${Math.round(percent)}%`;
  }

  if (lowIcon) {
    lowIcon.style.transform = "none";
    lowIcon.style.opacity = `${Math.max(0.5, 1 - (percent / 100) * 0.4)}`;
  }
  if (highIcon) {
    highIcon.style.transform = "none";
    highIcon.style.opacity = `${Math.max(0.5, 0.5 + (percent / 100) * 0.4)}`;
  }
}

const updateBrightnessProgress = () =>
  updateRangeControl(
    brightnessInput,
    brightnessValueLabel,
    darkBrightnessIcon,
    lightBrightnessIcon
  );

const updateSaturationProgress = () =>
  updateRangeControl(
    saturationInput,
    saturationValueLabel,
    lowSaturationIcon,
    highSaturationIcon
  );

function getCurrentPaletteAdjustmentSnapshot() {
  return resolvePaletteAdjustmentSettings();
}

function capturePaletteAdjustmentBase(colors = currentPalette, settings = getCurrentPaletteAdjustmentSnapshot()) {
  const validColors = Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => isValidPaletteHex(hex))
    : [];

  paletteAdjustmentBase = [...validColors];
  paletteAdjustmentBaseSettings = resolvePaletteAdjustmentSettings({
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : DEFAULT_SATURATION,
  });
}

function getPaletteAdjustmentDeltas(
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const resolvedBaseSettings = resolvePaletteAdjustmentSettings(baseSettings);

  return {
    brightnessDelta: resolvedSettings.brightness - resolvedBaseSettings.brightness,
    saturationDelta: resolvedSettings.saturation - resolvedBaseSettings.saturation,
  };
}

function mapBrightnessValueToOklchLightness(
  brightness,
  options = {}
) {
  const minimumLightness = Number.isFinite(options.minLightness)
    ? options.minLightness
    : 0.18;
  const maximumLightness = Number.isFinite(options.maxLightness)
    ? options.maxLightness
    : 0.94;
  const gamma = Number.isFinite(options.gamma) ? options.gamma : 0.84;
  const ratio = clampControlValue((Number(brightness) || 0) / 100, 0, 1);

  return minimumLightness + (maximumLightness - minimumLightness) * (ratio ** gamma);
}

function mapSaturationValueToOklchChroma(
  saturation,
  options = {}
) {
  const minimumChroma = Number.isFinite(options.minChroma)
    ? options.minChroma
    : 0.0015;
  const maximumChroma = Number.isFinite(options.maxChroma)
    ? options.maxChroma
    : 0.24;
  const gamma = Number.isFinite(options.gamma) ? options.gamma : 1.7;
  const ratio = clampControlValue((Number(saturation) || 0) / 100, 0, 1);

  return minimumChroma + (maximumChroma - minimumChroma) * (ratio ** gamma);
}

function getAdjustedPaletteColor(
  hex,
  variantIndex = 0,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const oklch = controlsHexToOklch(hex);
  if (!oklch) {
    return controlsNormalizeHexColor(hex);
  }

  const lightnessVariants = [0, -0.014, 0.014, -0.028, 0.028, -0.04, 0.04];
  const hueVariants = [0];
  const chromaVariants = [1, 0.99, 1.01, 0.97, 1.03];
  const lightnessOffset = lightnessVariants[variantIndex % lightnessVariants.length];
  const hueOffset =
    hueVariants[Math.floor(variantIndex / lightnessVariants.length) % hueVariants.length];
  const chromaScale =
    chromaVariants[
      Math.floor(variantIndex / (lightnessVariants.length * hueVariants.length)) %
        chromaVariants.length
    ];
  const saturationMappingOptions = {
    minChroma: 0.001,
    maxChroma: 0.24,
    gamma: 1.35,
  };
  const baseLightnessAnchor = mapBrightnessValueToOklchLightness(baseSettings?.brightness);
  const targetLightnessAnchor = mapBrightnessValueToOklchLightness(settings?.brightness);
  const baseSaturationAnchor = mapSaturationValueToOklchChroma(
    baseSettings?.saturation,
    saturationMappingOptions
  );
  const targetSaturationAnchor = mapSaturationValueToOklchChroma(
    settings?.saturation,
    saturationMappingOptions
  );
  const brightnessShift = (targetLightnessAnchor - baseLightnessAnchor) * 0.7;
  const chromaRatio = baseSaturationAnchor > 0.0001
    ? targetSaturationAnchor / baseSaturationAnchor
    : 1;
  const nextLightness = clampControlValue(
    oklch.l + brightnessShift + lightnessOffset,
    0.14,
    0.96
  );
  const variantChroma = Math.max(oklch.c, 0.003) * chromaScale;
  const nextChroma = clampControlValue(
    variantChroma * clampControlValue(chromaRatio, 0.02, 1.25),
    0.001,
    0.28
  );

  return controlsNormalizeHexColor(
    controlsOklchToHex(
      nextLightness,
      nextChroma,
      oklch.h + hueOffset,
      {
        minLightness: 0.14,
        maxLightness: 0.96,
        maxChroma: 0.28,
      }
    ) || hex
  );
}

function buildAdjustedPaletteFromBase(
  colors = paletteAdjustmentBase,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const adjustedPalette = [];
  const usedColors = new Set();
  const baseCardIndex =
    paletteBaseMode === "color" && typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(Array.isArray(colors) ? colors.length : 0)
      : -1;
  const complementaryCardIndex =
    paletteBaseMode === "color" && typeof getComplementaryRoleCardIndex === "function"
      ? getComplementaryRoleCardIndex(Array.isArray(colors) ? colors.length : 0)
      : -1;

  colors.forEach((color, colorIndex) => {
    if (colorIndex === baseCardIndex && paletteBaseMode === "color") {
      const fixedBaseColor = controlsNormalizeHexColor(selectedPaletteBaseColor || color);
      if (!usedColors.has(fixedBaseColor)) {
        usedColors.add(fixedBaseColor);
        adjustedPalette.push(fixedBaseColor);
        return;
      }
    }

    if (colorIndex === complementaryCardIndex && paletteBaseMode === "color") {
      const fixedComplementaryColor = controlsNormalizeHexColor(color);
      if (!usedColors.has(fixedComplementaryColor)) {
        usedColors.add(fixedComplementaryColor);
        adjustedPalette.push(fixedComplementaryColor);
        return;
      }
    }

    let fallbackCandidate = controlsNormalizeHexColor(color);

    for (let variantIndex = 0; variantIndex < 28; variantIndex++) {
      const candidate = getAdjustedPaletteColor(
        color,
        variantIndex + colorIndex * 2,
        settings,
        baseSettings
      );
      fallbackCandidate = candidate || fallbackCandidate;
      if (usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      adjustedPalette.push(candidate);
      return;
    }

    adjustedPalette.push(fallbackCandidate);
  });

  return adjustedPalette;
}

function buildRenderedPaletteFromBaseColors(colors, settings) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  return buildAdjustedPaletteFromBase(colors, resolvedSettings, resolvedSettings);
}

function renderAdjustedPalette(colors) {
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mergedColors = mergePaletteWithPinnedColors(colors, pinnedEntries);
  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedColors.length)
    .map((entry) => entry.index);
  const cards = Array.from(getColorCards());

  if (cards.length !== mergedColors.length) {
    getColorCards().forEach((card) => card.remove());
    mergedColors.forEach((color, index) => {
      createColorCard(color, {
        pinned: pinnedIndexes.includes(index),
      });
    });
  } else {
    cards.forEach((card, index) => {
      setCardColor(card, mergedColors[index]);
      setCardPinnedState(card, pinnedIndexes.includes(index));
    });
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();
  syncCurrentPaletteFromDom();
}

function applyCurrentPaletteAdjustments() {
  if (!Array.isArray(paletteAdjustmentBase) || paletteAdjustmentBase.length === 0) {
    return;
  }

  renderAdjustedPalette(buildAdjustedPaletteFromBase());
}

function normalizePaletteHexCollection(colors) {
  return Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => isValidPaletteHex(hex))
    : [];
}

function getPaletteSimilarityMetrics(nextPalette, referencePalette) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);

  if (nextColors.length === 0 || referenceColors.length === 0) {
    return {
      exactMatch: false,
      sharedColorCount: 0,
      nextCount: nextColors.length,
      referenceCount: referenceColors.length,
    };
  }

  const exactMatch =
    nextColors.length === referenceColors.length &&
    nextColors.every((color, index) => color === referenceColors[index]);

  const referenceSet = new Set(referenceColors);
  const sharedColorCount = nextColors.reduce((count, color) => {
    return count + (referenceSet.has(color) ? 1 : 0);
  }, 0);

  return {
    exactMatch,
    sharedColorCount,
    nextCount: nextColors.length,
    referenceCount: referenceColors.length,
  };
}

function getPalettePositionalSimilarityMetrics(nextPalette, referencePalette) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);
  const comparableCount = Math.min(nextColors.length, referenceColors.length);
  let samePositionCount = 0;

  for (let index = 0; index < comparableCount; index += 1) {
    if (nextColors[index] === referenceColors[index]) {
      samePositionCount += 1;
    }
  }

  return {
    samePositionCount,
    comparableCount,
    nextCount: nextColors.length,
    referenceCount: referenceColors.length,
  };
}

function arePalettesTooSimilar(nextPalette, referencePalette) {
  const similarityMetrics = getPaletteSimilarityMetrics(nextPalette, referencePalette);
  return (
    similarityMetrics.exactMatch ||
    similarityMetrics.sharedColorCount >= Math.max(similarityMetrics.nextCount - 1, 3)
  );
}

function getPinnedPaletteIndexSet(pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  const indexSet = new Set();

  if (!Array.isArray(pinnedEntries)) {
    return indexSet;
  }

  pinnedEntries.forEach((entry) => {
    if (Number.isFinite(entry?.index) && entry.index >= 0) {
      indexSet.add(entry.index);
    }
  });

  return indexSet;
}

function getComparablePaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);

  if (normalizedColors.length === 0 || pinnedIndexes.size === 0) {
    return normalizedColors;
  }

  return normalizedColors.filter((color, index) => !pinnedIndexes.has(index));
}

function getComparableMergedPaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return getComparablePaletteSlice(
    mergePaletteWithPinnedColors(colors, pinnedEntries),
    pinnedEntries
  );
}

function isBetterPaletteFallbackCandidate(nextCandidate, currentFallbackCandidate) {
  if (!currentFallbackCandidate) {
    return true;
  }

  if (nextCandidate.samePositionCount !== currentFallbackCandidate.samePositionCount) {
    return nextCandidate.samePositionCount < currentFallbackCandidate.samePositionCount;
  }

  if (nextCandidate.isTooSimilar !== currentFallbackCandidate.isTooSimilar) {
    return !nextCandidate.isTooSimilar;
  }

  return nextCandidate.score > currentFallbackCandidate.score;
}

function getMutablePaletteSlotCount(totalCount = paletteSize, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) {
    return 0;
  }

  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);
  let pinnedCount = 0;

  pinnedIndexes.forEach((index) => {
    if (index < totalCount) {
      pinnedCount += 1;
    }
  });

  return Math.max(0, totalCount - pinnedCount);
}

function clearRecentInspiredPalettes() {
  recentInspiredPalettes = [];
}

function rememberInspiredPalette(colors) {
  const normalizedPalette = normalizePaletteHexCollection(colors);
  if (normalizedPalette.length === 0) {
    return;
  }

  const signature = normalizedPalette.join("|");
  recentInspiredPalettes = recentInspiredPalettes
    .filter((palette) => normalizePaletteHexCollection(palette).join("|") !== signature)
    .concat([normalizedPalette])
    .slice(-MAX_RECENT_INSPIRED_PALETTES);
}

function isPaletteTooSimilarToRecentInspiredPalettes(nextPalette, recentPalettes = recentInspiredPalettes) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(recentPalettes) || recentPalettes.length === 0) {
    return false;
  }

  return recentPalettes.some((palette) => arePalettesTooSimilar(normalizedPalette, palette));
}
function clampControlValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentBrightnessValue() {
  const sliderValue = brightnessInput
    ? parseFloat(brightnessInput.value)
    : DEFAULT_BRIGHTNESS;

  return Number.isFinite(sliderValue) ? sliderValue : DEFAULT_BRIGHTNESS;
}

function getCurrentSaturationValue() {
  const saturationValue = saturationInput
    ? parseFloat(saturationInput.value)
    : DEFAULT_SATURATION;

  return Number.isFinite(saturationValue) ? saturationValue : DEFAULT_SATURATION;
}

function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}
function scorePaletteHarmony(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
  }

  if (normalizedColors.length === 1) {
    return 0;
  }

  const paletteOklch = normalizedColors.map((color) => controlsHexToOklch(color));
  let pairwiseDistanceScore = 0;
  let pairCount = 0;
  let closePairPenalty = 0;

  for (let leftIndex = 0; leftIndex < normalizedColors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedColors.length; rightIndex += 1) {
      const distance =
        window.AppColorUtils?.getColorDistance?.(
          normalizedColors[leftIndex],
          normalizedColors[rightIndex],
          { method: "deltae2000" }
        ) || 0;

      pairwiseDistanceScore += Math.min(distance / 34, 1);
      if (distance < 10) {
        closePairPenalty += (10 - distance) / 10;
      }
      pairCount += 1;
    }
  }

  const averageDistanceScore = pairCount > 0 ? pairwiseDistanceScore / pairCount : 0;
  const averageSaturation =
    paletteOklch.reduce((sum, color) => sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100), 0) /
    paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100), 0) /
    paletteOklch.length;
  const saturationBalance = 1 - Math.min(Math.abs(averageSaturation - 42) / 42, 1);
  const lightnessBalance = 1 - Math.min(Math.abs(averageLightness - 58) / 58, 1);

  return (
    averageDistanceScore * 2.1 +
    saturationBalance * 0.75 +
    lightnessBalance * 0.7 -
    closePairPenalty * 0.9
  );
}

function scorePaletteElegance(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
  }

  const paletteOklch = normalizedColors.map((color) => controlsHexToOklch(color));
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageSaturationDeviation =
    paletteOklch.reduce((sum, color) => {
      const chromaPercent = clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
      return sum + Math.abs(chromaPercent - averageSaturation);
    }, 0) / paletteOklch.length;
  const averageLightnessDeviation =
    paletteOklch.reduce((sum, color) => {
      const lightnessPercent = clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
      return sum + Math.abs(lightnessPercent - averageLightness);
    }, 0) / paletteOklch.length;
  const vividCount = paletteOklch.filter((color) => ((color?.c ?? 0) / 0.24) * 100 > 62).length;
  const extremeLightnessCount = paletteOklch.filter((color) => {
    const lightnessPercent = ((color?.l ?? 0.5) * 100);
    return lightnessPercent < 22 || lightnessPercent > 82;
  }).length;
  const softColorCount = paletteOklch.filter((color) => {
    const chromaPercent = ((color?.c ?? 0) / 0.24) * 100;
    return chromaPercent >= 18 && chromaPercent <= 52;
  }).length;
  const elegantSaturationBalance = 1 - Math.min(Math.abs(averageSaturation - 36) / 36, 1);
  const elegantLightnessBalance = 1 - Math.min(Math.abs(averageLightness - 58) / 58, 1);
  const saturationSpreadBalance = 1 - Math.min(Math.abs(averageSaturationDeviation - 12) / 20, 1);
  const lightnessSpreadBalance = 1 - Math.min(Math.abs(averageLightnessDeviation - 13) / 22, 1);

  return (
    elegantSaturationBalance * 0.95 +
    elegantLightnessBalance * 0.85 +
    saturationSpreadBalance * 0.65 +
    lightnessSpreadBalance * 0.6 +
    (softColorCount / paletteOklch.length) * 0.4 -
    (vividCount / paletteOklch.length) * 0.85 -
    (extremeLightnessCount / paletteOklch.length) * 0.75
  );
}

function setPaletteAdjustmentControls(settings) {
  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    updateSaturationProgress();
  }

  syncTemperatureControlsState();
  syncPaletteGeneratorStoreAdjustments(settings, {
    scope: "adjustments-controls",
  });
}

function getPinnedPaletteEntriesSnapshot() {
  if (typeof getCurrentPaletteCardEntries !== "function") {
    return [];
  }

  if (
    typeof isCardPinningAvailable === "function" &&
    !isCardPinningAvailable()
  ) {
    return [];
  }

  if (
    typeof isColorModeMonochromaticScaleActive === "function" &&
    isColorModeMonochromaticScaleActive()
  ) {
    return [];
  }

  return getCurrentPaletteCardEntries()
    .filter((entry) => {
      if (!entry.pinned) {
        return false;
      }

      if (entry.card?.dataset.readonlyFixedPin === "true") {
        return false;
      }

      // In color mode, the base card is controlled by the base-color input,
      // so it should not behave like a regular pinned slot during regeneration.
      const baseCardIndex =
        typeof getColorModeBaseCardIndex === "function"
          ? getColorModeBaseCardIndex(getColorCards().length)
          : 0;
      if (paletteBaseMode === "color" && entry.index === baseCardIndex) {
        return false;
      }

      const complementaryCardIndex =
        typeof getComplementaryRoleCardIndex === "function"
          ? getComplementaryRoleCardIndex(getColorCards().length)
          : -1;
      if (
        typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected() &&
        paletteBaseMode === "color" &&
        entry.index === complementaryCardIndex
      ) {
        return false;
      }

      return true;
    })
    .map((entry) => ({
      index: entry.index,
      hex: controlsNormalizeHexColor(entry.hex),
    }))
    .filter((entry) => isValidPaletteHex(entry.hex));
}

function mergePaletteWithPinnedColors(nextPalette, pinnedEntries = []) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(pinnedEntries) || pinnedEntries.length === 0) {
    return normalizedPalette;
  }

  const mergedPalette = new Array(normalizedPalette.length).fill(null);
  const usedColors = new Set();

  pinnedEntries.forEach((entry) => {
    if (!Number.isFinite(entry?.index) || entry.index < 0 || entry.index >= mergedPalette.length) {
      return;
    }

    const normalizedHex = controlsNormalizeHexColor(entry.hex);
    if (!isValidPaletteHex(normalizedHex) || usedColors.has(normalizedHex)) {
      return;
    }

    mergedPalette[entry.index] = normalizedHex;
    usedColors.add(normalizedHex);
  });

  const availableColors = normalizedPalette.filter((color) => !usedColors.has(color));
  let colorCursor = 0;

  for (let index = 0; index < mergedPalette.length; index += 1) {
    if (mergedPalette[index]) {
      continue;
    }

    const nextColor = availableColors[colorCursor];
    if (!nextColor) {
      break;
    }

    mergedPalette[index] = nextColor;
    usedColors.add(nextColor);
    colorCursor += 1;
  }

  return mergedPalette.filter((color) => isValidPaletteHex(color));
}

function commitGeneratedPalette(nextPalette, options = {}) {
  const previousPalette = normalizePaletteHexCollection(
    options.previousPalette ?? currentPalette
  );
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  let mergedPalette = mergePaletteWithPinnedColors(nextPalette, pinnedEntries);

  if (
    paletteBaseMode === "color" &&
    options.effectiveType === "complementary" &&
    paletteSize === 2 &&
    typeof buildComplementaryColorModePalette === "function"
  ) {
    const explicitComplementaryPair = buildComplementaryColorModePalette(
      2,
      getCurrentPaletteAdjustmentSnapshot(),
      {
        baseColor:
          typeof getPaletteBaseColorSnapshot === "function"
            ? getPaletteBaseColorSnapshot()
            : null,
        variantIndex: 0,
      }
    );

    if (explicitComplementaryPair.length === 2) {
      mergedPalette = explicitComplementaryPair;
    }
  }

  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedPalette.length)
    .map((entry) => entry.index);

  setPaletteImageExtractionFeedback(false);
  getColorCards().forEach((card) => card.remove());

  capturePaletteAdjustmentBase(mergedPalette);
  const shouldRenderRawGeneratedPalette =
    paletteBaseMode === "color" &&
    ["monochromatic", "complementary", "analogous", "triad", "tetrad"].includes(
      options.effectiveType
    );

  currentPalette = shouldRenderRawGeneratedPalette
    ? [...mergedPalette]
    : mergePaletteWithPinnedColors(
      buildAdjustedPaletteFromBase(),
      pinnedEntries
    );
  currentPalette.forEach((color, index) => {
    createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
    });
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  const generatedPalette = normalizePaletteHexCollection(currentPalette);
  const hasExactPaletteChanged =
    previousPalette.length !== generatedPalette.length ||
    previousPalette.some((color, index) => color !== generatedPalette[index]);

  if (hasExactPaletteChanged || paletteHistory.length === 0) {
    saveHistory(currentPalette, {
      isAlternative: !!options.usedAlternativePalette,
      pinnedIndexes,
    });
  }
}

async function generatePalette(options = {}) {
  return withPaletteLoadingOverlay(async () => {
    let nextPalette = [];
    let usedAlternativePalette = false;
    let effectiveColorPaletteType = null;
    const previousPalette = normalizePaletteHexCollection(
      options.referencePalette ?? currentPalette
    );

    if (paletteBaseMode === "image") {
      try {
        nextPalette = await buildImageBasedPalette(paletteSize);
      } catch (error) {
        console.error(error);
        alert("No se pudo generar una paleta desde esta imagen.");
        return;
      }

      if (nextPalette.length === 0) {
        setPaletteImageExtractionFeedback(true);
        revealPaletteImageDropzoneForRetry();
        return;
      }
    } else if (paletteBaseMode === "color") {
      const effectiveType = options.effectiveType || getEffectiveColorPaletteType();
      const shouldRecalculateFromScratch = !!options.recalculateFromScratch;
      const candidate = shouldRecalculateFromScratch
        ? {
            palette: buildColorModePaletteForSettings(
              paletteSize,
              getCurrentPaletteAdjustmentSnapshot(),
              {
                baseColor:
                  typeof getPaletteBaseColorSnapshot === "function"
                    ? getPaletteBaseColorSnapshot()
                    : null,
                effectiveType,
                variantIndex:
                  effectiveType === "monochromatic" || effectiveType === "complementary"
                    ? 0
                    : colorPaletteVariantIndex,
              }
            ),
            effectiveType,
            variantIndex:
              effectiveType === "monochromatic" || effectiveType === "complementary"
                ? 0
                : colorPaletteVariantIndex,
          }
        : createColorModePaletteCandidate(getCurrentPaletteAdjustmentSnapshot(), {
            referencePalette: previousPalette,
            effectiveType,
          });

      if (!candidate?.palette?.length) {
        alert("No se pudo generar una paleta válida a partir del color base.");
        return;
      }

      nextPalette = candidate.palette;
      effectiveColorPaletteType = candidate.effectiveType;
      colorPaletteVariantIndex = candidate.variantIndex;
      syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
        scope: "color-variant",
      });
    } else {
      const temperatureResult = buildTemperaturePaletteForSettings(paletteSize);
      nextPalette = temperatureResult.palette;
      usedAlternativePalette = temperatureResult.usedAlternativePalette;
    }

    commitGeneratedPalette(nextPalette, {
      effectiveType: effectiveColorPaletteType,
      usedAlternativePalette,
      previousPalette,
    });
  });
}

// GENERATE COLOR

function generateColor() {
  const hue = getTemperatureBasedHue();
  const chroma = mapSaturationValueToOklchChroma(getCurrentSaturationValue(), {
    minChroma: 0.006,
    maxChroma: 0.22,
    gamma: 1.08,
  });
  const lightness = mapBrightnessValueToOklchLightness(getCurrentBrightnessValue(), {
    minLightness: 0.18,
    maxLightness: 0.92,
  });

  return controlsNormalizeHexColor(
    controlsOklchToHex(lightness, chroma, hue, {
      minLightness: 0.12,
      maxLightness: 0.94,
      maxChroma: 0.24,
    })
  );
}
