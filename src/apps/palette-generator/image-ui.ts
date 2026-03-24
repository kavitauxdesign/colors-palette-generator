import { IMAGE_PALETTE_VARIANT_PROFILES } from "./image-variant-profiles";
import AppColorUtils from "../../shared/color/color-utils";

let hasInitializedPaletteGeneratorImageUi = false;

const PALETTE_ADJUSTMENT_PREVIEW_DELAY_MS = 16;
const IMAGE_EXTRACTION_ERROR_MESSAGE =
  "No se ha podido extraer colores. Has de intentar subir otra imagen.";
const IMAGE_PANEL_TRANSITION_MS = 320;

let saturationAttentionTimeout: ReturnType<typeof setTimeout> | null = null;
let isPaletteImageDropzoneVisible = true;
let isReplaceImagePending = false;
let isPaletteImageUploadPending = false;
let isPaletteAdjustPanelOpen = false;
let paletteAdjustmentPreviewFrame: number | null = null;
let paletteAdjustmentPreviewTimeout: ReturnType<typeof setTimeout> | null = null;
let lastImageModeSnapshot: {
  imageDataUrl: string;
  paletteSize: number;
  colors: string[];
  pinnedIndexes: number[];
} | null = null;

function getPaletteGeneratorImageUiWindow() {
  return window as any;
}

