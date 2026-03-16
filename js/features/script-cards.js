// CREATE COLOR CARD

const colorUtilsForCards = window.AppColorUtils || {};

const normalizeHexColor =
  typeof colorUtilsForCards.normalizeHexColor === "function"
    ? colorUtilsForCards.normalizeHexColor
    : (color) => String(color ?? "").trim().toUpperCase();

const isValidHexColor =
  typeof colorUtilsForCards.isValidHexColor === "function"
    ? colorUtilsForCards.isValidHexColor
    : (hex) => /^#[0-9A-F]{6}$/.test(String(hex ?? "").trim().toUpperCase());

const hexToRgb =
  typeof colorUtilsForCards.hexToRgb === "function"
    ? colorUtilsForCards.hexToRgb
    : (hex) => {
      const normalized = String(hex ?? "").trim().toUpperCase().replace("#", "");
      const value =
        normalized.length === 3
          ? normalized
              .split("")
              .map((char) => char + char)
              .join("")
          : normalized;

      return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
      };
    };

const hexToHsl =
  typeof colorUtilsForCards.hexToHsl === "function"
    ? colorUtilsForCards.hexToHsl
    : (hex) => {
      const rgb = hexToRgb(hex);
      const rNorm = rgb.r / 255;
      const gNorm = rgb.g / 255;
      const bNorm = rgb.b / 255;
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      const delta = max - min;

      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        if (max === rNorm) {
          h = 60 * (((gNorm - bNorm) / delta) % 6);
        } else if (max === gNorm) {
          h = 60 * ((bNorm - rNorm) / delta + 2);
        } else {
          h = 60 * ((rNorm - gNorm) / delta + 4);
        }
      }

      if (h < 0) {
        h += 360;
      }

      return {
        h,
        s: s * 100,
        l: l * 100,
      };
    };

// ===============================
// Core Card Flow
// ===============================

function syncCurrentPaletteFromDom() {
  // Read colors from cards and sync app state
  currentPalette = getCurrentPaletteHexValues();
  refreshColorCardNames();
}

// Get all current palette colors from the DOM
function getColorCards() {
  return paletteContainer.querySelectorAll(".color-card");
}

// Apply color style and label text to one card
function setCardColor(card, color) {
  const normalizedColor = normalizeHexColor(color);
  card.style.background = normalizedColor;

  const colorName = card.querySelector(".color-name");
  if (colorName) {
    applyAccessibleColorNameStyle(colorName, normalizedColor);
  }

  const label = card.querySelector(".color-label");
  if (label) {
    label.textContent = normalizedColor;
  }
}

