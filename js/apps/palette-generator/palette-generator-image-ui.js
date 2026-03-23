const paletteGeneratorImageUiHelpers = window.PaletteGeneratorImageUiHelpers || {};
const paletteGeneratorImageUiRuntime = window.PaletteGeneratorImageUiRuntime || {};
if (
  typeof paletteGeneratorImageUiHelpers.getPaletteModeActionVisibility !== "function" ||
  typeof paletteGeneratorImageUiHelpers.getPaletteRegenerateButtonState !== "function" ||
  typeof paletteGeneratorImageUiHelpers.getPaletteSurpriseButtonState !== "function" ||
  typeof paletteGeneratorImageUiHelpers.hasInsufficientFreeSlotsForImageInspiration !== "function" ||
  typeof paletteGeneratorImageUiHelpers.getPaletteInspirationButtonState !== "function" ||
  typeof paletteGeneratorImageUiHelpers.getPaletteSizeButtonState !== "function"
) {
  throw new Error("PaletteGeneratorImageUiHelpers are required before palette-generator-image-ui.js loads.");
}
if (
  typeof paletteGeneratorImageUiRuntime.normalizePaletteBaseMode !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getFirstPaletteHexForColorBaseAdoption !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getPaletteBaseModeTransitionPlan !== "function" ||
  typeof paletteGeneratorImageUiRuntime.isAcceptedPaletteImageFile !== "function" ||
  typeof paletteGeneratorImageUiRuntime.createUploadedBaseImage !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getNextImageVariantState !== "function"
) {
  throw new Error("PaletteGeneratorImageUiRuntime is required before palette-generator-image-ui.js loads.");
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
    syncPaletteGeneratorStoreCurrentPalette([], {
      scope: "image-extraction-feedback",
    });
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
    syncPaletteGeneratorStoreAdjustments({
      brightness: Number(brightnessInput.value),
    }, {
      scope: "brightness-input",
    });
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
    syncPaletteGeneratorStoreAdjustments({
      saturation: Number(saturationInput.value),
    }, {
      scope: "saturation-input",
    });
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
  const visibility = paletteGeneratorImageUiHelpers.getPaletteModeActionVisibility({
    paletteBaseMode,
    selectedColorPaletteType,
    hasImageSource: !!uploadedBaseImage?.dataUrl,
    isMonochromaticColorScale:
    typeof isColorModeMonochromaticScaleActive === "function" &&
    isColorModeMonochromaticScaleActive(),
  });

  if (paletteGenerationButtons) {
    paletteGenerationButtons.hidden = visibility.generationButtonsHidden;
  }

  if (paletteRegenerateBtn) {
    paletteRegenerateBtn.hidden = visibility.regenerateHidden;
  }

  if (surpriseBtn) {
    surpriseBtn.hidden = visibility.surpriseHidden;
  }

  if (paletteInspirationBtn) {
    paletteInspirationBtn.hidden = visibility.inspirationHidden;
  }

  if (paletteIntensityControlGroup) {
    paletteIntensityControlGroup.hidden = visibility.intensityHidden;
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
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const isMonochromaticColorScale =
    typeof isColorModeMonochromaticScaleActive === "function" &&
    isColorModeMonochromaticScaleActive();
  const state = paletteGeneratorImageUiHelpers.getPaletteRegenerateButtonState({
    paletteBaseMode,
    mutableSlotCount,
    hasValidSelectedPaletteBaseColor: hasValidSelectedPaletteBaseColor(),
    isMonochromaticColorScale,
    hasImageSource: !!uploadedBaseImage?.dataUrl,
    availableImageColors: availableCount,
  });

  paletteRegenerateBtn.disabled = state.disabled;
  paletteRegenerateBtn.classList.toggle("is-disabled", state.disabled);
  paletteRegenerateBtn.setAttribute("aria-disabled", state.disabled ? "true" : "false");
  setPaletteRegenerateButtonTooltip(state.tooltip);
}

function updatePaletteSurpriseButtonAvailability(availableImageColors = null) {
  if (!surpriseBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const state = paletteGeneratorImageUiHelpers.getPaletteSurpriseButtonState({
    paletteBaseMode,
    mutableSlotCount,
    hasImageSource: !!uploadedBaseImage?.dataUrl,
    availableImageColors: availableCount,
  });

  surpriseBtn.disabled = state.disabled;
  surpriseBtn.classList.toggle("is-disabled", state.disabled);
  surpriseBtn.setAttribute("aria-disabled", state.disabled ? "true" : "false");
  setPaletteSurpriseButtonTooltip(state.tooltip);
}

function updatePaletteInspirationButtonAvailability(availableImageColors = null) {
  if (!paletteInspirationBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const state = paletteGeneratorImageUiHelpers.getPaletteInspirationButtonState({
    paletteBaseMode,
    mutableSlotCount,
    hasImageSource: !!uploadedBaseImage?.dataUrl,
    availableImageColors: availableCount,
    paletteSize,
  });

  paletteInspirationBtn.hidden = state.hidden;
  paletteInspirationBtn.disabled = state.disabled;
  paletteInspirationBtn.classList.toggle("is-disabled", state.disabled);
  paletteInspirationBtn.setAttribute("aria-disabled", state.disabled ? "true" : "false");
  setPaletteInspirationButtonTooltip(state.tooltip);
}

function hasInsufficientFreeSlotsForImageInspiration(
  mutableSlotCount = getMutablePaletteSlotCount(paletteSize, getPinnedPaletteEntriesSnapshot())
) {
  return paletteGeneratorImageUiHelpers.hasInsufficientFreeSlotsForImageInspiration(
    mutableSlotCount,
    paletteSize
  );
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
      paletteBaseMode === "image" || paletteBaseMode === "color"
        ? Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 2)
        : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      candidate = getRegeneratedColorForCard(entry.card, new Set(nextColors), {
        excludedColors,
        variantSeedOffset:
          paletteBaseMode === "image" || paletteBaseMode === "color"
            ? attempt * Math.max(1, IMAGE_PALETTE_VARIANT_PROFILES.length)
            : 0,
        maxVariantSweeps:
          paletteBaseMode === "image" || paletteBaseMode === "color"
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
  const runSync = async () => {
    if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
      return;
    }

    const nextVariantState = paletteGeneratorImageUiRuntime.getNextImageVariantState({
      imagePaletteVariantIndex,
      imageInspirationVariantIndex,
      resetVariant: options.resetVariant,
      advanceVariant: options.advanceVariant,
    });
    imagePaletteVariantIndex = nextVariantState.imagePaletteVariantIndex;
    imageInspirationVariantIndex = nextVariantState.imageInspirationVariantIndex;

    if (nextVariantState.shouldClearRecentInspiredPalettes) {
      clearRecentInspiredPalettes();
    }

    syncPaletteGeneratorStoreState(
      {
        imagePaletteVariantIndex,
        imageInspirationVariantIndex,
      },
      {
        scope: "image-variants",
      }
    );

    await refreshImageDerivedControls();
    if (!(paletteImageExtractionAlert?.hidden ?? true)) {
      return;
    }

    await generatePalette();
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runSync);
  }

  return runSync();
}
// PALETTE BASE

function getFirstPaletteHexForColorBaseAdoption() {
  const firstEntryHex =
    typeof getCurrentPaletteCardEntries === "function"
      ? getCurrentPaletteCardEntries()[0]?.hex || ""
      : "";
  return paletteGeneratorImageUiRuntime.getFirstPaletteHexForColorBaseAdoption(
    currentPalette,
    firstEntryHex
  );
}

function clearLeakedColorModeFixedPins() {
  Array.from(getColorCards()).forEach((card) => {
    card.dataset.readonlyFixedPin = "false";
    card.classList.remove("is-base-color", "is-complementary-color");

    const colorBaseIndicator = card.querySelector(".color-base-indicator");
    if (colorBaseIndicator) {
      colorBaseIndicator.hidden = true;
    }

    const complementaryIndicator = card.querySelector(".color-complementary-indicator");
    if (complementaryIndicator) {
      complementaryIndicator.hidden = true;
    }

    if (typeof setCardPinnedState === "function") {
      setCardPinnedState(card, false);
    }
  });
}

function setPaletteBaseMode(nextMode) {
  const previousBaseMode = paletteBaseMode;
  const transitionPlan = paletteGeneratorImageUiRuntime.getPaletteBaseModeTransitionPlan({
    currentMode: previousBaseMode,
    nextMode,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    adoptedBaseColor:
      previousBaseMode === "image" ? getFirstPaletteHexForColorBaseAdoption() : null,
  });
  paletteBaseMode = transitionPlan.nextMode;

  syncPaletteGeneratorStoreState(
    {
      paletteBaseMode,
    },
    {
      scope: "palette-base-mode",
    }
  );

  if (transitionPlan.shouldClearImageExtractionFeedback) {
    setPaletteImageExtractionFeedback(false);
  }

  if (paletteBaseModeSelect) {
    paletteBaseModeSelect.value = paletteBaseMode;
  }

  if (colorBasePanel) {
    const showColorPanel = paletteBaseMode === "color";
    colorBasePanel.classList.toggle("active", showColorPanel);
    colorBasePanel.hidden = !showColorPanel;
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

  if (transitionPlan.shouldClearLeakedColorModeFixedPins) {
    clearLeakedColorModeFixedPins();
  }

  if (typeof syncCurrentPaletteFromDom === "function") {
    syncCurrentPaletteFromDom();
  }

  updatePaletteModeActionVisibility();
  updatePaletteActionButtonsAvailability();
  updatePaletteStickyState();
  updatePaletteSizeButtonsAvailability();

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }

  if (transitionPlan.shouldRefreshImageDerivedControls) {
    void refreshImageDerivedControls();
    return;
  }

  if (transitionPlan.colorModeAdoption.shouldSyncColorModeControls) {
    if (
      transitionPlan.colorModeAdoption.adoptedBaseColor &&
      typeof setSelectedPaletteBaseColor === "function"
    ) {
      setSelectedPaletteBaseColor(transitionPlan.colorModeAdoption.adoptedBaseColor, {
        generate: false,
        publish: true,
        syncTextInput: true,
      });
    }

    if (
      transitionPlan.colorModeAdoption.nextColorPaletteType &&
      typeof setSelectedColorPaletteType === "function"
    ) {
      setSelectedColorPaletteType(transitionPlan.colorModeAdoption.nextColorPaletteType, {
        generate: false,
      });
    }

    if (
      transitionPlan.colorModeAdoption.nextMonochromaticGenerationMode &&
      typeof setSelectedMonochromaticGenerationMode === "function"
    ) {
      setSelectedMonochromaticGenerationMode(
        transitionPlan.colorModeAdoption.nextMonochromaticGenerationMode,
        {
          generate: false,
        }
      );
    }

    if (transitionPlan.colorModeAdoption.resetColorVariantIndex) {
      colorPaletteVariantIndex = 0;
      syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
        scope: "color-variant",
      });
    }

    if (transitionPlan.colorModeAdoption.shouldClearUnavailablePinnedCards && typeof clearUnavailablePinnedCards === "function") {
      clearUnavailablePinnedCards();
    }

    syncColorModeBaseControls();
    syncColorModeSizeSelection();

    if (
      transitionPlan.colorModeAdoption.shouldRefreshMonochromaticPalette &&
      typeof generatePalette === "function"
    ) {
      void generatePalette({
        recalculateFromScratch: true,
        effectiveType: "monochromatic",
      });
      return;
    }
  }
}

