import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorTemperatureHelpers from "./temperature-helpers";
import { IMAGE_PALETTE_VARIANT_PROFILES } from "./image-variant-profiles";

let hasInitializedPaletteGeneratorTemperature = false;

function getPaletteGeneratorTemperatureWindow() {
  return window as any;
}

function getGlobals() {
  return getPaletteGeneratorTemperatureWindow().PaletteGeneratorLegacyGlobals || {};
}

function getDom() {
  return getPaletteGeneratorTemperatureWindow().AppDom || {};
}

export function initializePaletteGeneratorTemperature() {
  if (hasInitializedPaletteGeneratorTemperature) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorTemperatureWindow();
  const dom = getDom();

  runtimeWindow.getRandomSteppedValue = function getRandomSteppedValue(
    min = 0,
    max = 100,
    step = 5
  ) {
    return PaletteGeneratorTemperatureHelpers.getRandomSteppedValue(min, max, step);
  };

  runtimeWindow.getRandomTemperatureSelection = function getRandomTemperatureSelection() {
    return PaletteGeneratorTemperatureHelpers.getRandomTemperatureSelection();
  };

  runtimeWindow.getCurrentTemperatureSelectionKey = function getCurrentTemperatureSelectionKey() {
    const globals = getGlobals();
    return PaletteGeneratorTemperatureHelpers.getTemperatureSelectionKey({
      warm: !!globals.temperature?.warm,
      cool: !!globals.temperature?.cool,
    });
  };

  runtimeWindow.withTemporaryTemperatureSelection = function withTemporaryTemperatureSelection(
    nextSelection: Record<string, boolean>,
    callback: () => unknown
  ) {
    const globals = getGlobals();
    const previousSelection = {
      warm: !!globals.temperature?.warm,
      cool: !!globals.temperature?.cool,
    };

    globals.temperature = {
      warm: !!nextSelection?.warm,
      cool: !!nextSelection?.cool,
    };

    try {
      return callback();
    } finally {
      globals.temperature = previousSelection;
    }
  };

  runtimeWindow.createTemperatureCandidate = function createTemperatureCandidate(
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const globals = getGlobals();
    const paletteSize = Number(globals.paletteSize) || 0;
    const currentPalette = Array.isArray(globals.currentPalette) ? globals.currentPalette : [];
    const attemptCount = Number.isFinite(options.attemptCount)
      ? Math.max(1, Number(options.attemptCount))
      : Math.max(24, paletteSize * 8);
    const pinnedEntries = Array.isArray(options.pinnedEntries)
      ? options.pinnedEntries
      : runtimeWindow.getPinnedPaletteEntriesSnapshot?.();
    const referencePalette = runtimeWindow.normalizePaletteHexCollection?.(
      runtimeWindow.getComparablePaletteSlice?.(options.referencePalette ?? currentPalette, pinnedEntries)
    );
    let bestDistinctCandidate = null;
    let bestFallbackCandidate = null;

    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const candidateResult = runtimeWindow.buildTemperaturePaletteForSettings?.(paletteSize, settings);
      if (!candidateResult?.palette?.length) {
        continue;
      }

      const renderedPalette = runtimeWindow.buildRenderedPaletteFromBaseColors?.(
        candidateResult.palette,
        settings
      );
      const comparableRenderedPalette = runtimeWindow.getComparableMergedPaletteSlice?.(
        renderedPalette,
        pinnedEntries
      );
      const similarityMetrics = runtimeWindow.getPaletteSimilarityMetrics?.(
        comparableRenderedPalette,
        referencePalette
      );
      const positionalSimilarityMetrics = runtimeWindow.getPalettePositionalSimilarityMetrics?.(
        comparableRenderedPalette,
        referencePalette
      );
      const similarityPenalty =
        (similarityMetrics?.sharedColorCount || 0) /
        Math.max(comparableRenderedPalette?.length || 1, 1);
      const candidate = {
        palette: candidateResult.palette,
        renderedPalette,
        usedAlternativePalette: candidateResult.usedAlternativePalette,
        score:
          (runtimeWindow.scorePaletteHarmony?.(renderedPalette) || 0) -
          similarityPenalty * 0.85,
        samePositionCount: positionalSimilarityMetrics?.samePositionCount || 0,
        isTooSimilar: runtimeWindow.arePalettesTooSimilar?.(
          comparableRenderedPalette,
          referencePalette
        ),
      };

      if (runtimeWindow.isBetterPaletteFallbackCandidate?.(candidate, bestFallbackCandidate)) {
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
  };

  runtimeWindow.regenerateTemperaturePaletteKeepingPreferences =
    async function regenerateTemperaturePaletteKeepingPreferences() {
      const globals = getGlobals();
      const currentPalette = Array.isArray(globals.currentPalette) ? globals.currentPalette : [];
      const lockedSettings = {
        brightness: runtimeWindow.getCurrentBrightnessValue?.(),
        saturation: runtimeWindow.getCurrentSaturationValue?.(),
      };
      const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.();
      const candidate = runtimeWindow.createTemperatureCandidate?.(lockedSettings, {
        referencePalette: currentPalette,
        pinnedEntries,
      });

      if (!candidate) {
        await runtimeWindow.generatePalette?.();
        return;
      }

      runtimeWindow.commitGeneratedPalette?.(candidate.palette, {
        usedAlternativePalette: candidate.usedAlternativePalette,
        previousPalette: currentPalette,
      });
    };

  runtimeWindow.surpriseTemperaturePalette = async function surpriseTemperaturePalette() {
    const globals = getGlobals();
    const currentPalette = Array.isArray(globals.currentPalette) ? globals.currentPalette : [];
    const currentTemperatureKey = runtimeWindow.getCurrentTemperatureSelectionKey?.();
    const currentSettings = runtimeWindow.getCurrentPaletteAdjustmentSnapshot?.();
    const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.();
    const referencePalette = runtimeWindow.normalizePaletteHexCollection?.(
      runtimeWindow.getComparablePaletteSlice?.(currentPalette, pinnedEntries)
    );
    let bestCandidate = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const nextTemperatureSelection = runtimeWindow.getRandomTemperatureSelection?.();
      const nextSettings = {
        brightness: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
        saturation: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
      };
      const temperatureSelectionKey =
        `${nextTemperatureSelection?.warm ? 1 : 0}:${nextTemperatureSelection?.cool ? 1 : 0}`;
      const candidate = runtimeWindow.withTemporaryTemperatureSelection?.(
        nextTemperatureSelection,
        () =>
          runtimeWindow.createTemperatureCandidate?.(nextSettings, {
            referencePalette,
            pinnedEntries,
            attemptCount: 10,
          })
      );

      if (!candidate) {
        continue;
      }

      const controlDistance =
        Math.abs((nextSettings.brightness || 0) - (currentSettings?.brightness || 0)) +
        Math.abs((nextSettings.saturation || 0) - (currentSettings?.saturation || 0));
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
      await runtimeWindow.regenerateTemperaturePaletteKeepingPreferences?.();
      return;
    }

    runtimeWindow.setTemperatureSelection?.(bestCandidate.temperatureSelection);
    runtimeWindow.setPaletteAdjustmentControls?.(bestCandidate.settings);
    runtimeWindow.commitGeneratedPalette?.(bestCandidate.palette, {
      usedAlternativePalette: bestCandidate.usedAlternativePalette,
      previousPalette: currentPalette,
    });
  };

  runtimeWindow.surprisePinnedTemperaturePaletteSlots =
    function surprisePinnedTemperaturePaletteSlots() {
      if (
        typeof runtimeWindow.getCurrentPaletteCardEntries !== "function" ||
        typeof runtimeWindow.getRegeneratedColorForCard !== "function"
      ) {
        return false;
      }

      const cardEntries = runtimeWindow.getCurrentPaletteCardEntries();
      const mutableEntries = cardEntries.filter((entry: any) => !entry.pinned);

      if (mutableEntries.length === 0) {
        return false;
      }

      runtimeWindow.setTemperatureSelection?.(runtimeWindow.getRandomTemperatureSelection?.());
      runtimeWindow.setPaletteAdjustmentControls?.({
        brightness: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
        saturation: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
      });

      const nextColors = cardEntries.map((entry: any) => AppColorUtils.normalizeHexColor(entry.hex));
      let hasChanged = false;

      mutableEntries.forEach((entry: any) => {
        const candidate = runtimeWindow.getRegeneratedColorForCard?.(
          entry.card,
          new Set(nextColors)
        );

        if (!candidate || candidate === entry.hex) {
          return;
        }

        runtimeWindow.setCardColor?.(entry.card, candidate);
        nextColors[entry.index] = AppColorUtils.normalizeHexColor(candidate);
        hasChanged = true;
      });

      if (hasChanged) {
        runtimeWindow.persistCurrentPaletteSnapshot?.();
      }

      return hasChanged;
    };

  runtimeWindow.surprisePinnedImagePaletteSlots = function surprisePinnedImagePaletteSlots() {
    const globals = getGlobals();
    if (
      typeof runtimeWindow.regeneratePinnedPaletteSlots !== "function" ||
      !globals.uploadedBaseImage?.dataUrl
    ) {
      return false;
    }

    const nextPriorityPreference = Math.random() < 0.5;
    globals.prioritizeImageDominantColors = nextPriorityPreference;
    if (dom.paletteImageDominantToggle) {
      dom.paletteImageDominantToggle.checked = nextPriorityPreference;
    }
    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        prioritizeImageDominantColors: globals.prioritizeImageDominantColors,
      },
      {
        scope: "image-dominant-toggle",
      }
    );

    runtimeWindow.setPaletteAdjustmentControls?.({
      brightness: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
      saturation: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
    });

    return runtimeWindow.regeneratePinnedPaletteSlots?.();
  };

  runtimeWindow.surpriseImagePalette = async function surpriseImagePalette() {
    const runSurprise = async () => {
      const globals = getGlobals();
      if (!globals.uploadedBaseImage?.dataUrl) {
        return;
      }

      const currentPalette = Array.isArray(globals.currentPalette) ? globals.currentPalette : [];
      const originalPriorityPreference = !!globals.prioritizeImageDominantColors;
      const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.();
      const referencePalette = runtimeWindow.normalizePaletteHexCollection?.(
        runtimeWindow.getComparablePaletteSlice?.(currentPalette, pinnedEntries)
      );
      const currentSettings = runtimeWindow.getCurrentPaletteAdjustmentSnapshot?.();
      let bestCandidate = null;

      for (let attempt = 0; attempt < 12; attempt += 1) {
        const candidatePriorityPreference = Math.random() < 0.5;
        const candidateSettings = {
          brightness: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
          saturation: runtimeWindow.getRandomSteppedValue?.(0, 100, 5),
        };
        const candidateVariantIndex =
          (Number(globals.imagePaletteVariantIndex) || 0) +
          1 +
          Math.floor(Math.random() * IMAGE_PALETTE_VARIANT_PROFILES.length * 2);

        globals.prioritizeImageDominantColors = candidatePriorityPreference;
        const candidateResult = await runtimeWindow.buildImageBasedPaletteCandidate?.(
          Number(globals.paletteSize) || 0,
          {
            startVariantIndex: candidateVariantIndex,
            referencePalette,
            pinnedEntries,
            maxVariantAttempts: IMAGE_PALETTE_VARIANT_PROFILES.length * 3,
          }
        );

        if (!candidateResult?.palette?.length) {
          continue;
        }

        const renderedPalette = runtimeWindow.buildRenderedPaletteFromBaseColors?.(
          candidateResult.palette,
          candidateSettings
        );
        const comparableRenderedPalette = runtimeWindow.getComparableMergedPaletteSlice?.(
          renderedPalette,
          pinnedEntries
        );
        const similarityMetrics = runtimeWindow.getPaletteSimilarityMetrics?.(
          comparableRenderedPalette,
          referencePalette
        );
        const similarityPenalty =
          (similarityMetrics?.sharedColorCount || 0) /
          Math.max(comparableRenderedPalette?.length || 1, 1);
        const controlDistance =
          Math.abs((candidateSettings.brightness || 0) - (currentSettings?.brightness || 0)) +
          Math.abs((candidateSettings.saturation || 0) - (currentSettings?.saturation || 0));
        const priorityBonus =
          candidatePriorityPreference !== originalPriorityPreference ? 0.16 : 0;
        const score =
          (runtimeWindow.scorePaletteHarmony?.(renderedPalette) || 0) -
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

      globals.prioritizeImageDominantColors = originalPriorityPreference;

      if (!bestCandidate) {
        await runtimeWindow.syncImagePaletteFromSource?.({ advanceVariant: true });
        return;
      }

      globals.prioritizeImageDominantColors = bestCandidate.prioritizeDominant;
      if (dom.paletteImageDominantToggle) {
        dom.paletteImageDominantToggle.checked = bestCandidate.prioritizeDominant;
      }
      runtimeWindow.syncPaletteGeneratorStoreState?.(
        {
          prioritizeImageDominantColors: globals.prioritizeImageDominantColors,
        },
        {
          scope: "image-dominant-toggle",
        }
      );
      runtimeWindow.setPaletteAdjustmentControls?.(bestCandidate.settings);
      globals.imagePaletteVariantIndex = bestCandidate.variantIndex;
      runtimeWindow.syncPaletteGeneratorStoreState?.(
        {
          imagePaletteVariantIndex: globals.imagePaletteVariantIndex,
        },
        {
          scope: "image-palette-variant",
        }
      );
      runtimeWindow.commitGeneratedPalette?.(bestCandidate.palette, {
        previousPalette: Array.isArray(globals.currentPalette) ? globals.currentPalette : [],
      });
    };

    if (typeof runtimeWindow.withPaletteLoadingOverlay === "function") {
      return runtimeWindow.withPaletteLoadingOverlay(runSurprise);
    }

    return runSurprise();
  };

  runtimeWindow.applyInspiredImagePalette = async function applyInspiredImagePalette() {
    const runInspiration = async () => {
      const globals = getGlobals();
      const currentPalette = Array.isArray(globals.currentPalette) ? globals.currentPalette : [];
      const targetCount =
        Number.isFinite(globals.paletteSize) && Number(globals.paletteSize) > 0
          ? Number(globals.paletteSize)
          : 5;
      const result = await runtimeWindow.buildInspiredImagePaletteCandidate?.(targetCount, {
        referencePalette: currentPalette,
      });

      if (!Array.isArray(result?.palette) || result.palette.length === 0) {
        runtimeWindow.setPaletteImageExtractionFeedback?.(
          true,
          "No se ha podido extraer colores. Has de intentar subir otra imagen."
        );
        runtimeWindow.revealPaletteImageDropzoneForRetry?.();
        return;
      }

      globals.imageInspirationVariantIndex = Number(result.variantIndex) + 1;
      runtimeWindow.syncPaletteGeneratorStoreState?.(
        {
          imageInspirationVariantIndex: globals.imageInspirationVariantIndex,
        },
        {
          scope: "image-inspiration-variant",
        }
      );
      runtimeWindow.rememberInspiredPalette?.(result.palette);
      runtimeWindow.setPaletteAdjustmentControls?.(result.settings);
      runtimeWindow.commitGeneratedPalette?.(result.palette, {
        previousPalette: currentPalette,
      });
    };

    if (typeof runtimeWindow.withPaletteLoadingOverlay === "function") {
      return runtimeWindow.withPaletteLoadingOverlay(runInspiration);
    }

    return runInspiration();
  };

  runtimeWindow.setupSurpriseButton = function setupSurpriseButton() {
    if (!dom.surpriseBtn) {
      return;
    }

    dom.surpriseBtn.addEventListener("click", () => {
      const globals = getGlobals();
      if (dom.surpriseBtn.disabled) {
        return;
      }

      if (
        globals.paletteBaseMode === "temperature" &&
        runtimeWindow.getPinnedPaletteEntriesSnapshot?.().length > 0
      ) {
        if (runtimeWindow.surprisePinnedTemperaturePaletteSlots?.()) {
          return;
        }
      }

      if (
        globals.paletteBaseMode === "image" &&
        runtimeWindow.getPinnedPaletteEntriesSnapshot?.().length > 0
      ) {
        runtimeWindow.surprisePinnedImagePaletteSlots?.();
        return;
      }

      if (globals.paletteBaseMode === "image") {
        void runtimeWindow.surpriseImagePalette?.();
        return;
      }

      void runtimeWindow.surpriseTemperaturePalette?.();
    });
  };

  runtimeWindow.shouldUseAlternativePalette = function shouldUseAlternativePalette() {
    return (
      runtimeWindow.getCurrentSaturationValue?.() <=
      APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD
    );
  };

  runtimeWindow.getTemperatureTargetLightness = function getTemperatureTargetLightness(
    settings: Record<string, unknown>
  ) {
    return PaletteGeneratorTemperatureHelpers.getTemperatureTargetLightness(settings, {
      fallbackBrightness: runtimeWindow.getCurrentBrightnessValue?.(),
      minLightness: 0.2,
      maxLightness: 0.92,
      gamma: 0.86,
    });
  };

  runtimeWindow.getTemperatureTargetChroma = function getTemperatureTargetChroma(
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    return PaletteGeneratorTemperatureHelpers.getTemperatureTargetChroma(settings, {
      fallbackSaturation: runtimeWindow.getCurrentSaturationValue?.(),
      minChroma: Number.isFinite(options.minChroma) ? Number(options.minChroma) : 0.0015,
      maxChroma: Number.isFinite(options.maxChroma) ? Number(options.maxChroma) : 0.22,
      gamma: Number.isFinite(options.gamma) ? Number(options.gamma) : 1.7,
    });
  };

  runtimeWindow.createTemperatureOklchHex = function createTemperatureOklchHex(
    hue: number,
    lightness: number,
    chroma: number
  ) {
    return PaletteGeneratorTemperatureHelpers.createTemperatureOklchHex(hue, lightness, chroma);
  };

  runtimeWindow.getTemperatureBasedHue = function getTemperatureBasedHue() {
    const globals = getGlobals();
    return PaletteGeneratorTemperatureHelpers.getTemperatureBasedHue({
      warm: !!globals.temperature?.warm,
      cool: !!globals.temperature?.cool,
    });
  };

  runtimeWindow.buildAlternativeMonochromePalette = function buildAlternativeMonochromePalette(
    targetCount: number
  ) {
    const globals = getGlobals();
    return PaletteGeneratorTemperatureHelpers.buildAlternativeMonochromePaletteForSettings(
      targetCount,
      {
        brightness: runtimeWindow.getCurrentBrightnessValue?.(),
        saturation: runtimeWindow.getCurrentSaturationValue?.(),
      },
      {
        temperatureSelection: {
          warm: !!globals.temperature?.warm,
          cool: !!globals.temperature?.cool,
        },
        fallbackBrightness: runtimeWindow.getCurrentBrightnessValue?.(),
        fallbackSaturation: runtimeWindow.getCurrentSaturationValue?.(),
        lowSaturationThreshold: APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD,
        isDisallowedColor:
          typeof runtimeWindow.isDisallowedColor === "function"
            ? runtimeWindow.isDisallowedColor
            : null,
      }
    );
  };

  runtimeWindow.buildTemperatureColorFromSettings = function buildTemperatureColorFromSettings(
    settings: Record<string, unknown>
  ) {
    const globals = getGlobals();
    return PaletteGeneratorTemperatureHelpers.buildTemperatureColorFromSettings(settings, {
      temperatureSelection: {
        warm: !!globals.temperature?.warm,
        cool: !!globals.temperature?.cool,
      },
      fallbackBrightness: runtimeWindow.getCurrentBrightnessValue?.(),
      fallbackSaturation: runtimeWindow.getCurrentSaturationValue?.(),
    });
  };

  runtimeWindow.buildAlternativeMonochromePaletteForSettings =
    function buildAlternativeMonochromePaletteForSettings(
      targetCount: number,
      settings: Record<string, unknown>
    ) {
      const globals = getGlobals();
      return PaletteGeneratorTemperatureHelpers.buildAlternativeMonochromePaletteForSettings(
        targetCount,
        settings,
        {
          temperatureSelection: {
            warm: !!globals.temperature?.warm,
            cool: !!globals.temperature?.cool,
          },
          fallbackBrightness: runtimeWindow.getCurrentBrightnessValue?.(),
          fallbackSaturation: runtimeWindow.getCurrentSaturationValue?.(),
          lowSaturationThreshold: APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD,
          isDisallowedColor:
            typeof runtimeWindow.isDisallowedColor === "function"
              ? runtimeWindow.isDisallowedColor
              : null,
        }
      );
    };

  runtimeWindow.buildTemperaturePaletteForSettings = function buildTemperaturePaletteForSettings(
    targetCount: number,
    settings: Record<string, unknown>
  ) {
    const globals = getGlobals();
    return PaletteGeneratorTemperatureHelpers.buildTemperaturePaletteForSettings(
      targetCount,
      settings,
      {
        temperatureSelection: {
          warm: !!globals.temperature?.warm,
          cool: !!globals.temperature?.cool,
        },
        fallbackBrightness: runtimeWindow.getCurrentBrightnessValue?.(),
        fallbackSaturation: runtimeWindow.getCurrentSaturationValue?.(),
        lowSaturationThreshold: APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD,
        isDisallowedColor:
          typeof runtimeWindow.isDisallowedColor === "function"
            ? runtimeWindow.isDisallowedColor
            : null,
        maxRetriesPerColor: 12,
      }
    );
  };

  hasInitializedPaletteGeneratorTemperature = true;
}

export default initializePaletteGeneratorTemperature;