// ===============================
// Internal Helpers
// ===============================
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function srgbChannelToLinear(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminanceFromHex(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rLin = srgbChannelToLinear(r);
  const gLin = srgbChannelToLinear(g);
  const bLin = srgbChannelToLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function getContrastRatio(hexA, hexB) {
  const luminanceA = getRelativeLuminanceFromHex(hexA);
  const luminanceB = getRelativeLuminanceFromHex(hexB);
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendHexColors(baseHex, mixHex, mixAmount) {
  const amount = clamp(mixAmount, 0, 1);
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);

  const r = Math.round(base.r + (mix.r - base.r) * amount);
  const g = Math.round(base.g + (mix.g - base.g) * amount);
  const b = Math.round(base.b + (mix.b - base.b) * amount);

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function getAccessibleColorNameStyle(backgroundHex) {
  const normalized = normalizeHexColor(backgroundHex);
  const bgLuminance = getRelativeLuminanceFromHex(normalized);
  const needsLighterText = bgLuminance < 0.42;
  const contrastTarget = 3.2;
  const contrastFallbackTarget = 2.8;
  const extremeColor = needsLighterText ? "#FFFFFF" : "#000000";
  let mixAmount = 0.34;
  let candidate = blendHexColors(normalized, extremeColor, mixAmount);
  let contrast = getContrastRatio(candidate, normalized);

  while (contrast < contrastTarget && mixAmount < 0.92) {
    mixAmount += 0.06;
    candidate = blendHexColors(normalized, extremeColor, mixAmount);
    contrast = getContrastRatio(candidate, normalized);
  }

  // Corner case fallback when near-color blends still cannot reach enough contrast.
  if (contrast < contrastFallbackTarget) {
    candidate = extremeColor;
    contrast = getContrastRatio(candidate, normalized);
  }

  const shadowColor = needsLighterText
    ? "rgba(0, 0, 0, 0.42)"
    : "rgba(255, 255, 255, 0.45)";

  const opacity = contrast >= 4.5
    ? 0.8
    : contrast >= contrastTarget
      ? 0.88
      : 0.95;

  return {
    textColor: candidate,
    textShadow: `0 1px 1px ${shadowColor}, 0 0 1px ${shadowColor}`,
    opacity,
  };
}

function applyAccessibleColorNameStyle(colorNameElement, backgroundHex) {
  const style = getAccessibleColorNameStyle(backgroundHex);
  colorNameElement.style.color = style.textColor;
  colorNameElement.style.opacity = String(style.opacity);
  colorNameElement.style.textShadow = style.textShadow;
  colorNameElement.style.filter = "none";
}
// Choose black or white text for tooltip readability
function getReadableTooltipTextColor(backgroundHex) {
  const { r, g, b } = hexToRgb(backgroundHex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? "#000000" : "#FFFFFF";
}

// Messages for blocked colors
function getDisallowedColorAlertMessage(color) {
  const normalized = normalizeHexColor(color);

  if (normalized === "#000000") {
    return (
      "Black, technically the absence of color it is. \uD83C\uDF0C\n" +
      "Too dark, this darkness is. Peace, Yoda prefers. \u2696\uFE0F\n" +
      "Please choose another color."
    );
  }

  if (normalized === "#FFFFFF") {
    return (
      "White, all colors together it is. \uD83C\uDF08 Too bright, this brightness is.\n" +
      "Another color, choose you must. For balance in the palette, trust."
    );
  }

  return "Not allowed in the palette, this color is.";
}
// Block pure black and pure white
function isDisallowedColor(color) {
  return DISALLOWED_COLORS.has(normalizeHexColor(color));
}

function getAdaptiveMinColorDistance(existingCount, attempt) {
  // Start with moderate diversity and relax faster on later attempts
  const targetCount = Math.max(paletteSize, existingCount + 1);
  let baseDistance = 46;

  if (targetCount <= 3) {
    baseDistance = 72;
  } else if (targetCount <= 6) {
    baseDistance = 58;
  }

  const relaxedDistance = baseDistance - Math.floor(attempt * 0.7);
  return Math.max(10, relaxedDistance);
}

function getRgbDistance(colorA, colorB) {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function isColorTooCloseToExisting(candidateHex, existingColors, attempt) {
  if (existingColors.size === 0) {
    return false;
  }

  const minDistance = getAdaptiveMinColorDistance(existingColors.size, attempt);
  const candidateRgb = hexToRgb(candidateHex);

  for (const existingHex of existingColors) {
    const existingRgb = hexToRgb(existingHex);
    if (getRgbDistance(candidateRgb, existingRgb) < minDistance) {
      return true;
    }
  }

  return false;
}

// Try to generate one unique allowed color
function getUniqueGeneratedColor(existingColors = new Set()) {
  for (let attempt = 0; attempt < MAX_UNIQUE_COLOR_ATTEMPTS; attempt++) {
    const candidate = normalizeHexColor(generateColor());

    if (isDisallowedColor(candidate)) {
      continue;
    }

    if (existingColors.has(candidate)) {
      continue;
    }

    if (isColorTooCloseToExisting(candidate, existingColors, attempt)) {
      continue;
    }

    return candidate;
  }

  return null;
}
// Place hidden picker near the edit button
function positionEditPickerAtButton(editButton, editInput) {
  const rect = editButton.getBoundingClientRect();
  const anchorX = Math.min(Math.max(rect.left + rect.width / 2, 50), window.innerWidth - 50);
  const anchorY = Math.max(8, rect.top - 8);

  editInput.style.position = "fixed";
  editInput.style.left = `${Math.round(anchorX)}px`;
  editInput.style.top = `${Math.round(anchorY)}px`;
}
function openNativeColorPicker(inputEl) {
  try {
    // Try click first in browsers that position picker better with click
    if (typeof inputEl.click === "function") {
      inputEl.click();
    } else if (typeof inputEl.showPicker === "function") {
      inputEl.showPicker();
    }
    return true;
  } catch (error) {
    try {
      if (typeof inputEl.showPicker === "function") {
        inputEl.showPicker();
        return true;
      }
    } catch (innerError) {
      // Ignore second error and report failure
    }
    return false;
  }
}
// Build one action button used by cards and history rows
function createCardActionButton(actionName, tooltipText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `color-action-btn action-${actionName}`;
  button.setAttribute("aria-label", actionName);

  const actionIconSrcMap = {
    regenerate: "assets/regenerate.svg",
    edit: "assets/edit.svg",
    copy: "assets/copy.svg",
    delete: "assets/delete.svg",
  };

  const icon = document.createElement("img");
  icon.className = "action-icon";
  icon.src = actionIconSrcMap[actionName] || "assets/edit.svg";
  icon.alt = `${actionName} icon placeholder`;
  button.appendChild(icon);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;
  button.appendChild(tooltip);

  return button;
}
// Show delete only when more than 3 cards exist
function refreshDeleteButtonsVisibility() {
  const cards = getColorCards();
  const canDelete = cards.length > 3;

  cards.forEach((card) => {
    const deleteBtn = card.querySelector(".action-delete");
    if (!deleteBtn) {
      return;
    }
    deleteBtn.classList.toggle("is-hidden", !canDelete);
  });
}
// Enable or disable add button by card limit
function updateAddColorButtonState() {
  if (!addColorBtn || !addColorLabel) {
    return;
  }

  const totalCards = getColorCards().length;
  const isAtMax = totalCards >= MAX_PALETTE_COLORS;

  addColorBtn.classList.toggle("is-disabled", isAtMax);
  addColorBtn.setAttribute("aria-disabled", String(isAtMax));
  addColorLabel.textContent = isAtMax ? ADD_DISABLED_LABEL : addColorDefaultLabel;
}

function attachCardActions(card) {
  // Create all action buttons for this card
  const actions = document.createElement("div");
  actions.className = "color-actions";

  const regenerateBtn = createCardActionButton(
    "regenerate",
    "Regenerate color",
  );
  const editBtn = createCardActionButton("edit", "Edit color");
  const copyBtn = createCardActionButton("copy", CARD_COPY_TOOLTIP_DEFAULT);
  const deleteBtn = createCardActionButton("delete", "Delete color");

  let cardCopyFeedbackTimeout = null;
  // Regenerate this card while keeping colors unique
  regenerateBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    const currentHex = normalizeHexColor(
      card.querySelector(".color-label")?.textContent?.trim() || "#000000",
    );
    // Exclude current card color because it will be replaced
    const existingColors = new Set(getCurrentPaletteHexValues());
    existingColors.delete(currentHex);

    const newColor = getUniqueGeneratedColor(existingColors);
    if (!newColor) {
      alert("Could not find a unique color. Please try again.");
      return;
    }

    setCardColor(card, newColor);
    syncCurrentPaletteFromDom();
    saveHistory(currentPalette);
  });

  editBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const currentHex = normalizeHexColor(
      card.querySelector(".color-label")?.textContent?.trim() || "#000000",
    );
    activeEditCard = card;
    activeEditOriginalColor = currentHex;
    globalEditPicker.value = currentHex;
    positionEditPickerAtButton(editBtn, globalEditPicker);

    // Wait one frame so fixed position is applied before opening picker
    requestAnimationFrame(() => {
      if (!openNativeColorPicker(globalEditPicker)) {
        alert("Could not open color picker. Please try again.");
      }
    });
  });

  copyBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const hex = card
      .querySelector(".color-label")
      ?.textContent?.trim()
      .toUpperCase();
    if (!hex || !isValidHexColor(hex)) {
      return;
    }

    const text = hex;
    try {
      await copyTextToClipboard(text);

      const copyTooltip = copyBtn.querySelector(".tooltip");
      if (copyTooltip) {
        const feedbackBg = normalizeHexColor(hex);
        const feedbackTextColor = getReadableTooltipTextColor(feedbackBg);

        copyTooltip.style.setProperty("--tooltip-feedback-bg", feedbackBg);
        copyTooltip.style.setProperty(
          "--tooltip-feedback-fg",
          feedbackTextColor,
        );
        copyTooltip.textContent = "¡Copiado!";
        copyTooltip.classList.add("is-copied-feedback");
        copyBtn.classList.add("show-feedback");

        if (cardCopyFeedbackTimeout) {
          clearTimeout(cardCopyFeedbackTimeout);
        }

        cardCopyFeedbackTimeout = setTimeout(() => {
          copyTooltip.textContent = CARD_COPY_TOOLTIP_DEFAULT;
          copyTooltip.classList.remove("is-copied-feedback");
          copyBtn.classList.remove("show-feedback");
          copyTooltip.style.removeProperty("--tooltip-feedback-bg");
          copyTooltip.style.removeProperty("--tooltip-feedback-fg");
          cardCopyFeedbackTimeout = null;
        }, 2000);
      }
    } catch (error) {
      alert("Could not copy this color value.");
    }
  });

  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const totalCards = getColorCards().length;
    if (totalCards <= 3) {
      return;
    }

    card.remove();
    refreshDeleteButtonsVisibility();
    syncCurrentPaletteFromDom();
    saveHistory(currentPalette);
  });

  actions.appendChild(regenerateBtn);
  actions.appendChild(editBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(actions);
}
// Live update card color while picker is open
globalEditPicker.addEventListener("input", () => {
  if (!activeEditCard) {
    return;
  }

  const candidate = normalizeHexColor(globalEditPicker.value);
  if (isDisallowedColor(candidate) || isColorAlreadyInPalette(candidate, activeEditCard)) {
    return;
  }

  setCardColor(activeEditCard, candidate);
  syncCurrentPaletteFromDom();
});

