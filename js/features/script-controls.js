// Update brightness UI
const hslToHex = window.AppColorUtils?.hslToHex;
if (typeof hslToHex !== "function") {
  throw new Error("AppColorUtils.hslToHex is required before script-controls.js loads.");
}

const ROOT_STYLES = getComputedStyle(document.documentElement);
const DARK_BRIGHTNESS_DEFAULT_FILL =
  ROOT_STYLES.getPropertyValue("--secondary").trim() || LIGHT_BRIGHTNESS_DEFAULT_FILL;
const DARK_BRIGHTNESS_ACTIVE_FILL =
  ROOT_STYLES.getPropertyValue("--danger").trim() || "#ce1c1c";

function hexToRgbForControls(hex) {
  const normalized = String(hex || "").trim().toUpperCase().replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function blendHexForControls(fromHex, toHex, amount) {
  const from = hexToRgbForControls(fromHex);
  const to = hexToRgbForControls(toHex);
  const ratio = Math.max(0, Math.min(1, amount));

  const r = Math.round(from.r + (to.r - from.r) * ratio);
  const g = Math.round(from.g + (to.g - from.g) * ratio);
  const b = Math.round(from.b + (to.b - from.b) * ratio);

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

const updateProgress = () => {
  if (!brightnessInput) {
    return;
  }

  const min = parseFloat(brightnessInput.min) || 0;
  const max = parseFloat(brightnessInput.max) || 100;
  const value = parseFloat(brightnessInput.value);

  // Update slider fill based on current value
  const percent = ((value - min) / (max - min)) * 100;

  brightnessInput.style.setProperty("--value", percent + "%");

  // Grow dark icon when slider goes left
  let darkScale = 0;
  if (darkBrightnessSvg && percent < 50) {
    darkScale = ((50 - percent) / 40) * 100;
    const darkActiveRatio = (50 - percent) / 50;

    if (darkBrightnessPath) {
      darkBrightnessPath.style.fill = blendHexForControls(
        DARK_BRIGHTNESS_DEFAULT_FILL,
        DARK_BRIGHTNESS_ACTIVE_FILL,
        darkActiveRatio,
      );
    }
  } else if (darkBrightnessSvg) {
    if (darkBrightnessPath) {
      darkBrightnessPath.style.fill = DARK_BRIGHTNESS_DEFAULT_FILL;
    }
  }

  // Grow light icon when slider goes right
  let lightScale = 0;
  if (percent > 50) {
    lightScale = ((percent - 50) / 40) * 180;
    if (lightBrightnessPath) {
      lightBrightnessPath.style.fill = LIGHT_BRIGHTNESS_ACTIVE_FILL;
    }
  } else if (lightBrightnessPath) {
    lightBrightnessPath.style.fill = LIGHT_BRIGHTNESS_DEFAULT_FILL;
  }

  if (darkBrightnessSvg) {
    darkBrightnessSvg.style.transform = `scale(${1 + darkScale / 100})`;
  }
  if (lightBrightnessSvg) {
    lightBrightnessSvg.style.transform = `scale(${1 + lightScale / 100})`;
  }
};

if (brightnessInput) {
  brightnessInput.addEventListener("input", updateProgress);
  // Apply the first visual state
  updateProgress();
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

// SIZE SELECTOR

function setPaletteSize(size) {
  paletteSize = size;
  sizeButtons.forEach((button) => {
    button.classList.toggle("active", parseInt(button.dataset.size) === size);
  });
}

sizeButtons.forEach((button) => {
  button.onclick = () => {
    setPaletteSize(parseInt(button.dataset.size));
  };
});

// TEMPERATURE

function setTemperatureSelection(nextSelection) {
  const warmSelected = !!nextSelection.warm;
  const coolSelected = !!nextSelection.cool;

  // Keep at least one temperature active
  if (!warmSelected && !coolSelected) {
    temperature = { warm: true, cool: false };
  } else {
    temperature = { warm: warmSelected, cool: coolSelected };
  }

  if (warmBtn) {
    warmBtn.classList.toggle("active", temperature.warm);
  }
  if (coolBtn) {
    coolBtn.classList.toggle("active", temperature.cool);
  }
}

function toggleTemperature(type) {
  const nextSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  nextSelection[type] = !nextSelection[type];

  // If both become off, turn back the clicked one
  if (!nextSelection.warm && !nextSelection.cool) {
    nextSelection[type] = true;
  }

  setTemperatureSelection(nextSelection);
}

if (warmBtn) {
  warmBtn.onclick = () => toggleTemperature("warm");
}

if (coolBtn) {
  coolBtn.onclick = () => toggleTemperature("cool");
}

// RESET

if (resetPaletteBtn) {
  resetPaletteBtn.onclick = () => {
    // Reload page to reset app state
    window.location.reload();
  };
}

// GENERATE

if (generateBtn) {
  generateBtn.onclick = generatePalette;
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.onclick = () => {
    // Pick random controls, then generate one palette
    const randomSize = [3, 6, 9][Math.floor(Math.random() * 3)];
    setPaletteSize(randomSize);

    const randomTemperatureSelection = [
      { warm: true, cool: false },
      { warm: false, cool: true },
      { warm: true, cool: true },
    ][Math.floor(Math.random() * 3)];
    setTemperatureSelection(randomTemperatureSelection);

    if (brightnessInput) {
      // Pick random brightness and map it to slider value
      const randomBrightness = 20 + Math.random() * 60;
      brightnessInput.value = ((randomBrightness - 20) / 60) * 100;
      updateProgress();
    }

    generatePalette();
  };
}

function generatePalette() {
  // Remove only color cards and keep the add card
  getColorCards().forEach((card) => card.remove());

  // Build a new palette from current settings
  currentPalette = [];
  const usedColors = new Set();
  const maxRetriesPerColor = 99;
  const requiresSpecialColor = paletteSize >= 6;
  let hasSpecialColor = false;
  const specialTargetIndex = requiresSpecialColor
    ? Math.floor(Math.random() * paletteSize)
    : -1;

  for (let i = 0; i < paletteSize; i++) {
    let color = null;
    let retries = 0;

    const remainingSlots = paletteSize - i;
    const mustPickSpecialNow =
      requiresSpecialColor &&
      !hasSpecialColor &&
      (i === specialTargetIndex || remainingSlots === 1);

    if (mustPickSpecialNow) {
      color = getUniqueSpecialColor(usedColors);
    }

    // Retry silently before giving up on this slot
    while (!color && retries < maxRetriesPerColor) {
      color = getUniqueGeneratedColor(usedColors);
      retries++;
    }

    if (!color) {
      // Stop generation quietly if uniqueness constraints cannot be satisfied
      break;
    }

    usedColors.add(color);
    if (isSpecialCosmicColorHex(color)) {
      hasSpecialColor = true;
    }

    currentPalette.push(color);

    createColorCard(color);
  }

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  saveHistory(currentPalette);
}

// GENERATE COLOR

function generateColor() {
  let h;

  // If both temps are on, pick warm or cool randomly
  const useWarmPalette =
    temperature.warm && (!temperature.cool || Math.random() < 0.5);

  if (useWarmPalette) {
    if (Math.random() < 0.2) {
      h = 300 + Math.random() * 60;
    } else {
      h = Math.random() * 60;
    }
  } else {
    h = 120 + Math.random() * 180;
  }

  // Saturation stays fixed
  let s = 70;
  // Map slider range 0-100 to lightness 20-80
  let sliderValue = parseFloat(brightnessInput.value);
  let l = 20 + (sliderValue / 100) * 60;

  return hslToHex(h, s, l);
}


