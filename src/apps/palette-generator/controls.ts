let hasInitializedPaletteGeneratorControls = false;

function getPaletteGeneratorControlsWindow() {
  return window as any;
}

export function initializePaletteGeneratorControls() {
  if (hasInitializedPaletteGeneratorControls) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorControlsWindow();
  const controlsRuntime = runtimeWindow.PaletteGeneratorControlsRuntime || {};
  const dom = runtimeWindow.AppDom || {};
  const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};

  if (
    typeof controlsRuntime.applyPaletteSizeChange !== "function" ||
    typeof controlsRuntime.setTemperatureSelection !== "function" ||
    typeof controlsRuntime.toggleTemperatureSelection !== "function"
  ) {
    throw new Error(
      "PaletteGeneratorControlsRuntime is required before controls.ts initializes."
    );
  }

  const sizeButtons = Array.from(dom.sizeButtons || []);

  function setPaletteSize(size: number) {
    globals.paletteSize = size;
    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        paletteSize: size,
      },
      {
        scope: "palette-size",
      }
    );

    sizeButtons.forEach((button: HTMLElement) => {
      button.classList.toggle(
        "active",
        Number.parseInt(button.dataset.size || "", 10) === size
      );
    });
  }

  async function applyPaletteSizeChange(nextSize: number) {
    const result = await controlsRuntime.applyPaletteSizeChange({
      paletteBaseMode: globals.paletteBaseMode,
      nextSize,
      paletteSize: globals.paletteSize,
      currentPalette: globals.currentPalette,
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      setPaletteSize,
      getColorCards: runtimeWindow.getColorCards,
      refreshDeleteButtonsVisibility: runtimeWindow.refreshDeleteButtonsVisibility,
      syncCurrentPaletteFromDom: runtimeWindow.syncCurrentPaletteFromDom,
      capturePaletteAdjustmentBase: runtimeWindow.capturePaletteAdjustmentBase,
      getCurrentPaletteHexValues: runtimeWindow.getCurrentPaletteHexValues,
      getAddedColorForCurrentMode: runtimeWindow.getAddedColorForCurrentMode,
      createColorCard: runtimeWindow.createColorCard,
      saveHistory: runtimeWindow.saveHistory,
      syncImagePaletteFromSource: runtimeWindow.syncImagePaletteFromSource,
      getAllowedPaletteSizesForCurrentMode:
        typeof runtimeWindow.getAllowedPaletteSizesForCurrentMode === "function"
          ? runtimeWindow.getAllowedPaletteSizesForCurrentMode
          : null,
      getNearestAllowedPaletteSize:
        typeof runtimeWindow.getNearestAllowedPaletteSize === "function"
          ? runtimeWindow.getNearestAllowedPaletteSize
          : null,
      updatePaletteModeActionVisibility:
        typeof runtimeWindow.updatePaletteModeActionVisibility === "function"
          ? runtimeWindow.updatePaletteModeActionVisibility
          : null,
      updatePaletteActionButtonsAvailability:
        typeof runtimeWindow.updatePaletteActionButtonsAvailability === "function"
          ? runtimeWindow.updatePaletteActionButtonsAvailability
          : null,
      updateRegenerateButtonsAvailability:
        typeof runtimeWindow.updateRegenerateButtonsAvailability === "function"
          ? runtimeWindow.updateRegenerateButtonsAvailability
          : null,
      getEffectiveColorPaletteType:
        typeof runtimeWindow.getEffectiveColorPaletteType === "function"
          ? runtimeWindow.getEffectiveColorPaletteType
          : null,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      buildColorModePaletteForSettings:
        typeof runtimeWindow.buildColorModePaletteForSettings === "function"
          ? runtimeWindow.buildColorModePaletteForSettings
          : null,
      getCurrentPaletteAdjustmentSnapshot: runtimeWindow.getCurrentPaletteAdjustmentSnapshot,
      getPaletteBaseColorSnapshot:
        typeof runtimeWindow.getPaletteBaseColorSnapshot === "function"
          ? runtimeWindow.getPaletteBaseColorSnapshot
          : null,
      colorPaletteVariantIndex: globals.colorPaletteVariantIndex,
      commitGeneratedPalette:
        typeof runtimeWindow.commitGeneratedPalette === "function"
          ? runtimeWindow.commitGeneratedPalette
          : null,
      withPaletteLoadingOverlay:
        typeof runtimeWindow.withPaletteLoadingOverlay === "function"
          ? runtimeWindow.withPaletteLoadingOverlay
          : null,
    });

    if (
      Number.isFinite(result?.nextColorPaletteVariantIndex) &&
      result.nextColorPaletteVariantIndex !== globals.colorPaletteVariantIndex
    ) {
      globals.colorPaletteVariantIndex = result.nextColorPaletteVariantIndex;
      runtimeWindow.syncPaletteGeneratorStoreColorVariantIndex?.(
        globals.colorPaletteVariantIndex,
        {
          scope: "color-variant",
        }
      );
    }
  }

  async function handlePaletteSizeButtonClick(button: HTMLElement) {
    if (button?.classList.contains("is-disabled")) {
      return;
    }

    const nextSize = Number.parseInt(button.dataset.size || "", 10);
    if (!Number.isFinite(nextSize) || nextSize === globals.paletteSize) {
      return;
    }

    if (button?.matches(":hover")) {
      button.classList.add("suppress-hover");
    }

    setPaletteSize(nextSize);
    await applyPaletteSizeChange(nextSize);
  }

  function setTemperatureSelection(nextSelection: Record<string, boolean>) {
    globals.temperature = controlsRuntime.setTemperatureSelection({
      nextSelection,
    });

    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        temperature: {
          warm: !!globals.temperature?.warm,
          cool: !!globals.temperature?.cool,
        },
      },
      {
        scope: "temperature-selection",
      }
    );

    runtimeWindow.syncTemperatureControlsState?.();
    return globals.temperature;
  }

  function toggleTemperature(type: "warm" | "cool") {
    if (runtimeWindow.isTemperatureLockedBySaturation?.()) {
      runtimeWindow.animateSaturationControlAttention?.();
      return;
    }

    setTemperatureSelection(
      controlsRuntime.toggleTemperatureSelection({
        type,
        temperature: globals.temperature,
      })
    );
  }

  function handleTemperatureButtonClick(type: "warm" | "cool", button: HTMLElement) {
    if (button?.matches(":hover")) {
      button.classList.add("suppress-hover");
    }

    const previousTemperatureState = {
      warm: !!globals.temperature?.warm,
      cool: !!globals.temperature?.cool,
    };

    toggleTemperature(type);

    const hasTemperatureChanged =
      previousTemperatureState.warm !== !!globals.temperature?.warm ||
      previousTemperatureState.cool !== !!globals.temperature?.cool;

    if (hasTemperatureChanged && globals.paletteBaseMode === "temperature") {
      void runtimeWindow.generatePalette?.();
    }
  }

  runtimeWindow.setPaletteSize = setPaletteSize;
  runtimeWindow.applyPaletteSizeChange = applyPaletteSizeChange;
  runtimeWindow.setTemperatureSelection = setTemperatureSelection;
  runtimeWindow.toggleTemperature = toggleTemperature;

  sizeButtons.forEach((button: HTMLElement) => {
    button.addEventListener("click", () => {
      void handlePaletteSizeButtonClick(button);
    });
    button.addEventListener("mouseleave", () => {
      button.classList.remove("suppress-hover");
    });
  });

  if (dom.warmBtn) {
    dom.warmBtn.addEventListener("click", () => {
      handleTemperatureButtonClick("warm", dom.warmBtn);
    });
    dom.warmBtn.addEventListener("mouseleave", () => {
      dom.warmBtn.classList.remove("suppress-hover");
    });
  }

  if (dom.coolBtn) {
    dom.coolBtn.addEventListener("click", () => {
      handleTemperatureButtonClick("cool", dom.coolBtn);
    });
    dom.coolBtn.addEventListener("mouseleave", () => {
      dom.coolBtn.classList.remove("suppress-hover");
    });
  }

  if (dom.resetPaletteBtn) {
    dom.resetPaletteBtn.addEventListener("click", () => {
      window.location.reload();
    });
  }

  hasInitializedPaletteGeneratorControls = true;
}

export default initializePaletteGeneratorControls;
