// PALETTES HISTORY
const paletteGeneratorHistoryRuntime = window.PaletteGeneratorHistoryRuntime || {};

if (
  typeof paletteGeneratorHistoryRuntime.captureCurrentGeneratorSettings !== "function" ||
  typeof paletteGeneratorHistoryRuntime.resolveAppliedPaletteSize !== "function" ||
  typeof paletteGeneratorHistoryRuntime.getHistoryNavigationState !== "function" ||
  typeof paletteGeneratorHistoryRuntime.createHistoryEntry !== "function" ||
  typeof paletteGeneratorHistoryRuntime.formatHistoryTime !== "function" ||
  typeof paletteGeneratorHistoryRuntime.resolveHistoryEntryForLoad !== "function" ||
  typeof paletteGeneratorHistoryRuntime.getTargetHistoryIndex !== "function"
) {
  throw new Error("PaletteGeneratorHistoryRuntime is required before palette-generator-history.js loads.");
}

function captureCurrentGeneratorSettings() {
  return paletteGeneratorHistoryRuntime.captureCurrentGeneratorSettings({
    paletteSize,
    actualPaletteSize: Array.isArray(currentPalette) ? currentPalette.length : 0,
    paletteBaseMode,
    selectedPaletteBaseColor,
    selectedColorPaletteType,
    selectedMonochromaticGenerationMode,
    selectedAnalogousSeparationMode,
    prioritizeImageDominantColors,
    temperature,
    brightness: brightnessInput ? Number(brightnessInput.value) : DEFAULT_BRIGHTNESS,
    saturation: saturationInput ? Number(saturationInput.value) : DEFAULT_SATURATION,
    defaultBrightness: DEFAULT_BRIGHTNESS,
    defaultSaturation: DEFAULT_SATURATION,
  });
}

function updateHistoryNavigationButtons() {
  const { canUndo, canRedo } = paletteGeneratorHistoryRuntime.getHistoryNavigationState({
    paletteHistoryIndex,
    paletteHistoryLength: paletteHistory.length,
  });

  if (paletteUndoBtn) {
    paletteUndoBtn.disabled = !canUndo;
    paletteUndoBtn.setAttribute("aria-disabled", canUndo ? "false" : "true");
  }

  if (paletteRedoBtn) {
    paletteRedoBtn.disabled = !canRedo;
    paletteRedoBtn.setAttribute("aria-disabled", canRedo ? "false" : "true");
  }
}

function applyGeneratorSettings(settings, fallbackSize) {
  // Old history entries may miss settings
  const nextSize = paletteGeneratorHistoryRuntime.resolveAppliedPaletteSize(
    settings,
    fallbackSize
  );
  setPaletteSize(nextSize);

  if (typeof setPaletteBaseMode === "function" && settings?.baseMode) {
    setPaletteBaseMode(settings.baseMode, {
      suppressAutomaticColorModeRefresh: true,
      suppressAutomaticImageModeRefresh: true,
    });
  }

  if (typeof settings?.prioritizeImageDominantColors === "boolean") {
    prioritizeImageDominantColors = settings.prioritizeImageDominantColors;
    if (paletteImageDominantToggle) {
      paletteImageDominantToggle.checked = prioritizeImageDominantColors;
    }
  }

  if (settings?.temperature) {
    setTemperatureSelection(settings.temperature);
  }

  if (typeof settings?.baseColor === "string") {
    setSelectedPaletteBaseColor(settings.baseColor, {
      syncTextInput: true,
      generate: false,
      publish: false,
    });
  }

  if (typeof settings?.colorPaletteType === "string") {
    setSelectedColorPaletteType(settings.colorPaletteType, {
      generate: false,
    });
  }

  if (typeof settings?.monochromaticGenerationMode === "string") {
    setSelectedMonochromaticGenerationMode(settings.monochromaticGenerationMode, {
      generate: false,
    });
  }

  if (typeof settings?.analogousSeparationMode === "string") {
    setSelectedAnalogousSeparationMode(settings.analogousSeparationMode, {
      generate: false,
    });
  }

  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
    syncTemperatureControlsState();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    updateSaturationProgress();
    syncTemperatureControlsState();
  }

  syncPaletteGeneratorStoreWithLegacyState({}, {
    scope: "history-apply-settings",
  });
}

function saveHistory(colors, metadata = {}) {
  if (paletteHistoryIndex < paletteHistory.length - 1) {
    paletteHistory = paletteHistory.slice(0, paletteHistoryIndex + 1);
  }

  const pinnedIndexes = Array.isArray(metadata.pinnedIndexes)
    ? metadata.pinnedIndexes
    : (
      typeof getPinnedPaletteIndexes === "function"
        ? getPinnedPaletteIndexes()
        : []
    );

  // Save a copy so later edits do not change history
  paletteHistory.push(
    paletteGeneratorHistoryRuntime.createHistoryEntry({
      colors,
      metadata: {
        isAlternative: metadata.isAlternative,
        pinnedIndexes,
      },
      settings: captureCurrentGeneratorSettings(),
    })
  );
  paletteHistoryIndex = paletteHistory.length - 1;
  syncPaletteGeneratorStoreHistoryState({
    scope: "history-save",
  });

  renderHistory();
  updateHistoryNavigationButtons();
}

function formatHistoryTime(dateValue) {
  return paletteGeneratorHistoryRuntime.formatHistoryTime(dateValue);
}

