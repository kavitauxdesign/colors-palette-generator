// Update range controls UI
const controlsHslToHex = window.AppColorUtils?.hslToHex;
const controlsNormalizeHexColor = window.AppColorUtils?.normalizeHexColor;
const controlsHexToRgb = window.AppColorUtils?.hexToRgb;
const controlsHexToHsl = window.AppColorUtils?.hexToHsl;
if (
  typeof controlsHslToHex !== "function" ||
  typeof controlsNormalizeHexColor !== "function" ||
  typeof controlsHexToRgb !== "function" ||
  typeof controlsHexToHsl !== "function"
) {
  throw new Error("AppColorUtils helpers are required before script-controls.js loads.");
}

let saturationAttentionTimeout = null;
let isPaletteImageDropzoneVisible = true;
let isReplaceImagePending = false;
let isPaletteAdjustPanelOpen = false;
const imagePanelTransitionMs = 320;
const allowedPaletteImageTypes = new Set(["image/jpeg", "image/png", "image/svg+xml"]);
const allowedPaletteImageExtensions = [".jpg", ".jpeg", ".png", ".svg"];
const IMAGE_EXTRACTION_ERROR_MESSAGE =
  "No se ha podido extraer colores. Has de intentar subir otra imagen.";
const IMAGE_PALETTE_VARIANT_PROFILES = [
  { hueShift: 0, saturationShift: 0, lightnessShift: 0, stagger: [0, 0, 0, 0] },
  { hueShift: 4, saturationShift: -6, lightnessShift: 8, stagger: [0, 6, -4, 10] },
  { hueShift: -5, saturationShift: 8, lightnessShift: -6, stagger: [0, -8, 6, -12] },
  { hueShift: 10, saturationShift: -10, lightnessShift: 4, stagger: [0, 10, -6, 14] },
  { hueShift: -12, saturationShift: 6, lightnessShift: 10, stagger: [0, -10, 8, -6] },
  { hueShift: 16, saturationShift: -4, lightnessShift: -10, stagger: [0, 12, -10, 6] },
];

function updateUploadedImageAnalysisCache(cachePatch) {
  if (!uploadedBaseImage) {
    return;
  }

  uploadedBaseImage.analysisCache = {
    ...(uploadedBaseImage.analysisCache || {}),
    ...cachePatch,
  };
}

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

