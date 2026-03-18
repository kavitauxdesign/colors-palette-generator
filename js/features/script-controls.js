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
const IMAGE_INSPIRATION_VARIANT_PROFILES = [
  { hueShift: 4, saturationShift: 4, lightnessShift: 4, accentHueShift: 8, accentBoost: 10, neutralLift: 5 },
  { hueShift: -6, saturationShift: 2, lightnessShift: -3, accentHueShift: -8, accentBoost: 12, neutralLift: 2 },
  { hueShift: 8, saturationShift: -4, lightnessShift: 7, accentHueShift: 10, accentBoost: 8, neutralLift: 7 },
  { hueShift: -9, saturationShift: 6, lightnessShift: 2, accentHueShift: -10, accentBoost: 13, neutralLift: 3 },
  { hueShift: 3, saturationShift: -2, lightnessShift: -6, accentHueShift: 7, accentBoost: 7, neutralLift: -1 },
];
const MAX_RECENT_INSPIRED_PALETTES = 8;

function blendControlValue(fromValue, toValue, ratio) {
  return fromValue + (toValue - fromValue) * ratio;
}

function resolvePaletteAdjustmentSettings(settings = {}) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
  };
}

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

  if (lowIcon) {
    lowIcon.style.transform = "none";
    lowIcon.style.opacity = `${Math.max(0.5, 1 - (percent / 100) * 0.4)}`;
  }
  if (highIcon) {
    highIcon.style.transform = "none";
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
  return resolvePaletteAdjustmentSettings();
}

function capturePaletteAdjustmentBase(colors = currentPalette, settings = getCurrentPaletteAdjustmentSnapshot()) {
  const validColors = Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => /^#[0-9A-F]{6}$/.test(hex))
    : [];

  paletteAdjustmentBase = [...validColors];
  paletteAdjustmentBaseSettings = resolvePaletteAdjustmentSettings({
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : DEFAULT_SATURATION,
  });
}

function getPaletteAdjustmentDeltas(
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const resolvedBaseSettings = resolvePaletteAdjustmentSettings(baseSettings);

  return {
    brightnessDelta: resolvedSettings.brightness - resolvedBaseSettings.brightness,
    saturationDelta: resolvedSettings.saturation - resolvedBaseSettings.saturation,
  };
}

