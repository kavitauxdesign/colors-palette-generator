import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import PaletteGeneratorCoreRuntime from "./core-runtime";

let hasInitializedPaletteGeneratorCore = false;
let paletteLoadingOverlayDepth = 0;

const MAX_RECENT_INSPIRED_PALETTES = 8;

function getPaletteGeneratorCoreWindow() {
  return window as any;
}

function getGlobals() {
  return getPaletteGeneratorCoreWindow().PaletteGeneratorLegacyGlobals || {};
}

function getDom() {
  return getPaletteGeneratorCoreWindow().AppDom || {};
}

function getConstants() {
  return getPaletteGeneratorCoreWindow().AppConstants || {};
}

function waitForPaletteLoadingOverlayPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function initializePaletteGeneratorCore() {
  if (hasInitializedPaletteGeneratorCore) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorCoreWindow();
  const dom = getDom();
  const constants = getConstants();

  function setPaletteLoadingOverlayState(isVisible: boolean) {
    if (!dom.paletteLoadingOverlay || !dom.paletteViewport) {
      return;
    }

    dom.paletteLoadingOverlay.hidden = !isVisible;
    dom.paletteLoadingOverlay.setAttribute("aria-hidden", isVisible ? "false" : "true");
    dom.paletteViewport.classList.toggle("is-loading", isVisible);
  }

  async function withPaletteLoadingOverlay<T>(task: () => Promise<T> | T) {
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

  function updateBrightnessProgress() {
    return PaletteGeneratorCoreRuntime.updateRangeControl({
      input: dom.brightnessInput,
      valueLabel: dom.brightnessValueLabel,
      lowIcon: dom.darkBrightnessIcon,
      highIcon: dom.lightBrightnessIcon,
    });
  }

  function updateSaturationProgress() {
    return PaletteGeneratorCoreRuntime.updateRangeControl({
      input: dom.saturationInput,
      valueLabel: dom.saturationValueLabel,
      lowIcon: dom.lowSaturationIcon,
      highIcon: dom.highSaturationIcon,
    });
  }

  function blendControlValue(fromValue: unknown, toValue: unknown, ratio: unknown) {
    return PaletteGeneratorCoreHelpers.blendControlValue(fromValue, toValue, ratio);
  }

  function resolvePaletteAdjustmentSettings(settings: Record<string, unknown> = {}) {
    return PaletteGeneratorCoreHelpers.resolvePaletteAdjustmentSettings(settings, {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    });
  }

  function isValidPaletteHex(hex: string) {
    return AppColorUtils.isValidHexColor(hex);
  }

  function getCurrentPaletteAdjustmentSnapshot() {
    return resolvePaletteAdjustmentSettings();
  }

  function capturePaletteAdjustmentBase(
    colors = getGlobals().currentPalette,
    settings = getCurrentPaletteAdjustmentSnapshot()
  ) {
    const globals = getGlobals();
    const nextAdjustmentBase = PaletteGeneratorCoreRuntime.capturePaletteAdjustmentBase({
      colors,
      settings,
      defaultBrightness: constants.DEFAULT_BRIGHTNESS,
      defaultSaturation: constants.DEFAULT_SATURATION,
    });

    globals.paletteAdjustmentBase = [...nextAdjustmentBase.colors];
    globals.paletteAdjustmentBaseSettings = { ...nextAdjustmentBase.baseSettings };
  }

  function getPaletteAdjustmentDeltas(
    settings = getCurrentPaletteAdjustmentSnapshot(),
    baseSettings = getGlobals().paletteAdjustmentBaseSettings
  ) {
    return PaletteGeneratorCoreHelpers.getPaletteAdjustmentDeltas(
      settings,
      baseSettings,
      {
        brightness: getCurrentBrightnessValue(),
        saturation: getCurrentSaturationValue(),
      }
    );
  }

  function mapBrightnessValueToOklchLightness(
    brightness: unknown,
    options: Record<string, unknown> = {}
  ) {
    return PaletteGeneratorCoreHelpers.mapBrightnessValueToOklchLightness(
      brightness,
      options
    );
  }

  function mapSaturationValueToOklchChroma(
    saturation: unknown,
    options: Record<string, unknown> = {}
  ) {
    return PaletteGeneratorCoreHelpers.mapSaturationValueToOklchChroma(
      saturation,
      options
    );
  }

  function getAdjustedPaletteColor(
    hex: string,
    variantIndex = 0,
    settings = getCurrentPaletteAdjustmentSnapshot(),
    baseSettings = getGlobals().paletteAdjustmentBaseSettings
  ) {
    return PaletteGeneratorCoreHelpers.getAdjustedPaletteColor(hex, {
      variantIndex,
      settings,
      baseSettings,
      fallbackSettings: {
        brightness: constants.DEFAULT_BRIGHTNESS,
        saturation: constants.DEFAULT_SATURATION,
      },
    });
  }

  function buildAdjustedPaletteFromBase(
    colors = getGlobals().paletteAdjustmentBase,
    settings = getCurrentPaletteAdjustmentSnapshot(),
    baseSettings = getGlobals().paletteAdjustmentBaseSettings
  ) {
    const globals = getGlobals();

    return PaletteGeneratorCoreRuntime.buildAdjustedPaletteFromBase({
      colors: Array.isArray(colors) ? colors : [],
      settings,
      baseSettings,
      paletteBaseMode: globals.paletteBaseMode,
      selectedPaletteBaseColor: globals.selectedPaletteBaseColor,
      getColorModeBaseCardIndex:
        typeof runtimeWindow.getColorModeBaseCardIndex === "function"
          ? runtimeWindow.getColorModeBaseCardIndex
          : null,
      getComplementaryRoleCardIndex:
        typeof runtimeWindow.getComplementaryRoleCardIndex === "function"
          ? runtimeWindow.getComplementaryRoleCardIndex
          : null,
      getAdjustedPaletteColor,
    });
  }

  function buildRenderedPaletteFromBaseColors(colors: string[], settings: Record<string, unknown>) {
    const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
    return buildAdjustedPaletteFromBase(
      colors,
      resolvedSettings,
      resolvedSettings
    );
  }

  function renderAdjustedPalette(colors: string[], options: Record<string, unknown> = {}) {
    const globals = getGlobals();
    const renderedPalette = PaletteGeneratorCoreRuntime.renderAdjustedPalette({
      colors,
      pinnedEntries: getPinnedPaletteEntriesSnapshot(),
      previewOnly: !!options.previewOnly,
      getColorCards: runtimeWindow.getColorCards,
      createColorCard: runtimeWindow.createColorCard,
      setCardColor: runtimeWindow.setCardColor,
      setCardPinnedState: runtimeWindow.setCardPinnedState,
      refreshDeleteButtonsVisibility: runtimeWindow.refreshDeleteButtonsVisibility,
      updateAddColorButtonState: runtimeWindow.updateAddColorButtonState,
      syncCurrentPaletteFromDom: runtimeWindow.syncCurrentPaletteFromDom,
    });

    if (options.previewOnly && Array.isArray(renderedPalette)) {
      globals.currentPalette = [...renderedPalette];
    }

    return renderedPalette;
  }

  function applyCurrentPaletteAdjustments(options: Record<string, unknown> = {}) {
    const globals = getGlobals();
    if (
      !Array.isArray(globals.paletteAdjustmentBase) ||
      globals.paletteAdjustmentBase.length === 0
    ) {
      return;
    }

    renderAdjustedPalette(buildAdjustedPaletteFromBase(), options);
  }

  function normalizePaletteHexCollection(colors: unknown) {
    return PaletteGeneratorCoreHelpers.normalizePaletteHexCollection(colors);
  }

  function getPaletteSimilarityMetrics(nextPalette: unknown, referencePalette: unknown) {
    return PaletteGeneratorCoreHelpers.getPaletteSimilarityMetrics(
      nextPalette,
      referencePalette
    );
  }

  function getPalettePositionalSimilarityMetrics(
    nextPalette: unknown,
    referencePalette: unknown
  ) {
    return PaletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics(
      nextPalette,
      referencePalette
    );
  }

  function arePalettesTooSimilar(nextPalette: unknown, referencePalette: unknown) {
    return PaletteGeneratorCoreHelpers.arePalettesTooSimilar(
      nextPalette,
      referencePalette
    );
  }

  function getPinnedPaletteIndexSet(
    pinnedEntries = getPinnedPaletteEntriesSnapshot()
  ) {
    return PaletteGeneratorCoreRuntime.getPinnedPaletteIndexSet(pinnedEntries);
  }

  function getComparablePaletteSlice(
    colors: unknown,
    pinnedEntries = getPinnedPaletteEntriesSnapshot()
  ) {
    return PaletteGeneratorCoreRuntime.getComparablePaletteSlice(colors, pinnedEntries);
  }

  function getComparableMergedPaletteSlice(
    colors: unknown,
    pinnedEntries = getPinnedPaletteEntriesSnapshot()
  ) {
    return PaletteGeneratorCoreRuntime.getComparableMergedPaletteSlice(
      colors,
      pinnedEntries
    );
  }

  function isBetterPaletteFallbackCandidate(
    nextCandidate: unknown,
    currentFallbackCandidate: unknown
  ) {
    return PaletteGeneratorCoreHelpers.isBetterPaletteFallbackCandidate(
      nextCandidate,
      currentFallbackCandidate
    );
  }

  function getMutablePaletteSlotCount(
    totalCount = getGlobals().paletteSize,
    pinnedEntries = getPinnedPaletteEntriesSnapshot()
  ) {
    return PaletteGeneratorCoreRuntime.getMutablePaletteSlotCount(
      totalCount,
      pinnedEntries
    );
  }

  function clearRecentInspiredPalettes() {
    const globals = getGlobals();
    globals.recentInspiredPalettes =
      PaletteGeneratorCoreRuntime.clearRecentInspiredPalettes();
  }

  function rememberInspiredPalette(colors: unknown) {
    const globals = getGlobals();
    globals.recentInspiredPalettes = PaletteGeneratorCoreRuntime.rememberInspiredPalette(
      {
        recentPalettes: globals.recentInspiredPalettes,
        colors,
        maxCount: MAX_RECENT_INSPIRED_PALETTES,
      }
    );
  }

  function isPaletteTooSimilarToRecentInspiredPalettes(
    nextPalette: unknown,
    recentPalettes = getGlobals().recentInspiredPalettes
  ) {
    return PaletteGeneratorCoreRuntime.isPaletteTooSimilarToRecentInspiredPalettes({
      nextPalette,
      recentPalettes,
      arePalettesTooSimilar,
    });
  }

  function clampControlValue(value: unknown, min: number, max: number) {
    return PaletteGeneratorCoreHelpers.clampControlValue(value, min, max);
  }

  function getCurrentBrightnessValue() {
    const sliderValue = dom.brightnessInput
      ? Number.parseFloat(dom.brightnessInput.value)
      : constants.DEFAULT_BRIGHTNESS;

    return Number.isFinite(sliderValue) ? sliderValue : constants.DEFAULT_BRIGHTNESS;
  }

  function getCurrentSaturationValue() {
    const saturationValue = dom.saturationInput
      ? Number.parseFloat(dom.saturationInput.value)
      : constants.DEFAULT_SATURATION;

    return Number.isFinite(saturationValue)
      ? saturationValue
      : constants.DEFAULT_SATURATION;
  }

  function shouldUseAlternativePalette() {
    return (
      getCurrentSaturationValue() <=
      constants.LOW_SATURATION_FALLBACK_THRESHOLD
    );
  }

  function scorePaletteHarmony(colors: unknown) {
    return PaletteGeneratorCoreHelpers.scorePaletteHarmony(colors);
  }

  function scorePaletteElegance(colors: unknown) {
    return PaletteGeneratorCoreHelpers.scorePaletteElegance(colors);
  }

  function updateUploadedImageAnalysisCache(cachePatch: Record<string, unknown>) {
    const globals = getGlobals();
    if (!globals.uploadedBaseImage) {
      return;
    }

    globals.uploadedBaseImage = {
      ...globals.uploadedBaseImage,
      analysisCache: {
        ...(globals.uploadedBaseImage.analysisCache || {}),
        ...cachePatch,
      },
    };

    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        uploadedBaseImage: globals.uploadedBaseImage,
      },
      {
        scope: "uploaded-image-cache",
      }
    );
  }

  function setPaletteAdjustmentControls(
    settings: { brightness?: number; saturation?: number } | null | undefined
  ) {
    if (dom.brightnessInput && Number.isFinite(settings?.brightness)) {
      dom.brightnessInput.value = String(settings?.brightness);
      updateBrightnessProgress();
    }

    if (dom.saturationInput && Number.isFinite(settings?.saturation)) {
      dom.saturationInput.value = String(settings?.saturation);
      updateSaturationProgress();
    }

    runtimeWindow.syncTemperatureControlsState?.();
    runtimeWindow.syncPaletteGeneratorStoreAdjustments?.(settings, {
      scope: "adjustments-controls",
    });
  }

  function getPinnedPaletteEntriesSnapshot() {
    const globals = getGlobals();
    if (typeof runtimeWindow.getCurrentPaletteCardEntries !== "function") {
      return [];
    }

    const totalCount =
      typeof runtimeWindow.getColorCards === "function"
        ? runtimeWindow.getColorCards().length
        : Array.isArray(globals.currentPalette)
          ? globals.currentPalette.length
          : 0;
    const baseCardIndex =
      typeof runtimeWindow.getColorModeBaseCardIndex === "function"
        ? runtimeWindow.getColorModeBaseCardIndex(totalCount)
        : -1;
    const complementaryCardIndex =
      typeof runtimeWindow.getComplementaryRoleCardIndex === "function"
        ? runtimeWindow.getComplementaryRoleCardIndex(totalCount)
        : -1;

    return PaletteGeneratorCoreRuntime.getPinnedPaletteEntriesSnapshot({
      entries: runtimeWindow.getCurrentPaletteCardEntries().map((entry: any) => ({
        index: entry.index,
        hex: entry.hex,
        pinned: entry.pinned,
        readonlyFixedPin: entry.card?.dataset.readonlyFixedPin === "true",
      })),
      pinningAvailable:
        typeof runtimeWindow.isCardPinningAvailable === "function"
          ? runtimeWindow.isCardPinningAvailable()
          : true,
      monochromaticScaleActive:
        typeof runtimeWindow.isColorModeMonochromaticScaleActive === "function"
          ? runtimeWindow.isColorModeMonochromaticScaleActive()
          : false,
      paletteBaseMode: globals.paletteBaseMode,
      baseCardIndex,
      complementaryCardIndex,
    });
  }

  function mergePaletteWithPinnedColors(nextPalette: unknown, pinnedEntries: any[] = []) {
    return PaletteGeneratorCoreRuntime.mergePaletteWithPinnedColors({
      nextPalette,
      pinnedEntries,
    });
  }

  function commitGeneratedPalette(
    nextPalette: string[],
    options: Record<string, unknown> = {}
  ) {
    const globals = getGlobals();
    const previousPalette = normalizePaletteHexCollection(
      options.previousPalette ?? globals.currentPalette
    );
    const pinnedEntries = Array.isArray(options.pinnedEntries)
      ? options.pinnedEntries
      : getPinnedPaletteEntriesSnapshot();
    let mergedPalette = mergePaletteWithPinnedColors(nextPalette, pinnedEntries);

    if (
      globals.paletteBaseMode === "color" &&
      options.effectiveType === "complementary" &&
      globals.paletteSize === 2 &&
      typeof runtimeWindow.buildComplementaryColorModePalette === "function"
    ) {
      const explicitComplementaryPair =
        runtimeWindow.buildComplementaryColorModePalette(
          2,
          getCurrentPaletteAdjustmentSnapshot(),
          {
            baseColor:
              typeof runtimeWindow.getPaletteBaseColorSnapshot === "function"
                ? runtimeWindow.getPaletteBaseColorSnapshot()
                : null,
            variantIndex: 0,
          }
        );

      if (explicitComplementaryPair.length === 2) {
        mergedPalette = explicitComplementaryPair;
      }
    }

    const commitResult = PaletteGeneratorCoreRuntime.commitGeneratedPalette({
      nextPalette: mergedPalette,
      previousPalette,
      pinnedEntries,
      paletteBaseMode: globals.paletteBaseMode,
      effectiveType: options.effectiveType,
      usedAlternativePalette: options.usedAlternativePalette,
      paletteHistoryLength: Array.isArray(globals.paletteHistory)
        ? globals.paletteHistory.length
        : 0,
      setPaletteImageExtractionFeedback: runtimeWindow.setPaletteImageExtractionFeedback,
      getColorCards: runtimeWindow.getColorCards,
      capturePaletteAdjustmentBase,
      buildAdjustedPaletteFromBase,
      createColorCard: runtimeWindow.createColorCard,
      syncCurrentPaletteFromDom: runtimeWindow.syncCurrentPaletteFromDom,
      saveHistory: runtimeWindow.saveHistory,
    });

    globals.currentPalette = Array.isArray(commitResult?.renderedPalette)
      ? [...commitResult.renderedPalette]
      : [];
  }

  async function generatePalette(options: Record<string, unknown> = {}) {
    return withPaletteLoadingOverlay(async () => {
      const globals = getGlobals();
      let nextPalette: string[] = [];
      let usedAlternativePalette = false;
      let effectiveColorPaletteType: string | null = null;
      const previousPalette = normalizePaletteHexCollection(
        options.referencePalette ?? globals.currentPalette
      );

      if (globals.paletteBaseMode === "image") {
        try {
          nextPalette = await runtimeWindow.buildImageBasedPalette?.(globals.paletteSize);
        } catch (error) {
          console.error(error);
          alert("No se pudo generar una paleta desde esta imagen.");
          return;
        }

        if (!nextPalette.length) {
          runtimeWindow.setPaletteImageExtractionFeedback?.(true);
          runtimeWindow.revealPaletteImageDropzoneForRetry?.();
          return;
        }
      } else if (globals.paletteBaseMode === "color") {
        const effectiveType =
          options.effectiveType || runtimeWindow.getEffectiveColorPaletteType?.();
        const shouldRecalculateFromScratch = !!options.recalculateFromScratch;
        const candidate = shouldRecalculateFromScratch
          ? {
              palette: runtimeWindow.buildColorModePaletteForSettings?.(
                globals.paletteSize,
                getCurrentPaletteAdjustmentSnapshot(),
                {
                  baseColor:
                    typeof runtimeWindow.getPaletteBaseColorSnapshot === "function"
                      ? runtimeWindow.getPaletteBaseColorSnapshot()
                      : null,
                  effectiveType,
                  variantIndex:
                    effectiveType === "monochromatic" ||
                    effectiveType === "complementary"
                      ? 0
                      : globals.colorPaletteVariantIndex,
                }
              ),
              effectiveType,
              variantIndex:
                effectiveType === "monochromatic" ||
                effectiveType === "complementary"
                  ? 0
                  : globals.colorPaletteVariantIndex,
            }
          : runtimeWindow.createColorModePaletteCandidate?.(
              getCurrentPaletteAdjustmentSnapshot(),
              {
                referencePalette: previousPalette,
                effectiveType,
              }
            );

        if (!candidate?.palette?.length) {
          alert("No se pudo generar una paleta válida a partir del color base.");
          return;
        }

        nextPalette = candidate.palette;
        effectiveColorPaletteType = candidate.effectiveType;
        globals.colorPaletteVariantIndex = candidate.variantIndex;
        runtimeWindow.syncPaletteGeneratorStoreColorVariantIndex?.(
          globals.colorPaletteVariantIndex,
          {
            scope: "color-variant",
          }
        );
      } else {
        const temperatureResult = runtimeWindow.buildTemperaturePaletteForSettings?.(
          globals.paletteSize
        );
        nextPalette = temperatureResult?.palette || [];
        usedAlternativePalette = !!temperatureResult?.usedAlternativePalette;
      }

      commitGeneratedPalette(nextPalette, {
        effectiveType: effectiveColorPaletteType,
        usedAlternativePalette,
        previousPalette,
      });
    });
  }

  function generateColor() {
    const hue = runtimeWindow.getTemperatureBasedHue?.();
    const chroma = mapSaturationValueToOklchChroma(getCurrentSaturationValue(), {
      minChroma: 0.006,
      maxChroma: 0.22,
      gamma: 1.08,
    });
    const lightness = mapBrightnessValueToOklchLightness(
      getCurrentBrightnessValue(),
      {
        minLightness: 0.18,
        maxLightness: 0.92,
      }
    );

    return AppColorUtils.normalizeHexColor(
      AppColorUtils.oklchToHex(lightness, chroma, hue, {
        minLightness: 0.12,
        maxLightness: 0.94,
        maxChroma: 0.24,
      })
    );
  }

  runtimeWindow.setPaletteLoadingOverlayState = setPaletteLoadingOverlayState;
  runtimeWindow.withPaletteLoadingOverlay = withPaletteLoadingOverlay;
  runtimeWindow.updateBrightnessProgress = updateBrightnessProgress;
  runtimeWindow.updateSaturationProgress = updateSaturationProgress;
  runtimeWindow.blendControlValue = blendControlValue;
  runtimeWindow.resolvePaletteAdjustmentSettings = resolvePaletteAdjustmentSettings;
  runtimeWindow.isValidPaletteHex = isValidPaletteHex;
  runtimeWindow.getCurrentPaletteAdjustmentSnapshot =
    getCurrentPaletteAdjustmentSnapshot;
  runtimeWindow.capturePaletteAdjustmentBase = capturePaletteAdjustmentBase;
  runtimeWindow.getPaletteAdjustmentDeltas = getPaletteAdjustmentDeltas;
  runtimeWindow.mapBrightnessValueToOklchLightness =
    mapBrightnessValueToOklchLightness;
  runtimeWindow.mapSaturationValueToOklchChroma = mapSaturationValueToOklchChroma;
  runtimeWindow.getAdjustedPaletteColor = getAdjustedPaletteColor;
  runtimeWindow.buildAdjustedPaletteFromBase = buildAdjustedPaletteFromBase;
  runtimeWindow.buildRenderedPaletteFromBaseColors = buildRenderedPaletteFromBaseColors;
  runtimeWindow.renderAdjustedPalette = renderAdjustedPalette;
  runtimeWindow.applyCurrentPaletteAdjustments = applyCurrentPaletteAdjustments;
  runtimeWindow.normalizePaletteHexCollection = normalizePaletteHexCollection;
  runtimeWindow.getPaletteSimilarityMetrics = getPaletteSimilarityMetrics;
  runtimeWindow.getPalettePositionalSimilarityMetrics =
    getPalettePositionalSimilarityMetrics;
  runtimeWindow.arePalettesTooSimilar = arePalettesTooSimilar;
  runtimeWindow.getPinnedPaletteIndexSet = getPinnedPaletteIndexSet;
  runtimeWindow.getComparablePaletteSlice = getComparablePaletteSlice;
  runtimeWindow.getComparableMergedPaletteSlice = getComparableMergedPaletteSlice;
  runtimeWindow.isBetterPaletteFallbackCandidate =
    isBetterPaletteFallbackCandidate;
  runtimeWindow.getMutablePaletteSlotCount = getMutablePaletteSlotCount;
  runtimeWindow.clearRecentInspiredPalettes = clearRecentInspiredPalettes;
  runtimeWindow.rememberInspiredPalette = rememberInspiredPalette;
  runtimeWindow.isPaletteTooSimilarToRecentInspiredPalettes =
    isPaletteTooSimilarToRecentInspiredPalettes;
  runtimeWindow.clampControlValue = clampControlValue;
  runtimeWindow.getCurrentBrightnessValue = getCurrentBrightnessValue;
  runtimeWindow.getCurrentSaturationValue = getCurrentSaturationValue;
  runtimeWindow.shouldUseAlternativePalette = shouldUseAlternativePalette;
  runtimeWindow.scorePaletteHarmony = scorePaletteHarmony;
  runtimeWindow.scorePaletteElegance = scorePaletteElegance;
  runtimeWindow.updateUploadedImageAnalysisCache = updateUploadedImageAnalysisCache;
  runtimeWindow.setPaletteAdjustmentControls = setPaletteAdjustmentControls;
  runtimeWindow.getPinnedPaletteEntriesSnapshot = getPinnedPaletteEntriesSnapshot;
  runtimeWindow.mergePaletteWithPinnedColors = mergePaletteWithPinnedColors;
  runtimeWindow.commitGeneratedPalette = commitGeneratedPalette;
  runtimeWindow.generatePalette = generatePalette;
  runtimeWindow.generateColor = generateColor;

  if (Number.isFinite(constants.DEFAULT_BRIGHTNESS) && dom.brightnessInput) {
    dom.brightnessInput.value = String(
      dom.brightnessInput.value || constants.DEFAULT_BRIGHTNESS
    );
    updateBrightnessProgress();
  }

  if (Number.isFinite(constants.DEFAULT_SATURATION) && dom.saturationInput) {
    dom.saturationInput.value = String(
      dom.saturationInput.value || constants.DEFAULT_SATURATION
    );
    updateSaturationProgress();
  }

  hasInitializedPaletteGeneratorCore = true;
}

export default initializePaletteGeneratorCore;