function getCurrentPaletteAdjustmentSnapshot() {
  return {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
}

function capturePaletteAdjustmentBase(colors = currentPalette, settings = getCurrentPaletteAdjustmentSnapshot()) {
  const validColors = Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => /^#[0-9A-F]{6}$/.test(hex))
    : [];

  paletteAdjustmentBase = [...validColors];
  paletteAdjustmentBaseSettings = {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : DEFAULT_SATURATION,
  };
}

function getPaletteAdjustmentDeltas() {
  return {
    brightnessDelta:
      getCurrentBrightnessValue() - paletteAdjustmentBaseSettings.brightness,
    saturationDelta:
      getCurrentSaturationValue() - paletteAdjustmentBaseSettings.saturation,
  };
}

function getAdjustedPaletteColor(hex, variantIndex = 0) {
  const hsl = controlsHexToHsl(hex);
  const { brightnessDelta, saturationDelta } = getPaletteAdjustmentDeltas();
  const lightnessVariants = [0, -4, 4, -8, 8, -12, 12, -16, 16];
  const hueVariants = [0, 2, -2, 4, -4];
  const lightnessOffset = lightnessVariants[variantIndex % lightnessVariants.length];
  const hueOffset =
    hueVariants[Math.floor(variantIndex / lightnessVariants.length) % hueVariants.length];

  return controlsNormalizeHexColor(
    controlsHslToHex(
      (hsl.h + hueOffset + 360) % 360,
      clampControlValue(hsl.s + saturationDelta, 0, 100),
      clampControlValue(hsl.l + brightnessDelta * 0.45 + lightnessOffset, 0, 100)
    )
  );
}

function buildAdjustedPaletteFromBase(colors = paletteAdjustmentBase) {
  const adjustedPalette = [];
  const usedColors = new Set();

  colors.forEach((color, colorIndex) => {
    for (let variantIndex = 0; variantIndex < 28; variantIndex++) {
      const candidate = getAdjustedPaletteColor(color, variantIndex + colorIndex * 2);
      if (usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      adjustedPalette.push(candidate);
      return;
    }
  });

  return adjustedPalette;
}

function renderAdjustedPalette(colors) {
  const cards = Array.from(getColorCards());

  if (cards.length !== colors.length) {
    getColorCards().forEach((card) => card.remove());
    colors.forEach((color) => {
      createColorCard(color);
    });
  } else {
    cards.forEach((card, index) => {
      setCardColor(card, colors[index]);
    });
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();
  syncCurrentPaletteFromDom();
}

function applyCurrentPaletteAdjustments() {
  if (!Array.isArray(paletteAdjustmentBase) || paletteAdjustmentBase.length === 0) {
    return;
  }

  renderAdjustedPalette(buildAdjustedPaletteFromBase());
}

function setPaletteAdjustPanelOpen(shouldOpen) {
  if (!paletteAdjustPanel || !paletteAdjustBtn) {
    return;
  }

  isPaletteAdjustPanelOpen = !!shouldOpen;
  paletteAdjustPanel.classList.toggle("is-open", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.classList.toggle("is-active", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.setAttribute("aria-expanded", isPaletteAdjustPanelOpen ? "true" : "false");
  paletteAdjustPanel.setAttribute("aria-hidden", isPaletteAdjustPanelOpen ? "false" : "true");
  updatePaletteStickyState();
}

function setPaletteImageExtractionFeedback(isVisible, message = IMAGE_EXTRACTION_ERROR_MESSAGE) {
  if (paletteContainer) {
    paletteContainer.hidden = isVisible;
  }

  if (addColorElement) {
    addColorElement.hidden = isVisible;
  }

  if (paletteImageExtractionAlert) {
    paletteImageExtractionAlert.hidden = !isVisible;
    paletteImageExtractionAlert.textContent = message;
  }

  if (isVisible) {
    getColorCards().forEach((card) => card.remove());
    currentPalette = [];
    capturePaletteAdjustmentBase([]);
  }

  updatePaletteStickyState();
}

function revealPaletteImageDropzoneForRetry() {
  if (!paletteImageDropzonePanel) {
    return;
  }

  const shouldAnimate = !isPaletteImageDropzoneVisible;
  isPaletteImageDropzoneVisible = true;
  isReplaceImagePending = false;
  renderPaletteImagePreview();

  if (!shouldAnimate) {
    return;
  }

  paletteImageDropzonePanel.classList.remove("is-sliding-in");
  void paletteImageDropzonePanel.offsetWidth;
  paletteImageDropzonePanel.classList.add("is-sliding-in");
}

function ensurePaletteAdjustPanelVisible() {
  if (!isPaletteAdjustPanelOpen) {
    setPaletteAdjustPanelOpen(true);
  }
}

function updatePaletteStickyState() {
  if (!controlsPanel || !paletteSection) {
    return;
  }

  const isDesktopLayout = window.innerWidth > 680;
  const controlsHeight = controlsPanel.scrollHeight;
  const paletteHeight = paletteSection.scrollHeight;
  const shouldStick = isDesktopLayout && paletteHeight > 0 && paletteHeight < controlsHeight;

  paletteSection.classList.toggle("is-sticky", shouldStick);
}

function isTemperatureLockedBySaturation() {
  return (
    getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD &&
    getCurrentBrightnessValue() <= LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS
  );
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

  ensurePaletteAdjustPanelVisible();
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

if (brightnessInput) {
  brightnessInput.addEventListener("input", () => {
    updateBrightnessProgress();
    syncTemperatureControlsState();
    applyCurrentPaletteAdjustments();
  });
  brightnessInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateBrightnessProgress();
  syncTemperatureControlsState();
}

if (saturationInput) {
  saturationInput.addEventListener("input", () => {
    updateSaturationProgress();
    syncTemperatureControlsState();
    applyCurrentPaletteAdjustments();
  });
  saturationInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateSaturationProgress();
  syncTemperatureControlsState();
}

if (paletteAdjustBtn) {
  paletteAdjustBtn.addEventListener("click", () => {
    setPaletteAdjustPanelOpen(!isPaletteAdjustPanelOpen);
  });
}

function updatePaletteModeActionVisibility() {
  const isImageMode = paletteBaseMode === "image";
  const hasImageSource = !!uploadedBaseImage?.dataUrl;

  if (paletteGenerationButtons) {
    paletteGenerationButtons.hidden = isImageMode;
  }

  if (paletteRegenerateBtn) {
    const shouldShowRegenerate = !isImageMode || hasImageSource;
    paletteRegenerateBtn.hidden = !shouldShowRegenerate;
  }
}

function setPaletteRegenerateButtonTooltip(tooltipText) {
  if (typeof setActionButtonTooltipText === "function") {
    setActionButtonTooltipText(paletteRegenerateBtn, tooltipText);
    return;
  }

  const tooltip = paletteRegenerateBtn?.querySelector(".tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = tooltipText;
}

function updatePaletteRegenerateButtonAvailability(availableImageColors = null) {
  if (!paletteRegenerateBtn) {
    return;
  }

  if (paletteBaseMode !== "image") {
    paletteRegenerateBtn.disabled = false;
    paletteRegenerateBtn.classList.remove("is-disabled");
    paletteRegenerateBtn.setAttribute("aria-disabled", "false");
    setPaletteRegenerateButtonTooltip("Regenerar paleta");
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  if (!hasImageSource) {
    paletteRegenerateBtn.disabled = true;
    paletteRegenerateBtn.classList.add("is-disabled");
    paletteRegenerateBtn.setAttribute("aria-disabled", "true");
    setPaletteRegenerateButtonTooltip("Sube una imagen para regenerar la paleta");
    return;
  }

  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasLimitedExtractedColors = availableCount <= paletteSize;

  paletteRegenerateBtn.disabled = hasLimitedExtractedColors;
  paletteRegenerateBtn.classList.toggle("is-disabled", hasLimitedExtractedColors);
  paletteRegenerateBtn.setAttribute(
    "aria-disabled",
    hasLimitedExtractedColors ? "true" : "false"
  );
  setPaletteRegenerateButtonTooltip(
    hasLimitedExtractedColors
      ? "No hay suficiente variedad de colores en la imagen de referencia"
      : "Regenerar paleta"
  );
}

async function syncImagePaletteFromSource(options = {}) {
  if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
    return;
  }

  if (options.resetVariant) {
    imagePaletteVariantIndex = 0;
  } else if (options.advanceVariant) {
    imagePaletteVariantIndex += 1;
  }

  await refreshImageDerivedControls();
  if (!(paletteImageExtractionAlert?.hidden ?? true)) {
    return;
  }

  await generatePalette();
}

function rotateImagePaletteCandidates(values, offset) {
  if (!Array.isArray(values) || values.length <= 1) {
    return Array.isArray(values) ? [...values] : [];
  }

  const normalizedOffset = ((offset % values.length) + values.length) % values.length;
  if (normalizedOffset === 0) {
    return [...values];
  }

  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function normalizePaletteHexCollection(colors) {
  return Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => /^#[0-9A-F]{6}$/.test(hex))
    : [];
}

function areImagePalettesTooSimilar(nextPalette, referencePalette) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);

  if (nextColors.length === 0 || referenceColors.length === 0) {
    return false;
  }

  const exactMatch =
    nextColors.length === referenceColors.length &&
    nextColors.every((color, index) => color === referenceColors[index]);
  if (exactMatch) {
    return true;
  }

  const referenceSet = new Set(referenceColors);
  const sharedColorCount = nextColors.reduce((count, color) => {
    return count + (referenceSet.has(color) ? 1 : 0);
  }, 0);

  return sharedColorCount >= Math.max(nextColors.length - 1, 3);
}

// PALETTE BASE

function setPaletteBaseMode(nextMode) {
  paletteBaseMode = nextMode === "image" ? "image" : "temperature";

  if (paletteBaseMode !== "image") {
    setPaletteImageExtractionFeedback(false);
  }

  if (paletteBaseModeSelect) {
    paletteBaseModeSelect.value = paletteBaseMode;
  }

  if (temperatureBasePanel) {
    const showTemperaturePanel = paletteBaseMode === "temperature";
    temperatureBasePanel.classList.toggle("active", showTemperaturePanel);
    temperatureBasePanel.hidden = !showTemperaturePanel;
  }

  if (imageBasePanel) {
    const showImagePanel = paletteBaseMode === "image";
    imageBasePanel.classList.toggle("active", showImagePanel);
    imageBasePanel.hidden = !showImagePanel;
  }

  updatePaletteModeActionVisibility();
  updatePaletteRegenerateButtonAvailability();
  updatePaletteStickyState();
  updatePaletteSizeButtonsAvailability();

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }

  if (paletteBaseMode === "image" && uploadedBaseImage?.dataUrl) {
    void refreshImageDerivedControls();
  }
}

function isAcceptedPaletteImageFile(file) {
  if (!(file instanceof File)) {
    return false;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return (
    allowedPaletteImageTypes.has(file.type) ||
    allowedPaletteImageExtensions.some((extension) => normalizedName.endsWith(extension))
  );
}

function renderPaletteImagePreview() {
  if (
    !paletteImagePreview ||
    !paletteImagePreviewImg ||
    !paletteImageName ||
    !paletteImageDropzonePanel ||
    !paletteImageReplaceBtn
  ) {
    return;
  }

  const hasPreview = !!uploadedBaseImage?.dataUrl;
  if (!hasPreview) {
    isPaletteImageDropzoneVisible = true;
  }

  setAnimatedImagePanelVisibility(
    paletteImageDropzonePanel,
    !hasPreview || isPaletteImageDropzoneVisible
  );
  setAnimatedImagePanelVisibility(paletteImagePreview, hasPreview);
  paletteImageReplaceBtn.disabled = !hasPreview || isReplaceImagePending;
  paletteImageReplaceBtn.setAttribute(
    "aria-disabled",
    !hasPreview || isReplaceImagePending ? "true" : "false"
  );

  if (!hasPreview) {
    paletteImagePreviewImg.removeAttribute("src");
    paletteImageName.textContent = "";
    updatePaletteModeActionVisibility();
    updatePaletteRegenerateButtonAvailability();
    return;
  }

  paletteImagePreviewImg.src = uploadedBaseImage.dataUrl;
  paletteImageName.textContent = uploadedBaseImage.name;
  updatePaletteModeActionVisibility();
  updatePaletteRegenerateButtonAvailability();
}

function setAnimatedImagePanelVisibility(element, shouldShow) {
  if (!element) {
    return;
  }

  if (element.__hideTimeout) {
    clearTimeout(element.__hideTimeout);
    element.__hideTimeout = null;
  }

  if (shouldShow) {
    if (element.hidden) {
      element.hidden = false;
      element.classList.add("is-collapsed");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove("is-collapsed");
        });
      });
      return;
    }

    element.classList.remove("is-collapsed");
    return;
  }

  if (element.hidden) {
    return;
  }

  element.classList.add("is-collapsed");
  element.__hideTimeout = setTimeout(() => {
    element.hidden = true;
    element.__hideTimeout = null;
  }, imagePanelTransitionMs);
}

function openPaletteImageDropzone() {
  if (!paletteImageDropzonePanel) {
    return;
  }

  isReplaceImagePending = true;
  isPaletteImageDropzoneVisible = true;
  renderPaletteImagePreview();

  paletteImageDropzonePanel.classList.remove("is-sliding-in");
  void paletteImageDropzonePanel.offsetWidth;
  paletteImageDropzonePanel.classList.add("is-sliding-in");
}

function handlePaletteImageFile(file) {
  if (!isAcceptedPaletteImageFile(file)) {
    alert("Solo se permiten imágenes JPG, PNG o SVG.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    uploadedBaseImage = {
      name: file.name,
      type: file.type,
      dataUrl: String(reader.result || ""),
      analysisCache: null,
    };
    isReplaceImagePending = false;
    isPaletteImageDropzoneVisible = false;
    setPaletteImageExtractionFeedback(false);
    setPaletteBaseMode("image");
    renderPaletteImagePreview();
    void syncImagePaletteFromSource({ resetVariant: true });
  });
  reader.readAsDataURL(file);
}

if (paletteBaseModeSelect) {
  paletteBaseModeSelect.addEventListener("change", () => {
    setPaletteBaseMode(paletteBaseModeSelect.value);
  });
}

if (paletteImageInput) {
  paletteImageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
    paletteImageInput.value = "";
  });
}