function getAdjustedPaletteColor(
  hex,
  variantIndex = 0,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const hsl = controlsHexToHsl(hex);
  const { brightnessDelta, saturationDelta } = getPaletteAdjustmentDeltas(
    settings,
    baseSettings
  );
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

function buildAdjustedPaletteFromBase(
  colors = paletteAdjustmentBase,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const adjustedPalette = [];
  const usedColors = new Set();

  colors.forEach((color, colorIndex) => {
    for (let variantIndex = 0; variantIndex < 28; variantIndex++) {
      const candidate = getAdjustedPaletteColor(
        color,
        variantIndex + colorIndex * 2,
        settings,
        baseSettings
      );
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

function buildRenderedPaletteFromBaseColors(colors, settings) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  return buildAdjustedPaletteFromBase(colors, resolvedSettings, resolvedSettings);
}

function renderAdjustedPalette(colors) {
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mergedColors = mergePaletteWithPinnedColors(colors, pinnedEntries);
  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedColors.length)
    .map((entry) => entry.index);
  const cards = Array.from(getColorCards());

  if (cards.length !== mergedColors.length) {
    getColorCards().forEach((card) => card.remove());
    mergedColors.forEach((color, index) => {
      createColorCard(color, {
        pinned: pinnedIndexes.includes(index),
      });
    });
  } else {
    cards.forEach((card, index) => {
      setCardColor(card, mergedColors[index]);
      setCardPinnedState(card, pinnedIndexes.includes(index));
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

  if (surpriseBtn) {
    const shouldShowSurprise = !isImageMode || hasImageSource;
    surpriseBtn.hidden = !shouldShowSurprise;
  }

  if (paletteInspirationBtn) {
    paletteInspirationBtn.hidden = !(isImageMode && hasImageSource);
  }
}

function setPaletteActionButtonTooltip(button, tooltipText) {
  if (typeof setActionButtonTooltipText === "function") {
    setActionButtonTooltipText(button, tooltipText);
    return;
  }

  const tooltip = button?.querySelector(".tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = tooltipText;
}

function setPaletteRegenerateButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(paletteRegenerateBtn, tooltipText);
}

function setPaletteSurpriseButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(surpriseBtn, tooltipText);
}

function setPaletteInspirationButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(paletteInspirationBtn, tooltipText);
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

function updatePaletteSurpriseButtonAvailability(availableImageColors = null) {
  if (!surpriseBtn) {
    return;
  }

  if (paletteBaseMode !== "image") {
    surpriseBtn.disabled = false;
    surpriseBtn.setAttribute("aria-disabled", "false");
    setPaletteSurpriseButtonTooltip(
      "Generar una variante más libre sin cambiar la cantidad de colores"
    );
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasExtractedColors = hasImageSource && availableCount > 0;

  surpriseBtn.disabled = !hasExtractedColors;
  surpriseBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteSurpriseButtonTooltip(
    hasExtractedColors
      ? "Generar una variante libre basada en la imagen original"
      : "Sube una imagen válida para sorprender la paleta"
  );
}

function updatePaletteInspirationButtonAvailability(availableImageColors = null) {
  if (!paletteInspirationBtn) {
    return;
  }

  if (paletteBaseMode !== "image") {
    paletteInspirationBtn.hidden = true;
    paletteInspirationBtn.disabled = true;
    paletteInspirationBtn.classList.add("is-disabled");
    paletteInspirationBtn.setAttribute("aria-disabled", "true");
    setPaletteInspirationButtonTooltip("Modo inspiración disponible solo en Imagen");
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasExtractedColors = hasImageSource && availableCount > 0;

  paletteInspirationBtn.hidden = !hasImageSource;
  paletteInspirationBtn.disabled = !hasExtractedColors;
  paletteInspirationBtn.classList.toggle("is-disabled", !hasExtractedColors);
  paletteInspirationBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteInspirationButtonTooltip(
    hasExtractedColors
      ? "Generar una paleta inspirada en la imagen"
      : "Sube una imagen válida para activar el modo inspiración"
  );
}

async function syncImagePaletteFromSource(options = {}) {
  if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
    return;
  }

  if (options.resetVariant) {
    imagePaletteVariantIndex = 0;
    imageInspirationVariantIndex = 0;
    clearRecentInspiredPalettes();
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

function getPaletteSimilarityMetrics(nextPalette, referencePalette) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);

  if (nextColors.length === 0 || referenceColors.length === 0) {
    return {
      exactMatch: false,
      sharedColorCount: 0,
      nextCount: nextColors.length,
      referenceCount: referenceColors.length,
    };
  }

  const exactMatch =
    nextColors.length === referenceColors.length &&
    nextColors.every((color, index) => color === referenceColors[index]);

  const referenceSet = new Set(referenceColors);
  const sharedColorCount = nextColors.reduce((count, color) => {
    return count + (referenceSet.has(color) ? 1 : 0);
  }, 0);

  return {
    exactMatch,
    sharedColorCount,
    nextCount: nextColors.length,
    referenceCount: referenceColors.length,
  };
}

function arePalettesTooSimilar(nextPalette, referencePalette) {
  const similarityMetrics = getPaletteSimilarityMetrics(nextPalette, referencePalette);
  return (
    similarityMetrics.exactMatch ||
    similarityMetrics.sharedColorCount >= Math.max(similarityMetrics.nextCount - 1, 3)
  );
}

function clearRecentInspiredPalettes() {
  recentInspiredPalettes = [];
}

function rememberInspiredPalette(colors) {
  const normalizedPalette = normalizePaletteHexCollection(colors);
  if (normalizedPalette.length === 0) {
    return;
  }

  const signature = normalizedPalette.join("|");
  recentInspiredPalettes = recentInspiredPalettes
    .filter((palette) => normalizePaletteHexCollection(palette).join("|") !== signature)
    .concat([normalizedPalette])
    .slice(-MAX_RECENT_INSPIRED_PALETTES);
}

function isPaletteTooSimilarToRecentInspiredPalettes(nextPalette, recentPalettes = recentInspiredPalettes) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(recentPalettes) || recentPalettes.length === 0) {
    return false;
  }

  return recentPalettes.some((palette) => arePalettesTooSimilar(normalizedPalette, palette));
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
  updatePaletteSurpriseButtonAvailability();
  updatePaletteInspirationButtonAvailability();
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
    updatePaletteSurpriseButtonAvailability();
    updatePaletteInspirationButtonAvailability();
    return;
  }

  paletteImagePreviewImg.src = uploadedBaseImage.dataUrl;
  paletteImageName.textContent = uploadedBaseImage.name;
  updatePaletteModeActionVisibility();
  updatePaletteRegenerateButtonAvailability();
  updatePaletteSurpriseButtonAvailability();
  updatePaletteInspirationButtonAvailability();
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

    void regenerateTemperaturePaletteKeepingPreferences();
  });
}

if (paletteInspirationBtn) {
  paletteInspirationBtn.addEventListener("click", () => {
    if (paletteInspirationBtn.disabled || paletteInspirationBtn.classList.contains("is-disabled")) {
      return;
    }

    void applyInspiredImagePalette();
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
updatePaletteSurpriseButtonAvailability();
updatePaletteInspirationButtonAvailability();

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
    updatePaletteSurpriseButtonAvailability();
    updatePaletteInspirationButtonAvailability();

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
  updatePaletteSurpriseButtonAvailability(clusters.length);
  updatePaletteInspirationButtonAvailability(clusters.length);

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
  const result = await buildImageBasedPaletteCandidate(targetCount);
  imagePaletteVariantIndex = result.variantIndex;
  return result.palette;
}

async function buildImageBasedPaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para generar una paleta desde ella.");
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  const referencePalette = normalizePaletteHexCollection(
    options.referencePalette ??
    (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette)
  );
  const variantStartIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imagePaletteVariantIndex;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 3);
  let fallbackPalette = [];
  let fallbackVariantIndex = variantStartIndex;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = variantStartIndex + attempt;
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
    fallbackVariantIndex = variantIndex;

    if (!arePalettesTooSimilar(candidatePalette, referencePalette)) {
      return {
        palette: candidatePalette,
        variantIndex,
      };
    }
  }

  return {
    palette: fallbackPalette,
    variantIndex: fallbackVariantIndex,
  };
}

