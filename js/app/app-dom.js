// DOM setup
(function () {
  // Save common elements once so we can reuse them later
  const paletteContainer = document.getElementById("palette");
  const historyContainer = document.getElementById("history");
  const brightnessInput = document.getElementById("brightness");
  const addColorBtn = document.getElementById("addColorBtn");
  const colorPicker = document.getElementById("colorPicker");
  const addColorElement = document.querySelector(".add-color");
  const copyHexBtn = document.getElementById("copyHexBtn");
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
  const brightnessSvgs = document.querySelectorAll(".brightness-labels svg");
  // Brightness icons and their key paths
  const darkBrightnessSvg = brightnessSvgs[0] || null;
  const lightBrightnessSvg = brightnessSvgs[1] || null;
  const darkBrightnessPath = darkBrightnessSvg?.querySelector("path") ?? null;
  const lightBrightnessPath = lightBrightnessSvg?.querySelector("path") ?? null;
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
    historyContainer,
    brightnessInput,
    addColorBtn,
    colorPicker,
    addColorElement,
    copyHexBtn,
    generateBtn,
    surpriseBtn,
    copyHexBtnTooltip,
    copyHexBtnLabel,
    resetPaletteBtn,
    warmBtn,
    coolBtn,
    sizeButtons,
    addColorLabel,
    darkBrightnessSvg,
    darkBrightnessPath,
    lightBrightnessSvg,
    lightBrightnessPath,
    globalEditPicker,
  };
})();