if (paletteImageReplaceBtn) {
  paletteImageReplaceBtn.addEventListener("click", () => {
    openPaletteImageDropzone();
  });
}

if (paletteImageDominantToggle) {
  paletteImageDominantToggle.checked = prioritizeImageDominantColors;
  paletteImageDominantToggle.addEventListener("change", () => {
    prioritizeImageDominantColors = !!paletteImageDominantToggle.checked;

    if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
      return;
    }

    void syncImagePaletteFromSource({ resetVariant: true });
  });
}

if (paletteRegenerateBtn) {
  paletteRegenerateBtn.addEventListener("click", () => {
    if (paletteRegenerateBtn.disabled || paletteRegenerateBtn.classList.contains("is-disabled")) {
      return;
    }

    if (paletteBaseMode === "image") {
      void syncImagePaletteFromSource({ advanceVariant: true });
      return;
    }

    void regenerateTemperaturePaletteWithControlVariation();
  });
}

if (paletteImageDropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.remove("is-dragover");
    });
  });

  paletteImageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
  });
}

setPaletteBaseMode(paletteBaseMode);
renderPaletteImagePreview();
updatePaletteModeActionVisibility();
updatePaletteRegenerateButtonAvailability();

if (controlsPanel && paletteSection) {
  updatePaletteStickyState();

  if (typeof ResizeObserver === "function") {
    const stickyObserver = new ResizeObserver(() => {
      updatePaletteStickyState();
    });

    stickyObserver.observe(controlsPanel);
    stickyObserver.observe(paletteSection);
    stickyObserver.observe(paletteContainer);
  }

  window.addEventListener("resize", updatePaletteStickyState, { passive: true });
}

