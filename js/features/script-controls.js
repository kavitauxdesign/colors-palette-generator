// Update brightness UI
const hslToHex = window.AppColorUtils?.hslToHex;
if (typeof hslToHex !== "function") {
  throw new Error("AppColorUtils.hslToHex is required before script-controls.js loads.");
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
  if (brightnessValueLabel) {
    brightnessValueLabel.textContent = `${Math.round(percent)}%`;
  }

  // Grow dark icon when slider goes left
  let darkScale = 0;
  if (darkBrightnessIcon && percent < 50) {
    darkScale = ((50 - percent) / 40) * 55;
  }

  // Grow light icon when slider goes right
  let lightScale = 0;
  if (percent > 50) {
    lightScale = ((percent - 50) / 40) * 60;
  }

  if (darkBrightnessIcon) {
    darkBrightnessIcon.style.transform = `scale(${1 + darkScale / 100})`;
  }
  if (lightBrightnessIcon) {
    lightBrightnessIcon.style.transform = `scale(${1 + lightScale / 100})`;
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
      // Keep the slider visual range at 0-100, but map the real lightness to 10-90.
      const randomBrightness = 10 + Math.random() * 80;
      brightnessInput.value = ((randomBrightness - 10) / 80) * 100;
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

  for (let i = 0; i < paletteSize; i++) {
    let color = null;
    let retries = 0;

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
  // Keep the slider at 0-100, but avoid real lightness extremes with a 10-90 range.
  let sliderValue = parseFloat(brightnessInput.value);
  let l = 10 + (sliderValue / 100) * 80;

  return hslToHex(h, s, l);
}