function getImageInspirationAtmosphere(clusters) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return {
      averageSaturation: 56,
      averageLightness: 54,
      maxWeight: 1,
      maxSaturation: 72,
      lightnessSpread: 0.3,
      warmthBias: 0,
    };
  }

  const totalWeight = clusters.reduce((sum, cluster) => sum + Math.max(cluster.weight || 0, 1), 0);
  const maxWeight = Math.max(
    ...clusters.map((cluster) => Math.max(cluster.weight || 0, 1)),
    1
  );
  const maxSaturation = Math.max(
    ...clusters.map((cluster) => clampControlValue(cluster.hsl?.s ?? 0, 0, 100)),
    0
  );
  const lightnessValues = clusters.map((cluster) => clampControlValue(cluster.hsl?.l ?? 50, 0, 100));
  const averageSaturation = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + (cluster.hsl?.s ?? 0) * weight;
  }, 0) / totalWeight;
  const averageLightness = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + (cluster.hsl?.l ?? 50) * weight;
  }, 0) / totalWeight;
  const warmthBias = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hue = cluster.hsl?.h ?? 0;
    const hueRadians = (hue / 180) * Math.PI;
    return sum + Math.cos(hueRadians) * weight;
  }, 0) / totalWeight;

  return {
    averageSaturation,
    averageLightness,
    maxWeight,
    maxSaturation,
    lightnessSpread:
      (Math.max(...lightnessValues, averageLightness) - Math.min(...lightnessValues, averageLightness)) /
      100,
    warmthBias,
  };
}

