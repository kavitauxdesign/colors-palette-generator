// SIZE SELECTOR
const paletteGeneratorControlsRuntime = window.PaletteGeneratorControlsRuntime || {};

if (
  typeof paletteGeneratorControlsRuntime.applyPaletteSizeChange !== "function" ||
  typeof paletteGeneratorControlsRuntime.setTemperatureSelection !== "function" ||
  typeof paletteGeneratorControlsRuntime.toggleTemperatureSelection !== "function"
) {
  throw new Error("PaletteGeneratorControlsRuntime is required before palette-generator-controls.js loads.");
}

function setPaletteSize(size) {
  paletteSize = size;
  syncPaletteGeneratorStoreState(
    {
      paletteSize,
    },
    {
      scope: "palette-size",
    }
  );
  sizeButtons.forEach((button) => {
    button.classList.toggle("active", Number.parseInt(button.dataset.size, 10) === size);
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
  const result = await paletteGeneratorControlsRuntime.applyPaletteSizeChange({
    paletteBaseMode,
    nextSize,
    paletteSize,
    currentPalette,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    setPaletteSize,
    getColorCards,
    refreshDeleteButtonsVisibility,
    syncCurrentPaletteFromDom,
    capturePaletteAdjustmentBase,
    getCurrentPaletteHexValues,
    getAddedColorForCurrentMode,
    createColorCard,
    saveHistory,
    syncImagePaletteFromSource,
    getAllowedPaletteSizesForCurrentMode:
      typeof getAllowedPaletteSizesForCurrentMode === "function"
        ? getAllowedPaletteSizesForCurrentMode
        : null,
    getNearestAllowedPaletteSize:
      typeof getNearestAllowedPaletteSize === "function"
        ? getNearestAllowedPaletteSize
        : null,
    updatePaletteModeActionVisibility:
      typeof updatePaletteModeActionVisibility === "function"
        ? updatePaletteModeActionVisibility
        : null,
    updatePaletteActionButtonsAvailability:
      typeof updatePaletteActionButtonsAvailability === "function"
        ? updatePaletteActionButtonsAvailability
        : null,
    updateRegenerateButtonsAvailability:
      typeof updateRegenerateButtonsAvailability === "function"
        ? updateRegenerateButtonsAvailability
        : null,
    getEffectiveColorPaletteType:
      typeof getEffectiveColorPaletteType === "function"
        ? getEffectiveColorPaletteType
        : null,
    selectedColorPaletteType,
    buildColorModePaletteForSettings:
      typeof buildColorModePaletteForSettings === "function"
        ? buildColorModePaletteForSettings
        : null,
    getCurrentPaletteAdjustmentSnapshot,
    getPaletteBaseColorSnapshot:
      typeof getPaletteBaseColorSnapshot === "function"
        ? getPaletteBaseColorSnapshot
        : null,
    colorPaletteVariantIndex,
    commitGeneratedPalette:
      typeof commitGeneratedPalette === "function"
        ? commitGeneratedPalette
        : null,
    withPaletteLoadingOverlay:
      typeof withPaletteLoadingOverlay === "function"
        ? withPaletteLoadingOverlay
        : null,
  });

  if (
    Number.isFinite(result?.nextColorPaletteVariantIndex) &&
    result.nextColorPaletteVariantIndex !== colorPaletteVariantIndex
  ) {
    colorPaletteVariantIndex = result.nextColorPaletteVariantIndex;
    syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
      scope: "color-variant",
    });
  }
}

async function handlePaletteSizeButtonClick(button) {
  if (button?.classList.contains("is-disabled")) {
    return;
  }

  const nextSize = Number.parseInt(button.dataset.size, 10);
  if (!Number.isFinite(nextSize) || nextSize === paletteSize) {
    return;
  }

  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  setPaletteSize(nextSize);
  await applyPaletteSizeChange(nextSize);
}

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    void handlePaletteSizeButtonClick(button);
  });
  button.addEventListener("mouseleave", () => {
    button.classList.remove("suppress-hover");
  });
});

// TEMPERATURE

function setTemperatureSelection(nextSelection) {
  temperature = paletteGeneratorControlsRuntime.setTemperatureSelection({
    nextSelection,
  });

  syncPaletteGeneratorStoreState(
    {
      temperature: {
        warm: !!temperature.warm,
        cool: !!temperature.cool,
      },
    },
    {
      scope: "temperature-selection",
    }
  );

  syncTemperatureControlsState();
}

function toggleTemperature(type) {
  if (isTemperatureLockedBySaturation()) {
    animateSaturationControlAttention();
    return;
  }

  setTemperatureSelection(
    paletteGeneratorControlsRuntime.toggleTemperatureSelection({
      type,
      temperature,
    })
  );
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
  warmBtn.addEventListener("click", () => {
    handleTemperatureButtonClick("warm", warmBtn);
  });
  warmBtn.addEventListener("mouseleave", () => {
    warmBtn.classList.remove("suppress-hover");
  });
}

if (coolBtn) {
  coolBtn.addEventListener("click", () => {
    handleTemperatureButtonClick("cool", coolBtn);
  });
  coolBtn.addEventListener("mouseleave", () => {
    coolBtn.classList.remove("suppress-hover");
  });
}

// RESET

if (resetPaletteBtn) {
  resetPaletteBtn.addEventListener("click", () => {
    // Reload page to reset app state
    window.location.reload();
  });
}

// GENERATE

if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    void generatePalette();
  });
}
