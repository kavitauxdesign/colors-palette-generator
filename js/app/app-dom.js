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
  const brightnessValueLabel = document.getElementById("brightnessValue");
  const brightnessIcons = document.querySelectorAll(".brightness-labels .brightness-icon");
  const darkBrightnessIcon = brightnessIcons[0] || null;
  const lightBrightnessIcon = brightnessIcons[1] || null;
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
    brightnessValueLabel,
    darkBrightnessIcon,
    lightBrightnessIcon,
    globalEditPicker,
  };
})();

// MENU TAB FUNCTIONALITY
const views = document.querySelectorAll(".view-tab");

document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {

    views.forEach(v => v.classList.remove("active"));

    const target = btn.dataset.view;
    document.getElementById(target).classList.add("active");

  });
});

// HASH CHANGE VIEW HANDLER
// main function to show the correct view based on the URL hash
function showView(name) {

  views.forEach(v => v.classList.remove("active"));

  const target = document.getElementById(name);
  if (target) {
    target.classList.add("active");
  }
  updateActiveMenuButton(name);
}

// CLICK ON MENU
document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {

    const target = btn.dataset.view;

    // change the URL
    location.hash = target;

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