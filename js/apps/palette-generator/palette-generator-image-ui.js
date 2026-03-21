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

function updatePaletteActionButtonsAvailability(availableImageColors = null) {
  updatePaletteRegenerateButtonAvailability(availableImageColors);
  updatePaletteSurpriseButtonAvailability(availableImageColors);
  updatePaletteInspirationButtonAvailability(availableImageColors);
}

function updatePaletteRegenerateButtonAvailability(availableImageColors = null) {
  if (!paletteRegenerateBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);

  if (paletteBaseMode !== "image") {
    const isDisabled = mutableSlotCount <= 0;
    paletteRegenerateBtn.disabled = isDisabled;
    paletteRegenerateBtn.classList.toggle("is-disabled", isDisabled);
    paletteRegenerateBtn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    setPaletteRegenerateButtonTooltip(
      isDisabled ? "Todos los colores están fijados" : "Regenerar paleta"
    );
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
  const hasLimitedExtractedColors = availableCount <= Math.max(mutableSlotCount, 0);
  const isDisabled = mutableSlotCount <= 0 || hasLimitedExtractedColors;

  paletteRegenerateBtn.disabled = isDisabled;
  paletteRegenerateBtn.classList.toggle("is-disabled", isDisabled);
  paletteRegenerateBtn.setAttribute(
    "aria-disabled",
    isDisabled ? "true" : "false"
  );
  setPaletteRegenerateButtonTooltip(
    mutableSlotCount <= 0
      ? "Todos los colores están fijados"
      : hasLimitedExtractedColors
        ? "No hay suficiente variedad de colores en la imagen de referencia"
      : "Regenerar paleta"
  );
}

function updatePaletteSurpriseButtonAvailability(availableImageColors = null) {
  if (!surpriseBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);

  if (paletteBaseMode !== "image") {
    const isDisabled = mutableSlotCount <= 0;
    surpriseBtn.disabled = isDisabled;
    surpriseBtn.classList.toggle("is-disabled", isDisabled);
    surpriseBtn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    setPaletteSurpriseButtonTooltip(
      isDisabled
        ? "Todos los colores están fijados"
        : "Generar una variante más libre sin cambiar la cantidad de colores"
    );
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasExtractedColors = hasImageSource && availableCount > 0 && mutableSlotCount > 0;

  surpriseBtn.disabled = !hasExtractedColors;
  surpriseBtn.classList.toggle("is-disabled", !hasExtractedColors);
  surpriseBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteSurpriseButtonTooltip(
    hasExtractedColors
      ? "Generar una variante libre basada en la imagen original"
      : mutableSlotCount <= 0
        ? "Todos los colores están fijados"
        : "Sube una imagen válida para sorprender la paleta"
  );
}

function updatePaletteInspirationButtonAvailability(availableImageColors = null) {
  if (!paletteInspirationBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);
  const requiresMoreFreeSlotsForInspiration = hasInsufficientFreeSlotsForImageInspiration(
    mutableSlotCount
  );

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
  const hasExtractedColors =
    hasImageSource &&
    availableCount > 0 &&
    mutableSlotCount > 0 &&
    !requiresMoreFreeSlotsForInspiration;

  paletteInspirationBtn.hidden = !hasImageSource;
  paletteInspirationBtn.disabled = !hasExtractedColors;
  paletteInspirationBtn.classList.toggle("is-disabled", !hasExtractedColors);
  paletteInspirationBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteInspirationButtonTooltip(
    hasExtractedColors
      ? "Generar una paleta inspirada en la imagen"
      : mutableSlotCount <= 0
        ? "Todos los colores están fijados"
      : requiresMoreFreeSlotsForInspiration
        ? "Desfija más colores para usar Inspiración en toda la paleta"
        : "Sube una imagen válida para activar el modo inspiración"
  );
}

function hasInsufficientFreeSlotsForImageInspiration(
  mutableSlotCount = getMutablePaletteSlotCount(paletteSize, getPinnedPaletteEntriesSnapshot())
) {
  return mutableSlotCount < 2 || mutableSlotCount < Math.ceil(paletteSize / 2);
}

function regeneratePinnedPaletteSlots() {
  if (
    typeof getCurrentPaletteCardEntries !== "function" ||
    typeof getRegeneratedColorForCard !== "function"
  ) {
    return false;
  }

  const cardEntries = getCurrentPaletteCardEntries();
  const mutableEntries = cardEntries.filter((entry) => !entry.pinned);

  if (mutableEntries.length === 0) {
    return false;
  }

  const nextColors = cardEntries.map((entry) => normalizeHexColor(entry.hex));
  let hasChanged = false;

  mutableEntries.forEach((entry) => {
    let candidate = null;
    const excludedColors = new Set([normalizeHexColor(entry.hex)]);
    const maxAttempts =
      paletteBaseMode === "image"
        ? Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 2)
        : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      candidate = getRegeneratedColorForCard(entry.card, new Set(nextColors), {
        excludedColors,
        variantSeedOffset:
          paletteBaseMode === "image"
            ? attempt * Math.max(1, IMAGE_PALETTE_VARIANT_PROFILES.length)
            : 0,
        maxVariantSweeps:
          paletteBaseMode === "image"
            ? Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6)
            : undefined,
      });

      if (candidate && candidate !== entry.hex && !excludedColors.has(candidate)) {
        break;
      }

      if (candidate) {
        excludedColors.add(normalizeHexColor(candidate));
      }
    }

    if (!candidate || candidate === entry.hex) {
      return;
    }

    setCardColor(entry.card, candidate);
    nextColors[entry.index] = normalizeHexColor(candidate);
    hasChanged = true;
  });

  if (hasChanged) {
    persistCurrentPaletteSnapshot();
  }

  return hasChanged;
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
  updatePaletteActionButtonsAvailability();
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
    updatePaletteActionButtonsAvailability();
    return;
  }

  paletteImagePreviewImg.src = uploadedBaseImage.dataUrl;
  paletteImageName.textContent = uploadedBaseImage.name;
  updatePaletteModeActionVisibility();
  updatePaletteActionButtonsAvailability();
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
    alert("Solo se permiten imágenes JPG, PNG, SVG o WEBP.");
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

    const hasPinnedEntries = getPinnedPaletteEntriesSnapshot().length > 0;
    if (hasPinnedEntries) {
      const hasChanged = regeneratePinnedPaletteSlots();
      if (hasChanged || paletteBaseMode === "image") {
        return;
      }
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
    updatePaletteInspirationButtonAvailability();

    if (paletteInspirationBtn.disabled || paletteInspirationBtn.classList.contains("is-disabled")) {
      return;
    }

    if (hasInsufficientFreeSlotsForImageInspiration()) {
      updatePaletteInspirationButtonAvailability();
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
updatePaletteActionButtonsAvailability();

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
function updatePaletteSizeButtonsAvailability(availableImageColors = null) {
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;

  sizeButtons.forEach((button) => {
    const buttonSize = Number.parseInt(button.dataset.size, 10);
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
    updatePaletteActionButtonsAvailability();

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
  updatePaletteActionButtonsAvailability(clusters.length);

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }
}
