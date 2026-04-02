import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorColorModeHelpers from "./color-mode-helpers";
import PaletteGeneratorColorModeRuntime from "./color-mode-runtime";

let hasInitializedPaletteGeneratorColorMode = false;

function getPaletteGeneratorColorModeWindow() {
  return window as any;
}

function getGlobals() {
  return getPaletteGeneratorColorModeWindow().PaletteGeneratorLegacyGlobals || {};
}

function getDom() {
  return getPaletteGeneratorColorModeWindow().AppDom || {};
}

function getStoreState() {
  return getPaletteGeneratorColorModeWindow().PaletteGeneratorStore?.getState?.() || null;
}

function getDisallowedColorPredicate() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  return typeof runtimeWindow.isDisallowedColor === "function"
    ? runtimeWindow.isDisallowedColor
    : null;
}

function getCurrentBrightnessValue() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  const dom = getDom();

  if (typeof runtimeWindow.getCurrentBrightnessValue === "function") {
    return runtimeWindow.getCurrentBrightnessValue();
  }

  return Number(dom.brightnessInput?.value) || runtimeWindow.AppConstants?.DEFAULT_BRIGHTNESS || 0;
}

function getCurrentSaturationValue() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  const dom = getDom();

  if (typeof runtimeWindow.getCurrentSaturationValue === "function") {
    return runtimeWindow.getCurrentSaturationValue();
  }

  return Number(dom.saturationInput?.value) || runtimeWindow.AppConstants?.DEFAULT_SATURATION || 0;
}

function syncStoreState(partial: Record<string, unknown>, scope: string) {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  runtimeWindow.syncPaletteGeneratorStoreState?.(partial, { scope });
}

function syncColorVariantIndex(variantIndex: number, scope = "color-variant") {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  runtimeWindow.syncPaletteGeneratorStoreColorVariantIndex?.(variantIndex, { scope });
}

function getPinnedPaletteEntriesSnapshot() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  return typeof runtimeWindow.getPinnedPaletteEntriesSnapshot === "function"
    ? runtimeWindow.getPinnedPaletteEntriesSnapshot()
    : [];
}

function updatePaletteActionUi() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  runtimeWindow.updatePaletteModeActionVisibility?.();
  runtimeWindow.updatePaletteActionButtonsAvailability?.();
}

function updatePaletteRegenerationUi() {
  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  runtimeWindow.updatePaletteModeActionVisibility?.();
  runtimeWindow.updatePaletteActionButtonsAvailability?.();
  runtimeWindow.updateRegenerateButtonsAvailability?.();
}

function getBuilderOptions(
  parsedBaseColor: any,
  effectiveType: any,
  variantIndex: any,
  options: Record<string, unknown> = {}
): any {
  const globals = getGlobals();

  return {
    ...options,
    baseColor: parsedBaseColor,
    effectiveType,
    variantIndex,
    selectedMonochromaticGenerationMode: globals.selectedMonochromaticGenerationMode,
    selectedAnalogousSeparationMode: globals.selectedAnalogousSeparationMode,
    isDisallowedColor: getDisallowedColorPredicate(),
  };
}

