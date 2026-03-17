// Update range controls UI
const hslToHex = window.AppColorUtils?.hslToHex;
if (typeof hslToHex !== "function") {
  throw new Error("AppColorUtils.hslToHex is required before script-controls.js loads.");
}

let saturationAttentionTimeout = null;
let brightnessAttentionTimeout = null;
let saturationDangerTimeout = null;

function updateRangeControl(input, valueLabel, lowIcon, highIcon) {
  if (!input) {
    return;
  }

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);

  // Update slider fill based on current value
  const percent = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--value", percent + "%");
  if (valueLabel) {
    valueLabel.textContent = `${Math.round(percent)}%`;
  }

  // Grow left icon when slider goes left
  let lowScale = 0;
  if (lowIcon && percent < 50) {
    lowScale = ((50 - percent) / 40) * 30;
  }

  // Grow right icon when slider goes right
  let highScale = 0;
  if (percent > 50) {
    highScale = ((percent - 50) / 40) * 30;
  }

  if (lowIcon) {
    lowIcon.style.transform = `scale(${1 + lowScale / 100})`;
    lowIcon.style.opacity = `${Math.max(0.5, 1 - (percent / 100) * 0.4)}`;
  }
  if (highIcon) {
    highIcon.style.transform = `scale(${1 + highScale / 100})`;
    highIcon.style.opacity = `${Math.max(0.5, 0.5 + (percent / 100) * 0.4)}`;
  }
}

const updateBrightnessProgress = () =>
  updateRangeControl(
    brightnessInput,
    brightnessValueLabel,
    darkBrightnessIcon,
    lightBrightnessIcon
  );

const updateSaturationProgress = () =>
  updateRangeControl(
    saturationInput,
    saturationValueLabel,
    lowSaturationIcon,
    highSaturationIcon
  );

function isTemperatureLockedBySaturation() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}

function renderTemperatureButtonState(button, isActive) {
  if (!button) {
    return;
  }

  const isLocked = isTemperatureLockedBySaturation();
  button.classList.toggle("active", !isLocked && isActive);
  button.classList.toggle("is-saturation-locked", isLocked);
  button.setAttribute("aria-disabled", isLocked ? "true" : "false");
}

function syncTemperatureControlsState() {
  renderTemperatureButtonState(warmBtn, temperature.warm);
  renderTemperatureButtonState(coolBtn, temperature.cool);
}

function animateSaturationControlAttention() {
  if (!saturationControlGroup) {
    return;
  }

  saturationControlGroup.classList.remove("needs-attention");
  void saturationControlGroup.offsetWidth;
  saturationControlGroup.classList.add("needs-attention");

  if (saturationAttentionTimeout) {
    clearTimeout(saturationAttentionTimeout);
  }

  saturationAttentionTimeout = setTimeout(() => {
    saturationControlGroup.classList.remove("needs-attention");
    saturationAttentionTimeout = null;
  }, 420);
}

function animateBrightnessControlAttention() {
  if (!brightnessControlGroup) {
    return;
  }

  brightnessControlGroup.classList.remove("needs-attention");
  void brightnessControlGroup.offsetWidth;
  brightnessControlGroup.classList.add("needs-attention");

  if (brightnessAttentionTimeout) {
    clearTimeout(brightnessAttentionTimeout);
  }

  brightnessAttentionTimeout = setTimeout(() => {
    brightnessControlGroup.classList.remove("needs-attention");
    brightnessAttentionTimeout = null;
  }, 420);
}

function showSaturationDangerState() {
  if (!saturationInput) {
    return;
  }

  saturationInput.classList.add("is-danger");

  if (saturationDangerTimeout) {
    clearTimeout(saturationDangerTimeout);
  }

  saturationDangerTimeout = setTimeout(() => {
    saturationInput.classList.remove("is-danger");
    saturationDangerTimeout = null;
  }, 1000);
}

function isLowBrightnessRestrictingSaturation() {
  return getCurrentBrightnessValue() <= LOW_BRIGHTNESS_THRESHOLD;
}

function enforceLowBrightnessSaturationConstraint(triggerSource = "system") {
  if (!saturationInput || !isLowBrightnessRestrictingSaturation()) {
    return false;
  }

  const currentSaturation = getCurrentSaturationValue();
  if (currentSaturation >= MIN_SATURATION_WHEN_LOW_BRIGHTNESS) {
    return false;
  }

  saturationInput.value = String(MIN_SATURATION_WHEN_LOW_BRIGHTNESS);
  updateSaturationProgress();
  syncTemperatureControlsState();

  if (triggerSource === "user") {
    animateBrightnessControlAttention();
    showSaturationDangerState();
  }

  return true;
}

