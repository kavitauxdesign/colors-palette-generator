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

const SPECIAL_BADGE_COLOR_NAMES = new Set(
  Array.isArray(window.AppConstants?.SPECIAL_BADGE_COLOR_NAMES)
    ? window.AppConstants.SPECIAL_BADGE_COLOR_NAMES
    : []
);

const SPECIAL_COSMIC_HEX_POOL = [...new Set(
  COLOR_NAME_REFERENCES
    .filter((entry) => SPECIAL_BADGE_COLOR_NAMES.has(String(entry.name || "").toUpperCase()))
    .map((entry) => normalizeHexColor(entry.hex))
    .filter((hex) => isValidHexColor(hex))
    .filter((hex) => !isDisallowedColor(hex))
)];

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

function createSpecialColorBadge() {
  const badge = document.createElement("div");
  badge.className = "color-special-badge";
  badge.setAttribute("aria-hidden", "true");
  badge.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(45deg);">
      <path d="M12 3C12 3 13.5 4 14.5 8C15 10 15 14 14.5 16C13.5 17.5 12.5 18 12 18C11.5 18 10.5 17.5 9.5 16C9 14 9 10 9.5 8C10.5 4 12 3 12 3Z" fill="white" stroke="white" stroke-width="0.5"></path>
      <ellipse cx="12" cy="5" rx="2" ry="2.5" fill="white" opacity="0.9"></ellipse>
      <path d="M9.5 14C9.5 14 8 15 7 17.5C7 17.5 8.5 16.5 9.5 16L9.5 14Z" fill="white" stroke="white" stroke-width="0.5"></path>
      <path d="M14.5 14C14.5 14 16 15 17 17.5C17 17.5 15.5 16.5 14.5 16L14.5 14Z" fill="white" stroke="white" stroke-width="0.5"></path>
      <ellipse cx="12" cy="10" rx="1.2" ry="1.5" fill="rgba(0,0,0,0.3)"></ellipse>
      <path d="M10.5 18C10.5 18 11 20 12 21C13 20 13.5 18 13.5 18Z" fill="white" opacity="0.6"></path>
      <circle cx="5" cy="5" r="1.2" fill="yellow"></circle>
      <circle cx="19" cy="6" r="1.2" fill="yellow"></circle>
      <circle cx="18" cy="19" r="1.2" fill="yellow"></circle>
    </svg>
    <div class="tooltip">Special cosmic color</div>
  `;

  return badge;
}

function getBaseDisplayColorName(displayName) {
  let baseName = String(displayName ?? "").trim();
  const suffixPattern = /\s+(Shade|Tone|Variant|Tint|Alt(?:\s+\d+)?)$/i;

  while (suffixPattern.test(baseName)) {
    baseName = baseName.replace(suffixPattern, "").trim();
  }

  return baseName;
}

function shouldShowSpecialColorBadge(displayName) {
  const baseName = getBaseDisplayColorName(displayName).toUpperCase();
  return SPECIAL_BADGE_COLOR_NAMES.has(baseName);
}

function isSpecialCosmicColorHex(hex) {
  const nearestName = String(getNearestColorName(hex) || "").toUpperCase();
  return SPECIAL_BADGE_COLOR_NAMES.has(nearestName);
}

function isHexMatchingTemperature(hex) {
  const { h } = hexToHsl(hex);
  const warmSelected = !!temperature?.warm;
  const coolSelected = !!temperature?.cool;

  // Keep same hue buckets used by generateColor().
  const isWarmHue = h < 60 || h >= 300;
  const isCoolHue = h >= 120 && h < 300;

  if (warmSelected && !coolSelected) {
    return isWarmHue;
  }

  if (!warmSelected && coolSelected) {
    return isCoolHue;
  }

  // Both selected (or unexpected fallback): accept all.
  return true;
}

function getTargetLightnessFromControls() {
  if (!brightnessInput) {
    return 50;
  }

  const sliderValue = parseFloat(brightnessInput.value);
  const safeSliderValue = Number.isFinite(sliderValue) ? sliderValue : 50;
  return 20 + (safeSliderValue / 100) * 60;
}

function getSpecialColorControlScore(hex) {
  const profile = hexToHsl(hex);
  const temperaturePenalty = isHexMatchingTemperature(hex) ? 0 : 100;
  const targetLightness = getTargetLightnessFromControls();
  const lightnessPenalty = Math.abs(profile.l - targetLightness);
  return temperaturePenalty + lightnessPenalty;
}

function getUniqueSpecialColor(existingColors = new Set()) {
  if (SPECIAL_COSMIC_HEX_POOL.length === 0) {
    return null;
  }

  const candidates = [...SPECIAL_COSMIC_HEX_POOL]
    .map((hex) => ({
      hex,
      score: getSpecialColorControlScore(hex),
      randomTiebreaker: Math.random(),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.randomTiebreaker - b.randomTiebreaker;
    })
    .map((entry) => entry.hex);

  // First pass: match controls and keep spacing similar to regular generation.
  for (const candidate of candidates) {
    if (existingColors.has(candidate)) {
      continue;
    }
    if (isColorTooCloseToExisting(candidate, existingColors, 0)) {
      continue;
    }
    return candidate;
  }

  // Second pass: guarantee one special color even if spacing is tight.
  for (const candidate of candidates) {
    if (!existingColors.has(candidate)) {
      return candidate;
    }
  }

  return null;
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
      "Negro, ausencia de color es. \uD83C\uDF0C\n" +
      "Demasiado oscuro, esta oscuridad es. Paz, Yoda prefiere. \u2696\uFE0F\n" +
      "Otro color elegir, debes."
    );
  }

  if (normalized === "#FFFFFF") {
    return (
      "Blanco, todos los colores juntos es. \uD83C\uDF08\n" +
      "Demasiado brillante, esta luminosidad es.\n" +
      "Otro color, elegir debes. Para el equilibrio en la paleta, confía."
    );
  }

  return "Este color permitido no está.";
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
    "Regenerar color",
  );
  const editBtn = createCardActionButton("edit", "Editar color");
  const copyBtn = createCardActionButton("copy", CARD_COPY_TOOLTIP_DEFAULT);
  const deleteBtn = createCardActionButton("delete", "Eliminar color");

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
      alert("Un color único encontrar no pude. De nuevo intentar, debes.");
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
        alert("El selector de color, no pude abrir. De nuevo intentar, prueba.");
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
        copyTooltip.textContent = "Copied!";
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
      alert("Valor este de color no pude copiar.");
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
    alert("Hmm… en la paleta ya está este color.\uD83C\uDFA8" + 
      "Un duplicado, no podemos tener. Armonía en los colores, debemos mantener.\u2728");
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

  const specialBadge = createSpecialColorBadge();

  const label = document.createElement("div");
  label.className = "color-label";

  attachCardActions(card);
  card.appendChild(colorName);
  card.appendChild(specialBadge);
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

    const specialBadge = card.querySelector(".color-special-badge");
    if (specialBadge) {
      specialBadge.classList.toggle("is-visible", shouldShowSpecialColorBadge(displayName));
    }
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
      alert("En la paleta actual, colores no hay.");
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
        copyHexBtnLabel.textContent = "Copied!";
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
      alert("Al portapapeles, los valores de la paleta copiar no pude.");
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
      alert("Un color único encontrar no pude. De nuevo intentar, debes.");
      return;
    }
    createColorCard(color);
    syncCurrentPaletteFromDom();
    saveHistory(currentPalette);
  });
}

