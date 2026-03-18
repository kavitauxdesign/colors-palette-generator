// DOM setup
(function () {
  // Save common elements once so we can reuse them later
  const paletteContainer = document.getElementById("palette");
  const controlsPanel = document.querySelector(".controls");
  const paletteSection = document.querySelector(".palette-section");
  const historyContainer = document.getElementById("history");
  const paletteBaseControlGroup = document.getElementById("paletteBaseControlGroup");
  const paletteBaseModeSelect = document.getElementById("paletteBaseModeSelect");
  const temperatureBasePanel = document.getElementById("temperatureBasePanel");
  const imageBasePanel = document.getElementById("imageBasePanel");
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
    temperatureBasePanel,
    imageBasePanel,
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

// MENU TAB FUNCTIONALITY
const views = document.querySelectorAll(".view-tab");
const navButtons = document.querySelectorAll("nav button");

// Main function to show the correct view based on the current target name.
function showView(name) {

  views.forEach(v => v.classList.remove("active"));

  const target = document.getElementById(name);
  if (target) {
    target.classList.add("active");
  }
  updateActiveMenuButton(name);
}

// Click on menu: update URL without triggering the browser's anchor jump.
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.view;
    if (!target) {
      return;
    }

    showView(target);
    history.replaceState(null, "", `#${target}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  });
});

// HASH CHANGE VIEW HANDLER
window.addEventListener("hashchange", () => {
  const view = location.hash.replace("#", "");
  showView(view);
});

// INITIAL LOAD
window.addEventListener("DOMContentLoaded", () => {

  const view = location.hash.replace("#", "") || "palette_generator";
  showView(view);
  updateActiveMenuButton(view);

});

// ACTIVE MENU BUTTON
function updateActiveMenuButton(view) {
  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  const activeBtn = document.querySelector(`nav button[data-view="${view}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}


// HEADER LOGO SCROLL ROTATION
const logoImage = document.querySelector(".logo img");
if (logoImage && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const rotateLogoOnScroll = () => {
    logoImage.style.setProperty("--scroll-rotate", `${window.scrollY * 0.2}deg`);
  };
  window.addEventListener("scroll", rotateLogoOnScroll, { passive: true });
  rotateLogoOnScroll();
}