function isAcceptedPaletteImageFile(file) {
  return paletteGeneratorImageUiRuntime.isAcceptedPaletteImageFile(file);
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
    uploadedBaseImage = paletteGeneratorImageUiRuntime.createUploadedBaseImage(
      file,
      reader.result
    );
    syncPaletteGeneratorStoreState(
      {
        uploadedBaseImage,
      },
      {
        scope: "uploaded-image",
      }
    );
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
    syncPaletteGeneratorStoreState(
      {
        prioritizeImageDominantColors,
      },
      {
        scope: "image-dominant-toggle",
      }
    );

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

    if (paletteBaseMode === "color") {
      void generatePalette();
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
  const allowedColorModeSizes = getAllowedPaletteSizesForCurrentMode();
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;

  sizeButtons.forEach((button) => {
    const buttonSize = Number.parseInt(button.dataset.size, 10);
    const state = paletteGeneratorImageUiHelpers.getPaletteSizeButtonState({
      paletteBaseMode,
      buttonSize,
      allowedColorModeSizes,
      hasImageSource: !!uploadedBaseImage?.dataUrl,
      availableImageColors: availableCount,
    });

    button.hidden = state.hidden;
    button.classList.toggle("is-disabled", state.disabled);
    button.setAttribute("aria-disabled", state.disabled ? "true" : "false");
  });
}

async function refreshImageDerivedControls() {
  const runRefresh = async () => {
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
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runRefresh);
  }

  return runRefresh();
}