export function initializePaletteGeneratorImageUi() {
  if (hasInitializedPaletteGeneratorImageUi) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorImageUiWindow();
  const helpers = runtimeWindow.PaletteGeneratorImageUiHelpers || {};
  const uiRuntime = runtimeWindow.PaletteGeneratorImageUiRuntime || {};
  const dom = runtimeWindow.AppDom || {};
  const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};

  if (
    typeof helpers.getPaletteModeActionVisibility !== "function" ||
    typeof helpers.getPaletteRegenerateButtonState !== "function" ||
    typeof helpers.getPaletteSurpriseButtonState !== "function" ||
    typeof helpers.hasInsufficientFreeSlotsForImageInspiration !== "function" ||
    typeof helpers.getPaletteInspirationButtonState !== "function" ||
    typeof helpers.getPaletteSizeButtonState !== "function" ||
    typeof helpers.getPaletteActionButtonsAvailabilityState !== "function"
  ) {
    throw new Error(
      "PaletteGeneratorImageUiHelpers are required before image-ui.ts initializes."
    );
  }

  if (
    typeof uiRuntime.normalizePaletteBaseMode !== "function" ||
    typeof uiRuntime.getFirstPaletteHexForColorBaseAdoption !== "function" ||
    typeof uiRuntime.getPaletteBaseModeTransitionPlan !== "function" ||
    typeof uiRuntime.isAcceptedPaletteImageFile !== "function" ||
    typeof uiRuntime.createPaletteImageFileLoadState !== "function" ||
    typeof uiRuntime.getPaletteImagePreviewState !== "function" ||
    typeof uiRuntime.getOpenPaletteImageDropzoneState !== "function" ||
    typeof uiRuntime.getPaletteBasePanelVisibilityState !== "function" ||
    typeof uiRuntime.refreshImageDerivedControls !== "function" ||
    typeof uiRuntime.syncImagePaletteFromSource !== "function" ||
    typeof uiRuntime.regeneratePinnedPaletteSlots !== "function" ||
    typeof uiRuntime.clearLeakedColorModeFixedPins !== "function" ||
    typeof uiRuntime.resetPaletteBeforeColorModeRegeneration !== "function"
  ) {
    throw new Error(
      "PaletteGeneratorImageUiRuntime is required before image-ui.ts initializes."
    );
  }

  function setPaletteAdjustPanelOpen(shouldOpen: boolean) {
    if (!dom.paletteAdjustPanel || !dom.paletteAdjustBtn) {
      return;
    }

    isPaletteAdjustPanelOpen = !!shouldOpen;
    dom.paletteAdjustPanel.classList.toggle("is-open", isPaletteAdjustPanelOpen);
    dom.paletteAdjustBtn.classList.toggle("is-active", isPaletteAdjustPanelOpen);
    dom.paletteAdjustBtn.setAttribute(
      "aria-expanded",
      isPaletteAdjustPanelOpen ? "true" : "false"
    );
    dom.paletteAdjustPanel.setAttribute(
      "aria-hidden",
      isPaletteAdjustPanelOpen ? "false" : "true"
    );
    updatePaletteStickyState();
  }

  function setPaletteImageExtractionFeedback(
    isVisible: boolean,
    message = IMAGE_EXTRACTION_ERROR_MESSAGE
  ) {
    if (dom.paletteContainer) {
      dom.paletteContainer.hidden = isVisible;
    }

    if (dom.addColorElement) {
      dom.addColorElement.hidden = isVisible;
    }

    if (dom.paletteImageExtractionAlert) {
      dom.paletteImageExtractionAlert.hidden = !isVisible;
      dom.paletteImageExtractionAlert.textContent = message;
    }

    if (isVisible) {
      runtimeWindow.getColorCards?.().forEach((card: Element) => card.remove());
      globals.currentPalette = [];
      runtimeWindow.syncPaletteGeneratorStoreCurrentPalette?.([], {
        scope: "image-extraction-feedback",
      });
      runtimeWindow.capturePaletteAdjustmentBase?.([]);
    }

    updatePaletteStickyState();
  }

  function revealPaletteImageDropzoneForRetry() {
    if (!dom.paletteImageDropzonePanel) {
      return;
    }

    const shouldAnimate = !isPaletteImageDropzoneVisible;
    isPaletteImageDropzoneVisible = true;
    isReplaceImagePending = false;
    renderPaletteImagePreview();

    if (!shouldAnimate) {
      return;
    }

    dom.paletteImageDropzonePanel.classList.remove("is-sliding-in");
    void dom.paletteImageDropzonePanel.offsetWidth;
    dom.paletteImageDropzonePanel.classList.add("is-sliding-in");
  }

  function ensurePaletteAdjustPanelVisible() {
    if (!isPaletteAdjustPanelOpen) {
      setPaletteAdjustPanelOpen(true);
    }
  }

  function updatePaletteStickyState() {
    if (!dom.controlsPanel || !dom.paletteSection) {
      return;
    }

    const isDesktopLayout = window.innerWidth > 680;
    const controlsHeight = dom.controlsPanel.scrollHeight;
    const paletteHeight = dom.paletteSection.scrollHeight;
    const shouldStick =
      isDesktopLayout && paletteHeight > 0 && paletteHeight < controlsHeight;

    dom.paletteSection.classList.toggle("is-sticky", shouldStick);
  }

  function isTemperatureLockedBySaturation() {
    return (
      runtimeWindow.getCurrentSaturationValue?.() <=
        runtimeWindow.AppConstants?.LOW_SATURATION_FALLBACK_THRESHOLD &&
      runtimeWindow.getCurrentBrightnessValue?.() <=
        runtimeWindow.AppConstants?.LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS
    );
  }

  function renderTemperatureButtonState(button: HTMLElement | null, isActive: boolean) {
    if (!button) {
      return;
    }

    const isLocked = isTemperatureLockedBySaturation();
    button.classList.toggle("active", !isLocked && isActive);
    button.classList.toggle("is-saturation-locked", isLocked);
    button.setAttribute("aria-disabled", isLocked ? "true" : "false");
  }

  function syncTemperatureControlsState() {
    renderTemperatureButtonState(dom.warmBtn, !!globals.temperature?.warm);
    renderTemperatureButtonState(dom.coolBtn, !!globals.temperature?.cool);
  }

  function animateSaturationControlAttention() {
    if (!dom.saturationControlGroup) {
      return;
    }

    ensurePaletteAdjustPanelVisible();
    dom.saturationControlGroup.classList.remove("needs-attention");
    void dom.saturationControlGroup.offsetWidth;
    dom.saturationControlGroup.classList.add("needs-attention");

    if (saturationAttentionTimeout) {
      clearTimeout(saturationAttentionTimeout);
    }

    saturationAttentionTimeout = setTimeout(() => {
      dom.saturationControlGroup?.classList.remove("needs-attention");
      saturationAttentionTimeout = null;
    }, 420);
  }

  function schedulePaletteAdjustmentPreview() {
    if (
      paletteAdjustmentPreviewTimeout !== null ||
      paletteAdjustmentPreviewFrame !== null
    ) {
      return;
    }

    paletteAdjustmentPreviewTimeout = setTimeout(() => {
      paletteAdjustmentPreviewTimeout = null;
      paletteAdjustmentPreviewFrame = requestAnimationFrame(() => {
        paletteAdjustmentPreviewFrame = null;
        runtimeWindow.applyCurrentPaletteAdjustments?.({
          previewOnly: globals.paletteBaseMode === "image",
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

    runtimeWindow.applyCurrentPaletteAdjustments?.();
  }

  function bindPaletteAdjustmentInput(
    input: HTMLInputElement | null,
    handlers: {
      onInput?: (() => void) | null;
      onChange?: (() => void) | null;
    } = {}
  ) {
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

  function updatePaletteModeActionVisibility() {
    const visibility = helpers.getPaletteModeActionVisibility({
      paletteBaseMode: globals.paletteBaseMode,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
      isMonochromaticColorScale:
        typeof runtimeWindow.isColorModeMonochromaticScaleActive === "function" &&
        runtimeWindow.isColorModeMonochromaticScaleActive(),
    });

    if (dom.paletteGenerationButtons) {
      dom.paletteGenerationButtons.hidden = visibility.generationButtonsHidden;
    }

    if (dom.paletteRegenerateBtn) {
      dom.paletteRegenerateBtn.hidden = visibility.regenerateHidden;
    }

    if (dom.surpriseBtn) {
      dom.surpriseBtn.hidden = visibility.surpriseHidden;
    }

    if (dom.paletteInspirationBtn) {
      dom.paletteInspirationBtn.hidden = visibility.inspirationHidden;
    }

    if (dom.paletteIntensityControlGroup) {
      dom.paletteIntensityControlGroup.hidden = visibility.intensityHidden;
    }
  }

  function setPaletteActionButtonTooltip(
    button: HTMLElement | null,
    tooltipText: string
  ) {
    if (typeof runtimeWindow.setActionButtonTooltipText === "function") {
      runtimeWindow.setActionButtonTooltipText(button, tooltipText);
      return;
    }

    const tooltip = button?.querySelector(".tooltip");
    if (!tooltip) {
      return;
    }

    tooltip.textContent = tooltipText;
  }

  function setPaletteRegenerateButtonTooltip(tooltipText: string) {
    setPaletteActionButtonTooltip(dom.paletteRegenerateBtn, tooltipText);
  }

  function setPaletteSurpriseButtonTooltip(tooltipText: string) {
    setPaletteActionButtonTooltip(dom.surpriseBtn, tooltipText);
  }

  function setPaletteInspirationButtonTooltip(tooltipText: string) {
    setPaletteActionButtonTooltip(dom.paletteInspirationBtn, tooltipText);
  }

  function updatePaletteActionButtonsAvailability(
    availableImageColors: number | null = null
  ) {
    const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || [];
    const mutableSlotCount =
      runtimeWindow.getMutablePaletteSlotCount?.(globals.paletteSize, pinnedEntries) || 0;
    const availableCount = Number.isFinite(availableImageColors)
      ? Number(availableImageColors)
      : (runtimeWindow.getCachedImageColorClusters?.().length || 0);

    const buttonState = helpers.getPaletteActionButtonsAvailabilityState({
      paletteBaseMode: globals.paletteBaseMode,
      mutableSlotCount,
      hasValidSelectedPaletteBaseColor:
        typeof runtimeWindow.hasValidSelectedPaletteBaseColor === "function"
          ? runtimeWindow.hasValidSelectedPaletteBaseColor()
          : false,
      isMonochromaticColorScale:
        typeof runtimeWindow.isColorModeMonochromaticScaleActive === "function" &&
        runtimeWindow.isColorModeMonochromaticScaleActive(),
      hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
      availableImageColors: availableCount,
      paletteSize: globals.paletteSize,
    });

    if (dom.paletteRegenerateBtn) {
      dom.paletteRegenerateBtn.disabled = buttonState.regenerate.disabled;
      dom.paletteRegenerateBtn.classList.toggle(
        "is-disabled",
        buttonState.regenerate.disabled
      );
      dom.paletteRegenerateBtn.setAttribute(
        "aria-disabled",
        buttonState.regenerate.disabled ? "true" : "false"
      );
      setPaletteRegenerateButtonTooltip(buttonState.regenerate.tooltip);
    }

    if (dom.surpriseBtn) {
      dom.surpriseBtn.disabled = buttonState.surprise.disabled;
      dom.surpriseBtn.classList.toggle("is-disabled", buttonState.surprise.disabled);
      dom.surpriseBtn.setAttribute(
        "aria-disabled",
        buttonState.surprise.disabled ? "true" : "false"
      );
      setPaletteSurpriseButtonTooltip(buttonState.surprise.tooltip);
    }

    if (dom.paletteInspirationBtn) {
      dom.paletteInspirationBtn.hidden = buttonState.inspiration.hidden;
      dom.paletteInspirationBtn.disabled = buttonState.inspiration.disabled;
      dom.paletteInspirationBtn.classList.toggle(
        "is-disabled",
        buttonState.inspiration.disabled
      );
      dom.paletteInspirationBtn.setAttribute(
        "aria-disabled",
        buttonState.inspiration.disabled ? "true" : "false"
      );
      setPaletteInspirationButtonTooltip(buttonState.inspiration.tooltip);
    }
  }

  function updatePaletteRegenerateButtonAvailability(
    availableImageColors: number | null = null
  ) {
    if (!dom.paletteRegenerateBtn) {
      return;
    }

    const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || [];
    const mutableSlotCount =
      runtimeWindow.getMutablePaletteSlotCount?.(globals.paletteSize, pinnedEntries) || 0;
    const availableCount = Number.isFinite(availableImageColors)
      ? Number(availableImageColors)
      : (runtimeWindow.getCachedImageColorClusters?.().length || 0);
    const isMonochromaticColorScale =
      typeof runtimeWindow.isColorModeMonochromaticScaleActive === "function" &&
      runtimeWindow.isColorModeMonochromaticScaleActive();
    const state = helpers.getPaletteRegenerateButtonState({
      paletteBaseMode: globals.paletteBaseMode,
      mutableSlotCount,
      hasValidSelectedPaletteBaseColor:
        typeof runtimeWindow.hasValidSelectedPaletteBaseColor === "function"
          ? runtimeWindow.hasValidSelectedPaletteBaseColor()
          : false,
      isMonochromaticColorScale,
      hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
      availableImageColors: availableCount,
    });

    dom.paletteRegenerateBtn.disabled = state.disabled;
    dom.paletteRegenerateBtn.classList.toggle("is-disabled", state.disabled);
    dom.paletteRegenerateBtn.setAttribute(
      "aria-disabled",
      state.disabled ? "true" : "false"
    );
    setPaletteRegenerateButtonTooltip(state.tooltip);
  }

  function updatePaletteSurpriseButtonAvailability(
    availableImageColors: number | null = null
  ) {
    if (!dom.surpriseBtn) {
      return;
    }

    const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || [];
    const mutableSlotCount =
      runtimeWindow.getMutablePaletteSlotCount?.(globals.paletteSize, pinnedEntries) || 0;
    const availableCount = Number.isFinite(availableImageColors)
      ? Number(availableImageColors)
      : (runtimeWindow.getCachedImageColorClusters?.().length || 0);
    const state = helpers.getPaletteSurpriseButtonState({
      paletteBaseMode: globals.paletteBaseMode,
      mutableSlotCount,
      hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
      availableImageColors: availableCount,
    });

    dom.surpriseBtn.disabled = state.disabled;
    dom.surpriseBtn.classList.toggle("is-disabled", state.disabled);
    dom.surpriseBtn.setAttribute(
      "aria-disabled",
      state.disabled ? "true" : "false"
    );
    setPaletteSurpriseButtonTooltip(state.tooltip);
  }

  function updatePaletteInspirationButtonAvailability(
    availableImageColors: number | null = null
  ) {
    if (!dom.paletteInspirationBtn) {
      return;
    }

    const pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || [];
    const mutableSlotCount =
      runtimeWindow.getMutablePaletteSlotCount?.(globals.paletteSize, pinnedEntries) || 0;
    const availableCount = Number.isFinite(availableImageColors)
      ? Number(availableImageColors)
      : (runtimeWindow.getCachedImageColorClusters?.().length || 0);
    const state = helpers.getPaletteInspirationButtonState({
      paletteBaseMode: globals.paletteBaseMode,
      mutableSlotCount,
      hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
      availableImageColors: availableCount,
      paletteSize: globals.paletteSize,
    });

    dom.paletteInspirationBtn.hidden = state.hidden;
    dom.paletteInspirationBtn.disabled = state.disabled;
    dom.paletteInspirationBtn.classList.toggle("is-disabled", state.disabled);
    dom.paletteInspirationBtn.setAttribute(
      "aria-disabled",
      state.disabled ? "true" : "false"
    );
    setPaletteInspirationButtonTooltip(state.tooltip);
  }

  function hasInsufficientFreeSlotsForImageInspiration(
    mutableSlotCount = runtimeWindow.getMutablePaletteSlotCount?.(
      globals.paletteSize,
      runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || []
    ) || 0
  ) {
    return helpers.hasInsufficientFreeSlotsForImageInspiration(
      mutableSlotCount,
      globals.paletteSize
    );
  }

  function regeneratePinnedPaletteSlots() {
    if (
      typeof runtimeWindow.getCurrentPaletteCardEntries !== "function" ||
      typeof runtimeWindow.getRegeneratedColorForCard !== "function"
    ) {
      return false;
    }

    return uiRuntime.regeneratePinnedPaletteSlots({
      paletteBaseMode: globals.paletteBaseMode,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      getCurrentPaletteCardEntries: runtimeWindow.getCurrentPaletteCardEntries,
      getRegeneratedColorForCard: runtimeWindow.getRegeneratedColorForCard,
      setCardColor: runtimeWindow.setCardColor,
      persistCurrentPaletteSnapshot: runtimeWindow.persistCurrentPaletteSnapshot,
    });
  }

  async function syncImagePaletteFromSource(options: Record<string, unknown> = {}) {
    return uiRuntime.syncImagePaletteFromSource({
      paletteBaseMode: globals.paletteBaseMode,
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      paletteSize: globals.paletteSize,
      imagePaletteVariantIndex: globals.imagePaletteVariantIndex,
      imageInspirationVariantIndex: globals.imageInspirationVariantIndex,
      options,
      clearRecentInspiredPalettes: runtimeWindow.clearRecentInspiredPalettes,
      setPaletteSize:
        typeof runtimeWindow.setPaletteSize === "function"
          ? runtimeWindow.setPaletteSize
          : null,
      syncVariantState(nextVariantState: {
        imagePaletteVariantIndex: number;
        imageInspirationVariantIndex: number;
      }) {
        globals.imagePaletteVariantIndex = nextVariantState.imagePaletteVariantIndex;
        globals.imageInspirationVariantIndex =
          nextVariantState.imageInspirationVariantIndex;
        runtimeWindow.syncPaletteGeneratorStoreState?.(
          {
            imagePaletteVariantIndex: globals.imagePaletteVariantIndex,
            imageInspirationVariantIndex: globals.imageInspirationVariantIndex,
          },
          {
            scope: "image-variants",
          }
        );
      },
      refreshImageDerivedControls,
      isExtractionFeedbackVisible() {
        return !(dom.paletteImageExtractionAlert?.hidden ?? true);
      },
      generatePalette: runtimeWindow.generatePalette,
      withPaletteLoadingOverlay:
        typeof runtimeWindow.withPaletteLoadingOverlay === "function"
          ? runtimeWindow.withPaletteLoadingOverlay
          : null,
    });
  }

  function getFirstPaletteHexForColorBaseAdoption() {
    const firstEntryHex =
      typeof runtimeWindow.getCurrentPaletteCardEntries === "function"
        ? runtimeWindow.getCurrentPaletteCardEntries()[0]?.hex || ""
        : "";
    return uiRuntime.getFirstPaletteHexForColorBaseAdoption(
      globals.currentPalette,
      firstEntryHex
    );
  }

  function captureLastImageModeSnapshot() {
    if (
      globals.paletteBaseMode !== "image" ||
      !globals.uploadedBaseImage?.dataUrl ||
      typeof runtimeWindow.getCurrentPaletteCardEntries !== "function"
    ) {
      return;
    }

    const entries = runtimeWindow.getCurrentPaletteCardEntries() || [];
    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    const colors = entries
      .map((entry: any) => AppColorUtils.normalizeHexColor(entry.hex))
      .filter((hex: string) => AppColorUtils.isValidHexColor(hex));

    if (colors.length === 0) {
      return;
    }

    lastImageModeSnapshot = {
      imageDataUrl: globals.uploadedBaseImage.dataUrl,
      paletteSize: colors.length,
      colors,
      pinnedIndexes: entries
        .filter((entry: any) => !!entry.pinned)
        .map((entry: any) => Number(entry.index))
        .filter((index: number) => Number.isFinite(index)),
    };
  }

  function restoreLastImageModeSnapshot() {
    if (
      !lastImageModeSnapshot ||
      !globals.uploadedBaseImage?.dataUrl ||
      lastImageModeSnapshot.imageDataUrl !== globals.uploadedBaseImage.dataUrl ||
      !Array.isArray(lastImageModeSnapshot.colors) ||
      lastImageModeSnapshot.colors.length === 0 ||
      typeof runtimeWindow.createColorCard !== "function"
    ) {
      return false;
    }

    runtimeWindow.getColorCards?.().forEach((card: Element) => card.remove());

    if (typeof runtimeWindow.setPaletteSize === "function") {
      runtimeWindow.setPaletteSize(lastImageModeSnapshot.paletteSize);
    } else {
      globals.paletteSize = lastImageModeSnapshot.paletteSize;
    }

    globals.currentPalette = [];

    lastImageModeSnapshot.colors.forEach((color: string, index: number) => {
      runtimeWindow.createColorCard(color, {
        pinned: lastImageModeSnapshot?.pinnedIndexes.includes(index),
        suppressUiRefresh: true,
      });
      globals.currentPalette.push(color);
    });

    runtimeWindow.capturePaletteAdjustmentBase?.(globals.currentPalette, {
      brightness: dom.brightnessInput
        ? Number(dom.brightnessInput.value)
        : runtimeWindow.AppConstants?.DEFAULT_BRIGHTNESS,
      saturation: dom.saturationInput
        ? Number(dom.saturationInput.value)
        : runtimeWindow.AppConstants?.DEFAULT_SATURATION,
    });
    runtimeWindow.syncCurrentPaletteFromDom?.();
    runtimeWindow.syncPaletteGeneratorStoreCurrentPalette?.(globals.currentPalette, {
      scope: "restore-image-palette",
    });
    updatePaletteSizeButtonsAvailability(lastImageModeSnapshot.colors.length);
    updatePaletteActionButtonsAvailability(lastImageModeSnapshot.colors.length);
    runtimeWindow.updateRegenerateButtonsAvailability?.();
    runtimeWindow.updateAddColorButtonState?.();
    return true;
  }

  function clearLeakedColorModeFixedPins() {
    uiRuntime.clearLeakedColorModeFixedPins({
      cards: Array.from(runtimeWindow.getColorCards?.() || []),
      setCardPinnedState:
        typeof runtimeWindow.setCardPinnedState === "function"
          ? runtimeWindow.setCardPinnedState
          : null,
    });
  }

  function resetPaletteBeforeColorModeRegeneration() {
    const didReset = uiRuntime.resetPaletteBeforeColorModeRegeneration({
      cards: Array.from(runtimeWindow.getColorCards?.() || []),
      refreshDeleteButtonsVisibility:
        typeof runtimeWindow.refreshDeleteButtonsVisibility === "function"
          ? runtimeWindow.refreshDeleteButtonsVisibility
          : null,
      syncCurrentPaletteFromDom:
        typeof runtimeWindow.syncCurrentPaletteFromDom === "function"
          ? runtimeWindow.syncCurrentPaletteFromDom
          : null,
      syncPaletteGeneratorStoreCurrentPalette:
        typeof runtimeWindow.syncPaletteGeneratorStoreCurrentPalette === "function"
          ? runtimeWindow.syncPaletteGeneratorStoreCurrentPalette
          : null,
      capturePaletteAdjustmentBase:
        typeof runtimeWindow.capturePaletteAdjustmentBase === "function"
          ? runtimeWindow.capturePaletteAdjustmentBase
          : null,
    });

    if (
      !didReset &&
      typeof runtimeWindow.syncPaletteGeneratorStoreCurrentPalette === "function"
    ) {
      globals.currentPalette = [];
      runtimeWindow.syncPaletteGeneratorStoreCurrentPalette(globals.currentPalette, {
        scope: "current-palette-reset",
      });
    }
  }

  function setPaletteBaseMode(nextMode: unknown, options: Record<string, unknown> = {}) {
    const previousBaseMode = globals.paletteBaseMode;
    if (previousBaseMode === "image" && nextMode !== "image") {
      captureLastImageModeSnapshot();
    }
    const transitionPlan = uiRuntime.getPaletteBaseModeTransitionPlan({
      currentMode: previousBaseMode,
      nextMode,
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      adoptedBaseColor:
        previousBaseMode !== "color" ? getFirstPaletteHexForColorBaseAdoption() : null,
    });
    globals.paletteBaseMode = transitionPlan.nextMode;

    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        paletteBaseMode: globals.paletteBaseMode,
      },
      {
        scope: "palette-base-mode",
      }
    );

    if (transitionPlan.shouldClearImageExtractionFeedback) {
      setPaletteImageExtractionFeedback(false);
    }

    if (dom.paletteBaseModeSelect) {
      dom.paletteBaseModeSelect.value = globals.paletteBaseMode;
    }

    const panelVisibilityState = uiRuntime.getPaletteBasePanelVisibilityState(
      globals.paletteBaseMode
    );

    if (dom.colorBasePanel) {
      dom.colorBasePanel.classList.toggle("active", panelVisibilityState.showColorPanel);
      dom.colorBasePanel.hidden = !panelVisibilityState.showColorPanel;
    }

    if (dom.temperatureBasePanel) {
      dom.temperatureBasePanel.classList.toggle(
        "active",
        panelVisibilityState.showTemperaturePanel
      );
      dom.temperatureBasePanel.hidden = !panelVisibilityState.showTemperaturePanel;
    }

    if (dom.imageBasePanel) {
      dom.imageBasePanel.classList.toggle("active", panelVisibilityState.showImagePanel);
      dom.imageBasePanel.hidden = !panelVisibilityState.showImagePanel;
    }

    if (transitionPlan.shouldClearLeakedColorModeFixedPins) {
      clearLeakedColorModeFixedPins();
    }

    runtimeWindow.syncCurrentPaletteFromDom?.();

    updatePaletteModeActionVisibility();
    updatePaletteActionButtonsAvailability();
    updatePaletteStickyState();
    updatePaletteSizeButtonsAvailability();

    if (typeof runtimeWindow.updateRegenerateButtonsAvailability === "function") {
      runtimeWindow.updateRegenerateButtonsAvailability();
    }
    if (typeof runtimeWindow.updateColorModeCardActionVisibility === "function") {
      runtimeWindow.updateColorModeCardActionVisibility();
    }
    if (typeof runtimeWindow.updateAddColorButtonState === "function") {
      runtimeWindow.updateAddColorButtonState();
    }

    if (transitionPlan.shouldRefreshImageDerivedControls) {
      if (
        transitionPlan.shouldRefreshImagePaletteFromSource &&
        options.suppressAutomaticImageModeRefresh !== true
      ) {
        if (restoreLastImageModeSnapshot()) {
          return;
        }
        void syncImagePaletteFromSource();
        return;
      }

      void refreshImageDerivedControls();
      return;
    }

    if (transitionPlan.colorModeAdoption.shouldSyncColorModeControls) {
      if (
        transitionPlan.colorModeAdoption.adoptedBaseColor &&
        typeof runtimeWindow.setSelectedPaletteBaseColor === "function"
      ) {
        runtimeWindow.setSelectedPaletteBaseColor(
          transitionPlan.colorModeAdoption.adoptedBaseColor,
          {
            generate: false,
            publish: true,
            syncTextInput: true,
          }
        );
      }

      if (
        transitionPlan.colorModeAdoption.nextColorPaletteType &&
        typeof runtimeWindow.setSelectedColorPaletteType === "function"
      ) {
        runtimeWindow.setSelectedColorPaletteType(
          transitionPlan.colorModeAdoption.nextColorPaletteType,
          {
            generate: false,
          }
        );
      }

      if (
        transitionPlan.colorModeAdoption.nextMonochromaticGenerationMode &&
        typeof runtimeWindow.setSelectedMonochromaticGenerationMode === "function"
      ) {
        runtimeWindow.setSelectedMonochromaticGenerationMode(
          transitionPlan.colorModeAdoption.nextMonochromaticGenerationMode,
          {
            generate: false,
          }
        );
      }

      if (transitionPlan.colorModeAdoption.resetColorVariantIndex) {
        globals.colorPaletteVariantIndex = 0;
        runtimeWindow.syncPaletteGeneratorStoreColorVariantIndex?.(
          globals.colorPaletteVariantIndex,
          {
            scope: "color-variant",
          }
        );
      }

      if (
        transitionPlan.colorModeAdoption.shouldClearUnavailablePinnedCards &&
        typeof runtimeWindow.clearUnavailablePinnedCards === "function"
      ) {
        runtimeWindow.clearUnavailablePinnedCards();
      }

      runtimeWindow.syncColorModeBaseControls?.();
      runtimeWindow.syncColorModeSizeSelection?.();

      if (
        transitionPlan.colorModeAdoption.shouldRefreshMonochromaticPalette &&
        options.suppressAutomaticColorModeRefresh !== true &&
        typeof runtimeWindow.generatePalette === "function"
      ) {
        resetPaletteBeforeColorModeRegeneration();
        void runtimeWindow.generatePalette({
          recalculateFromScratch: true,
          effectiveType: "monochromatic",
          referencePalette: [],
        });
      }
    }
  }

  function isAcceptedPaletteImageFile(file: unknown) {
    return uiRuntime.isAcceptedPaletteImageFile(file);
  }

  function renderPaletteImagePreview() {
    if (
      !dom.paletteImagePreview ||
      !dom.paletteImagePreviewImg ||
      !dom.paletteImageName ||
      !dom.paletteImageDropzonePanel ||
      !dom.paletteImagePending ||
      !dom.paletteImageReplaceBtn
    ) {
      return;
    }

    const previewState = uiRuntime.getPaletteImagePreviewState({
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      isPaletteImageDropzoneVisible,
      isReplaceImagePending,
    });
    const shouldShowPendingPreview = isPaletteImageUploadPending;

    if (!previewState.hasPreview) {
      isPaletteImageDropzoneVisible = true;
    }

    setAnimatedImagePanelVisibility(
      dom.paletteImageDropzonePanel,
      previewState.shouldShowDropzonePanel && !shouldShowPendingPreview
    );
    setAnimatedImagePanelVisibility(dom.paletteImagePending, shouldShowPendingPreview);
    setAnimatedImagePanelVisibility(
      dom.paletteImagePreview,
      previewState.shouldShowPreviewPanel && !shouldShowPendingPreview
    );
    if (dom.paletteImageDominantToggle) {
      dom.paletteImageDominantToggle.disabled = shouldShowPendingPreview;
      dom.paletteImageDominantToggle.setAttribute(
        "aria-disabled",
        shouldShowPendingPreview ? "true" : "false"
      );
    }
    dom.paletteImageReplaceBtn.disabled =
      previewState.replaceButtonDisabled || shouldShowPendingPreview;
    dom.paletteImageReplaceBtn.setAttribute(
      "aria-disabled",
      previewState.replaceButtonDisabled || shouldShowPendingPreview ? "true" : "false"
    );

    if (shouldShowPendingPreview) {
      dom.paletteImagePreviewImg.removeAttribute("src");
      dom.paletteImageName.textContent = "";
      dom.paletteImagePreview.hidden = true;
      updatePaletteModeActionVisibility();
      updatePaletteActionButtonsAvailability();
      return;
    }

    if (!previewState.hasPreview) {
      dom.paletteImagePreviewImg.removeAttribute("src");
      dom.paletteImageName.textContent = "";
      updatePaletteModeActionVisibility();
      updatePaletteActionButtonsAvailability();
      return;
    }

    dom.paletteImagePreviewImg.src = globals.uploadedBaseImage.dataUrl;
    dom.paletteImageName.textContent = globals.uploadedBaseImage.name;
    updatePaletteModeActionVisibility();
    updatePaletteActionButtonsAvailability();
  }

  function setAnimatedImagePanelVisibility(
    element: HTMLElement | null,
    shouldShow: boolean
  ) {
    if (!element) {
      return;
    }

    const elementWithTimeout = element as HTMLElement & {
      __hideTimeout?: ReturnType<typeof setTimeout> | null;
    };

    if (elementWithTimeout.__hideTimeout) {
      clearTimeout(elementWithTimeout.__hideTimeout);
      elementWithTimeout.__hideTimeout = null;
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
    elementWithTimeout.__hideTimeout = setTimeout(() => {
      element.hidden = true;
      elementWithTimeout.__hideTimeout = null;
    }, IMAGE_PANEL_TRANSITION_MS);
  }

  function openPaletteImageDropzone() {
    if (!dom.paletteImageDropzonePanel) {
      return;
    }

    const nextState = uiRuntime.getOpenPaletteImageDropzoneState();
    isReplaceImagePending = nextState.isReplaceImagePending;
    isPaletteImageDropzoneVisible = nextState.isPaletteImageDropzoneVisible;
    renderPaletteImagePreview();

    dom.paletteImageDropzonePanel.classList.remove("is-sliding-in");
    void dom.paletteImageDropzonePanel.offsetWidth;
    dom.paletteImageDropzonePanel.classList.add("is-sliding-in");
  }

  function handlePaletteImageFile(file: File) {
    if (!isAcceptedPaletteImageFile(file)) {
      alert("Solo se permiten imágenes JPG, PNG, SVG o WEBP.");
      return;
    }

    isPaletteImageUploadPending = true;
    isReplaceImagePending = false;
    isPaletteImageDropzoneVisible = false;
    setPaletteBaseMode("image", {
      suppressAutomaticImageModeRefresh: true,
    });
    renderPaletteImagePreview();

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const uploadState = uiRuntime.createPaletteImageFileLoadState(file, reader.result);
      globals.uploadedBaseImage = uploadState.uploadedBaseImage;
      runtimeWindow.syncPaletteGeneratorStoreState?.(
        {
          uploadedBaseImage: globals.uploadedBaseImage,
        },
        {
          scope: "uploaded-image",
        }
      );

      isReplaceImagePending = uploadState.isReplaceImagePending;
      isPaletteImageDropzoneVisible = uploadState.isPaletteImageDropzoneVisible;
      setPaletteImageExtractionFeedback(false);
      void syncImagePaletteFromSource({
        resetVariant: uploadState.shouldResetVariant,
      })
        .catch((error) => {
          console.error(error);
          alert("No se pudo cargar esta imagen.");
        })
        .finally(() => {
          isPaletteImageUploadPending = false;
          renderPaletteImagePreview();
        });
    });
    reader.addEventListener(
      "error",
      () => {
        isPaletteImageUploadPending = false;
        renderPaletteImagePreview();
        alert("No se pudo cargar esta imagen.");
      },
      {
        once: true,
      }
    );
    reader.addEventListener(
      "abort",
      () => {
        isPaletteImageUploadPending = false;
        renderPaletteImagePreview();
      },
      {
        once: true,
      }
    );
    reader.readAsDataURL(file);
  }

  function updatePaletteSizeButtonsAvailability(
    availableImageColors: number | null = null
  ) {
    const allowedColorModeSizes =
      runtimeWindow.getAllowedPaletteSizesForCurrentMode?.() || [];
    const availableCount = Number.isFinite(availableImageColors)
      ? Number(availableImageColors)
      : (runtimeWindow.getCachedImageColorClusters?.().length || 0);

    Array.from(dom.sizeButtons || []).forEach((button: HTMLElement) => {
      const buttonSize = Number.parseInt(button.dataset.size || "", 10);
      const state = helpers.getPaletteSizeButtonState({
        paletteBaseMode: globals.paletteBaseMode,
        buttonSize,
        allowedColorModeSizes,
        hasImageSource: !!globals.uploadedBaseImage?.dataUrl,
        availableImageColors: availableCount,
      });

      button.hidden = state.hidden;
      button.classList.toggle("is-disabled", state.disabled);
      button.setAttribute("aria-disabled", state.disabled ? "true" : "false");
    });
  }

  async function refreshImageDerivedControls() {
    return uiRuntime.refreshImageDerivedControls({
      paletteBaseMode: globals.paletteBaseMode,
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      getImageColorClusters: runtimeWindow.getImageColorClusters,
      setPaletteImageExtractionFeedback,
      revealPaletteImageDropzoneForRetry,
      updatePaletteSizeButtonsAvailability,
      updatePaletteActionButtonsAvailability,
      updateRegenerateButtonsAvailability:
        typeof runtimeWindow.updateRegenerateButtonsAvailability === "function"
          ? runtimeWindow.updateRegenerateButtonsAvailability
          : null,
      updateAddColorButtonState:
        typeof runtimeWindow.updateAddColorButtonState === "function"
          ? runtimeWindow.updateAddColorButtonState
          : null,
      withPaletteLoadingOverlay:
        typeof runtimeWindow.withPaletteLoadingOverlay === "function"
          ? runtimeWindow.withPaletteLoadingOverlay
          : null,
    });
  }

  runtimeWindow.setPaletteAdjustPanelOpen = setPaletteAdjustPanelOpen;
  runtimeWindow.setPaletteImageExtractionFeedback = setPaletteImageExtractionFeedback;
  runtimeWindow.revealPaletteImageDropzoneForRetry = revealPaletteImageDropzoneForRetry;
  runtimeWindow.updatePaletteStickyState = updatePaletteStickyState;
  runtimeWindow.isTemperatureLockedBySaturation = isTemperatureLockedBySaturation;
  runtimeWindow.syncTemperatureControlsState = syncTemperatureControlsState;
  runtimeWindow.animateSaturationControlAttention = animateSaturationControlAttention;
  runtimeWindow.schedulePaletteAdjustmentPreview = schedulePaletteAdjustmentPreview;
  runtimeWindow.flushPaletteAdjustmentPreview = flushPaletteAdjustmentPreview;
  runtimeWindow.updatePaletteModeActionVisibility = updatePaletteModeActionVisibility;
  runtimeWindow.updatePaletteActionButtonsAvailability =
    updatePaletteActionButtonsAvailability;
  runtimeWindow.updatePaletteRegenerateButtonAvailability =
    updatePaletteRegenerateButtonAvailability;
  runtimeWindow.updatePaletteSurpriseButtonAvailability =
    updatePaletteSurpriseButtonAvailability;
  runtimeWindow.updatePaletteInspirationButtonAvailability =
    updatePaletteInspirationButtonAvailability;
  runtimeWindow.hasInsufficientFreeSlotsForImageInspiration =
    hasInsufficientFreeSlotsForImageInspiration;
  runtimeWindow.regeneratePinnedPaletteSlots = regeneratePinnedPaletteSlots;
  runtimeWindow.syncImagePaletteFromSource = syncImagePaletteFromSource;
  runtimeWindow.getFirstPaletteHexForColorBaseAdoption =
    getFirstPaletteHexForColorBaseAdoption;
  runtimeWindow.captureLastImageModeSnapshot = captureLastImageModeSnapshot;
  runtimeWindow.restoreLastImageModeSnapshot = restoreLastImageModeSnapshot;
  runtimeWindow.clearLeakedColorModeFixedPins = clearLeakedColorModeFixedPins;
  runtimeWindow.resetPaletteBeforeColorModeRegeneration =
    resetPaletteBeforeColorModeRegeneration;
  runtimeWindow.setPaletteBaseMode = setPaletteBaseMode;
  runtimeWindow.isAcceptedPaletteImageFile = isAcceptedPaletteImageFile;
  runtimeWindow.renderPaletteImagePreview = renderPaletteImagePreview;
  runtimeWindow.openPaletteImageDropzone = openPaletteImageDropzone;
  runtimeWindow.handlePaletteImageFile = handlePaletteImageFile;
  runtimeWindow.updatePaletteSizeButtonsAvailability =
    updatePaletteSizeButtonsAvailability;
  runtimeWindow.refreshImageDerivedControls = refreshImageDerivedControls;

  bindPaletteAdjustmentInput(dom.brightnessInput, {
    onInput: () => {
      runtimeWindow.updateBrightnessProgress?.();
      syncTemperatureControlsState();
      schedulePaletteAdjustmentPreview();
    },
    onChange: () => {
      flushPaletteAdjustmentPreview();
      runtimeWindow.syncPaletteGeneratorStoreAdjustments?.(
        {
          brightness: Number(dom.brightnessInput?.value),
        },
        {
          scope: "brightness-change",
        }
      );
      if ((globals.currentPalette || []).length > 0) {
        runtimeWindow.saveHistory?.(globals.currentPalette);
      }
    },
  });

  bindPaletteAdjustmentInput(dom.saturationInput, {
    onInput: () => {
      runtimeWindow.updateSaturationProgress?.();
      syncTemperatureControlsState();
      schedulePaletteAdjustmentPreview();
    },
    onChange: () => {
      flushPaletteAdjustmentPreview();
      runtimeWindow.syncPaletteGeneratorStoreAdjustments?.(
        {
          saturation: Number(dom.saturationInput?.value),
        },
        {
          scope: "saturation-change",
        }
      );
      if ((globals.currentPalette || []).length > 0) {
        runtimeWindow.saveHistory?.(globals.currentPalette);
      }
    },
  });

  runtimeWindow.updateBrightnessProgress?.();
  runtimeWindow.updateSaturationProgress?.();
  syncTemperatureControlsState();

  if (dom.paletteAdjustBtn) {
    dom.paletteAdjustBtn.addEventListener("click", () => {
      setPaletteAdjustPanelOpen(!isPaletteAdjustPanelOpen);
    });
  }

  if (dom.paletteBaseModeSelect) {
    dom.paletteBaseModeSelect.addEventListener("change", () => {
      setPaletteBaseMode(dom.paletteBaseModeSelect.value);
    });
  }

  if (dom.paletteImageInput) {
    dom.paletteImageInput.addEventListener("change", (event: Event) => {
      const input = event.currentTarget as HTMLInputElement | null;
      const file = input?.files?.[0];
      if (file) {
        handlePaletteImageFile(file);
      }
      if (input) {
        input.value = "";
      }
    });
  }

  if (dom.paletteImageReplaceBtn) {
    dom.paletteImageReplaceBtn.addEventListener("click", () => {
      openPaletteImageDropzone();
    });
  }

  if (dom.paletteImageDominantToggle) {
    dom.paletteImageDominantToggle.checked = !!globals.prioritizeImageDominantColors;
    dom.paletteImageDominantToggle.addEventListener("change", () => {
      globals.prioritizeImageDominantColors = !!dom.paletteImageDominantToggle?.checked;
      runtimeWindow.syncPaletteGeneratorStoreState?.(
        {
          prioritizeImageDominantColors: globals.prioritizeImageDominantColors,
        },
        {
          scope: "image-dominant-toggle",
        }
      );

      if (
        globals.paletteBaseMode !== "image" ||
        !globals.uploadedBaseImage?.dataUrl
      ) {
        return;
      }

      void syncImagePaletteFromSource({ resetVariant: true });
    });
  }

  if (dom.paletteRegenerateBtn) {
    dom.paletteRegenerateBtn.addEventListener("click", () => {
      if (
        dom.paletteRegenerateBtn?.disabled ||
        dom.paletteRegenerateBtn?.classList.contains("is-disabled")
      ) {
        return;
      }

      const hasPinnedEntries =
        (runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || []).length > 0;
      if (hasPinnedEntries) {
        const hasChanged = regeneratePinnedPaletteSlots();
        if (hasChanged || globals.paletteBaseMode === "image") {
          return;
        }
      }

      if (globals.paletteBaseMode === "image") {
        void syncImagePaletteFromSource({ advanceVariant: true });
        return;
      }

      if (globals.paletteBaseMode === "color") {
        void runtimeWindow.generatePalette?.();
        return;
      }

      void runtimeWindow.regenerateTemperaturePaletteKeepingPreferences?.();
    });
  }

  if (dom.paletteInspirationBtn) {
    dom.paletteInspirationBtn.addEventListener("click", () => {
      updatePaletteInspirationButtonAvailability();

      if (
        dom.paletteInspirationBtn?.disabled ||
        dom.paletteInspirationBtn?.classList.contains("is-disabled")
      ) {
        return;
      }

      if (hasInsufficientFreeSlotsForImageInspiration()) {
        updatePaletteInspirationButtonAvailability();
        return;
      }

      void runtimeWindow.applyInspiredImagePalette?.();
    });
  }

  if (dom.paletteImageDropzone) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dom.paletteImageDropzone?.addEventListener(eventName, (event: Event) => {
        event.preventDefault();
        dom.paletteImageDropzone?.classList.add("is-dragover");
      });
    });

    ["dragleave", "dragend", "drop"].forEach((eventName) => {
      dom.paletteImageDropzone?.addEventListener(eventName, (event: Event) => {
        event.preventDefault();
        dom.paletteImageDropzone?.classList.remove("is-dragover");
      });
    });

    dom.paletteImageDropzone.addEventListener("drop", (event: DragEvent) => {
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        handlePaletteImageFile(file);
      }
    });
  }

  setPaletteBaseMode(globals.paletteBaseMode);
  renderPaletteImagePreview();
  updatePaletteSizeButtonsAvailability();
  updatePaletteModeActionVisibility();
  updatePaletteActionButtonsAvailability();

  if (dom.controlsPanel && dom.paletteSection) {
    updatePaletteStickyState();

    if (typeof ResizeObserver === "function") {
      const stickyObserver = new ResizeObserver(() => {
        updatePaletteStickyState();
      });

      stickyObserver.observe(dom.controlsPanel);
      stickyObserver.observe(dom.paletteSection);
      if (dom.paletteContainer) {
        stickyObserver.observe(dom.paletteContainer);
      }
    }

    window.addEventListener("resize", updatePaletteStickyState, { passive: true });
  }

  hasInitializedPaletteGeneratorImageUi = true;
}

export default initializePaletteGeneratorImageUi;
