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
const paletteGeneratorCoreHelpers = window.PaletteGeneratorCoreHelpers || {};
const paletteGeneratorCoreRuntime = window.PaletteGeneratorCoreRuntime || {};
if (
  typeof paletteGeneratorCoreHelpers.clampControlValue !== "function" ||
  typeof paletteGeneratorCoreHelpers.blendControlValue !== "function" ||
  typeof paletteGeneratorCoreHelpers.resolvePaletteAdjustmentSettings !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPaletteAdjustmentDeltas !== "function" ||
  typeof paletteGeneratorCoreHelpers.mapBrightnessValueToOklchLightness !== "function" ||
  typeof paletteGeneratorCoreHelpers.mapSaturationValueToOklchChroma !== "function" ||
  typeof paletteGeneratorCoreHelpers.getAdjustedPaletteColor !== "function" ||
  typeof paletteGeneratorCoreHelpers.normalizePaletteHexCollection !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPaletteSimilarityMetrics !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics !== "function" ||
  typeof paletteGeneratorCoreHelpers.arePalettesTooSimilar !== "function" ||
  typeof paletteGeneratorCoreHelpers.isBetterPaletteFallbackCandidate !== "function" ||
  typeof paletteGeneratorCoreHelpers.scorePaletteHarmony !== "function" ||
  typeof paletteGeneratorCoreHelpers.scorePaletteElegance !== "function"
) {
  throw new Error("PaletteGeneratorCoreHelpers are required before palette-generator-core.js loads.");
}
if (
  typeof paletteGeneratorCoreRuntime.updateRangeControl !== "function" ||
  typeof paletteGeneratorCoreRuntime.capturePaletteAdjustmentBase !== "function" ||
  typeof paletteGeneratorCoreRuntime.buildAdjustedPaletteFromBase !== "function" ||
  typeof paletteGeneratorCoreRuntime.getPinnedPaletteIndexSet !== "function" ||
  typeof paletteGeneratorCoreRuntime.mergePaletteWithPinnedColors !== "function" ||
  typeof paletteGeneratorCoreRuntime.renderAdjustedPalette !== "function" ||
  typeof paletteGeneratorCoreRuntime.getComparablePaletteSlice !== "function" ||
  typeof paletteGeneratorCoreRuntime.getComparableMergedPaletteSlice !== "function" ||
  typeof paletteGeneratorCoreRuntime.getMutablePaletteSlotCount !== "function" ||
  typeof paletteGeneratorCoreRuntime.getPinnedPaletteEntriesSnapshot !== "function" ||
  typeof paletteGeneratorCoreRuntime.commitGeneratedPalette !== "function" ||
  typeof paletteGeneratorCoreRuntime.clearRecentInspiredPalettes !== "function" ||
  typeof paletteGeneratorCoreRuntime.rememberInspiredPalette !== "function" ||
  typeof paletteGeneratorCoreRuntime.isPaletteTooSimilarToRecentInspiredPalettes !== "function"
) {
  throw new Error("PaletteGeneratorCoreRuntime is required before palette-generator-core.js loads.");
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
  return paletteGeneratorCoreHelpers.blendControlValue(fromValue, toValue, ratio);
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
  return paletteGeneratorCoreHelpers.resolvePaletteAdjustmentSettings(
    settings,
    {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    }
  );
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
  return paletteGeneratorCoreRuntime.updateRangeControl({
    input,
    valueLabel,
    lowIcon,
    highIcon,
  });
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
  const nextAdjustmentBase = paletteGeneratorCoreRuntime.capturePaletteAdjustmentBase({
    colors,
    settings,
    defaultBrightness: DEFAULT_BRIGHTNESS,
    defaultSaturation: DEFAULT_SATURATION,
  });

  paletteAdjustmentBase = [...nextAdjustmentBase.colors];
  paletteAdjustmentBaseSettings = { ...nextAdjustmentBase.baseSettings };
}

function getPaletteAdjustmentDeltas(
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  return paletteGeneratorCoreHelpers.getPaletteAdjustmentDeltas(
    settings,
    baseSettings,
    {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    }
  );
}

function mapBrightnessValueToOklchLightness(
  brightness,
  options = {}
) {
  return paletteGeneratorCoreHelpers.mapBrightnessValueToOklchLightness(brightness, options);
}

function mapSaturationValueToOklchChroma(
  saturation,
  options = {}
) {
  return paletteGeneratorCoreHelpers.mapSaturationValueToOklchChroma(saturation, options);
}

function getAdjustedPaletteColor(
  hex,
  variantIndex = 0,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  return paletteGeneratorCoreHelpers.getAdjustedPaletteColor(
    hex,
    {
      variantIndex,
      settings,
      baseSettings,
      fallbackSettings: {
        brightness: DEFAULT_BRIGHTNESS,
        saturation: DEFAULT_SATURATION,
      },
    }
  );
}

function buildAdjustedPaletteFromBase(
  colors = paletteAdjustmentBase,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  return paletteGeneratorCoreRuntime.buildAdjustedPaletteFromBase({
    colors: Array.isArray(colors) ? colors : [],
    settings,
    baseSettings,
    paletteBaseMode,
    selectedPaletteBaseColor,
    getColorModeBaseCardIndex:
      typeof getColorModeBaseCardIndex === "function" ? getColorModeBaseCardIndex : null,
    getComplementaryRoleCardIndex:
      typeof getComplementaryRoleCardIndex === "function"
        ? getComplementaryRoleCardIndex
        : null,
    getAdjustedPaletteColor,
  });
}