function rgbToHex(color) {
  return `#${[color.r, color.g, color.b]
    .map((channel) =>
      clampControlValue(Math.round(channel), 0, 255).toString(16).padStart(2, "0")
    )
    .join("")
    .toUpperCase()}`;
}

function getRgbDistanceBetween(colorA, colorB) {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for palette extraction."));
    image.src = dataUrl;
  });
}

async function getUploadedImageSamplePoints() {
  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  if (Array.isArray(uploadedBaseImage.analysisCache?.points)) {
    return uploadedBaseImage.analysisCache.points;
  }

  const image = await loadImageElement(uploadedBaseImage.dataUrl);
  const maxDimension = 56;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  );
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const quantizedColors = new Map();

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 40) {
      continue;
    }

    const r = Math.round(imageData[index] / 16) * 16;
    const g = Math.round(imageData[index + 1] / 16) * 16;
    const b = Math.round(imageData[index + 2] / 16) * 16;
    const key = `${r}-${g}-${b}`;
    const existingPoint = quantizedColors.get(key);

    if (existingPoint) {
      existingPoint.weight += 1;
      continue;
    }

    quantizedColors.set(key, {
      r,
      g,
      b,
      weight: 1,
    });
  }

  const points = Array.from(quantizedColors.values());
  updateUploadedImageAnalysisCache({
    points,
    width,
    height,
  });
  return points;
}

function getWeightedRandomPoint(points, weightResolver) {
  const totalWeight = points.reduce((sum, point) => sum + weightResolver(point), 0);
  if (totalWeight <= 0) {
    return points[Math.floor(Math.random() * points.length)];
  }

  let threshold = Math.random() * totalWeight;
  for (const point of points) {
    threshold -= weightResolver(point);
    if (threshold <= 0) {
      return point;
    }
  }

  return points[points.length - 1];
}

function initializeImageClusterCenters(points, clusterCount) {
  const centers = [];
  centers.push({ ...getWeightedRandomPoint(points, (point) => point.weight) });

  while (centers.length < clusterCount) {
    const nextPoint = getWeightedRandomPoint(points, (point) => {
      const nearestDistance = Math.min(
        ...centers.map((center) => {
          const distance = getRgbDistanceBetween(point, center);
          return distance * distance;
        })
      );
      return point.weight * Math.max(nearestDistance, 1);
    });

    centers.push({ ...nextPoint });
  }

  return centers;
}