export function initializePaletteGeneratorColorMode() {
  if (hasInitializedPaletteGeneratorColorMode) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorColorModeWindow();
  const dom = getDom();
  const globals = getGlobals();

  let colorPaletteVariantIndex = Number.isFinite(getStoreState()?.colorPaletteVariantIndex)
    ? Number(getStoreState()?.colorPaletteVariantIndex)
    : 0;

  const colorVariantDescriptor = {
    get() {
      return colorPaletteVariantIndex;
    },
    set(value: unknown) {
      colorPaletteVariantIndex = Number.isFinite(value) ? Number(value) : 0;
    },
    configurable: true,
  };

  Object.defineProperty(globals, "colorPaletteVariantIndex", colorVariantDescriptor);
  Object.defineProperty(runtimeWindow, "colorPaletteVariantIndex", colorVariantDescriptor);
  syncColorVariantIndex(colorPaletteVariantIndex);

  function normalizeMonochromaticGenerationMode(mode: unknown) {
    return PaletteGeneratorColorModeRuntime.normalizeMonochromaticGenerationMode(mode);
  }

  function normalizeAnalogousSeparationMode(mode: unknown) {
    return PaletteGeneratorColorModeRuntime.normalizeAnalogousSeparationMode(mode);
  }

  function normalizePaletteBaseColorInput(value: unknown) {
    return PaletteGeneratorColorModeRuntime.normalizePaletteBaseColorInput(value);
  }

  function normalizePaletteBaseCssColor(value: unknown) {
    return PaletteGeneratorColorModeRuntime.parsePaletteBaseCssColor(value);
  }

  function setPaletteBaseColorFeedback(message = "", isInvalid = false) {
    if (dom.paletteColorInputFeedback) {
      dom.paletteColorInputFeedback.textContent = message;
    }

    if (dom.paletteColorTextInput) {
      dom.paletteColorTextInput.classList.toggle("is-invalid", !!isInvalid);
    }
  }

  function syncSelectedPaletteBaseColorCard() {
    if (
      globals.paletteBaseMode !== "color" ||
      !Array.isArray(globals.currentPalette) ||
      globals.currentPalette.length === 0 ||
      typeof runtimeWindow.getColorCards !== "function" ||
      typeof runtimeWindow.setCardColor !== "function" ||
      typeof runtimeWindow.syncCurrentPaletteFromDom !== "function"
    ) {
      return;
    }

    const cards = Array.from(runtimeWindow.getColorCards() || []);
    const baseCardIndex =
      typeof runtimeWindow.getColorModeBaseCardIndex === "function"
        ? runtimeWindow.getColorModeBaseCardIndex(cards.length)
        : 0;
    const baseCard = cards[baseCardIndex];

    if (!baseCard) {
      return;
    }

    runtimeWindow.setCardColor(baseCard, globals.selectedPaletteBaseColor);
    if (typeof runtimeWindow.setCardPinnedState === "function") {
      runtimeWindow.setCardPinnedState(baseCard, true);
    }
    runtimeWindow.updateColorModeCardActionVisibility?.();
    runtimeWindow.syncCurrentPaletteFromDom();
  }

  function applyPaletteBaseColorInputState(
    parsedColor: any,
    options: Record<string, unknown> = {}
  ) {
    if (!parsedColor) {
      setPaletteBaseColorFeedback(
        "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
        true
      );
      return false;
    }

    globals.selectedPaletteBaseColor = parsedColor.hex;
    syncStoreState(
      {
        selectedPaletteBaseColor: globals.selectedPaletteBaseColor,
      },
      "base-color"
    );

    if (dom.paletteColorTextInput && options.syncTextInput !== false) {
      dom.paletteColorTextInput.value = parsedColor.inputValue;
    }

    if (dom.paletteColorPicker) {
      dom.paletteColorPicker.value = parsedColor.hex;
    }

    if (dom.paletteColorSwatchFill) {
      dom.paletteColorSwatchFill.style.backgroundColor = parsedColor.css;
    }

    setPaletteBaseColorFeedback("");
    syncSelectedPaletteBaseColorCard();
    return true;
  }

  function getPaletteBaseColorSnapshot() {
    return normalizePaletteBaseCssColor(
      dom.paletteColorTextInput?.value || globals.selectedPaletteBaseColor
    );
  }

  function hasValidSelectedPaletteBaseColor() {
    return !!getPaletteBaseColorSnapshot();
  }

  function getAllowedPaletteSizesForType(type: unknown) {
    return PaletteGeneratorColorModeRuntime.getAllowedPaletteSizesForType(type);
  }

  function getDefaultPaletteSizeForType(type: unknown) {
    return PaletteGeneratorColorModeRuntime.getDefaultPaletteSizeForType(type);
  }

  function getColorModeReferenceSaturation() {
    return PaletteGeneratorColorModeRuntime.getColorModeReferenceSaturation({
      paletteBaseColorValue:
        dom.paletteColorTextInput?.value || globals.selectedPaletteBaseColor,
      fallbackSaturation: getCurrentSaturationValue(),
    });
  }

  function resolveAutomaticColorPaletteType(targetCount = globals.paletteSize) {
    return PaletteGeneratorColorModeRuntime.resolveAutomaticColorPaletteType({
      targetCount,
      referenceSaturation: getColorModeReferenceSaturation(),
    });
  }

  function getEffectiveColorPaletteType(targetCount = globals.paletteSize) {
    return PaletteGeneratorColorModeRuntime.getEffectiveColorPaletteType({
      selectedColorPaletteType: globals.selectedColorPaletteType,
      targetCount,
      referenceSaturation: getColorModeReferenceSaturation(),
    });
  }

  function isColorModeMonochromaticScaleActive(targetCount = globals.paletteSize) {
    return PaletteGeneratorColorModeRuntime.isColorModeMonochromaticScaleActive({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      targetCount,
      referenceSaturation: getColorModeReferenceSaturation(),
    });
  }

  function getAllowedPaletteSizesForCurrentMode() {
    return PaletteGeneratorColorModeRuntime.getAllowedPaletteSizesForCurrentMode({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
    });
  }

  function getNearestAllowedPaletteSize(
    nextSize: unknown,
    allowedSizes = getAllowedPaletteSizesForCurrentMode()
  ) {
    return PaletteGeneratorColorModeRuntime.getNearestAllowedPaletteSize(nextSize, allowedSizes);
  }

  function resolvePaletteSizeForType(type: unknown, nextSize: unknown) {
    return PaletteGeneratorColorModeRuntime.resolvePaletteSizeForType(type, nextSize);
  }

  function shouldShowMonochromaticModeControl() {
    return PaletteGeneratorColorModeRuntime.shouldShowMonochromaticModeControl({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
    });
  }

  function shouldShowAnalogousSeparationControl() {
    return PaletteGeneratorColorModeRuntime.shouldShowAnalogousSeparationControl({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
    });
  }

  function syncMonochromaticModeControlState() {
    const controlState = PaletteGeneratorColorModeRuntime.getMonochromaticModeControlState({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      selectedMonochromaticGenerationMode: globals.selectedMonochromaticGenerationMode,
    });

    globals.selectedMonochromaticGenerationMode = controlState.resolvedMode;
    syncStoreState(
      {
        selectedMonochromaticGenerationMode: globals.selectedMonochromaticGenerationMode,
      },
      "monochromatic-mode"
    );

    if (dom.monochromaticModeSelect) {
      dom.monochromaticModeSelect.value = controlState.resolvedMode;
    }

    if (dom.monochromaticModeControl) {
      dom.monochromaticModeControl.hidden = controlState.hidden;
    }
  }

  function syncAnalogousSeparationControlState() {
    const controlState = PaletteGeneratorColorModeRuntime.getAnalogousSeparationControlState({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      selectedAnalogousSeparationMode: globals.selectedAnalogousSeparationMode,
    });

    globals.selectedAnalogousSeparationMode = controlState.resolvedMode;
    syncStoreState(
      {
        selectedAnalogousSeparationMode: globals.selectedAnalogousSeparationMode,
      },
      "analogous-separation"
    );

    if (dom.analogousSeparationSelect) {
      dom.analogousSeparationSelect.value = controlState.resolvedMode;
    }

    if (dom.analogousSeparationControl) {
      dom.analogousSeparationControl.hidden = controlState.hidden;
    }
  }

  function syncPaletteTypeOptionStates() {
    if (!(dom.paletteTypeOptions instanceof HTMLSelectElement)) {
      return;
    }

    const controlState = PaletteGeneratorColorModeRuntime.getPaletteTypeControlState({
      selectedColorPaletteType: globals.selectedColorPaletteType,
      paletteBaseMode: globals.paletteBaseMode,
      paletteSize: globals.paletteSize,
      referenceSaturation: getColorModeReferenceSaturation(),
    });

    globals.selectedColorPaletteType = controlState.selectedType;
    globals.resolvedAutomaticColorPaletteType = controlState.resolvedType;
    dom.paletteTypeOptions.value = globals.selectedColorPaletteType;

    syncStoreState(
      {
        selectedColorPaletteType: globals.selectedColorPaletteType,
        resolvedAutomaticColorPaletteType: globals.resolvedAutomaticColorPaletteType,
      },
      "palette-type"
    );

    if (dom.paletteTypeResolvedLabel) {
      dom.paletteTypeResolvedLabel.hidden = !controlState.shouldShowResolvedType;
      dom.paletteTypeResolvedLabel.textContent = controlState.resolvedLabel;
    }
  }

  function getPaletteTypeDisplayLabel(type: unknown) {
    return PaletteGeneratorColorModeRuntime.getPaletteTypeDisplayLabel(type);
  }

  function syncColorModeBaseControls() {
    const parsedColor = normalizePaletteBaseCssColor(globals.selectedPaletteBaseColor);
    if (parsedColor) {
      applyPaletteBaseColorInputState(parsedColor, {
        syncTextInput: true,
      });
    }

    syncPaletteTypeOptionStates();
    syncMonochromaticModeControlState();
    syncAnalogousSeparationControlState();
  }

  function setSelectedColorPaletteType(
    nextType: unknown,
    options: Record<string, unknown> = {}
  ) {
    const selectionState = PaletteGeneratorColorModeRuntime.resolveColorPaletteTypeSelection({
      selectedColorPaletteType: nextType,
      paletteBaseMode: globals.paletteBaseMode,
      paletteSize: globals.paletteSize,
      referenceSaturation: getColorModeReferenceSaturation(),
    });

    globals.selectedColorPaletteType = selectionState.selectedType;
    globals.resolvedAutomaticColorPaletteType = selectionState.resolvedType;

    syncPaletteTypeOptionStates();
    syncMonochromaticModeControlState();
    syncAnalogousSeparationControlState();

    if (typeof runtimeWindow.clearUnavailablePinnedCards === "function") {
      runtimeWindow.clearUnavailablePinnedCards();
    }

    if (typeof runtimeWindow.setPaletteSize === "function") {
      runtimeWindow.setPaletteSize(selectionState.nextSize);
    } else {
      globals.paletteSize = selectionState.nextSize;
    }

    syncStoreState(
      {
        selectedColorPaletteType: globals.selectedColorPaletteType,
        paletteSize: globals.paletteSize,
      },
      "palette-type"
    );

    runtimeWindow.updatePaletteSizeButtonsAvailability?.();
    updatePaletteRegenerationUi();

    if (
      options.generate !== false &&
      globals.paletteBaseMode === "color" &&
      Array.isArray(globals.currentPalette) &&
      globals.currentPalette.length > 0
    ) {
      void runtimeWindow.generatePalette?.();
    }
  }

  function setSelectedPaletteBaseColor(
    nextValue: unknown,
    options: Record<string, unknown> = {}
  ) {
    const parsedColor = normalizePaletteBaseCssColor(nextValue);
    const wasApplied = applyPaletteBaseColorInputState(parsedColor, {
      syncTextInput: options.syncTextInput !== false,
    });

    if (!wasApplied) {
      updatePaletteActionUi();
      return false;
    }

    if (options.publish !== false) {
      runtimeWindow.AppSharedColors?.setActiveColor?.(globals.selectedPaletteBaseColor, {
        source: "palette-generator",
        action: "color-base-update",
      });
    }

    if (
      options.generate !== false &&
      globals.paletteBaseMode === "color" &&
      Array.isArray(globals.currentPalette) &&
      globals.currentPalette.length > 0
    ) {
      void runtimeWindow.generatePalette?.();
    }

    updatePaletteActionUi();
    return true;
  }

  function setSelectedMonochromaticGenerationMode(
    nextMode: unknown,
    options: Record<string, unknown> = {}
  ) {
    globals.selectedMonochromaticGenerationMode =
      normalizeMonochromaticGenerationMode(nextMode);
    syncStoreState(
      {
        selectedMonochromaticGenerationMode: globals.selectedMonochromaticGenerationMode,
      },
      "monochromatic-mode"
    );
    syncMonochromaticModeControlState();

    if (
      options.generate !== false &&
      globals.paletteBaseMode === "color" &&
      globals.selectedColorPaletteType === "monochromatic" &&
      Array.isArray(globals.currentPalette) &&
      globals.currentPalette.length > 0
    ) {
      void runtimeWindow.generatePalette?.();
    }
  }

  function setSelectedAnalogousSeparationMode(
    nextMode: unknown,
    options: Record<string, unknown> = {}
  ) {
    globals.selectedAnalogousSeparationMode = normalizeAnalogousSeparationMode(nextMode);
    syncStoreState(
      {
        selectedAnalogousSeparationMode: globals.selectedAnalogousSeparationMode,
      },
      "analogous-separation"
    );
    syncAnalogousSeparationControlState();

    if (
      options.generate !== false &&
      globals.paletteBaseMode === "color" &&
      globals.selectedColorPaletteType === "analogous" &&
      Array.isArray(globals.currentPalette) &&
      globals.currentPalette.length > 0
    ) {
      void runtimeWindow.generatePalette?.();
    }
  }

  function buildMonochromaticColorModePalette(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    return PaletteGeneratorColorModeHelpers.buildMonochromaticColorModePalette(
      targetCount,
      settings,
      getBuilderOptions(
        parsedBaseColor,
        "monochromatic",
        Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : colorPaletteVariantIndex,
        options
      )
    );
  }

  function buildComplementaryColorModePalette(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    return PaletteGeneratorColorModeHelpers.buildComplementaryColorModePalette(
      targetCount,
      settings,
      getBuilderOptions(
        parsedBaseColor,
        "complementary",
        Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : colorPaletteVariantIndex,
        options
      )
    );
  }

  function buildAnalogousColorModePalette(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    return PaletteGeneratorColorModeHelpers.buildAnalogousColorModePalette(
      targetCount,
      settings,
      getBuilderOptions(
        parsedBaseColor,
        "analogous",
        Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : colorPaletteVariantIndex,
        options
      )
    );
  }

  function buildTriadColorModePalette(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    return PaletteGeneratorColorModeHelpers.buildTriadColorModePalette(
      targetCount,
      settings,
      getBuilderOptions(
        parsedBaseColor,
        "triad",
        Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : colorPaletteVariantIndex,
        options
      )
    );
  }

  function buildTetradColorModePalette(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    return PaletteGeneratorColorModeHelpers.buildTetradColorModePalette(
      targetCount,
      settings,
      getBuilderOptions(
        parsedBaseColor,
        "tetrad",
        Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : colorPaletteVariantIndex,
        options
      )
    );
  }

  function buildColorModePaletteForSettings(
    targetCount: number,
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
    if (!parsedBaseColor) {
      return [];
    }

    const effectiveType = (options.effectiveType ||
      getEffectiveColorPaletteType(targetCount)) as any;
    const variantIndex = Number.isFinite(options.variantIndex)
      ? Number(options.variantIndex)
      : colorPaletteVariantIndex;

    return PaletteGeneratorColorModeHelpers.buildColorModeHarmonyPalette(
      targetCount,
      settings,
      getBuilderOptions(parsedBaseColor, effectiveType, variantIndex, options)
    );
  }

  function createColorModePaletteCandidate(
    settings: Record<string, unknown>,
    options: Record<string, unknown> = {}
  ) {
    return PaletteGeneratorColorModeRuntime.createColorModePaletteCandidate({
      paletteSize: globals.paletteSize,
      currentPalette: globals.currentPalette,
      settings,
      effectiveType:
        (options.effectiveType || getEffectiveColorPaletteType(globals.paletteSize)) as any,
      currentVariantIndex: colorPaletteVariantIndex,
      attemptCount: options.attemptCount as any,
      pinnedEntries: Array.isArray(options.pinnedEntries)
        ? options.pinnedEntries
        : getPinnedPaletteEntriesSnapshot(),
      referencePalette: options.referencePalette ?? globals.currentPalette,
      baseColor: (options.baseColor || getPaletteBaseColorSnapshot()) as any,
      buildColorModePaletteForSettings,
      getComparablePaletteSlice:
        typeof runtimeWindow.getComparablePaletteSlice === "function"
          ? runtimeWindow.getComparablePaletteSlice
          : () => [],
      getComparableMergedPaletteSlice:
        typeof runtimeWindow.getComparableMergedPaletteSlice === "function"
          ? runtimeWindow.getComparableMergedPaletteSlice
          : () => [],
    });
  }

  function getColorModeRegenerationColorForCard(
    card: HTMLElement | null,
    existingColors = new Set<string>()
  ) {
    if (isColorModeMonochromaticScaleActive()) {
      return null;
    }

    const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
    const currentHex = AppColorUtils.normalizeHexColor(
      card?.querySelector(".color-label")?.textContent?.trim() || ""
    );

    if (!Number.isFinite(cardIndex) || cardIndex <= 0) {
      return null;
    }

    const regenerationCandidate =
      PaletteGeneratorColorModeRuntime.getColorModeRegenerationColorForCard({
        paletteSize: globals.paletteSize,
        currentPalette: globals.currentPalette,
        settings:
          typeof runtimeWindow.getCurrentPaletteAdjustmentSnapshot === "function"
            ? runtimeWindow.getCurrentPaletteAdjustmentSnapshot()
            : {},
        effectiveType: getEffectiveColorPaletteType(),
        currentVariantIndex: colorPaletteVariantIndex,
        pinnedEntries: getPinnedPaletteEntriesSnapshot(),
        referencePalette: globals.currentPalette,
        baseColor: getPaletteBaseColorSnapshot(),
        buildColorModePaletteForSettings,
        getComparablePaletteSlice:
          typeof runtimeWindow.getComparablePaletteSlice === "function"
            ? runtimeWindow.getComparablePaletteSlice
            : () => [],
        getComparableMergedPaletteSlice:
          typeof runtimeWindow.getComparableMergedPaletteSlice === "function"
            ? runtimeWindow.getComparableMergedPaletteSlice
            : () => [],
        cardIndex,
        currentHex,
        existingColors,
      });

    if (regenerationCandidate?.color) {
      colorPaletteVariantIndex = regenerationCandidate.variantIndex;
      syncColorVariantIndex(colorPaletteVariantIndex);
      return regenerationCandidate.color;
    }

    return null;
  }

  function syncColorModeSizeSelection() {
    const { nextSize } = PaletteGeneratorColorModeRuntime.resolveCurrentModePaletteSize({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      paletteSize: globals.paletteSize,
    });

    if (nextSize !== globals.paletteSize) {
      if (typeof runtimeWindow.setPaletteSize === "function") {
        runtimeWindow.setPaletteSize(nextSize);
      } else {
        globals.paletteSize = nextSize;
      }
    }

    runtimeWindow.updatePaletteSizeButtonsAvailability?.();
  }

  function initializeColorModeControls() {
    syncColorModeBaseControls();
    syncColorModeSizeSelection();

    if (dom.paletteColorSwatchBtn && dom.paletteColorPicker) {
      dom.paletteColorSwatchBtn.addEventListener("click", () => {
        if (typeof dom.paletteColorPicker.showPicker === "function") {
          dom.paletteColorPicker.showPicker();
          return;
        }

        dom.paletteColorPicker.click();
      });
    }

    if (dom.paletteColorPicker) {
      dom.paletteColorPicker.addEventListener("input", () => {
        setSelectedPaletteBaseColor(dom.paletteColorPicker.value, {
          syncTextInput: true,
        });
      });
    }

    if (dom.paletteColorTextInput) {
      dom.paletteColorTextInput.addEventListener("input", () => {
        const parsedColor = normalizePaletteBaseCssColor(dom.paletteColorTextInput.value);
        if (!parsedColor) {
          setPaletteBaseColorFeedback(
            "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
            true
          );
          runtimeWindow.updatePaletteActionButtonsAvailability?.();
          return;
        }

        if (dom.paletteColorTextInput.value !== parsedColor.inputValue) {
          dom.paletteColorTextInput.value = parsedColor.inputValue;
        }

        setSelectedPaletteBaseColor(parsedColor.inputValue, {
          syncTextInput: false,
        });
        runtimeWindow.updatePaletteActionButtonsAvailability?.();
      });

      dom.paletteColorTextInput.addEventListener("change", () => {
        setSelectedPaletteBaseColor(dom.paletteColorTextInput.value, {
          syncTextInput: true,
        });
      });
    }

    if (dom.paletteTypeOptions instanceof HTMLSelectElement) {
      dom.paletteTypeOptions.addEventListener("change", () => {
        setSelectedColorPaletteType(dom.paletteTypeOptions.value);
      });
    }

    if (dom.monochromaticModeSelect) {
      dom.monochromaticModeSelect.addEventListener("change", () => {
        setSelectedMonochromaticGenerationMode(dom.monochromaticModeSelect.value);
      });
    }

    if (dom.analogousSeparationSelect) {
      dom.analogousSeparationSelect.addEventListener("change", () => {
        setSelectedAnalogousSeparationMode(dom.analogousSeparationSelect.value);
      });
    }
  }

  runtimeWindow.normalizeMonochromaticGenerationMode = normalizeMonochromaticGenerationMode;
  runtimeWindow.normalizeAnalogousSeparationMode = normalizeAnalogousSeparationMode;
  runtimeWindow.shouldShowMonochromaticModeControl = shouldShowMonochromaticModeControl;
  runtimeWindow.shouldShowAnalogousSeparationControl = shouldShowAnalogousSeparationControl;
  runtimeWindow.normalizePaletteBaseColorInput = normalizePaletteBaseColorInput;
  runtimeWindow.normalizePaletteBaseCssColor = normalizePaletteBaseCssColor;
  runtimeWindow.setPaletteBaseColorFeedback = setPaletteBaseColorFeedback;
  runtimeWindow.applyPaletteBaseColorInputState = applyPaletteBaseColorInputState;
  runtimeWindow.syncSelectedPaletteBaseColorCard = syncSelectedPaletteBaseColorCard;
  runtimeWindow.getPaletteBaseColorSnapshot = getPaletteBaseColorSnapshot;
  runtimeWindow.hasValidSelectedPaletteBaseColor = hasValidSelectedPaletteBaseColor;
  runtimeWindow.getAllowedPaletteSizesForType = getAllowedPaletteSizesForType;
  runtimeWindow.getDefaultPaletteSizeForType = getDefaultPaletteSizeForType;
  runtimeWindow.getColorModeReferenceSaturation = getColorModeReferenceSaturation;
  runtimeWindow.resolveAutomaticColorPaletteType = resolveAutomaticColorPaletteType;
  runtimeWindow.getEffectiveColorPaletteType = getEffectiveColorPaletteType;
  runtimeWindow.isColorModeMonochromaticScaleActive = isColorModeMonochromaticScaleActive;
  runtimeWindow.getAllowedPaletteSizesForCurrentMode = getAllowedPaletteSizesForCurrentMode;
  runtimeWindow.getNearestAllowedPaletteSize = getNearestAllowedPaletteSize;
  runtimeWindow.resolvePaletteSizeForType = resolvePaletteSizeForType;
  runtimeWindow.syncPaletteTypeOptionStates = syncPaletteTypeOptionStates;
  runtimeWindow.getPaletteTypeDisplayLabel = getPaletteTypeDisplayLabel;
  runtimeWindow.syncColorModeBaseControls = syncColorModeBaseControls;
  runtimeWindow.setSelectedColorPaletteType = setSelectedColorPaletteType;
  runtimeWindow.setSelectedPaletteBaseColor = setSelectedPaletteBaseColor;
  runtimeWindow.setSelectedMonochromaticGenerationMode =
    setSelectedMonochromaticGenerationMode;
  runtimeWindow.setSelectedAnalogousSeparationMode = setSelectedAnalogousSeparationMode;
  runtimeWindow.buildMonochromaticColorModePalette = buildMonochromaticColorModePalette;
  runtimeWindow.buildComplementaryColorModePalette = buildComplementaryColorModePalette;
  runtimeWindow.buildAnalogousColorModePalette = buildAnalogousColorModePalette;
  runtimeWindow.buildTriadColorModePalette = buildTriadColorModePalette;
  runtimeWindow.buildTetradColorModePalette = buildTetradColorModePalette;
  runtimeWindow.buildColorModePaletteForSettings = buildColorModePaletteForSettings;
  runtimeWindow.createColorModePaletteCandidate = createColorModePaletteCandidate;
  runtimeWindow.getColorModeRegenerationColorForCard = getColorModeRegenerationColorForCard;
  runtimeWindow.syncColorModeSizeSelection = syncColorModeSizeSelection;

  initializeColorModeControls();
  hasInitializedPaletteGeneratorColorMode = true;
}

export default initializePaletteGeneratorColorMode;