globalEditPicker.addEventListener("change", () => {
  if (!activeEditCard) {
    return;
  }

  // Save final color and history only if color changed
  const candidate = normalizeHexColor(globalEditPicker.value);
  const previousColor = activeEditOriginalColor;

  if (isDisallowedColor(candidate)) {
    alert(getDisallowedColorAlertMessage(candidate));
    setCardColor(activeEditCard, activeEditOriginalColor);
    syncCurrentPaletteFromDom();
    return;
  }

  if (isColorAlreadyInPalette(candidate, activeEditCard)) {
    alert("Hmm... already in the palette, this color is.\uD83C\uDFA8" + 
      "A duplicate, we cannot have. Harmony in colors, we must keep.\u2728");
    setCardColor(activeEditCard, activeEditOriginalColor);
    syncCurrentPaletteFromDom();
    return;
  }

  setCardColor(activeEditCard, candidate);
  activeEditOriginalColor = candidate;
  syncCurrentPaletteFromDom();

  if (candidate !== previousColor) {
    saveHistory(currentPalette);
  }
});

globalEditPicker.addEventListener("blur", () => {
  activeEditCard = null;
});
// Close edit mode when user clicks outside cards
function closeAllCardEditors(exceptCard = null) {
  paletteContainer
    .querySelectorAll(".color-card.is-editing")
    .forEach((card) => {
      if (card !== exceptCard) {
        card.classList.remove("is-editing");
      }
    });
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".color-card")) {
    return;
  }

  closeAllCardEditors();
});

