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
  typeof paletteGeneratorImageUiRuntime.createPaletteImageFileLoadState !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getPaletteImagePreviewState !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getOpenPaletteImageDropzoneState !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getPaletteBasePanelVisibilityState !== "function" ||
  typeof paletteGeneratorImageUiRuntime.getNextImageVariantState !== "function" ||
  typeof paletteGeneratorImageUiRuntime.refreshImageDerivedControls !== "function" ||
  typeof paletteGeneratorImageUiRuntime.syncImagePaletteFromSource !== "function" ||
  typeof paletteGeneratorImageUiRuntime.regeneratePinnedPaletteSlots !== "function" ||
  typeof paletteGeneratorImageUiRuntime.clearLeakedColorModeFixedPins !== "function" ||
  typeof paletteGeneratorImageUiRuntime.resetPaletteBeforeColorModeRegeneration !== "function"
) {
  throw new Error("PaletteGeneratorImageUiRuntime is required before palette-generator-image-ui.js loads.");
}

const PALETTE_ADJUSTMENT_PREVIEW_DELAY_MS = 16;
let paletteAdjustmentPreviewFrame = null;
let paletteAdjustmentPreviewTimeout = null;

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

function schedulePaletteAdjustmentPreview() {
  if (paletteAdjustmentPreviewTimeout !== null || paletteAdjustmentPreviewFrame !== null) {
    return;
  }

  paletteAdjustmentPreviewTimeout = setTimeout(() => {
    paletteAdjustmentPreviewTimeout = null;
    paletteAdjustmentPreviewFrame = requestAnimationFrame(() => {
      paletteAdjustmentPreviewFrame = null;
      applyCurrentPaletteAdjustments({
        previewOnly: paletteBaseMode === "image",
      });
    });
  }, PALETTE_ADJUSTMENT_PREVIEW_DELAY_MS);
}

function flushPaletteAdjustmentPreview() {
  if (paletteAdjustmentPreviewTimeout !== null) {
    clearTimeout(paletteAdjustmentPreviewTimeout);
    paletteAdjustmentPreviewTimeout = null;
  }

  if (paletteAdjustmentPreviewFrame !== null) {
    cancelAnimationFrame(paletteAdjustmentPreviewFrame);
    paletteAdjustmentPreviewFrame = null;
  }

  applyCurrentPaletteAdjustments();
}

function bindPaletteAdjustmentInput(input, handlers = {}) {
  if (!input) {
    return;
  }

  if (typeof handlers.onInput === "function") {
    input.addEventListener("input", handlers.onInput);
  }

  if (typeof handlers.onChange === "function") {
    input.addEventListener("change", handlers.onChange);
  }
}

if (brightnessInput) {
  bindPaletteAdjustmentInput(brightnessInput, {
    onInput: () => {
      updateBrightnessProgress();
      syncTemperatureControlsState();
      schedulePaletteAdjustmentPreview();
    },
    onChange: () => {
      flushPaletteAdjustmentPreview();
      syncPaletteGeneratorStoreAdjustments({
        brightness: Number(brightnessInput.value),
      }, {
        scope: "brightness-change",
      });
      if (currentPalette.length > 0) {
        saveHistory(currentPalette);
      }
    },
  });
  // Apply the first visual state
  updateBrightnessProgress();
  syncTemperatureControlsState();
}