function orderPaletteHexColorsByHarmony(colors) {
  const nodes = normalizePaletteHexCollection(colors).map((hex) => ({
    hex,
    hsl: controlsHexToHsl(hex),
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex);
}

function isPaletteColorTooClose(candidateColor, palette, minimumDistance = 24) {
  const candidateRgb = controlsHexToRgb(candidateColor);
  return palette.some((existingColor) => {
    const existingRgb = controlsHexToRgb(existingColor);
    return getRgbDistanceBetween(candidateRgb, existingRgb) < minimumDistance;
  });
}

function getInspiredClusterRole(seedIndex, targetCount) {
  if (seedIndex === 0) {
    return "dominant";
  }

  if (targetCount >= 6 && seedIndex === 1) {
    return "dominant";
  }

  if (seedIndex === targetCount - 1) {
    return "accent";
  }

  if (targetCount >= 5 && seedIndex === targetCount - 2) {
    return "accent";
  }

  return "support";
}

function getInspiredImageVariantHex(cluster, role, clusterIndex, variantIndex, atmosphere) {
  const profile =
    IMAGE_INSPIRATION_VARIANT_PROFILES[
      Math.abs(variantIndex) % IMAGE_INSPIRATION_VARIANT_PROFILES.length
    ];
  const direction = (clusterIndex + variantIndex) % 2 === 0 ? 1 : -1;
  const hsl = cluster.hsl;
  const weightRatio = clampControlValue(
    Math.max(cluster.weight || 0, 1) / Math.max(atmosphere.maxWeight || 1, 1),
    0,
    1
  );
  const warmthAdjustment = atmosphere.warmthBias * 4.5;
  let hue = hsl.h;
  let saturation = hsl.s;
  let lightness = hsl.l;

  if (role === "dominant") {
    hue += profile.hueShift * 0.45 * direction + warmthAdjustment * 0.35;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(atmosphere.averageSaturation + 6 + profile.saturationShift, 22, 64),
      0.3
    ) - weightRatio * 3;
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(atmosphere.averageLightness + profile.neutralLift, 30, 70),
      0.34
    );
  } else if (role === "accent") {
    hue += profile.accentHueShift * 0.8 * direction + warmthAdjustment * 0.18;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(
        Math.max(
          atmosphere.averageSaturation + profile.accentBoost,
          atmosphere.maxSaturation * 0.58
        ),
        38,
        72
      ),
      0.44
    );
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(
        atmosphere.averageLightness + direction * 8 * (0.4 + atmosphere.lightnessSpread),
        28,
        76
      ),
      0.26
    );
  } else {
    hue += profile.hueShift * direction + direction * 3 + warmthAdjustment * 0.22;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(atmosphere.averageSaturation + 8 + profile.saturationShift, 26, 72),
      0.38
    );
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(
        atmosphere.averageLightness + profile.lightnessShift + direction * 4 * (0.45 + atmosphere.lightnessSpread),
        28,
        76
      ),
      0.32
    );
  }

  hue = (hue + 360) % 360;
  saturation = clampControlValue(saturation, role === "accent" ? 36 : 22, role === "dominant" ? 64 : 76);
  lightness = clampControlValue(lightness, 24, role === "accent" ? 78 : 74);

  let candidate = controlsNormalizeHexColor(
    controlsHslToHex(hue, saturation, lightness)
  );

  if (candidate === cluster.hex) {
    candidate = controlsNormalizeHexColor(
      controlsHslToHex(
        (hue + direction * 4 + 360) % 360,
        clampControlValue(saturation + (role === "accent" ? 8 : 4), 0, 100),
        clampControlValue(lightness + direction * 5, 12, 88)
      )
    );
  }

  return candidate;
}

function expandInspiredPalette(selectedClusters, targetCount, variantIndex, atmosphere, seedPalette = []) {
  const palette = [...seedPalette];
  const candidateRoles = ["support", "accent", "dominant", "support"];

  for (let cycleIndex = 0; palette.length < targetCount && cycleIndex < targetCount * 6; cycleIndex += 1) {
    const cluster = selectedClusters[cycleIndex % selectedClusters.length];
    const role = candidateRoles[cycleIndex % candidateRoles.length];
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      cycleIndex,
      variantIndex + cycleIndex + 1,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      palette.includes(candidate) ||
      isPaletteColorTooClose(candidate, palette, 22)
    ) {
      continue;
    }

    palette.push(candidate);
  }

  return palette.slice(0, targetCount);
}

function buildInspiredPaletteFromClusters(selectedClusters, targetCount, variantIndex, atmosphere) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const seedPalette = [];

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    if (seedPalette.length >= targetCount) {
      return;
    }

    const role = getInspiredClusterRole(seedPalette.length, targetCount);
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      clusterIndex,
      variantIndex,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      seedPalette.includes(candidate) ||
      isPaletteColorTooClose(candidate, seedPalette, 22)
    ) {
      return;
    }

    seedPalette.push(candidate);
  });

  return expandInspiredPalette(
    harmonyOrderedClusters,
    targetCount,
    variantIndex,
    atmosphere,
    seedPalette
  );
}