function renderHistory() {
  historyContainer.replaceChildren();

  const historyEntries = paletteHistory
    .map((entry, index) => ({
      entry,
      historyIndex: index,
    }))
    .reverse();

  historyEntries.forEach(({ entry, historyIndex }) => {
    // Support both old and new history formats
    const palette = Array.isArray(entry) ? entry : entry.colors;
    const createdAt = Array.isArray(entry) ? null : entry.createdAt;
    const isAlternative = Array.isArray(entry) ? false : !!entry.isAlternative;

    const historyItem = document.createElement("div");
    historyItem.className = "history-palette";

    const header = document.createElement("div");
    header.className = "history-header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "history-title-group";

    const title = document.createElement("h3");
    title.className = "history-title";
    title.textContent = isAlternative
      ? `Paleta Alternativa ${historyIndex + 1}`
      : `Paleta ${historyIndex + 1}`;

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = createdAt
      ? formatHistoryTime(createdAt)
      : "--:--:--";

    titleGroup.appendChild(title);
    titleGroup.appendChild(time);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const editHistoryBtn = createCardActionButton("edit", "Abrir en el generador");
    const editHistoryIcon = editHistoryBtn.querySelector(".action-icon");
    if (editHistoryIcon) {
      editHistoryIcon.src =
        window.AppAssetUrls?.icons?.magicWand || "assets/magic-wand.svg";
      editHistoryIcon.alt = "icono de abrir en el generador";
    }
    const copyHistoryBtn = createCardActionButton("copy", HISTORY_COPY_TOOLTIP_DEFAULT);
    let historyCopyFeedbackTimeout = null;

    editHistoryBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPaletteVersionInGenerator(entry, { historyIndex });
    });

    copyHistoryBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      const plainText = palette
        .map((hex) => `${normalizeHexColor(hex)} - ${getNearestColorName(hex)}`)
        .join("\n");

      try {
        await copyTextToClipboard(plainText);

        if (historyCopyFeedbackTimeout) {
          clearTimeout(historyCopyFeedbackTimeout);
        }

        historyCopyFeedbackTimeout = showButtonCopyFeedback(copyHistoryBtn, {
          defaultTooltipText: HISTORY_COPY_TOOLTIP_DEFAULT,
        });
      } catch (error) {
        alert("No se han podido copiar los valores de la paleta.");
      }
    });

    actions.appendChild(editHistoryBtn);
    actions.appendChild(copyHistoryBtn);

    header.appendChild(titleGroup);
    header.appendChild(actions);

    const row = document.createElement("div");
    row.className = "history-row";

    palette.forEach((color) => {
      const hex = normalizeHexColor(color);
      let historyColorCopyFeedbackTimeout = null;

      const box = document.createElement("button");
      box.type = "button";
      box.className = "history-color";
      box.style.background = hex;
      box.setAttribute("aria-label", `Copiar ${hex}`);

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = "Copiar HEX";
      box.appendChild(tooltip);

      box.addEventListener("click", async () => {
        try {
          await copyTextToClipboard(hex);

          if (historyColorCopyFeedbackTimeout) {
            clearTimeout(historyColorCopyFeedbackTimeout);
          }

          historyColorCopyFeedbackTimeout = showButtonCopyFeedback(box, {
            defaultTooltipText: "Copiar HEX",
          });
        } catch (error) {
          alert("No se pudo copiar este valor HEX.");
        }
      });

      row.appendChild(box);
    });

    historyItem.appendChild(header);
    historyItem.appendChild(row);
    historyContainer.appendChild(historyItem);
  });

  updateHistoryNavigationButtons();
}

function loadPaletteVersionInGenerator(historyEntry, options = {}) {
  const resolvedHistoryEntry =
    paletteGeneratorHistoryRuntime.resolveHistoryEntryForLoad(historyEntry);
  if (!resolvedHistoryEntry) {
    return;
  }

  const { validColors, fallbackSize, settings, pinnedIndexes } = resolvedHistoryEntry;
  applyGeneratorSettings(settings, fallbackSize);

  getColorCards().forEach((card) => card.remove());

  currentPalette = [];

  validColors.forEach((color, index) => {
    createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
    });
    currentPalette.push(color);
  });

  capturePaletteAdjustmentBase(currentPalette, {
    brightness: brightnessInput ? Number(brightnessInput.value) : DEFAULT_BRIGHTNESS,
    saturation: saturationInput ? Number(saturationInput.value) : DEFAULT_SATURATION,
  });
  syncCurrentPaletteFromDom();
  if (Number.isFinite(options.historyIndex)) {
    paletteHistoryIndex = options.historyIndex;
  }
  syncPaletteGeneratorStoreHistoryState({
    scope: "history-load",
  });
  updateHistoryNavigationButtons();
  // Scroll up so user can see the loaded palette
  if (options.shouldScroll !== false) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

function navigatePaletteHistory(direction) {
  if (!Array.isArray(paletteHistory) || paletteHistory.length === 0) {
    updateHistoryNavigationButtons();
    return;
  }

  const targetIndex = paletteGeneratorHistoryRuntime.getTargetHistoryIndex(
    direction,
    paletteHistoryIndex,
    paletteHistory.length
  );
  if (!Number.isFinite(targetIndex)) {
    updateHistoryNavigationButtons();
    return;
  }

  loadPaletteVersionInGenerator(paletteHistory[targetIndex], {
    historyIndex: targetIndex,
    shouldScroll: false,
  });
}

if (paletteUndoBtn) {
  paletteUndoBtn.addEventListener("click", () => {
    navigatePaletteHistory(-1);
  });
}

if (paletteRedoBtn) {
  paletteRedoBtn.addEventListener("click", () => {
    navigatePaletteHistory(1);
  });
}

updateHistoryNavigationButtons();