function buildRenderedPaletteFromBaseColors(colors, settings) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  return buildAdjustedPaletteFromBase(colors, resolvedSettings, resolvedSettings);
}

function renderAdjustedPalette(colors, options = {}) {
  const renderedPalette = paletteGeneratorCoreRuntime.renderAdjustedPalette({
    colors,
    pinnedEntries: getPinnedPaletteEntriesSnapshot(),
    previewOnly: !!options.previewOnly,
    getColorCards,
    createColorCard,
    setCardColor,
    setCardPinnedState,
    refreshDeleteButtonsVisibility,
    updateAddColorButtonState,
    syncCurrentPaletteFromDom,
  });

  if (options.previewOnly && Array.isArray(renderedPalette)) {
    currentPalette = [...renderedPalette];
  }

  return renderedPalette;
}

function applyCurrentPaletteAdjustments(options = {}) {
  if (!Array.isArray(paletteAdjustmentBase) || paletteAdjustmentBase.length === 0) {
    return;
  }

  renderAdjustedPalette(buildAdjustedPaletteFromBase(), options);
}

function normalizePaletteHexCollection(colors) {
  return paletteGeneratorCoreHelpers.normalizePaletteHexCollection(colors);
}

function getPaletteSimilarityMetrics(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.getPaletteSimilarityMetrics(nextPalette, referencePalette);
}

function getPalettePositionalSimilarityMetrics(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics(
    nextPalette,
    referencePalette
  );
}

function arePalettesTooSimilar(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.arePalettesTooSimilar(nextPalette, referencePalette);
}

function getPinnedPaletteIndexSet(pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return paletteGeneratorCoreRuntime.getPinnedPaletteIndexSet(pinnedEntries);
}

function getComparablePaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return paletteGeneratorCoreRuntime.getComparablePaletteSlice(colors, pinnedEntries);
}

function getComparableMergedPaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return paletteGeneratorCoreRuntime.getComparableMergedPaletteSlice(colors, pinnedEntries);
}

function isBetterPaletteFallbackCandidate(nextCandidate, currentFallbackCandidate) {
  return paletteGeneratorCoreHelpers.isBetterPaletteFallbackCandidate(
    nextCandidate,
    currentFallbackCandidate
  );
}

function getMutablePaletteSlotCount(totalCount = paletteSize, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return paletteGeneratorCoreRuntime.getMutablePaletteSlotCount(totalCount, pinnedEntries);
}

function clearRecentInspiredPalettes() {
  recentInspiredPalettes = paletteGeneratorCoreRuntime.clearRecentInspiredPalettes();
}

function rememberInspiredPalette(colors) {
  recentInspiredPalettes = paletteGeneratorCoreRuntime.rememberInspiredPalette({
    recentPalettes: recentInspiredPalettes,
    colors,
    maxCount: MAX_RECENT_INSPIRED_PALETTES,
  });
}

function isPaletteTooSimilarToRecentInspiredPalettes(nextPalette, recentPalettes = recentInspiredPalettes) {
  return paletteGeneratorCoreRuntime.isPaletteTooSimilarToRecentInspiredPalettes({
    nextPalette,
    recentPalettes,
    arePalettesTooSimilar,
  });
}
function clampControlValue(value, min, max) {
  return paletteGeneratorCoreHelpers.clampControlValue(value, min, max);
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
  return paletteGeneratorCoreHelpers.scorePaletteHarmony(colors);
}

function scorePaletteElegance(colors) {
  return paletteGeneratorCoreHelpers.scorePaletteElegance(colors);
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
  const totalCount = typeof getColorCards === "function" ? getColorCards().length : currentPalette.length;
  const baseCardIndex =
    typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(totalCount)
      : -1;
  const complementaryCardIndex =
    typeof getComplementaryRoleCardIndex === "function"
      ? getComplementaryRoleCardIndex(totalCount)
      : -1;

  return paletteGeneratorCoreRuntime.getPinnedPaletteEntriesSnapshot({
    entries: getCurrentPaletteCardEntries().map((entry) => ({
      index: entry.index,
      hex: entry.hex,
      pinned: entry.pinned,
      readonlyFixedPin: entry.card?.dataset.readonlyFixedPin === "true",
    })),
    pinningAvailable:
      typeof isCardPinningAvailable === "function" ? isCardPinningAvailable() : true,
    monochromaticScaleActive:
      typeof isColorModeMonochromaticScaleActive === "function"
        ? isColorModeMonochromaticScaleActive()
        : false,
    paletteBaseMode,
    baseCardIndex,
    complementaryCardIndex,
  });
}

function mergePaletteWithPinnedColors(nextPalette, pinnedEntries = []) {
  return paletteGeneratorCoreRuntime.mergePaletteWithPinnedColors({
    nextPalette,
    pinnedEntries,
  });
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
  const commitResult = paletteGeneratorCoreRuntime.commitGeneratedPalette({
    nextPalette: mergedPalette,
    previousPalette,
    pinnedEntries,
    paletteBaseMode,
    effectiveType: options.effectiveType,
    usedAlternativePalette: options.usedAlternativePalette,
    paletteHistoryLength: paletteHistory.length,
    setPaletteImageExtractionFeedback,
    getColorCards,
    capturePaletteAdjustmentBase,
    buildAdjustedPaletteFromBase,
    createColorCard,
    syncCurrentPaletteFromDom,
    saveHistory,
  });

  currentPalette = Array.isArray(commitResult?.renderedPalette)
    ? [...commitResult.renderedPalette]
    : [];
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