function createColorCard(color) {
  // Build one card and insert it before add button
  const card = document.createElement("div");
  card.className = "color-card";

  const colorName = document.createElement("div");
  colorName.className = "color-name";

  const label = document.createElement("div");
  label.className = "color-label";

  attachCardActions(card);
  card.appendChild(colorName);
  card.appendChild(label);
  setCardColor(card, color);

  if (addColorElement) {
    paletteContainer.insertBefore(card, addColorElement);
  } else {
    paletteContainer.appendChild(card);
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();
}

// COPY CURRENT PALETTE

function getNearestColorName(hex) {
  // Find nearest named color by RGB distance
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

  // Keep predictable labels if repetitions exceed the predefined list.
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

    // Keep the first occurrence unchanged, then append fixed repetition labels.
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
  return Array.from(
    paletteContainer.querySelectorAll(".color-card .color-label"),
  )
    .map((label) => label.textContent.trim().toUpperCase())
    .filter((hex) => isValidHexColor(hex));
}

async function copyTextToClipboard(text) {
  const value = String(text ?? "");

  // Try modern clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      // If blocked, continue with fallback
    }
  }

  // Fallback for older browsers or blocked clipboard API
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const didCopy = document.execCommand("copy");
  textArea.remove();

  if (!didCopy) {
    throw new Error("Clipboard copy failed");
  }
}

