// GLOBAL VARIABLES

const {
  paletteContainer,
  controlsPanel,
  paletteSection,
  historyContainer,
  paletteBaseControlGroup,
  paletteBaseModeSelect,
  colorBasePanel,
  temperatureBasePanel,
  imageBasePanel,
  paletteColorSwatchBtn,
  paletteColorSwatchFill,
  paletteColorTextInput,
  paletteColorInputFeedback,
  paletteColorPicker,
  paletteTypeOptions,
  paletteTypeResolvedLabel,
  monochromaticModeControl,
  monochromaticModeSelect,
  analogousSeparationControl,
  analogousSeparationSelect,
  paletteImageInput,
  paletteImageDropzonePanel,
  paletteImageDropzone,
  paletteImagePreview,
  paletteImagePreviewImg,
  paletteImageName,
  paletteImageDominantToggle,
  paletteImageReplaceBtn,
  paletteIntensityControlGroup,
  brightnessControlGroup,
  brightnessInput,
  saturationInput,
  saturationControlGroup,
  paletteAdjustBtn,
  paletteAdjustPanel,
  paletteUndoBtn,
  paletteRedoBtn,
  paletteViewport,
  paletteLoadingOverlay,
  paletteImageExtractionAlert,
  addColorBtn,
  addColorElement,
  paletteGenerationButtons,
  copyHexBtn,
  paletteRegenerateBtn,
  paletteInspirationBtn,
  generateBtn,
  surpriseBtn,
  copyHexBtnTooltip,
  copyHexBtnLabel,
  resetPaletteBtn,
  warmBtn,
  coolBtn,
  sizeButtons,
  addColorLabel,
  brightnessValueLabel,
  darkBrightnessIcon,
  lightBrightnessIcon,
  saturationValueLabel,
  lowSaturationIcon,
  highSaturationIcon,
  globalEditPicker,
} = window.AppDom;

const {
  DISALLOWED_COLORS,
  MAX_UNIQUE_COLOR_ATTEMPTS,
  MAX_PALETTE_COLORS,
  CARD_COPY_TOOLTIP_DEFAULT,
  HISTORY_COPY_TOOLTIP_DEFAULT,
  ADD_DISABLED_LABEL,
  DEFAULT_PALETTE_SIZE,
  DEFAULT_PALETTE_BASE_MODE,
  DEFAULT_TEMPERATURE,
  DEFAULT_COLOR_BASE,
  DEFAULT_COLOR_PALETTE_TYPE,
  DEFAULT_MONOCHROMATIC_GENERATION_MODE,
  DEFAULT_ANALOGOUS_SEPARATION_MODE,
  DEFAULT_BRIGHTNESS,
  DEFAULT_SATURATION,
  LOW_SATURATION_FALLBACK_THRESHOLD,
  LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS,
} = window.AppConstants;

const colorUtilsForState = window.AppColorUtils || {};
const stateCreateColor =
  typeof colorUtilsForState.createColor === "function"
    ? colorUtilsForState.createColor
    : () => null;

const COLOR_NAME_REFERENCES = Array.isArray(window.AppColorNames)
  ? window.AppColorNames
  : [];
const paletteGeneratorStore = window.PaletteGeneratorStore || null;
const paletteGeneratorStateActions = window.PaletteGeneratorStateActions || {};
const paletteGeneratorStateRuntime = window.PaletteGeneratorStateRuntime || {};
if (typeof paletteGeneratorStateActions.createLegacyStoreBindings !== "function") {
  throw new Error("PaletteGeneratorStateActions.createLegacyStoreBindings is required before palette-generator-state.js loads.");
}
if (
  typeof paletteGeneratorStateRuntime.normalizeLegacyRuntimeState !== "function" ||
  typeof paletteGeneratorStateRuntime.buildLegacySyncRuntimeState !== "function"
) {
  throw new Error("PaletteGeneratorStateRuntime is required before palette-generator-state.js loads.");
}
const paletteGeneratorStateBindings =
  paletteGeneratorStateActions.createLegacyStoreBindings({
    store: paletteGeneratorStore,
    getDominantToggleChecked: () => paletteImageDominantToggle?.checked ?? true,
    getSharedActiveColor: () =>
      window.AppSharedColors?.getDefaultActiveColor?.() ||
      window.AppSharedColors?.getState?.().activeColor ||
      DEFAULT_COLOR_BASE,
    getBrightnessInputValue: () => (brightnessInput ? Number(brightnessInput.value) : null),
    getSaturationInputValue: () => (saturationInput ? Number(saturationInput.value) : null),
  }) || null;
const paletteGeneratorLegacyRuntimeState =
  paletteGeneratorStateBindings?.initialRuntimeState || null;

// Shared runtime state used by all script files
let paletteSize = DEFAULT_PALETTE_SIZE;
let paletteHistory = [];
let paletteHistoryIndex = -1;
let paletteBaseMode = DEFAULT_PALETTE_BASE_MODE;
let uploadedBaseImage = null;
let prioritizeImageDominantColors = paletteImageDominantToggle?.checked ?? true;
let imagePaletteVariantIndex = 0;
let imageInspirationVariantIndex = 0;
let recentInspiredPalettes = [];
let selectedPaletteBaseColor = DEFAULT_COLOR_BASE;
let selectedColorPaletteType = DEFAULT_COLOR_PALETTE_TYPE;
let selectedMonochromaticGenerationMode = DEFAULT_MONOCHROMATIC_GENERATION_MODE;
let selectedAnalogousSeparationMode = DEFAULT_ANALOGOUS_SEPARATION_MODE;
let resolvedAutomaticColorPaletteType = "triad";
let temperature = {
  warm: !!DEFAULT_TEMPERATURE.warm,
  cool: !!DEFAULT_TEMPERATURE.cool,
};

