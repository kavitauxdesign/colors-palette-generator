// Palette generator card naming and palette copy helpers.

function getNearestColorName(hex) {
  if (normalizeHexColor(hex) === "#FFFFFF") {
    return "Pure white";
  }

  const target = hexToRgb(hex);
  let closestName = "Unknown";
  let minDistance = Infinity;

  COLOR_NAME_REFERENCES_RGB.forEach((entry) => {
    const candidate = entry.rgb;
    const distance =
      (target.r - candidate.r) ** 2 +
      (target.g - candidate.g) ** 2 +
      (target.b - candidate.b) ** 2;

    if (distance < minDistance) {
      minDistance = distance;
      closestName = entry.name;
    }
  });

  return closestName;
}

function getRepetitionSuffixByIndex(index) {
  const REPETITION_SUFFIXES = ["Shade", "Tone", "Variant", "Tint", "Alt"];
  if (index < REPETITION_SUFFIXES.length) {
    return REPETITION_SUFFIXES[index];
  }

  return `Alt ${index - REPETITION_SUFFIXES.length + 2}`;
}

function getPaletteDisplayNames(hexValues) {
  const normalizedHexValues = hexValues.map((hex) => normalizeHexColor(hex));
  const baseNames = normalizedHexValues.map((hex) => getNearestColorName(hex));
  const displayNames = [...baseNames];
  const groups = new Map();

  baseNames.forEach((name, index) => {
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name).push({ index, hex: normalizedHexValues[index] });
  });

  groups.forEach((entries, baseName) => {
    if (entries.length <= 1) {
      return;
    }

    displayNames[entries[0].index] = baseName;

    for (let repetitionIndex = 1; repetitionIndex < entries.length; repetitionIndex++) {
      const suffix = getRepetitionSuffixByIndex(repetitionIndex - 1);
      displayNames[entries[repetitionIndex].index] = `${baseName} ${suffix}`;
    }
  });

  return displayNames;
}

function refreshColorCardNames() {
  const cards = Array.from(getColorCards());
  if (cards.length === 0) {
    return;
  }

  const hexValues = cards
    .map((card) => card.querySelector(".color-label")?.textContent?.trim() || "")
    .map((hex) => normalizeHexColor(hex))
    .filter((hex) => isValidHexColor(hex));

  if (hexValues.length !== cards.length) {
    return;
  }

  const displayNames = getPaletteDisplayNames(hexValues);

  cards.forEach((card, index) => {
    const colorName = card.querySelector(".color-name");
    if (!colorName) {
      return;
    }

    const hex = hexValues[index];
    const displayName = displayNames[index] || getNearestColorName(hex);
    colorName.textContent = displayName;
    applyAccessibleColorNameStyle(colorName, hex);
  });
}

function getCurrentPaletteHexValues() {
  return getCurrentPaletteCardEntries().map((entry) => entry.hex);
}

if (copyHexBtn) {
  copyHexBtn.addEventListener("click", async () => {
    const hexValues = getCurrentPaletteHexValues();

    if (hexValues.length === 0) {
      alert("No hay colores en la paleta actual.");
      return;
    }

    const paletteDisplayNames = getPaletteDisplayNames(hexValues);
    const plainText = hexValues
      .map((hex, index) => `${hex} - ${paletteDisplayNames[index]}`)
      .join("\n");

    try {
      await writeTextToClipboard(plainText);

      if (copyBtnFeedbackTimeout) {
        clearTimeout(copyBtnFeedbackTimeout);
      }

      copyBtnFeedbackTimeout = showButtonCopyFeedback(copyHexBtn, {
        defaultTooltipText: copyHexBtnDefaultTooltip,
      });
    } catch (error) {
      alert("No se han podido copiar los valores de la paleta.");
    }
  });
}

function isColorAlreadyInPalette(color, excludeCard = null) {
  const normalized = normalizeHexColor(color);
  const cards = getColorCards();

  return Array.from(cards).some((card) => {
    if (excludeCard && card === excludeCard) {
      return false;
    }

    const label = card.querySelector(".color-label");
    return label && label.textContent.trim().toUpperCase() === normalized;
  });
}
