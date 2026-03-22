// SIZE SELECTOR

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
  if (paletteBaseMode === "color") {
    const allowedSizes = getAllowedPaletteSizesForCurrentMode();
    const resolvedSize = getNearestAllowedPaletteSize(nextSize, allowedSizes);
    const previousPalette = [...currentPalette];

    if (resolvedSize !== paletteSize) {
      setPaletteSize(resolvedSize);
    }

    if (typeof updatePaletteModeActionVisibility === "function") {
      updatePaletteModeActionVisibility();
    }

    if (typeof updatePaletteActionButtonsAvailability === "function") {
      updatePaletteActionButtonsAvailability();
    }

    if (typeof updateRegenerateButtonsAvailability === "function") {
      updateRegenerateButtonsAvailability();
    }

    const applyRecalculatedColorPalette = () => {
      const effectiveType = typeof getEffectiveColorPaletteType === "function"
        ? getEffectiveColorPaletteType(resolvedSize)
        : selectedColorPaletteType;
      const nextPalette =
        typeof buildColorModePaletteForSettings === "function"
          ? buildColorModePaletteForSettings(
              resolvedSize,
              getCurrentPaletteAdjustmentSnapshot(),
              {
                baseColor:
                  typeof getPaletteBaseColorSnapshot === "function"
                    ? getPaletteBaseColorSnapshot()
                    : null,
                effectiveType,
                variantIndex:
                  effectiveType === "monochromatic" || effectiveType === "complementary"
                    ? 0
                    : colorPaletteVariantIndex,
              }
            )
          : [];

      if (!Array.isArray(nextPalette) || nextPalette.length !== resolvedSize) {
        alert("No se pudo recalcular una paleta válida para esta cantidad de colores.");
        return;
      }

      if (effectiveType === "monochromatic" || effectiveType === "complementary") {
        colorPaletteVariantIndex = 0;
        syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
          scope: "color-variant",
        });
      }

      if (typeof commitGeneratedPalette === "function") {
        commitGeneratedPalette(nextPalette, {
          effectiveType,
          previousPalette,
        });
      }
    };

    if (typeof withPaletteLoadingOverlay === "function") {
      await withPaletteLoadingOverlay(async () => {
        applyRecalculatedColorPalette();
      });
    } else {
      applyRecalculatedColorPalette();
    }
    return;
  }

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
  const warmSelected = !!nextSelection.warm;
  const coolSelected = !!nextSelection.cool;

  // Keep at least one temperature active
  if (!warmSelected && !coolSelected) {
    temperature = { warm: true, cool: false };
  } else {
    temperature = { warm: warmSelected, cool: coolSelected };
  }

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