function validateInspiredPaletteCandidate(candidatePalette, extractedPalette, clusters) {
  const normalizedCandidate = normalizePaletteHexCollection(candidatePalette);
  const uniqueCount = new Set(normalizedCandidate).size;
  const similarityToExtraction = getPaletteSimilarityMetrics(
    normalizedCandidate,
    extractedPalette
  );

  const nearestClusterDistances = normalizedCandidate.map((color) => {
    const colorRgb = controlsHexToRgb(color);
    return Math.min(
      ...clusters.map((cluster) =>
        getRgbDistanceBetween(colorRgb, {
          r: cluster.r,
          g: cluster.g,
          b: cluster.b,
        })
      )
    );
  });

  const averageNearestClusterDistance =
    nearestClusterDistances.length > 0
      ? nearestClusterDistances.reduce((sum, distance) => sum + distance, 0) /
        nearestClusterDistances.length
      : 0;
  const inspirationDistanceScore = clampControlValue(
    1 - Math.abs(averageNearestClusterDistance - 28) / 42,
    0,
    1
  );

  return {
    hasRepeatedColors: uniqueCount !== normalizedCandidate.length,
    isExactExtractionCopy: similarityToExtraction.exactMatch,
    similarityToExtraction,
    averageNearestClusterDistance,
    inspirationDistanceScore,
    isCoherentWithImage: inspirationDistanceScore >= 0.24,
  };
}

function derivePaletteAdjustmentSettingsFromColors(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return resolvePaletteAdjustmentSettings();
  }

  const paletteHsl = normalizedColors.map((color) => controlsHexToHsl(color));
  const averageSaturation =
    paletteHsl.reduce((sum, color) => sum + color.s, 0) / paletteHsl.length;
  const averageLightness =
    paletteHsl.reduce((sum, color) => sum + color.l, 0) / paletteHsl.length;

  return resolvePaletteAdjustmentSettings({
    saturation: clampControlValue(Math.round(averageSaturation / 5) * 5, 0, 100),
    brightness: clampControlValue(
      Math.round((((averageLightness - 10) / 80) * 100) / 5) * 5,
      0,
      100
    ),
  });
}

async function buildInspiredImagePaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para activar el modo inspiración.");
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const safeTargetCount = Number.isFinite(targetCount) && targetCount > 0 ? targetCount : 5;
  const atmosphere = getImageInspirationAtmosphere(clusters);
  const referencePalette = normalizePaletteHexCollection(
    options.referencePalette ?? currentPalette
  );
  const recentInspiredReferences = Array.isArray(options.recentPalettes)
    ? options.recentPalettes
    : recentInspiredPalettes;
  const startVariantIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imageInspirationVariantIndex + 1;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(
        18,
        IMAGE_INSPIRATION_VARIANT_PROFILES.length * 8,
        recentInspiredReferences.length * 4 + 12
      );
  let fallbackCandidate = null;
  let bestCandidate = null;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = startVariantIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(
      clusters,
      Math.min(clusters.length, Math.max(safeTargetCount + 3, 6)),
      variantIndex
    );
    const extractedReferencePalette = orderImageClustersByHarmony(selectedClusters)
      .map((cluster) => cluster.hex)
      .slice(0, safeTargetCount);
    const candidatePalette = buildInspiredPaletteFromClusters(
      selectedClusters,
      safeTargetCount,
      variantIndex,
      atmosphere
    );
    const orderedPalette = orderPaletteHexColorsByHarmony(candidatePalette);

    if (orderedPalette.length === 0) {
      continue;
    }

    const validation = validateInspiredPaletteCandidate(
      orderedPalette,
      extractedReferencePalette,
      clusters
    );
    const isTooSimilarToRecentInspired = isPaletteTooSimilarToRecentInspiredPalettes(
      orderedPalette,
      recentInspiredReferences
    );
    const similarityToCurrent =
      getPaletteSimilarityMetrics(orderedPalette, referencePalette).sharedColorCount /
      Math.max(orderedPalette.length, 1);
    const eleganceScore = scorePaletteElegance(orderedPalette);
    const score =
      scorePaletteHarmony(orderedPalette) +
      eleganceScore * 1.35 +
      validation.inspirationDistanceScore * 1.15 +
      (validation.isCoherentWithImage ? 0.35 : 0) -
      similarityToCurrent * 0.7 -
      (isTooSimilarToRecentInspired ? 1.1 : 0) -
      (validation.isExactExtractionCopy ? 1.4 : 0) -
      (validation.hasRepeatedColors ? 3 : 0);
    const candidate = {
      palette: orderedPalette,
      variantIndex,
      validation,
      isTooSimilarToRecentInspired,
      settings: derivePaletteAdjustmentSettingsFromColors(orderedPalette),
      score,
    };

    if (
      !fallbackCandidate ||
      (fallbackCandidate.isTooSimilarToRecentInspired && !candidate.isTooSimilarToRecentInspired) ||
      (
        fallbackCandidate.isTooSimilarToRecentInspired === candidate.isTooSimilarToRecentInspired &&
        candidate.score > fallbackCandidate.score
      )
    ) {
      fallbackCandidate = candidate;
    }

    if (
      !validation.hasRepeatedColors &&
      !validation.isExactExtractionCopy &&
      !isTooSimilarToRecentInspired &&
      !arePalettesTooSimilar(orderedPalette, referencePalette) &&
      (!bestCandidate || candidate.score > bestCandidate.score)
    ) {
      bestCandidate = candidate;
    }
  }

  const resolvedCandidate = bestCandidate || fallbackCandidate || {
    palette: [],
    variantIndex: startVariantIndex,
    validation: null,
    settings: resolvePaletteAdjustmentSettings(),
  };
  updateUploadedImageAnalysisCache({
    lastInspiredPaletteValidation: resolvedCandidate.validation,
  });
  return resolvedCandidate;
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

