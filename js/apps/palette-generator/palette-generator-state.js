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

const COLOR_NAME_REFERENCES_COLOR = COLOR_NAME_REFERENCES.map((entry) => ({
  ...entry,
  color: stateCreateColor(entry.hex),
}));