if (saturationInput) {
  bindPaletteAdjustmentInput(saturationInput, {
    onInput: () => {
      updateSaturationProgress();
      syncTemperatureControlsState();
      schedulePaletteAdjustmentPreview();
    },
    onChange: () => {
      flushPaletteAdjustmentPreview();
      syncPaletteGeneratorStoreAdjustments({
        saturation: Number(saturationInput.value),
      }, {
        scope: "saturation-change",
      });
      if (currentPalette.length > 0) {
        saveHistory(currentPalette);
      }
    },
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
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const buttonState = paletteGeneratorImageUiHelpers.getPaletteActionButtonsAvailabilityState({
    paletteBaseMode,
    mutableSlotCount,
    hasValidSelectedPaletteBaseColor:
      typeof hasValidSelectedPaletteBaseColor === "function"
        ? hasValidSelectedPaletteBaseColor()
        : false,
    isMonochromaticColorScale:
      typeof isColorModeMonochromaticScaleActive === "function" &&
      isColorModeMonochromaticScaleActive(),
    hasImageSource: !!uploadedBaseImage?.dataUrl,
    availableImageColors: availableCount,
    paletteSize,
  });

  if (paletteRegenerateBtn) {
    paletteRegenerateBtn.disabled = buttonState.regenerate.disabled;
    paletteRegenerateBtn.classList.toggle("is-disabled", buttonState.regenerate.disabled);
    paletteRegenerateBtn.setAttribute(
      "aria-disabled",
      buttonState.regenerate.disabled ? "true" : "false"
    );
    setPaletteRegenerateButtonTooltip(buttonState.regenerate.tooltip);
  }

  if (surpriseBtn) {
    surpriseBtn.disabled = buttonState.surprise.disabled;
    surpriseBtn.classList.toggle("is-disabled", buttonState.surprise.disabled);
    surpriseBtn.setAttribute(
      "aria-disabled",
      buttonState.surprise.disabled ? "true" : "false"
    );
    setPaletteSurpriseButtonTooltip(buttonState.surprise.tooltip);
  }

  if (paletteInspirationBtn) {
    paletteInspirationBtn.hidden = buttonState.inspiration.hidden;
    paletteInspirationBtn.disabled = buttonState.inspiration.disabled;
    paletteInspirationBtn.classList.toggle("is-disabled", buttonState.inspiration.disabled);
    paletteInspirationBtn.setAttribute(
      "aria-disabled",
      buttonState.inspiration.disabled ? "true" : "false"
    );
    setPaletteInspirationButtonTooltip(buttonState.inspiration.tooltip);
  }
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
  return paletteGeneratorImageUiRuntime.regeneratePinnedPaletteSlots({
    paletteBaseMode,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    getCurrentPaletteCardEntries,
    getRegeneratedColorForCard,
    setCardColor,
    persistCurrentPaletteSnapshot,
  });
}

async function syncImagePaletteFromSource(options = {}) {
  return paletteGeneratorImageUiRuntime.syncImagePaletteFromSource({
    paletteBaseMode,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    paletteSize,
    imagePaletteVariantIndex,
    imageInspirationVariantIndex,
    options,
    clearRecentInspiredPalettes,
    setPaletteSize: typeof setPaletteSize === "function" ? setPaletteSize : null,
    syncVariantState(nextVariantState) {
      imagePaletteVariantIndex = nextVariantState.imagePaletteVariantIndex;
      imageInspirationVariantIndex = nextVariantState.imageInspirationVariantIndex;
      syncPaletteGeneratorStoreState(
        {
          imagePaletteVariantIndex,
          imageInspirationVariantIndex,
        },
        {
          scope: "image-variants",
        }
      );
    },
    refreshImageDerivedControls,
    isExtractionFeedbackVisible() {
      return !(paletteImageExtractionAlert?.hidden ?? true);
    },
    generatePalette,
    withPaletteLoadingOverlay:
      typeof withPaletteLoadingOverlay === "function" ? withPaletteLoadingOverlay : null,
  });
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
  paletteGeneratorImageUiRuntime.clearLeakedColorModeFixedPins({
    cards: Array.from(getColorCards()),
    setCardPinnedState:
      typeof setCardPinnedState === "function" ? setCardPinnedState : null,
  });
}

function resetPaletteBeforeColorModeRegeneration() {
  const didReset = paletteGeneratorImageUiRuntime.resetPaletteBeforeColorModeRegeneration({
    cards: typeof getColorCards === "function" ? Array.from(getColorCards()) : [],
    refreshDeleteButtonsVisibility:
      typeof refreshDeleteButtonsVisibility === "function"
        ? refreshDeleteButtonsVisibility
        : null,
    syncCurrentPaletteFromDom:
      typeof syncCurrentPaletteFromDom === "function" ? syncCurrentPaletteFromDom : null,
    syncPaletteGeneratorStoreCurrentPalette:
      typeof syncPaletteGeneratorStoreCurrentPalette === "function"
        ? syncPaletteGeneratorStoreCurrentPalette
        : null,
    capturePaletteAdjustmentBase:
      typeof capturePaletteAdjustmentBase === "function" ? capturePaletteAdjustmentBase : null,
  });

  if (!didReset && typeof syncPaletteGeneratorStoreCurrentPalette === "function") {
    currentPalette = [];
    syncPaletteGeneratorStoreCurrentPalette(currentPalette, {
      scope: "current-palette-reset",
    });
  }
}

function setPaletteBaseMode(nextMode, options = {}) {
  const previousBaseMode = paletteBaseMode;
  const transitionPlan = paletteGeneratorImageUiRuntime.getPaletteBaseModeTransitionPlan({
    currentMode: previousBaseMode,
    nextMode,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    adoptedBaseColor:
      previousBaseMode !== "color" ? getFirstPaletteHexForColorBaseAdoption() : null,
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
  const panelVisibilityState = paletteGeneratorImageUiRuntime.getPaletteBasePanelVisibilityState(
    paletteBaseMode
  );

  if (colorBasePanel) {
    colorBasePanel.classList.toggle("active", panelVisibilityState.showColorPanel);
    colorBasePanel.hidden = !panelVisibilityState.showColorPanel;
  }

  if (temperatureBasePanel) {
    temperatureBasePanel.classList.toggle("active", panelVisibilityState.showTemperaturePanel);
    temperatureBasePanel.hidden = !panelVisibilityState.showTemperaturePanel;
  }

  if (imageBasePanel) {
    imageBasePanel.classList.toggle("active", panelVisibilityState.showImagePanel);
    imageBasePanel.hidden = !panelVisibilityState.showImagePanel;
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
    if (
      transitionPlan.shouldRefreshImagePaletteFromSource &&
      options.suppressAutomaticImageModeRefresh !== true
    ) {
      void syncImagePaletteFromSource();
      return;
    }

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
      options.suppressAutomaticColorModeRefresh !== true &&
      typeof generatePalette === "function"
    ) {
      resetPaletteBeforeColorModeRegeneration();
      void generatePalette({
        recalculateFromScratch: true,
        effectiveType: "monochromatic",
        referencePalette: [],
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

  const previewState = paletteGeneratorImageUiRuntime.getPaletteImagePreviewState({
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    isPaletteImageDropzoneVisible,
    isReplaceImagePending,
  });

  if (!previewState.hasPreview) {
    isPaletteImageDropzoneVisible = true;
  }

  setAnimatedImagePanelVisibility(
    paletteImageDropzonePanel,
    previewState.shouldShowDropzonePanel
  );
  setAnimatedImagePanelVisibility(paletteImagePreview, previewState.shouldShowPreviewPanel);
  paletteImageReplaceBtn.disabled = previewState.replaceButtonDisabled;
  paletteImageReplaceBtn.setAttribute(
    "aria-disabled",
    previewState.replaceButtonDisabled ? "true" : "false"
  );

  if (!previewState.hasPreview) {
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

  const nextState = paletteGeneratorImageUiRuntime.getOpenPaletteImageDropzoneState();
  isReplaceImagePending = nextState.isReplaceImagePending;
  isPaletteImageDropzoneVisible = nextState.isPaletteImageDropzoneVisible;
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
    const uploadState = paletteGeneratorImageUiRuntime.createPaletteImageFileLoadState(
      file,
      reader.result
    );
    uploadedBaseImage = uploadState.uploadedBaseImage;
    syncPaletteGeneratorStoreState(
      {
        uploadedBaseImage,
      },
      {
        scope: "uploaded-image",
      }
    );
    isReplaceImagePending = uploadState.isReplaceImagePending;
    isPaletteImageDropzoneVisible = uploadState.isPaletteImageDropzoneVisible;
    setPaletteImageExtractionFeedback(false);
    setPaletteBaseMode(uploadState.nextBaseMode, {
      suppressAutomaticImageModeRefresh: true,
    });
    renderPaletteImagePreview();
    void syncImagePaletteFromSource({ resetVariant: uploadState.shouldResetVariant });
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
  return paletteGeneratorImageUiRuntime.refreshImageDerivedControls({
    paletteBaseMode,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    getImageColorClusters,
    setPaletteImageExtractionFeedback,
    revealPaletteImageDropzoneForRetry,
    updatePaletteSizeButtonsAvailability,
    updatePaletteActionButtonsAvailability,
    updateRegenerateButtonsAvailability:
      typeof updateRegenerateButtonsAvailability === "function"
        ? updateRegenerateButtonsAvailability
        : null,
    updateAddColorButtonState:
      typeof updateAddColorButtonState === "function"
        ? updateAddColorButtonState
        : null,
    withPaletteLoadingOverlay:
      typeof withPaletteLoadingOverlay === "function" ? withPaletteLoadingOverlay : null,
  });
}
