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
const paletteGeneratorStoreState = paletteGeneratorStore?.getState?.() || null;

// Shared runtime state used by all script files
let paletteSize = Number.isFinite(paletteGeneratorStoreState?.paletteSize)
  ? paletteGeneratorStoreState.paletteSize
  : DEFAULT_PALETTE_SIZE;
let paletteHistory = Array.isArray(paletteGeneratorStoreState?.paletteHistory)
  ? [...paletteGeneratorStoreState.paletteHistory]
  : [];
let paletteHistoryIndex = Number.isFinite(paletteGeneratorStoreState?.paletteHistoryIndex)
  ? paletteGeneratorStoreState.paletteHistoryIndex
  : -1;
let paletteBaseMode = paletteGeneratorStoreState?.paletteBaseMode || DEFAULT_PALETTE_BASE_MODE;
let uploadedBaseImage = paletteGeneratorStoreState?.uploadedBaseImage || null;
let prioritizeImageDominantColors =
  typeof paletteGeneratorStoreState?.prioritizeImageDominantColors === "boolean"
    ? paletteGeneratorStoreState.prioritizeImageDominantColors
    : (paletteImageDominantToggle?.checked ?? true);
let imagePaletteVariantIndex = Number.isFinite(paletteGeneratorStoreState?.imagePaletteVariantIndex)
  ? paletteGeneratorStoreState.imagePaletteVariantIndex
  : 0;
let imageInspirationVariantIndex = Number.isFinite(
  paletteGeneratorStoreState?.imageInspirationVariantIndex
)
  ? paletteGeneratorStoreState.imageInspirationVariantIndex
  : 0;
let recentInspiredPalettes = [];
let selectedPaletteBaseColor =
  paletteGeneratorStoreState?.selectedPaletteBaseColor ||
  window.AppSharedColors?.getDefaultActiveColor?.() ||
  window.AppSharedColors?.getState?.().activeColor ||
  DEFAULT_COLOR_BASE;
let selectedColorPaletteType =
  paletteGeneratorStoreState?.selectedColorPaletteType || DEFAULT_COLOR_PALETTE_TYPE;
let selectedMonochromaticGenerationMode =
  paletteGeneratorStoreState?.selectedMonochromaticGenerationMode ||
  DEFAULT_MONOCHROMATIC_GENERATION_MODE;
let selectedAnalogousSeparationMode =
  paletteGeneratorStoreState?.selectedAnalogousSeparationMode ||
  DEFAULT_ANALOGOUS_SEPARATION_MODE;
let resolvedAutomaticColorPaletteType =
  paletteGeneratorStoreState?.resolvedAutomaticColorPaletteType || "triad";
let temperature = paletteGeneratorStoreState?.temperature
  ? {
      warm: !!paletteGeneratorStoreState.temperature.warm,
      cool: !!paletteGeneratorStoreState.temperature.cool,
    }
  : {
      warm: !!DEFAULT_TEMPERATURE.warm,
      cool: !!DEFAULT_TEMPERATURE.cool,
    };

const copyHexBtnDefaultTooltip =
  copyHexBtnTooltip?.textContent ?? HISTORY_COPY_TOOLTIP_DEFAULT;
const copyHexBtnDefaultLabel = copyHexBtnLabel?.textContent?.trim() ?? "Copiar HEX";
const addColorDefaultLabel = addColorLabel?.textContent?.trim() ?? "Añadir color";
let currentPalette = Array.isArray(paletteGeneratorStoreState?.currentPalette)
  ? [...paletteGeneratorStoreState.currentPalette]
  : [];
let paletteAdjustmentBase = [];
let paletteAdjustmentBaseSettings = {
  brightness: Number.isFinite(paletteGeneratorStoreState?.adjustments?.brightness)
    ? paletteGeneratorStoreState.adjustments.brightness
    : DEFAULT_BRIGHTNESS,
  saturation: Number.isFinite(paletteGeneratorStoreState?.adjustments?.saturation)
    ? paletteGeneratorStoreState.adjustments.saturation
    : DEFAULT_SATURATION,
};
let copyBtnFeedbackTimeout = null;
let activeEditCard = null;
let activeEditOriginalColor = "#000000";

function getPaletteGeneratorStoreAdjustmentValues(settings = {}) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : (brightnessInput ? Number(brightnessInput.value) : paletteAdjustmentBaseSettings.brightness),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : (saturationInput ? Number(saturationInput.value) : paletteAdjustmentBaseSettings.saturation),
  };
}

function syncPaletteGeneratorStoreState(partial = {}, metadata = {}) {
  if (!paletteGeneratorStore?.syncFromLegacy) {
    return null;
  }

  return paletteGeneratorStore.syncFromLegacy(partial, metadata);
}

function syncPaletteGeneratorStoreAdjustments(settings = {}, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      adjustments: getPaletteGeneratorStoreAdjustmentValues(settings),
    },
    metadata
  );
}

function syncPaletteGeneratorStoreCurrentPalette(colors = currentPalette, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      currentPalette: Array.isArray(colors) ? [...colors] : [],
    },
    metadata
  );
}

function syncPaletteGeneratorStoreHistoryState(metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      paletteHistory,
      paletteHistoryIndex,
    },
    metadata
  );
}

function syncPaletteGeneratorStoreColorVariantIndex(variantIndex = 0, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      colorPaletteVariantIndex: Number.isFinite(variantIndex) ? variantIndex : 0,
    },
    metadata
  );
}

function syncPaletteGeneratorStoreWithLegacyState(partial = {}, metadata = {}) {
  const nextState = {
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
    temperature: {
      warm: !!temperature?.warm,
      cool: !!temperature?.cool,
    },
    currentPalette,
    adjustments: getPaletteGeneratorStoreAdjustmentValues(),
    ...partial,
  };

  if (typeof colorPaletteVariantIndex !== "undefined") {
    nextState.colorPaletteVariantIndex = colorPaletteVariantIndex;
  }

  return syncPaletteGeneratorStoreState(nextState, metadata);
}

syncPaletteGeneratorStoreWithLegacyState();

const COLOR_NAME_REFERENCES_COLOR = COLOR_NAME_REFERENCES.map((entry) => ({
  ...entry,
  color: stateCreateColor(entry.hex),
}));