if (brightnessInput) {
  brightnessInput.addEventListener("input", () => {
    updateBrightnessProgress();
    enforceLowBrightnessSaturationConstraint();
  });
  // Apply the first visual state
  updateBrightnessProgress();
  enforceLowBrightnessSaturationConstraint();
}

if (saturationInput) {
  saturationInput.addEventListener("input", () => {
    enforceLowBrightnessSaturationConstraint("user");
    updateSaturationProgress();
    syncTemperatureControlsState();
  });
  // Apply the first visual state
  updateSaturationProgress();
  enforceLowBrightnessSaturationConstraint();
  syncTemperatureControlsState();
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

  syncTemperatureControlsState();
}

function toggleTemperature(type) {
  if (isTemperatureLockedBySaturation()) {
    animateSaturationControlAttention();
    return;
  }

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

function handleTemperatureButtonClick(type, button) {
  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  toggleTemperature(type);
}

if (warmBtn) {
  warmBtn.onclick = () => handleTemperatureButtonClick("warm", warmBtn);
  warmBtn.addEventListener("mouseleave", () => {
    warmBtn.classList.remove("suppress-hover");
  });
}

if (coolBtn) {
  coolBtn.onclick = () => handleTemperatureButtonClick("cool", coolBtn);
  coolBtn.addEventListener("mouseleave", () => {
    coolBtn.classList.remove("suppress-hover");
  });
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
      updateBrightnessProgress();
    }

    if (saturationInput) {
      saturationInput.value = Math.round((Math.random() * 100) / 5) * 5;
      enforceLowBrightnessSaturationConstraint();
      updateSaturationProgress();
      syncTemperatureControlsState();
    }

    generatePalette();
  };
}

function clampControlValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentBrightnessValue() {
  const sliderValue = brightnessInput
    ? parseFloat(brightnessInput.value)
    : DEFAULT_BRIGHTNESS;

  return Number.isFinite(sliderValue) ? sliderValue : DEFAULT_BRIGHTNESS;
}

function getCurrentSaturationValue() {
  const saturationValue = saturationInput
    ? parseFloat(saturationInput.value)
    : DEFAULT_SATURATION;

  return Number.isFinite(saturationValue) ? saturationValue : DEFAULT_SATURATION;
}

function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}

function buildAlternativeMonochromePalette(targetCount) {
  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = 10 + (getCurrentBrightnessValue() / 100) * 80;
  const monochromeSaturation = clampControlValue(
    getCurrentSaturationValue(),
    0,
    LOW_SATURATION_FALLBACK_THRESHOLD
  );
  const baseHue = Math.random() * 360;
  const spread = clampControlValue(targetCount * 8, 36, 72);

  let minLightness = clampControlValue(centerLightness - spread / 2, 10, 90);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 10, 90);

  if (maxLightness - minLightness < 24) {
    minLightness = 10;
    maxLightness = 90;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -6, 6, -12, 12, -18, 18];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const candidate = normalizeHexColor(
        hslToHex(
          baseHue,
          monochromeSaturation,
          clampControlValue(baseLightness + adjustment, 10, 90)
        )
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function generatePalette() {
  // Remove only color cards and keep the add card
  getColorCards().forEach((card) => card.remove());

  // Build a new palette from current settings
  let nextPalette = [];
  const usedColors = new Set();
  const maxRetriesPerColor = 99;
  let usedAlternativePalette = false;

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
    nextPalette.push(color);
  }

  if (nextPalette.length < paletteSize && shouldUseAlternativePalette()) {
    const alternativePalette = buildAlternativeMonochromePalette(paletteSize);

    if (alternativePalette.length === paletteSize) {
      nextPalette = alternativePalette;
      usedAlternativePalette = true;
    }
  }

  currentPalette = nextPalette;
  currentPalette.forEach((color) => {
    createColorCard(color);
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  saveHistory(currentPalette, { isAlternative: usedAlternativePalette });
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

  let s = getCurrentSaturationValue();

  // Keep the slider at 0-100, but avoid real lightness extremes with a 10-90 range.
  let sliderValue = getCurrentBrightnessValue();
  let l = 10 + (sliderValue / 100) * 80;

  return hslToHex(h, s, l);
}