function clusterImageColors(points, clusterCount) {
  const safeClusterCount = Math.max(1, Math.min(clusterCount, points.length));
  let centers = initializeImageClusterCenters(points, safeClusterCount);

  for (let iteration = 0; iteration < 8; iteration++) {
    const buckets = Array.from({ length: safeClusterCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    points.forEach((point) => {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      centers.forEach((center, index) => {
        const distance = getRgbDistanceBetween(point, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const bucket = buckets[nearestIndex];
      bucket.r += point.r * point.weight;
      bucket.g += point.g * point.weight;
      bucket.b += point.b * point.weight;
      bucket.weight += point.weight;
    });

    centers = centers.map((center, index) => {
      const bucket = buckets[index];
      if (!bucket.weight) {
        return { ...getWeightedRandomPoint(points, (point) => point.weight) };
      }

      return {
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
      };
    });
  }

  const clusters = centers.map((center) => ({
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    weight: 0,
  }));

  points.forEach((point) => {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    clusters.forEach((cluster, index) => {
      const distance = getRgbDistanceBetween(point, cluster);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    clusters[nearestIndex].weight += point.weight;
  });

  return clusters
    .filter((cluster) => cluster.weight > 0)
    .sort((clusterA, clusterB) => clusterB.weight - clusterA.weight);
}

function cleanImageClusterDuplicates(clusters) {
  const deduplicatedClusters = [];

  clusters.forEach((cluster) => {
    const hex = controlsNormalizeHexColor(rgbToHex(cluster));
    if (isDisallowedColor(hex)) {
      return;
    }

    const isNearExistingCluster = deduplicatedClusters.some(
      (existingCluster) => getRgbDistanceBetween(existingCluster, cluster) < 26
    );
    if (isNearExistingCluster) {
      return;
    }

    const hsl = controlsHexToHsl(hex);
    deduplicatedClusters.push({
      ...cluster,
      hex,
      hsl,
      relevance:
        cluster.weight *
        (1 + hsl.s / 220) *
        (0.92 + Math.abs(hsl.l - 50) / 180),
    });
  });

  return deduplicatedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImageClusterPriorityScore(cluster, allClusters, selectedClusters = []) {
  const safeClusters = Array.isArray(allClusters) && allClusters.length > 0
    ? allClusters
    : [cluster];
  const maxWeight = Math.max(
    ...safeClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(cluster.hsl?.s ?? 0, 0, 100) / 100;
  const lightnessDistance = Math.min(Math.abs((cluster.hsl?.l ?? 50) - 50) / 50, 1);
  const nearestDistance = selectedClusters.length > 0
    ? Math.min(
        ...selectedClusters.map((selectedCluster) =>
          getRgbDistanceBetween(selectedCluster, cluster)
        )
      )
    : 72;
  const normalizedDistance = Math.min(nearestDistance / 100, 1.25);

  if (prioritizeImageDominantColors) {
    const dominanceBaseScore =
      (cluster.weight || 0) *
      (1 + saturationFactor * 0.35) *
      (0.96 + lightnessDistance * 0.18);
    const diversityBoost = selectedClusters.length > 0
      ? 0.8 + normalizedDistance * 0.34
      : 1;

    return dominanceBaseScore * diversityBoost;
  }

  const accentBaseScore =
    Math.pow(Math.max(cluster.weight || 1, 1), 0.45) *
    (1 + saturationFactor * 1.15) *
    (1 + lightnessDistance * 0.45) *
    (0.62 + (1 - normalizedWeight) * 1.12);
  const diversityBoost = selectedClusters.length > 0
    ? 0.96 + normalizedDistance * 0.62
    : 1.12;

  return accentBaseScore * diversityBoost;
}

function selectRelevantImageClusters(clusters, targetCount, variantIndex = 0) {
  const candidatePoolSize = Math.min(
    clusters.length,
    Math.max(targetCount + 4, targetCount * 2)
  );
  const prioritizedClusters = [...clusters].sort((clusterA, clusterB) => {
    const scoreA = getImageClusterPriorityScore(clusterA, clusters);
    const scoreB = getImageClusterPriorityScore(clusterB, clusters);
    return scoreB - scoreA;
  });
  const rotatedPriorityPool = rotateImagePaletteCandidates(
    prioritizedClusters.slice(0, candidatePoolSize),
    variantIndex
  );
  const pool = [
    ...rotatedPriorityPool,
    ...prioritizedClusters.slice(candidatePoolSize),
  ];
  const selectedClusters = [];
  const selectionTarget = Math.min(targetCount, clusters.length);

  if (pool.length > 0) {
    selectedClusters.push(pool.shift());
  }

  while (pool.length > 0 && selectedClusters.length < selectionTarget) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((cluster, index) => {
      const poolOffset = Math.max(0, candidatePoolSize - index);
      const rotationBias = 1 + (poolOffset / Math.max(candidatePoolSize, 1)) * 0.12;
      const score =
        getImageClusterPriorityScore(cluster, clusters, selectedClusters) * rotationBias;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selectedClusters.push(pool.splice(bestIndex, 1)[0]);
  }

  return selectedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImagePaletteVariantHex(cluster, clusterIndex, variantIndex) {
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];

  if (normalizedVariantIndex === 0) {
    return cluster.hex;
  }

  const direction = (clusterIndex + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
  const stagger = profile.stagger[clusterIndex % profile.stagger.length] || 0;
  const hueOffset = profile.hueShift * direction + (clusterIndex % 3) * direction * 2;
  const saturationOffset = profile.saturationShift + stagger * 0.45;
  const lightnessOffset = profile.lightnessShift + stagger * 0.8;

  return controlsNormalizeHexColor(
    controlsHslToHex(
      (cluster.hsl.h + hueOffset + 360) % 360,
      clampControlValue(cluster.hsl.s + saturationOffset, 4, 100),
      clampControlValue(cluster.hsl.l + lightnessOffset, 8, 92)
    )
  );
}

function getImageClusterStartPenalty(cluster, allClusters) {
  const maxWeight = Math.max(
    ...allClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(cluster.hsl?.s ?? 0, 0, 100) / 100;
  const balancedLightness = 1 - Math.min(Math.abs((cluster.hsl?.l ?? 50) - 58) / 58, 1);

  if (prioritizeImageDominantColors) {
    return (1 - normalizedWeight) * 0.2 + (1 - balancedLightness) * 0.04;
  }

  return (1 - saturationFactor) * 0.12 + (1 - balancedLightness) * 0.05;
}

function getImageClusterHarmonyDistance(clusterA, clusterB) {
  const hueDifference = Math.abs((clusterA.hsl?.h ?? 0) - (clusterB.hsl?.h ?? 0));
  const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180;
  const saturationDifference =
    Math.abs((clusterA.hsl?.s ?? 0) - (clusterB.hsl?.s ?? 0)) / 100;
  const lightnessDifference =
    Math.abs((clusterA.hsl?.l ?? 50) - (clusterB.hsl?.l ?? 50)) / 100;

  return (
    wrappedHueDifference * 0.6 +
    saturationDifference * 0.2 +
    lightnessDifference * 0.2
  );
}

function orderImageClustersByHarmony(clusters) {
  if (!Array.isArray(clusters) || clusters.length <= 2) {
    return [...clusters];
  }

  const totalClusters = clusters.length;
  const totalMasks = 1 << totalClusters;
  const pathCosts = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(Infinity)
  );
  const previousIndexes = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(-1)
  );

  clusters.forEach((cluster, index) => {
    pathCosts[1 << index][index] = getImageClusterStartPenalty(cluster, clusters);
  });

  for (let mask = 1; mask < totalMasks; mask += 1) {
    for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
      const currentCost = pathCosts[mask][lastIndex];
      if (!Number.isFinite(currentCost)) {
        continue;
      }

      for (let nextIndex = 0; nextIndex < totalClusters; nextIndex += 1) {
        if (mask & (1 << nextIndex)) {
          continue;
        }

        const nextMask = mask | (1 << nextIndex);
        const nextCost =
          currentCost +
          getImageClusterHarmonyDistance(clusters[lastIndex], clusters[nextIndex]);

        if (nextCost < pathCosts[nextMask][nextIndex]) {
          pathCosts[nextMask][nextIndex] = nextCost;
          previousIndexes[nextMask][nextIndex] = lastIndex;
        }
      }
    }
  }

  const fullMask = totalMasks - 1;
  let bestLastIndex = 0;
  let bestPathCost = Infinity;

  for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
    if (pathCosts[fullMask][lastIndex] < bestPathCost) {
      bestPathCost = pathCosts[fullMask][lastIndex];
      bestLastIndex = lastIndex;
    }
  }

  const orderedClusters = [];
  let currentMask = fullMask;
  let currentIndex = bestLastIndex;

  while (currentIndex !== -1) {
    orderedClusters.unshift(clusters[currentIndex]);
    const previousIndex = previousIndexes[currentMask][currentIndex];
    currentMask ^= 1 << currentIndex;
    currentIndex = previousIndex;
  }

  return orderedClusters;
}

function expandImagePalette(selectedClusters, targetCount, variantIndex = 0, seedPalette = []) {
  const palette = [...seedPalette];
  const usedColors = new Set(palette);
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];
  const lightnessOffsets = normalizedVariantIndex === 0
    ? [-18, 18, -10, 10, -28, 28, -36, 36]
    : profile.stagger.map((offset) => Math.round(offset * 1.4)).concat([-20, 20, -30, 30]);
  let expansionStep = 0;

  while (palette.length < targetCount && selectedClusters.length > 0) {
    const cluster = selectedClusters[
      (normalizedVariantIndex + expansionStep) % selectedClusters.length
    ];
    const offset = lightnessOffsets[
      Math.floor(expansionStep / selectedClusters.length) % lightnessOffsets.length
    ];
    const direction = (expansionStep + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
    const variantHex = controlsNormalizeHexColor(
      controlsHslToHex(
        (cluster.hsl.h + profile.hueShift * direction + 360) % 360,
        clampControlValue(
          cluster.hsl.s + (offset > 0 ? -6 : 8) + profile.saturationShift * 0.7,
          4,
          100
        ),
        clampControlValue(cluster.hsl.l + offset + profile.lightnessShift * 0.55, 8, 92)
      )
    );

    if (!usedColors.has(variantHex) && !isDisallowedColor(variantHex)) {
      usedColors.add(variantHex);
      palette.push(variantHex);
    }

    expansionStep += 1;
    if (expansionStep > selectedClusters.length * lightnessOffsets.length * 2) {
      break;
    }
  }

  return palette.slice(0, targetCount);
}

function getCachedImageColorClusters() {
  return Array.isArray(uploadedBaseImage?.analysisCache?.deduplicatedClusters)
    ? uploadedBaseImage.analysisCache.deduplicatedClusters
    : [];
}

async function getImageColorClusters() {
  const cachedClusters = getCachedImageColorClusters();
  if (cachedClusters.length > 0) {
    return cachedClusters;
  }

  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  const points = await getUploadedImageSamplePoints();
  if (points.length === 0) {
    return [];
  }

  const clusterCount = Math.min(Math.max(MAX_PALETTE_COLORS, 12), points.length);
  const clusters = cleanImageClusterDuplicates(clusterImageColors(points, clusterCount));

  updateUploadedImageAnalysisCache({
    deduplicatedClusters: clusters,
  });

  return clusters;
}

function updatePaletteSizeButtonsAvailability(availableImageColors = null) {
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;

  sizeButtons.forEach((button) => {
    const buttonSize = parseInt(button.dataset.size);
    const shouldDisable =
      paletteBaseMode === "image" &&
      !!uploadedBaseImage?.dataUrl &&
      Number.isFinite(buttonSize) &&
      buttonSize > availableCount;

    button.classList.toggle("is-disabled", shouldDisable);
    button.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
  });
}

async function refreshImageDerivedControls() {
  if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
    setPaletteImageExtractionFeedback(false);
    updatePaletteSizeButtonsAvailability();
    updatePaletteRegenerateButtonAvailability();

    if (typeof updateRegenerateButtonsAvailability === "function") {
      updateRegenerateButtonsAvailability();
    }
    if (typeof updateAddColorButtonState === "function") {
      updateAddColorButtonState();
    }
    return;
  }

  const clusters = await getImageColorClusters();
  const hasExtractedColors = clusters.length > 0;

  setPaletteImageExtractionFeedback(!hasExtractedColors);
  if (!hasExtractedColors) {
    revealPaletteImageDropzoneForRetry();
  }

  updatePaletteSizeButtonsAvailability(clusters.length);
  updatePaletteRegenerateButtonAvailability(clusters.length);

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }
}

function getImageBasedCandidateColor(existingColors = new Set(), adjacentBaseNames = []) {
  const imageClusters = getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  let bestCandidate = null;
  let bestConflictCount = Infinity;
  let bestPriorityScore = -Infinity;

  imageClusters.forEach((cluster, clusterIndex) => {
    const candidate = getAdjustedPaletteColor(cluster.hex, clusterIndex);

    if (existingColors.has(candidate)) {
      return;
    }

    const candidateBaseName = typeof getNearestColorName === "function"
      ? getNearestColorName(candidate)
      : "";
    const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
      return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
    }, 0);
    const priorityScore = getImageClusterPriorityScore(cluster, imageClusters);

    if (conflictCount === 0) {
      if (priorityScore > bestPriorityScore) {
        bestCandidate = candidate;
        bestConflictCount = 0;
        bestPriorityScore = priorityScore;
      }
      return;
    }

    if (
      conflictCount < bestConflictCount ||
      (conflictCount === bestConflictCount && priorityScore > bestPriorityScore)
    ) {
      bestCandidate = candidate;
      bestConflictCount = conflictCount;
      bestPriorityScore = priorityScore;
    }
  });

  return bestCandidate;
}

function getImageRegenerationColorForCard(card, existingColors = new Set()) {
  const adjacentBaseNames = typeof getAdjacentBaseColorNames === "function"
    ? getAdjacentBaseColorNames(card)
    : [];

  return getImageBasedCandidateColor(existingColors, adjacentBaseNames);
}

function buildImagePaletteCandidate(selectedClusters, targetCount, variantIndex) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const basePalette = [];
  const usedColors = new Set();

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    const variantHex = getImagePaletteVariantHex(cluster, clusterIndex, variantIndex);
    const nextHex =
      !usedColors.has(variantHex) && !isDisallowedColor(variantHex)
        ? variantHex
        : cluster.hex;

    if (usedColors.has(nextHex) || isDisallowedColor(nextHex)) {
      return;
    }

    usedColors.add(nextHex);
    basePalette.push(nextHex);
  });

  return expandImagePalette(harmonyOrderedClusters, targetCount, variantIndex, basePalette);
}

async function buildImageBasedPalette(targetCount) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para generar una paleta desde ella.");
    return [];
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return [];
  }

  const referencePalette = normalizePaletteHexCollection(
    paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette
  );
  const maxVariantAttempts = Math.max(4, IMAGE_PALETTE_VARIANT_PROFILES.length);
  let fallbackPalette = [];

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = imagePaletteVariantIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(clusters, targetCount, variantIndex);
    const candidatePalette = buildImagePaletteCandidate(
      selectedClusters,
      targetCount,
      variantIndex
    );

    if (candidatePalette.length === 0) {
      continue;
    }

    fallbackPalette = candidatePalette;

    if (!areImagePalettesTooSimilar(candidatePalette, referencePalette)) {
      imagePaletteVariantIndex = variantIndex;
      return candidatePalette;
    }
  }

  return fallbackPalette;
}

