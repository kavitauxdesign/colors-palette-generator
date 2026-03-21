// DOM setup
(function () {
  // Save common elements once so we can reuse them later
  const paletteContainer = document.getElementById("palette");
  const controlsPanel = document.querySelector(".controls");
  const paletteSection = document.querySelector(".palette-section");
  const historyContainer = document.getElementById("history");
  const paletteBaseControlGroup = document.getElementById("paletteBaseControlGroup");
  const paletteBaseModeSelect = document.getElementById("paletteBaseModeSelect");
  const colorBasePanel = document.getElementById("colorBasePanel");
  const temperatureBasePanel = document.getElementById("temperatureBasePanel");
  const imageBasePanel = document.getElementById("imageBasePanel");
  const paletteColorSwatchBtn = document.getElementById("paletteColorSwatchBtn");
  const paletteColorSwatchFill = document.getElementById("paletteColorSwatchFill");
  const paletteColorTextInput = document.getElementById("paletteColorTextInput");
  const paletteColorInputFeedback = document.getElementById("paletteColorInputFeedback");
  const paletteColorPicker = document.getElementById("paletteColorPicker");
  const paletteTypeOptions = document.getElementById("paletteTypeOptions");
  const paletteTypeResolvedLabel = document.getElementById("paletteTypeResolvedLabel");
  const paletteImageInput = document.getElementById("paletteImageInput");
  const paletteImageDropzonePanel = document.getElementById("paletteImageDropzonePanel");
  const paletteImageDropzone = document.getElementById("paletteImageDropzone");
  const paletteImagePreview = document.getElementById("paletteImagePreview");
  const paletteImagePreviewImg = document.getElementById("paletteImagePreviewImg");
  const paletteImageName = document.getElementById("paletteImageName");
  const paletteImageDominantToggle = document.getElementById("paletteImageDominantToggle");
  const paletteImageReplaceBtn = document.getElementById("paletteImageReplaceBtn");
  const brightnessControlGroup = document.getElementById("brightnessControlGroup");
  const brightnessInput = document.getElementById("brightness");
  const saturationInput = document.getElementById("saturation");
  const saturationControlGroup = document.getElementById("saturationControlGroup");
  const paletteAdjustBtn = document.getElementById("paletteAdjustBtn");
  const paletteAdjustPanel = document.getElementById("paletteAdjustPanel");
  const paletteUndoBtn = document.getElementById("paletteUndoBtn");
  const paletteRedoBtn = document.getElementById("paletteRedoBtn");
  const paletteImageExtractionAlert = document.getElementById("paletteImageExtractionAlert");
  const addColorBtn = document.getElementById("addColorBtn");
  const colorPicker = document.getElementById("colorPicker");
  const addColorElement = document.querySelector(".add-color");
  const paletteGenerationButtons = document.getElementById("paletteGenerationButtons");
  const copyHexBtn = document.getElementById("copyHexBtn");
  const paletteRegenerateBtn = document.getElementById("paletteRegenerateBtn");
  const paletteInspirationBtn = document.getElementById("paletteInspirationBtn");
  const generateBtn = document.getElementById("generateBtn");
  const surpriseBtn = document.getElementById("surpriseBtn");
  // Tooltip and label used by the main copy button
  const copyHexBtnTooltip = copyHexBtn?.querySelector(".tooltip") ?? null;
  const copyHexBtnLabel = copyHexBtn?.querySelector("span") ?? null;
  const resetPaletteBtn = document.getElementById("resetPaletteBtn");
  const warmBtn = document.getElementById("warmBtn");
  const coolBtn = document.getElementById("coolBtn");
  const sizeButtons = document.querySelectorAll(".size");
  // Add button label text
  const addColorLabel = addColorBtn?.querySelector("span") ?? null;
  const brightnessValueLabel = document.getElementById("brightnessValue");
  const brightnessIcons = document.querySelectorAll(".brightness-labels .brightness-icon");
  const darkBrightnessIcon = brightnessIcons[0] || null;
  const lightBrightnessIcon = brightnessIcons[1] || null;
  const saturationValueLabel = document.getElementById("saturationValue");
  const saturationIcons = document.querySelectorAll(".saturation-labels .saturation-icon");
  const lowSaturationIcon = saturationIcons[0] || null;
  const highSaturationIcon = saturationIcons[1] || null;
  // One shared color input for editing card colors
  const globalEditPicker = document.createElement("input");
  globalEditPicker.type = "color";
  globalEditPicker.className = "card-edit-input";
  document.body.appendChild(globalEditPicker);

  if (colorPicker) {
    // This old picker is not used in the new add flow
    colorPicker.disabled = true;
    colorPicker.tabIndex = -1;
    colorPicker.style.pointerEvents = "none";
    colorPicker.setAttribute("aria-hidden", "true");
  }
  // Export all DOM references
  window.AppDom = {
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
    paletteImageInput,
    paletteImageDropzonePanel,
    paletteImageDropzone,
    paletteImagePreview,
    paletteImagePreviewImg,
    paletteImageName,
    paletteImageDominantToggle,
    paletteImageReplaceBtn,
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
    colorPicker,
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
  };
})();