const copyHexBtnDefaultTooltip =
  copyHexBtnTooltip?.textContent ?? HISTORY_COPY_TOOLTIP_DEFAULT;
const copyHexBtnDefaultLabel = copyHexBtnLabel?.textContent?.trim() ?? "Copiar HEX";
const addColorDefaultLabel = addColorLabel?.textContent?.trim() ?? "Añadir color";
let currentPalette = [];
let paletteAdjustmentBase = [];
let paletteAdjustmentBaseSettings = {
  brightness: DEFAULT_BRIGHTNESS,
  saturation: DEFAULT_SATURATION,
};
let copyBtnFeedbackTimeout = null;
let activeEditCard = null;
let activeEditOriginalColor = "#000000";

function applyPaletteGeneratorLegacyRuntimeState(
  nextState = null,
  options = {}
) {
  const shouldSyncAdjustmentBaseSettings = !!options.syncAdjustmentBaseSettings;
  const normalizedState = paletteGeneratorStateRuntime.normalizeLegacyRuntimeState({
    nextState,
    prioritizeImageDominantColorsFallback: paletteImageDominantToggle?.checked ?? true,
  });

  paletteSize = normalizedState.paletteSize;
  paletteHistory = [...normalizedState.paletteHistory];
  paletteHistoryIndex = normalizedState.paletteHistoryIndex;
  paletteBaseMode = normalizedState.paletteBaseMode;
  uploadedBaseImage = normalizedState.uploadedBaseImage;
  prioritizeImageDominantColors = normalizedState.prioritizeImageDominantColors;
  imagePaletteVariantIndex = normalizedState.imagePaletteVariantIndex;
  imageInspirationVariantIndex = normalizedState.imageInspirationVariantIndex;
  selectedPaletteBaseColor = normalizedState.selectedPaletteBaseColor;
  selectedColorPaletteType = normalizedState.selectedColorPaletteType;
  selectedMonochromaticGenerationMode = normalizedState.selectedMonochromaticGenerationMode;
  selectedAnalogousSeparationMode = normalizedState.selectedAnalogousSeparationMode;
  resolvedAutomaticColorPaletteType = normalizedState.resolvedAutomaticColorPaletteType;
  temperature = normalizedState.temperature;
  currentPalette = [...normalizedState.currentPalette];

  if (shouldSyncAdjustmentBaseSettings) {
    paletteAdjustmentBaseSettings = {
      ...normalizedState.paletteAdjustmentBaseSettings,
    };
  }
}

applyPaletteGeneratorLegacyRuntimeState(paletteGeneratorLegacyRuntimeState, {
  syncAdjustmentBaseSettings: true,
});

function getPaletteGeneratorStoreAdjustmentValues(settings = {}) {
  return (
    paletteGeneratorStateBindings?.getAdjustmentValues?.(
      settings,
      paletteAdjustmentBaseSettings
    ) || {
      brightness: DEFAULT_BRIGHTNESS,
      saturation: DEFAULT_SATURATION,
    }
  );
}

function syncPaletteGeneratorStoreState(partial = {}, metadata = {}) {
  return paletteGeneratorStateBindings?.syncState?.(partial, metadata) || null;
}

function syncPaletteGeneratorStoreAdjustments(settings = {}, metadata = {}) {
  return (
    paletteGeneratorStateBindings?.syncAdjustments?.(
      settings,
      paletteAdjustmentBaseSettings,
      metadata
    ) || null
  );
}

function syncPaletteGeneratorStoreCurrentPalette(colors = currentPalette, metadata = {}) {
  return (
    paletteGeneratorStateBindings?.syncCurrentPalette?.(
      Array.isArray(colors) ? [...colors] : [],
      metadata
    ) || null
  );
}

function syncPaletteGeneratorStoreHistoryState(metadata = {}) {
  return (
    paletteGeneratorStateBindings?.syncHistory?.(
      paletteHistory,
      paletteHistoryIndex,
      metadata
    ) || null
  );
}

function syncPaletteGeneratorStoreColorVariantIndex(variantIndex = 0, metadata = {}) {
  return (
    paletteGeneratorStateBindings?.syncColorVariantIndex?.(variantIndex, metadata) || null
  );
}

function syncPaletteGeneratorStoreWithLegacyState(partial = {}, metadata = {}) {
  return (
    paletteGeneratorStateBindings?.syncWithLegacyRuntime?.(
      paletteGeneratorStateRuntime.buildLegacySyncRuntimeState({
        paletteSize,
        paletteHistory,
        paletteHistoryIndex,
        paletteBaseMode,
        uploadedBaseImage,
        prioritizeImageDominantColors,
        imagePaletteVariantIndex,
        imageInspirationVariantIndex,
        selectedPaletteBaseColor,
        selectedColorPaletteType,
        selectedMonochromaticGenerationMode,
        selectedAnalogousSeparationMode,
        resolvedAutomaticColorPaletteType,
        temperature,
        currentPalette,
        colorPaletteVariantIndex:
          typeof colorPaletteVariantIndex !== "undefined" ? colorPaletteVariantIndex : undefined,
      }),
      paletteAdjustmentBaseSettings,
      partial,
      metadata
    ) || null
  );
}

paletteGeneratorStateBindings?.subscribeToStore?.((nextState) => {
  applyPaletteGeneratorLegacyRuntimeState(nextState);
});

syncPaletteGeneratorStoreWithLegacyState();

const COLOR_NAME_REFERENCES_COLOR = COLOR_NAME_REFERENCES.map((entry) => ({
  ...entry,
  color: stateCreateColor(entry.hex),
}));