function getRandomSteppedValue(min = 0, max = 100, step = 5) {
  const steps = Math.round((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function getRandomTemperatureSelection() {
  return [
    { warm: true, cool: false },
    { warm: false, cool: true },
    { warm: true, cool: true },
  ][Math.floor(Math.random() * 3)];
}

function getCurrentTemperatureSelectionKey() {
  return `${temperature.warm ? 1 : 0}:${temperature.cool ? 1 : 0}`;
}

function withTemporaryTemperatureSelection(nextSelection, callback) {
  const previousSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  temperature = {
    warm: !!nextSelection?.warm,
    cool: !!nextSelection?.cool,
  };

  try {
    return callback();
  } finally {
    temperature = previousSelection;
  }
}

function createTemperatureCandidate(settings, options = {}) {
  const attemptCount = Number.isFinite(options.attemptCount)
    ? Math.max(1, options.attemptCount)
    : Math.max(24, paletteSize * 8);
  const referencePalette = normalizePaletteHexCollection(
    options.referencePalette ?? currentPalette
  );
  let bestDistinctCandidate = null;
  let bestFallbackCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const candidateResult = buildTemperaturePaletteForSettings(paletteSize, settings);
    if (candidateResult.palette.length === 0) {
      continue;
    }

    const renderedPalette = buildRenderedPaletteFromBaseColors(
      candidateResult.palette,
      settings
    );
    const similarityMetrics = getPaletteSimilarityMetrics(renderedPalette, referencePalette);
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(renderedPalette.length, 1);
    const candidate = {
      palette: candidateResult.palette,
      renderedPalette,
      usedAlternativePalette: candidateResult.usedAlternativePalette,
      score: scorePaletteHarmony(renderedPalette) - similarityPenalty * 0.85,
      isTooSimilar: arePalettesTooSimilar(renderedPalette, referencePalette),
    };

    if (!bestFallbackCandidate || candidate.score > bestFallbackCandidate.score) {
      bestFallbackCandidate = candidate;
    }

    if (
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

async function regenerateTemperaturePaletteKeepingPreferences() {
  const lockedSettings = {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
  const candidate = createTemperatureCandidate(lockedSettings, {
    referencePalette: currentPalette,
  });

  if (!candidate) {
    await generatePalette();
    return;
  }

  commitGeneratedPalette(candidate.palette, {
    usedAlternativePalette: candidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

async function surpriseTemperaturePalette() {
  const currentTemperatureKey = getCurrentTemperatureSelectionKey();
  const currentSettings = getCurrentPaletteAdjustmentSnapshot();
  const referencePalette = normalizePaletteHexCollection(currentPalette);
  let bestCandidate = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nextTemperatureSelection = getRandomTemperatureSelection();
    const nextSettings = {
      brightness: getRandomSteppedValue(0, 100, 5),
      saturation: getRandomSteppedValue(0, 100, 5),
    };
    const temperatureSelectionKey =
      `${nextTemperatureSelection.warm ? 1 : 0}:${nextTemperatureSelection.cool ? 1 : 0}`;
    const candidate = withTemporaryTemperatureSelection(
      nextTemperatureSelection,
      () =>
        createTemperatureCandidate(nextSettings, {
          referencePalette,
          attemptCount: 10,
        })
    );

    if (!candidate) {
      continue;
    }

    const controlDistance =
      Math.abs(nextSettings.brightness - currentSettings.brightness) +
      Math.abs(nextSettings.saturation - currentSettings.saturation);
    const temperatureBonus = temperatureSelectionKey !== currentTemperatureKey ? 0.28 : 0;
    const noveltyBonus = Math.min(controlDistance / 120, 0.75);
    const score = candidate.score + noveltyBonus + temperatureBonus;

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        temperatureSelection: nextTemperatureSelection,
        settings: nextSettings,
        palette: candidate.palette,
        usedAlternativePalette: candidate.usedAlternativePalette,
        score,
      };
    }
  }

  if (!bestCandidate) {
    await regenerateTemperaturePaletteKeepingPreferences();
    return;
  }

  setTemperatureSelection(bestCandidate.temperatureSelection);
  setPaletteAdjustmentControls(bestCandidate.settings);
  commitGeneratedPalette(bestCandidate.palette, {
    usedAlternativePalette: bestCandidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

async function surpriseImagePalette() {
  if (!uploadedBaseImage?.dataUrl) {
    return;
  }

  const originalPriorityPreference = prioritizeImageDominantColors;
  const referencePalette = normalizePaletteHexCollection(currentPalette);
  const currentSettings = getCurrentPaletteAdjustmentSnapshot();
  let bestCandidate = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidatePriorityPreference = Math.random() < 0.5;
    const candidateSettings = {
      brightness: getRandomSteppedValue(0, 100, 5),
      saturation: getRandomSteppedValue(0, 100, 5),
    };
    const candidateVariantIndex =
      imagePaletteVariantIndex +
      1 +
      Math.floor(Math.random() * IMAGE_PALETTE_VARIANT_PROFILES.length * 2);

    prioritizeImageDominantColors = candidatePriorityPreference;
    const candidateResult = await buildImageBasedPaletteCandidate(paletteSize, {
      startVariantIndex: candidateVariantIndex,
      referencePalette,
      maxVariantAttempts: IMAGE_PALETTE_VARIANT_PROFILES.length * 3,
    });

    if (candidateResult.palette.length === 0) {
      continue;
    }

    const renderedPalette = buildRenderedPaletteFromBaseColors(
      candidateResult.palette,
      candidateSettings
    );
    const similarityMetrics = getPaletteSimilarityMetrics(renderedPalette, referencePalette);
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(renderedPalette.length, 1);
    const controlDistance =
      Math.abs(candidateSettings.brightness - currentSettings.brightness) +
      Math.abs(candidateSettings.saturation - currentSettings.saturation);
    const priorityBonus =
      candidatePriorityPreference !== originalPriorityPreference ? 0.16 : 0;
    const score =
      scorePaletteHarmony(renderedPalette) -
      similarityPenalty * 0.7 +
      Math.min(controlDistance / 120, 0.8) +
      priorityBonus;

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        prioritizeDominant: candidatePriorityPreference,
        settings: candidateSettings,
        palette: candidateResult.palette,
        variantIndex: candidateResult.variantIndex,
        score,
      };
    }
  }

  prioritizeImageDominantColors = originalPriorityPreference;

  if (!bestCandidate) {
    await syncImagePaletteFromSource({ advanceVariant: true });
    return;
  }

  prioritizeImageDominantColors = bestCandidate.prioritizeDominant;
  if (paletteImageDominantToggle) {
    paletteImageDominantToggle.checked = bestCandidate.prioritizeDominant;
  }
  setPaletteAdjustmentControls(bestCandidate.settings);
  imagePaletteVariantIndex = bestCandidate.variantIndex;
  commitGeneratedPalette(bestCandidate.palette, {
    previousPalette: currentPalette,
  });
}

async function applyInspiredImagePalette() {
  const targetCount = Number.isFinite(paletteSize) && paletteSize > 0 ? paletteSize : 5;
  const result = await buildInspiredImagePaletteCandidate(targetCount, {
    referencePalette: currentPalette,
  });

  if (!Array.isArray(result.palette) || result.palette.length === 0) {
    setPaletteImageExtractionFeedback(true, IMAGE_EXTRACTION_ERROR_MESSAGE);
    revealPaletteImageDropzoneForRetry();
    return;
  }

  imageInspirationVariantIndex = result.variantIndex + 1;
  rememberInspiredPalette(result.palette);
  setPaletteAdjustmentControls(result.settings);
  commitGeneratedPalette(result.palette, {
    previousPalette: currentPalette,
  });
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.onclick = () => {
    if (surpriseBtn.disabled) {
      return;
    }

    if (paletteBaseMode === "image") {
      void surpriseImagePalette();
      return;
    }

    void surpriseTemperaturePalette();
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

function scorePaletteElegance(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
  }

  const paletteHsl = normalizedColors.map((color) => controlsHexToHsl(color));
  const averageSaturation =
    paletteHsl.reduce((sum, color) => sum + color.s, 0) / paletteHsl.length;
  const averageLightness =
    paletteHsl.reduce((sum, color) => sum + color.l, 0) / paletteHsl.length;
  const averageSaturationDeviation =
    paletteHsl.reduce((sum, color) => sum + Math.abs(color.s - averageSaturation), 0) /
    paletteHsl.length;
  const averageLightnessDeviation =
    paletteHsl.reduce((sum, color) => sum + Math.abs(color.l - averageLightness), 0) /
    paletteHsl.length;
  const vividCount = paletteHsl.filter((color) => color.s > 76).length;
  const extremeLightnessCount = paletteHsl.filter((color) => color.l < 20 || color.l > 82).length;
  const softColorCount = paletteHsl.filter((color) => color.s >= 22 && color.s <= 62).length;
  const elegantSaturationBalance = 1 - Math.min(Math.abs(averageSaturation - 48) / 48, 1);
  const elegantLightnessBalance = 1 - Math.min(Math.abs(averageLightness - 58) / 58, 1);
  const saturationSpreadBalance = 1 - Math.min(Math.abs(averageSaturationDeviation - 14) / 22, 1);
  const lightnessSpreadBalance = 1 - Math.min(Math.abs(averageLightnessDeviation - 13) / 22, 1);

  return (
    elegantSaturationBalance * 0.95 +
    elegantLightnessBalance * 0.85 +
    saturationSpreadBalance * 0.65 +
    lightnessSpreadBalance * 0.6 +
    (softColorCount / paletteHsl.length) * 0.4 -
    (vividCount / paletteHsl.length) * 0.85 -
    (extremeLightnessCount / paletteHsl.length) * 0.75
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

function getPinnedPaletteEntriesSnapshot() {
  if (typeof getCurrentPaletteCardEntries !== "function") {
    return [];
  }

  return getCurrentPaletteCardEntries()
    .filter((entry) => entry.pinned)
    .map((entry) => ({
      index: entry.index,
      hex: controlsNormalizeHexColor(entry.hex),
    }))
    .filter((entry) => /^#[0-9A-F]{6}$/.test(entry.hex));
}

function mergePaletteWithPinnedColors(nextPalette, pinnedEntries = []) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(pinnedEntries) || pinnedEntries.length === 0) {
    return normalizedPalette;
  }

  const mergedPalette = new Array(normalizedPalette.length).fill(null);
  const usedColors = new Set();

  pinnedEntries.forEach((entry) => {
    if (!Number.isFinite(entry?.index) || entry.index < 0 || entry.index >= mergedPalette.length) {
      return;
    }

    const normalizedHex = controlsNormalizeHexColor(entry.hex);
    if (!/^#[0-9A-F]{6}$/.test(normalizedHex) || usedColors.has(normalizedHex)) {
      return;
    }

    mergedPalette[entry.index] = normalizedHex;
    usedColors.add(normalizedHex);
  });

  const availableColors = normalizedPalette.filter((color) => !usedColors.has(color));
  let colorCursor = 0;

  for (let index = 0; index < mergedPalette.length; index += 1) {
    if (mergedPalette[index]) {
      continue;
    }

    const nextColor = availableColors[colorCursor];
    if (!nextColor) {
      break;
    }

    mergedPalette[index] = nextColor;
    usedColors.add(nextColor);
    colorCursor += 1;
  }

  return mergedPalette.filter((color) => /^#[0-9A-F]{6}$/.test(color));
}

function commitGeneratedPalette(nextPalette, options = {}) {
  const previousPalette = normalizePaletteHexCollection(
    options.previousPalette ?? currentPalette
  );
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const mergedPalette = mergePaletteWithPinnedColors(nextPalette, pinnedEntries);
  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedPalette.length)
    .map((entry) => entry.index);

  setPaletteImageExtractionFeedback(false);
  getColorCards().forEach((card) => card.remove());

  capturePaletteAdjustmentBase(mergedPalette);
  currentPalette = mergePaletteWithPinnedColors(
    buildAdjustedPaletteFromBase(),
    pinnedEntries
  );
  currentPalette.forEach((color, index) => {
    createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
    });
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  const generatedPalette = normalizePaletteHexCollection(currentPalette);
  const hasExactPaletteChanged =
    previousPalette.length !== generatedPalette.length ||
    previousPalette.some((color, index) => color !== generatedPalette[index]);

  if (hasExactPaletteChanged || paletteHistory.length === 0) {
    saveHistory(currentPalette, {
      isAlternative: !!options.usedAlternativePalette,
      pinnedIndexes,
    });
  }
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