// SIZE SELECTOR

function setPaletteSize(size) {
  paletteSize = size;
  sizeButtons.forEach((button) => {
    button.classList.toggle("active", parseInt(button.dataset.size) === size);
  });
}

function removeColorsFromPaletteEnd(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return false;
  }

  const cards = Array.from(getColorCards());
  if (cards.length === 0) {
    return false;
  }

  cards.slice(-count).forEach((card) => {
    card.remove();
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);
  return true;
}

function addColorsToPaletteEnd(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return false;
  }

  let hasChanged = false;

  for (let index = 0; index < count; index += 1) {
    const existingColors = new Set(getCurrentPaletteHexValues());
    const { color, isFallbackWhite } = getAddedColorForCurrentMode(existingColors);

    if (!color) {
      break;
    }

    const card = createColorCard(color);
    if (!card) {
      break;
    }

    card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
    hasChanged = true;
  }

  if (!hasChanged) {
    return false;
  }

  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);
  return true;
}

async function applyPaletteSizeChange(nextSize) {
  const currentCount = getColorCards().length;
  const difference = nextSize - currentCount;

  if (difference === 0) {
    return;
  }

  if (currentCount === 0) {
    if (paletteBaseMode === "image" && uploadedBaseImage?.dataUrl) {
      await syncImagePaletteFromSource();
    }
    return;
  }

  const hasChanged = difference < 0
    ? removeColorsFromPaletteEnd(Math.abs(difference))
    : addColorsToPaletteEnd(difference);

  if (hasChanged) {
    saveHistory(currentPalette);
  }
}