if (copyHexBtn) {
  copyHexBtn.onclick = async () => {
    const hexValues = getCurrentPaletteHexValues();

    if (hexValues.length === 0) {
      alert("No colors found in the current palette.");
      return;
    }
    const paletteDisplayNames = getPaletteDisplayNames(hexValues);

    // Copy each HEX together with current display name.
    const plainText = hexValues
      .map((hex, index) => `${hex} - ${paletteDisplayNames[index]}`)
      .join("\n");

    try {
      await copyTextToClipboard(plainText);

      if (copyHexBtnLabel) {
        copyHexBtnLabel.textContent = "¡Copiado!";
      }

      copyHexBtn.classList.add("is-copied");

      if (copyBtnFeedbackTimeout) {
        clearTimeout(copyBtnFeedbackTimeout);
      }

      copyBtnFeedbackTimeout = setTimeout(() => {
        if (copyHexBtnLabel) {
          copyHexBtnLabel.textContent = copyHexBtnDefaultLabel;
        }

        copyHexBtn.classList.remove("is-copied");
        copyBtnFeedbackTimeout = null;
      }, 2000);
    } catch (error) {
      alert("Could not copy palette values to clipboard.");
    }
  };
}

// ADD COLOR

function isColorAlreadyInPalette(color, excludeCard = null) {
  // Ignore the edited card while checking duplicates
  const normalized = normalizeHexColor(color);
  const cards = getColorCards();
  // Return true if same color already exists
  return Array.from(cards).some((card) => {
    if (excludeCard && card === excludeCard) {
      return false;
    }

    const label = card.querySelector(".color-label");
    return label && label.textContent.trim().toUpperCase() === normalized;
  });
}
// Add a new unique color card when add button is enabled
if (addColorBtn) {
  addColorBtn.addEventListener("click", (event) => {
    event.preventDefault();

    updateAddColorButtonState();
    if (addColorBtn.classList.contains("is-disabled")) {
      return;
    }
    // Keep uniqueness against current palette colors
    const existingColors = new Set(getCurrentPaletteHexValues());
    const color = getUniqueGeneratedColor(existingColors);

    if (!color) {
      alert("Could not find a unique color. Please try again.");
      return;
    }
    createColorCard(color);
    syncCurrentPaletteFromDom();
    saveHistory(currentPalette);
  });
}
