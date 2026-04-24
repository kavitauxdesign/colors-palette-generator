let hasInitializedPaletteGeneratorHistory = false;

function getPaletteGeneratorHistoryWindow() {
  return window as any;
}

export function initializePaletteGeneratorHistory() {
  if (hasInitializedPaletteGeneratorHistory) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorHistoryWindow();
  const historyRuntime = runtimeWindow.PaletteGeneratorHistoryRuntime || {};
  const dom = runtimeWindow.AppDom || {};
  const constants = runtimeWindow.AppConstants || {};
  const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
  const normalizeHexColor =
    runtimeWindow.AppColorUtils?.normalizeHexColor || ((value: string) => value);
  const copyTextToClipboard =
    runtimeWindow.AppClipboard?.writeText || runtimeWindow.copyTextToClipboard;
  const maxSessionPaletteHistoryEntries = Number.isFinite(
    constants.MAX_SESSION_PALETTE_HISTORY_ENTRIES
  )
    ? Math.max(1, Number(constants.MAX_SESSION_PALETTE_HISTORY_ENTRIES))
    : 50;

  if (
    typeof historyRuntime.captureCurrentGeneratorSettings !== "function" ||
    typeof historyRuntime.resolveAppliedPaletteSize !== "function" ||
    typeof historyRuntime.getHistoryNavigationState !== "function" ||
    typeof historyRuntime.createHistoryEntry !== "function" ||
    typeof historyRuntime.formatHistoryTime !== "function" ||
    typeof historyRuntime.resolveHistoryEntryForLoad !== "function" ||
    typeof historyRuntime.getTargetHistoryIndex !== "function"
  ) {
    throw new Error(
      "PaletteGeneratorHistoryRuntime is required before history.ts initializes."
    );
  }

  function captureCurrentGeneratorSettings() {
    return historyRuntime.captureCurrentGeneratorSettings({
      paletteSize: globals.paletteSize,
      actualPaletteSize: Array.isArray(globals.currentPalette)
        ? globals.currentPalette.length
        : 0,
      paletteBaseMode: globals.paletteBaseMode,
      selectedPaletteBaseColor: globals.selectedPaletteBaseColor,
      selectedColorPaletteType: globals.selectedColorPaletteType,
      selectedMonochromaticGenerationMode: globals.selectedMonochromaticGenerationMode,
      selectedAnalogousSeparationMode: globals.selectedAnalogousSeparationMode,
      prioritizeImageDominantColors: globals.prioritizeImageDominantColors,
      temperature: globals.temperature,
      brightness: dom.brightnessInput
        ? Number(dom.brightnessInput.value)
        : constants.DEFAULT_BRIGHTNESS,
      saturation: dom.saturationInput
        ? Number(dom.saturationInput.value)
        : constants.DEFAULT_SATURATION,
      defaultBrightness: constants.DEFAULT_BRIGHTNESS,
      defaultSaturation: constants.DEFAULT_SATURATION,
    });
  }

  function updateHistoryNavigationButtons() {
    const { canUndo, canRedo } = historyRuntime.getHistoryNavigationState({
      paletteHistoryIndex: globals.paletteHistoryIndex,
      paletteHistoryLength: Array.isArray(globals.paletteHistory)
        ? globals.paletteHistory.length
        : 0,
    });

    if (dom.paletteUndoBtn) {
      dom.paletteUndoBtn.disabled = !canUndo;
      dom.paletteUndoBtn.setAttribute("aria-disabled", canUndo ? "false" : "true");
    }

    if (dom.paletteRedoBtn) {
      dom.paletteRedoBtn.disabled = !canRedo;
      dom.paletteRedoBtn.setAttribute("aria-disabled", canRedo ? "false" : "true");
    }
  }

  function applyGeneratorSettings(settings: Record<string, any>, fallbackSize: number) {
    const nextSize = historyRuntime.resolveAppliedPaletteSize(settings, fallbackSize);
    runtimeWindow.setPaletteSize?.(nextSize);

    if (typeof runtimeWindow.setPaletteBaseMode === "function" && settings?.baseMode) {
      runtimeWindow.setPaletteBaseMode(settings.baseMode, {
        suppressAutomaticColorModeRefresh: true,
        suppressAutomaticImageModeRefresh: true,
      });
    }

    if (typeof settings?.prioritizeImageDominantColors === "boolean") {
      globals.prioritizeImageDominantColors = settings.prioritizeImageDominantColors;
      if (dom.paletteImageDominantToggle) {
        dom.paletteImageDominantToggle.checked = !globals.prioritizeImageDominantColors;
      }
    }

    if (settings?.temperature) {
      runtimeWindow.setTemperatureSelection?.(settings.temperature);
    }

    if (typeof settings?.baseColor === "string") {
      runtimeWindow.setSelectedPaletteBaseColor?.(settings.baseColor, {
        syncTextInput: true,
        generate: false,
        publish: false,
      });
    }

    if (typeof settings?.colorPaletteType === "string") {
      runtimeWindow.setSelectedColorPaletteType?.(settings.colorPaletteType, {
        generate: false,
      });
    }

    if (typeof settings?.monochromaticGenerationMode === "string") {
      runtimeWindow.setSelectedMonochromaticGenerationMode?.(
        settings.monochromaticGenerationMode,
        {
          generate: false,
        }
      );
    }

    if (typeof settings?.analogousSeparationMode === "string") {
      runtimeWindow.setSelectedAnalogousSeparationMode?.(settings.analogousSeparationMode, {
        generate: false,
      });
    }

    if (dom.brightnessInput && Number.isFinite(settings?.brightness)) {
      dom.brightnessInput.value = settings.brightness;
      runtimeWindow.updateBrightnessProgress?.();
      runtimeWindow.syncTemperatureControlsState?.();
    }

    if (dom.saturationInput && Number.isFinite(settings?.saturation)) {
      dom.saturationInput.value = settings.saturation;
      runtimeWindow.updateSaturationProgress?.();
      runtimeWindow.syncTemperatureControlsState?.();
    }

    runtimeWindow.syncPaletteGeneratorStoreWithLegacyState?.({}, {
      scope: "history-apply-settings",
    });
  }

  function saveHistory(colors: string[], metadata: Record<string, any> = {}) {
    if (globals.paletteHistoryIndex < globals.paletteHistory.length - 1) {
      globals.paletteHistory = globals.paletteHistory.slice(0, globals.paletteHistoryIndex + 1);
    }

    const pinnedIndexes = Array.isArray(metadata.pinnedIndexes)
      ? metadata.pinnedIndexes
      : (
          typeof runtimeWindow.getPinnedPaletteIndexes === "function"
            ? runtimeWindow.getPinnedPaletteIndexes()
            : []
        );

    let nextPaletteHistory = [
      ...globals.paletteHistory,
      historyRuntime.createHistoryEntry({
        colors,
        metadata: {
          isAlternative: metadata.isAlternative,
          pinnedIndexes,
        },
        settings: captureCurrentGeneratorSettings(),
      }),
    ];

    if (nextPaletteHistory.length > maxSessionPaletteHistoryEntries) {
      nextPaletteHistory = nextPaletteHistory.slice(-maxSessionPaletteHistoryEntries);
    }

    globals.paletteHistory = nextPaletteHistory;
    globals.paletteHistoryIndex = globals.paletteHistory.length - 1;
    runtimeWindow.syncPaletteGeneratorStoreHistoryState?.({
      scope: "history-save",
    });

    renderHistory();
    updateHistoryNavigationButtons();
  }

  function formatHistoryTime(dateValue: unknown) {
    return historyRuntime.formatHistoryTime(dateValue);
  }

  function renderHistory() {
    const historyEntries = Array.isArray(globals.paletteHistory) ? globals.paletteHistory : [];
    const fragment = document.createDocumentFragment();

    for (let historyIndex = historyEntries.length - 1; historyIndex >= 0; historyIndex -= 1) {
      const entry = historyEntries[historyIndex];
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
      time.textContent = createdAt ? formatHistoryTime(createdAt) : "--:--:--";

      titleGroup.appendChild(title);
      titleGroup.appendChild(time);

      const actions = document.createElement("div");
      actions.className = "history-actions";

      const editHistoryBtn = runtimeWindow.createCardActionButton?.(
        "edit",
        "Abrir en el generador"
      );
      const editHistoryIcon = editHistoryBtn?.querySelector(".action-icon");
      if (editHistoryIcon) {
        editHistoryIcon.src =
          runtimeWindow.AppAssetUrls?.icons?.magicWand || "assets/magic-wand.svg";
        editHistoryIcon.alt = "icono de abrir en el generador";
      }
      const copyHistoryBtn = runtimeWindow.createCardActionButton?.(
        "copy",
        constants.HISTORY_COPY_TOOLTIP_DEFAULT
      );
      let historyCopyFeedbackTimeout: number | null = null;

      editHistoryBtn?.addEventListener("click", (event: Event) => {
        event.stopPropagation();
        loadPaletteVersionInGenerator(entry, { historyIndex });
      });

      copyHistoryBtn?.addEventListener("click", async (event: Event) => {
        event.stopPropagation();

        const plainText = palette
          .map((hex: string) => `${normalizeHexColor(hex)} - ${runtimeWindow.getNearestColorName?.(hex)}`)
          .join("\n");

        try {
          await copyTextToClipboard(plainText);

          if (historyCopyFeedbackTimeout) {
            clearTimeout(historyCopyFeedbackTimeout);
          }

          historyCopyFeedbackTimeout = runtimeWindow.showButtonCopyFeedback?.(copyHistoryBtn, {
            defaultTooltipText: constants.HISTORY_COPY_TOOLTIP_DEFAULT,
          });
        } catch (error) {
          window.alert("No se han podido copiar los valores de la paleta.");
        }
      });

      if (editHistoryBtn) {
        actions.appendChild(editHistoryBtn);
      }
      if (copyHistoryBtn) {
        actions.appendChild(copyHistoryBtn);
      }

      header.appendChild(titleGroup);
      header.appendChild(actions);

      const row = document.createElement("div");
      row.className = "history-row";

      palette.forEach((color: string) => {
        const hex = normalizeHexColor(color);
        let historyColorCopyFeedbackTimeout: number | null = null;

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

            historyColorCopyFeedbackTimeout = runtimeWindow.showButtonCopyFeedback?.(box, {
              defaultTooltipText: "Copiar HEX",
            });
          } catch (error) {
            window.alert("No se pudo copiar este valor HEX.");
          }
        });

        row.appendChild(box);
      });

      historyItem.appendChild(header);
      historyItem.appendChild(row);
      fragment.appendChild(historyItem);
    }

    dom.historyContainer?.replaceChildren(fragment);

    updateHistoryNavigationButtons();
  }

  function loadPaletteVersionInGenerator(historyEntry: unknown, options: Record<string, any> = {}) {
    const resolvedHistoryEntry = historyRuntime.resolveHistoryEntryForLoad(historyEntry);
    if (!resolvedHistoryEntry) {
      return;
    }

    const { validColors, fallbackSize, settings, pinnedIndexes } = resolvedHistoryEntry;
    applyGeneratorSettings(settings, fallbackSize);

    runtimeWindow.getColorCards?.().forEach((card: Element) => card.remove());

    globals.currentPalette = [];

    validColors.forEach((color: string, index: number) => {
      runtimeWindow.createColorCard?.(color, {
        pinned: pinnedIndexes.includes(index),
        suppressUiRefresh: true,
      });
      globals.currentPalette.push(color);
    });

    runtimeWindow.capturePaletteAdjustmentBase?.(globals.currentPalette, {
      brightness: dom.brightnessInput
        ? Number(dom.brightnessInput.value)
        : constants.DEFAULT_BRIGHTNESS,
      saturation: dom.saturationInput
        ? Number(dom.saturationInput.value)
        : constants.DEFAULT_SATURATION,
    });
    runtimeWindow.syncCurrentPaletteFromDom?.();
    if (Number.isFinite(options.historyIndex)) {
      globals.paletteHistoryIndex = options.historyIndex;
    }
    runtimeWindow.syncPaletteGeneratorStoreHistoryState?.({
      scope: "history-load",
    });
    updateHistoryNavigationButtons();
    if (options.shouldScroll !== false) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function navigatePaletteHistory(direction: number) {
    if (!Array.isArray(globals.paletteHistory) || globals.paletteHistory.length === 0) {
      updateHistoryNavigationButtons();
      return;
    }

    const targetIndex = historyRuntime.getTargetHistoryIndex(
      direction,
      globals.paletteHistoryIndex,
      globals.paletteHistory.length
    );
    if (!Number.isFinite(targetIndex)) {
      updateHistoryNavigationButtons();
      return;
    }

    loadPaletteVersionInGenerator(globals.paletteHistory[targetIndex], {
      historyIndex: targetIndex,
      shouldScroll: false,
    });
  }

  runtimeWindow.captureCurrentGeneratorSettings = captureCurrentGeneratorSettings;
  runtimeWindow.updateHistoryNavigationButtons = updateHistoryNavigationButtons;
  runtimeWindow.saveHistory = saveHistory;
  runtimeWindow.formatHistoryTime = formatHistoryTime;
  runtimeWindow.renderHistory = renderHistory;
  runtimeWindow.loadPaletteVersionInGenerator = loadPaletteVersionInGenerator;
  runtimeWindow.navigatePaletteHistory = navigatePaletteHistory;

  if (dom.paletteUndoBtn) {
    dom.paletteUndoBtn.addEventListener("click", () => {
      navigatePaletteHistory(-1);
    });
  }

  if (dom.paletteRedoBtn) {
    dom.paletteRedoBtn.addEventListener("click", () => {
      navigatePaletteHistory(1);
    });
  }

  updateHistoryNavigationButtons();
  hasInitializedPaletteGeneratorHistory = true;
}

export default initializePaletteGeneratorHistory;