async function handlePaletteSizeButtonClick(button) {
  if (button?.classList.contains("is-disabled")) {
    return;
  }

  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  const nextSize = parseInt(button.dataset.size);
  setPaletteSize(nextSize);
  await applyPaletteSizeChange(nextSize);
}

sizeButtons.forEach((button) => {
  button.onclick = () => {
    void handlePaletteSizeButtonClick(button);
  };
  button.addEventListener("mouseleave", () => {
    button.classList.remove("suppress-hover");
  });
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

  const previousTemperatureState = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  toggleTemperature(type);

  const hasTemperatureChanged =
    previousTemperatureState.warm !== temperature.warm ||
    previousTemperatureState.cool !== temperature.cool;

  if (hasTemperatureChanged && paletteBaseMode === "temperature") {
    void generatePalette();
  }
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
  generateBtn.onclick = () => {
    void generatePalette();
  };
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.onclick = () => {
    if (paletteBaseMode === "image") {
      void generatePalette();
      return;
    }

    // Pick random controls, then generate one palette
    const randomSize = [3, 6, 9, 12][Math.floor(Math.random() * 4)];
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
      updateSaturationProgress();
      syncTemperatureControlsState();
    }

    void generatePalette();
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

function getTemperatureBasedHue() {
  const useWarmPalette =
    temperature.warm && (!temperature.cool || Math.random() < 0.5);

  if (useWarmPalette) {
    return Math.random() < 0.2
      ? 300 + Math.random() * 60
      : Math.random() * 60;
  }

  return 120 + Math.random() * 180;
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
  const baseHue = getTemperatureBasedHue();
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
      const candidate = controlsNormalizeHexColor(
        controlsHslToHex(
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

function buildTemperatureColorFromSettings(settings) {
  const hue = getTemperatureBasedHue();
  const saturation = Number.isFinite(settings?.saturation)
    ? settings.saturation
    : getCurrentSaturationValue();
  const brightness = Number.isFinite(settings?.brightness)
    ? settings.brightness
    : getCurrentBrightnessValue();
  const lightness = 10 + (brightness / 100) * 80;

  return controlsHslToHex(hue, saturation, lightness);
}

function buildAlternativeMonochromePaletteForSettings(targetCount, settings) {
  if (!settings) {
    return buildAlternativeMonochromePalette(targetCount);
  }

  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = 10 + (settings.brightness / 100) * 80;
  const monochromeSaturation = clampControlValue(
    settings.saturation,
    0,
    LOW_SATURATION_FALLBACK_THRESHOLD
  );
  const baseHue = getTemperatureBasedHue();
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
      const candidate = controlsNormalizeHexColor(
        controlsHslToHex(
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

function buildTemperaturePaletteForSettings(targetCount, settings) {
  const resolvedSettings = {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
  };
  const usedColors = new Set();
  const nextPalette = [];
  const maxRetriesPerColor = 12;

  for (let index = 0; index < targetCount; index += 1) {
    let color = null;
    let retries = 0;

    while (!color && retries < maxRetriesPerColor) {
      const candidate = buildTemperatureColorFromSettings(resolvedSettings);
      if (!usedColors.has(candidate)) {
        color = candidate;
      }
      retries += 1;
    }

    if (!color) {
      break;
    }

    usedColors.add(color);
    nextPalette.push(color);
  }

  let usedAlternativePalette = false;
  if (
    nextPalette.length < targetCount &&
    resolvedSettings.saturation <= LOW_SATURATION_FALLBACK_THRESHOLD
  ) {
    const alternativePalette = buildAlternativeMonochromePaletteForSettings(
      targetCount,
      resolvedSettings
    );

    if (alternativePalette.length === targetCount) {
      return {
        palette: alternativePalette,
        usedAlternativePalette: true,
      };
    }
  }

  return {
    palette: nextPalette,
    usedAlternativePalette,
  };
}

function scorePaletteHarmony(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
  }

  if (normalizedColors.length === 1) {
    return 0;
  }

  const paletteHsl = normalizedColors.map((color) => controlsHexToHsl(color));
  let pairwiseDistanceScore = 0;
  let pairCount = 0;
  let closePairPenalty = 0;

  for (let leftIndex = 0; leftIndex < normalizedColors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedColors.length; rightIndex += 1) {
      const leftRgb = controlsHexToRgb(normalizedColors[leftIndex]);
      const rightRgb = controlsHexToRgb(normalizedColors[rightIndex]);
      const rgbDistance = getRgbDistanceBetween(leftRgb, rightRgb);

      pairwiseDistanceScore += Math.min(rgbDistance / 180, 1);
      if (rgbDistance < 42) {
        closePairPenalty += (42 - rgbDistance) / 42;
      }
      pairCount += 1;
    }
  }

  const averageDistanceScore = pairCount > 0 ? pairwiseDistanceScore / pairCount : 0;
  const averageSaturation =
    paletteHsl.reduce((sum, color) => sum + color.s, 0) / paletteHsl.length;
  const averageLightness =
    paletteHsl.reduce((sum, color) => sum + color.l, 0) / paletteHsl.length;
  const saturationBalance = 1 - Math.min(Math.abs(averageSaturation - 58) / 58, 1);
  const lightnessBalance = 1 - Math.min(Math.abs(averageLightness - 56) / 56, 1);

  return (
    averageDistanceScore * 2.1 +
    saturationBalance * 0.75 +
    lightnessBalance * 0.7 -
    closePairPenalty * 0.9
  );
}

function setPaletteAdjustmentControls(settings) {
  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    updateSaturationProgress();
  }

  syncTemperatureControlsState();
}

function commitGeneratedPalette(nextPalette, options = {}) {
  const previousPalette = normalizePaletteHexCollection(
    options.previousPalette ?? currentPalette
  );

  setPaletteImageExtractionFeedback(false);
  getColorCards().forEach((card) => card.remove());

  capturePaletteAdjustmentBase(nextPalette);
  currentPalette = buildAdjustedPaletteFromBase();
  currentPalette.forEach((color) => {
    createColorCard(color);
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  const generatedPalette = normalizePaletteHexCollection(currentPalette);
  const hasExactPaletteChanged =
    previousPalette.length !== generatedPalette.length ||
    previousPalette.some((color, index) => color !== generatedPalette[index]);

  if (hasExactPaletteChanged || paletteHistory.length === 0) {
    saveHistory(currentPalette, { isAlternative: !!options.usedAlternativePalette });
  }
}

async function regenerateTemperaturePaletteWithControlVariation() {
  const baseSettings = {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
  const brightnessOffsets = [0, -10, 10, -20, 20];
  const saturationOffsets = [0, -10, 10, -20, 20];
  const candidates = [];
  const seenSettings = new Set();

  brightnessOffsets.forEach((brightnessOffset) => {
    saturationOffsets.forEach((saturationOffset) => {
      const candidate = {
        brightness: clampControlValue(baseSettings.brightness + brightnessOffset, 0, 100),
        saturation: clampControlValue(baseSettings.saturation + saturationOffset, 0, 100),
      };
      const candidateKey = `${candidate.brightness}:${candidate.saturation}`;
      if (seenSettings.has(candidateKey)) {
        return;
      }

      seenSettings.add(candidateKey);
      candidates.push(candidate);
    });
  });

  let bestCandidate = null;

  candidates.forEach((candidateSettings) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const candidateResult = buildTemperaturePaletteForSettings(paletteSize, candidateSettings);
      if (candidateResult.palette.length === 0) {
        continue;
      }

      const harmonyScore = scorePaletteHarmony(candidateResult.palette);
      if (!bestCandidate || harmonyScore > bestCandidate.score) {
        bestCandidate = {
          settings: candidateSettings,
          palette: candidateResult.palette,
          usedAlternativePalette: candidateResult.usedAlternativePalette,
          score: harmonyScore,
        };
      }
    }
  });

  if (!bestCandidate) {
    await generatePalette();
    return;
  }

  setPaletteAdjustmentControls(bestCandidate.settings);
  commitGeneratedPalette(bestCandidate.palette, {
    usedAlternativePalette: bestCandidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

async function generatePalette() {
  let nextPalette = [];
  let usedAlternativePalette = false;
  const previousPalette = normalizePaletteHexCollection(currentPalette);

  if (paletteBaseMode === "image") {
    try {
      nextPalette = await buildImageBasedPalette(paletteSize);
    } catch (error) {
      console.error(error);
      alert("No se pudo generar una paleta desde esta imagen.");
      return;
    }

    if (nextPalette.length === 0) {
      setPaletteImageExtractionFeedback(true);
      revealPaletteImageDropzoneForRetry();
      return;
    }
  } else {
    const temperatureResult = buildTemperaturePaletteForSettings(paletteSize);
    nextPalette = temperatureResult.palette;
    usedAlternativePalette = temperatureResult.usedAlternativePalette;
  }

  commitGeneratedPalette(nextPalette, {
    usedAlternativePalette,
    previousPalette,
  });
}

// GENERATE COLOR

function generateColor() {
  let h = getTemperatureBasedHue();

  let s = getCurrentSaturationValue();

  // Keep the slider at 0-100, but avoid real lightness extremes with a 10-90 range.
  let sliderValue = getCurrentBrightnessValue();
  let l = 10 + (sliderValue / 100) * 80;

  return controlsHslToHex(h, s, l);
}
