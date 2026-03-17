// PALETTES HISTORY

function captureCurrentGeneratorSettings() {
  // Save current controls with colors
  return {
    paletteSize,
    baseMode: paletteBaseMode,
    temperature: {
      warm: !!temperature.warm,
      cool: !!temperature.cool,
    },
    brightness: brightnessInput ? Number(brightnessInput.value) : DEFAULT_BRIGHTNESS,
    saturation: saturationInput ? Number(saturationInput.value) : DEFAULT_SATURATION,
  };
}

function applyGeneratorSettings(settings, fallbackSize) {
  // Old history entries may miss settings
  const nextSize = Number.isFinite(settings?.paletteSize)
    ? settings.paletteSize
    : fallbackSize;
  setPaletteSize(nextSize);

  if (typeof setPaletteBaseMode === "function" && settings?.baseMode) {
    setPaletteBaseMode(settings.baseMode);
  }

  if (settings?.temperature) {
    setTemperatureSelection(settings.temperature);
  }

  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
    syncTemperatureControlsState();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    enforceLowBrightnessSaturationConstraint();
    updateSaturationProgress();
    syncTemperatureControlsState();
  }
}

function saveHistory(colors, metadata = {}) {
  // Save a copy so later edits do not change history
  paletteHistory.push({
    colors: [...colors],
    createdAt: new Date(),
    isAlternative: !!metadata.isAlternative,
    settings: captureCurrentGeneratorSettings(),
  });

  renderHistory();
}

function formatHistoryTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function renderHistory() {
  historyContainer.innerHTML = "";

  paletteHistory.forEach((entry, index) => {
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
      ? `Paleta Alternativa ${index + 1}`
      : `Paleta ${index + 1}`;

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
      editHistoryIcon.src = "assets/magic-wand.svg";
      editHistoryIcon.alt = "icono de abrir en el generador";
    }
    const copyHistoryBtn = createCardActionButton("copy", HISTORY_COPY_TOOLTIP_DEFAULT);
    let historyCopyFeedbackTimeout = null;

    editHistoryBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPaletteVersionInGenerator(entry);
    });

    copyHistoryBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      const plainText = palette
        .map((hex) => `${normalizeHexColor(hex)} - ${getNearestColorName(hex)}`)
        .join("\n");

      try {
        await copyTextToClipboard(plainText);

        const tooltip = copyHistoryBtn.querySelector(".tooltip");
        if (tooltip) {
          tooltip.textContent = "¡Copiado!";
          copyHistoryBtn.classList.add("show-feedback");

          if (historyCopyFeedbackTimeout) {
            clearTimeout(historyCopyFeedbackTimeout);
          }

          historyCopyFeedbackTimeout = setTimeout(() => {
            tooltip.textContent = HISTORY_COPY_TOOLTIP_DEFAULT;
            copyHistoryBtn.classList.remove("show-feedback");
            historyCopyFeedbackTimeout = null;
          }, 2000);
        }
      } catch (error) {
        alert("Could not copy palette values to clipboard.");
      }
    });

    actions.appendChild(editHistoryBtn);
    actions.appendChild(copyHistoryBtn);

    header.appendChild(titleGroup);
    header.appendChild(actions);

    let row = document.createElement("div");
    row.className = "history-row";

    palette.forEach((color) => {
      const hex = normalizeHexColor(color);
      let historyColorCopyFeedbackTimeout = null;

      let box = document.createElement("button");
      box.type = "button";
      box.className = "history-color";
      box.style.background = hex;
      box.setAttribute("aria-label", `Copy ${hex}`);

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = "Copiar HEX";
      box.appendChild(tooltip);

      box.addEventListener("click", async () => {
        try {
          await copyTextToClipboard(hex);

          tooltip.textContent = "¡Copiado!";
          box.classList.add("show-feedback");

          if (historyColorCopyFeedbackTimeout) {
            clearTimeout(historyColorCopyFeedbackTimeout);
          }

          historyColorCopyFeedbackTimeout = setTimeout(() => {
            tooltip.textContent = "Copiar HEX";
            box.classList.remove("show-feedback");
            historyColorCopyFeedbackTimeout = null;
          }, 2000);
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
}

function loadPaletteVersionInGenerator(historyEntry) {
  const colors = Array.isArray(historyEntry)
    ? historyEntry
    : historyEntry?.colors;

  if (!Array.isArray(colors)) {
    return;
  }

  // Normalize and keep only valid HEX colors
  const validColors = colors
    .map((color) => normalizeHexColor(color))
    .filter((hex) => isValidHexColor(hex));

  if (validColors.length === 0) {
    return;
  }

  const fallbackSize = validColors.length;
  const settings = Array.isArray(historyEntry)
    ? null
    : historyEntry?.settings;
  applyGeneratorSettings(settings, fallbackSize);

  getColorCards().forEach((card) => card.remove());

  currentPalette = [];

  validColors.forEach((color) => {
    createColorCard(color);
    currentPalette.push(color);
  });

  syncCurrentPaletteFromDom();
  // Scroll up so user can see the loaded palette
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
