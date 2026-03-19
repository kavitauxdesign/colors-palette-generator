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

const COPY_FEEDBACK_TEXT = "¡Copiado!";
const COPY_FEEDBACK_DURATION_MS = 2000;

// ===============================
// Core Card Flow
// ===============================

function syncCurrentPaletteFromDom() {
  // Read colors from cards and sync app state
  currentPalette = getCurrentPaletteHexValues();
  refreshColorCardNames();
  updateRegenerateButtonsAvailability();
  updateAddColorButtonState();
}

// Get all current palette colors from the DOM
function getColorCards() {
  return paletteContainer.querySelectorAll(".color-card");
}

function isCardPinned(card) {
  return card?.dataset.pinned === "true";
}

function getCurrentPaletteCardEntries() {
  return Array.from(getColorCards())
    .map((card, index) => {
      const hex = normalizeHexColor(
        card.querySelector(".color-label")?.textContent?.trim() || "",
      );

      return {
        card,
        index,
        hex,
        pinned: isCardPinned(card),
        regenerateLocked: card.dataset.regenerateLocked === "true",
      };
    })
    .filter((entry) => isValidHexColor(entry.hex));
}

function getPinnedPaletteIndexes() {
  return getCurrentPaletteCardEntries()
    .filter((entry) => entry.pinned)
    .map((entry) => entry.index);
}

// Apply color style and label text to one card
function setCardColor(card, color) {
  const normalizedColor = normalizeHexColor(color);
  card.style.background = normalizedColor;
  card.dataset.regenerateLocked = "false";

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
  const actionAriaLabelMap = {
    regenerate: "Regenerar color",
    edit: "Editar color",
    copy: "Copiar color",
    delete: "Eliminar color",
  };
  const actionIconAltMap = {
    regenerate: "icono de regenerar color",
    edit: "icono de editar color",
    copy: "icono de copiar color",
    delete: "icono de eliminar color",
  };
  button.setAttribute("aria-label", actionAriaLabelMap[actionName] || actionName);

  const actionIconSrcMap = {
    regenerate: "assets/regenerate.svg",
    edit: "assets/edit.svg",
    copy: "assets/copy.svg",
    delete: "assets/delete.svg",
  };

  const icon = document.createElement("img");
  icon.className = "action-icon";
  icon.src = actionIconSrcMap[actionName] || "assets/edit.svg";
  icon.alt = actionIconAltMap[actionName] || `icono de ${actionName}`;
  button.appendChild(icon);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;
  button.appendChild(tooltip);

  return button;
}

function getPinButtonIconMarkup(isPinned) {
  if (isPinned) {
    return `
      <svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z"/>
      </svg>
    `;
  }

  return `
    <svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.4746 4.3747L19.6474 7.55072C20.6549 8.55917 21.4713 9.37641 21.9969 10.0856C22.5382 10.8161 22.8881 11.5853 22.6982 12.4634C22.5083 13.3415 21.8718 13.8972 21.0771 14.3383C20.3055 14.7665 19.2245 15.1727 17.8906 15.6738L15.9136 16.4166C15.1192 16.7151 14.9028 16.8081 14.742 16.9474C14.6611 17.0174 14.5887 17.0967 14.5263 17.1837C14.4021 17.3568 14.329 17.5812 14.1037 18.4L14.0914 18.4449C13.8627 19.2762 13.6739 19.9623 13.4671 20.4774C13.2573 21.0003 12.974 21.4955 12.465 21.786C12.1114 21.9878 11.7112 22.0936 11.3041 22.093C10.7179 22.0921 10.227 21.8014 9.78647 21.4506C9.35243 21.1049 8.8497 20.6016 8.24065 19.9919L6.65338 18.403L2.5306 22.53C2.23786 22.823 1.76298 22.8233 1.46994 22.5305C1.1769 22.2378 1.17666 21.7629 1.4694 21.4699L5.59326 17.3418L4.05842 15.8054C3.45318 15.1996 2.9536 14.6995 2.61002 14.2678C2.26127 13.8297 1.97215 13.3421 1.96848 12.7599C1.96586 12.3451 2.07354 11.9371 2.28053 11.5777C2.57116 11.0731 3.06341 10.7919 3.58296 10.5834C4.09477 10.3779 4.77597 10.1901 5.60112 9.96265L5.6457 9.95036C6.46601 9.7242 6.69053 9.65088 6.86346 9.52638C6.9526 9.4622 7.0337 9.38748 7.10499 9.30383C7.24338 9.14144 7.33502 8.92324 7.62798 8.12367L8.34447 6.16811C8.83874 4.819 9.23907 3.72629 9.66362 2.9461C10.1005 2.14324 10.654 1.49811 11.5357 1.30359C12.4175 1.10904 13.1908 1.46156 13.9246 2.0063C14.6375 2.53559 15.4597 3.35863 16.4746 4.3747ZM13.0304 3.21067C12.4277 2.76322 12.1086 2.71327 11.8588 2.76836C11.609 2.82349 11.3402 3.0033 10.9812 3.66306C10.6161 4.33394 10.2525 5.32066 9.73087 6.7443L9.03642 8.63971C9.02304 8.67621 9.00987 8.71226 8.99686 8.74786C8.76267 9.3886 8.58179 9.88351 8.24665 10.2768C8.09712 10.4522 7.92696 10.609 7.73987 10.7437C7.3205 11.0456 6.81257 11.1852 6.15537 11.3659C6.11884 11.3759 6.08184 11.3861 6.04438 11.3964C5.16337 11.6393 4.56523 11.8054 4.1418 11.9754C3.71693 12.146 3.615 12.2662 3.58038 12.3263C3.50616 12.4552 3.46751 12.6015 3.46845 12.7504C3.46889 12.8201 3.49835 12.9752 3.78366 13.3337C4.06799 13.6909 4.50615 14.1312 5.15229 14.778L9.26897 18.8989C9.91923 19.5498 10.3618 19.9912 10.721 20.2772C11.0814 20.5643 11.2369 20.5929 11.3064 20.593C11.4519 20.5933 11.595 20.5554 11.7215 20.4832C11.7821 20.4486 11.9033 20.3466 12.0751 19.9187C12.2462 19.4923 12.4133 18.8896 12.6574 18.0021C12.6677 17.9648 12.6778 17.9279 12.6878 17.8914C12.8678 17.2352 13.0069 16.7283 13.3075 16.3093C13.4384 16.1268 13.5903 15.9604 13.76 15.8134C14.15 15.4758 14.642 15.2914 15.2786 15.0527C15.314 15.0395 15.3498 15.0261 15.386 15.0124L17.3032 14.2921C18.7112 13.7631 19.6865 13.3946 20.3491 13.0268C21.0001 12.6655 21.178 12.3967 21.2321 12.1463C21.2863 11.8958 21.2353 11.5773 20.7917 10.9787C20.3403 10.3695 19.6045 9.63013 18.541 8.5656L15.4588 5.48018C14.3876 4.40792 13.6433 3.66571 13.0304 3.21067Z"/>
    </svg>
  `;
}

function createCardPinButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "color-pin-btn";
  button.setAttribute("aria-label", "Fijar color");

  const iconWrap = document.createElement("span");
  iconWrap.className = "pin-icon-wrap";
  button.appendChild(iconWrap);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = "Fijar color";
  button.appendChild(tooltip);

  return button;
}

function setActionButtonTooltipText(button, tooltipText) {
  const tooltip = button?.querySelector(".tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = tooltipText;
}

function showButtonCopyFeedback(
  button,
  {
    defaultTooltipText,
    feedbackBg = null,
    feedbackTextColor = null,
    durationMs = COPY_FEEDBACK_DURATION_MS,
  } = {}
) {
  const tooltip = button?.querySelector(".tooltip");
  if (!button || !tooltip) {
    return null;
  }

  if (feedbackBg) {
    tooltip.style.setProperty("--tooltip-feedback-bg", feedbackBg);
  }
  if (feedbackTextColor) {
    tooltip.style.setProperty("--tooltip-feedback-fg", feedbackTextColor);
  }

  tooltip.textContent = COPY_FEEDBACK_TEXT;
  tooltip.classList.add("is-copied-feedback");
  button.classList.add("show-feedback");

  return window.setTimeout(() => {
    tooltip.textContent = defaultTooltipText ?? CARD_COPY_TOOLTIP_DEFAULT;
    tooltip.classList.remove("is-copied-feedback");
    button.classList.remove("show-feedback");
    tooltip.style.removeProperty("--tooltip-feedback-bg");
    tooltip.style.removeProperty("--tooltip-feedback-fg");
  }, durationMs);
}

function persistCurrentPaletteSnapshot(saveHistoryEntry = true) {
  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);

  if (saveHistoryEntry) {
    saveHistory(currentPalette);
  }
}

function updateCardPinButtonState(card) {
  const pinBtn = card?.querySelector(".color-pin-btn");
  if (!pinBtn) {
    return;
  }

  const isPinned = isCardPinned(card);
  const nextTooltip = isPinned ? "Desfijar color" : "Fijar color";
  const iconWrap = pinBtn.querySelector(".pin-icon-wrap");

  pinBtn.classList.toggle("is-pinned", isPinned);
  pinBtn.setAttribute("aria-label", nextTooltip);
  pinBtn.setAttribute("aria-pressed", isPinned ? "true" : "false");
  setActionButtonTooltipText(pinBtn, nextTooltip);

  if (iconWrap) {
    iconWrap.innerHTML = getPinButtonIconMarkup(isPinned);
  }
}

function setCardPinnedState(card, isPinned) {
  if (!card) {
    return;
  }

  card.dataset.pinned = isPinned ? "true" : "false";
  card.classList.toggle("is-pinned", !!isPinned);
  updateCardPinButtonState(card);
}

function setRegenerateButtonAvailability(button, isAvailable, tooltipText = null) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-disabled", !isAvailable);
  button.setAttribute("aria-disabled", isAvailable ? "false" : "true");
  setActionButtonTooltipText(
    button,
    tooltipText || (
      isAvailable
        ? "Regenerar color"
        : "No hay suficiente variedad de colores en la imagen de referencia"
    )
  );
}
// Show delete while more than 1 card exists
function refreshDeleteButtonsVisibility() {
  const cards = getColorCards();
  const canDelete = cards.length > 1;

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

function getAdjacentBaseColorNames(card) {
  const cards = Array.from(getColorCards());
  const cardIndex = cards.indexOf(card);

  if (cardIndex === -1) {
    return [];
  }

  return [cards[cardIndex - 1], cards[cardIndex + 1]]
    .filter(Boolean)
    .map((adjacentCard) => adjacentCard.querySelector(".color-label")?.textContent?.trim() || "")
    .map((hex) => normalizeHexColor(hex))
    .filter((hex) => isValidHexColor(hex))
    .map((hex) => getNearestColorName(hex));
}

function getRegeneratedColorForCard(card, existingColors) {
  if (paletteBaseMode === "image" && typeof getImageRegenerationColorForCard === "function") {
    return getImageRegenerationColorForCard(card, existingColors);
  }

  const maxCandidateSearches = 18;
  const seenCandidates = new Set();
  const adjacentBaseNames = getAdjacentBaseColorNames(card);
  let bestCandidate = null;
  let bestConflictCount = Infinity;

  for (let attempt = 0; attempt < maxCandidateSearches; attempt++) {
    const candidate = getUniqueGeneratedColor(existingColors);
    if (!candidate || seenCandidates.has(candidate)) {
      continue;
    }

    seenCandidates.add(candidate);

    const candidateBaseName = getNearestColorName(candidate);
    const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
      return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
    }, 0);

    if (conflictCount === 0) {
      return candidate;
    }

    if (conflictCount < bestConflictCount) {
      bestCandidate = candidate;
      bestConflictCount = conflictCount;
    }
  }

  return bestCandidate || getUniqueGeneratedColor(existingColors);
}

function getAddedColorForCurrentMode(existingColors) {
  if (paletteBaseMode === "image") {
    const imageCandidate =
      typeof getImageBasedCandidateColor === "function"
        ? getImageBasedCandidateColor(existingColors, [])
        : null;

    return {
      color: imageCandidate || "#FFFFFF",
      isFallbackWhite: !imageCandidate,
    };
  }

  return {
    color: getUniqueGeneratedColor(existingColors),
    isFallbackWhite: false,
  };
}

function updateRegenerateButtonsAvailability() {
  const cards = Array.from(getColorCards());

  cards.forEach((card) => {
    const regenerateBtn = card.querySelector(".action-regenerate");
    if (!regenerateBtn) {
      return;
    }

    if (isCardPinned(card)) {
      setRegenerateButtonAvailability(regenerateBtn, false, "El color está fijado");
      return;
    }

    if (paletteBaseMode !== "image") {
      setRegenerateButtonAvailability(regenerateBtn, true);
      return;
    }

    if (card.dataset.regenerateLocked === "true") {
      setRegenerateButtonAvailability(regenerateBtn, false);
      return;
    }

    const existingColors = new Set(getCurrentPaletteHexValues());

    setRegenerateButtonAvailability(
      regenerateBtn,
      !!getRegeneratedColorForCard(card, existingColors)
    );
  });
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
  const pinBtn = createCardPinButton();

  let cardCopyFeedbackTimeout = null;
  // Regenerate this card while keeping colors unique
  regenerateBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    if (regenerateBtn.classList.contains("is-disabled")) {
      return;
    }

    const existingColors = new Set(getCurrentPaletteHexValues());

    const newColor = getRegeneratedColorForCard(card, existingColors);
    if (!newColor) {
      alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
      return;
    }

    setCardColor(card, newColor);
    persistCurrentPaletteSnapshot();
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
        alert("No se ha podido abrir el selector de color. Intentalo de nuevo.");
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

      if (cardCopyFeedbackTimeout) {
        clearTimeout(cardCopyFeedbackTimeout);
      }

      const feedbackBg = normalizeHexColor(hex);
      const feedbackTextColor = getReadableTooltipTextColor(feedbackBg);
      cardCopyFeedbackTimeout = showButtonCopyFeedback(copyBtn, {
        defaultTooltipText: CARD_COPY_TOOLTIP_DEFAULT,
        feedbackBg,
        feedbackTextColor,
      });
    } catch (error) {
      alert("No se ha podido copiar este valor HEX.");
    }
  });

  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const totalCards = getColorCards().length;
    if (totalCards <= 1) {
      return;
    }

    card.remove();
    refreshDeleteButtonsVisibility();
    persistCurrentPaletteSnapshot();
  });

  pinBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    setCardPinnedState(card, !isCardPinned(card));
    persistCurrentPaletteSnapshot();
  });

  actions.appendChild(regenerateBtn);
  actions.appendChild(editBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(actions);
  card.appendChild(pinBtn);
  updateCardPinButtonState(card);
}
// Live update card color while picker is open
globalEditPicker.addEventListener("input", () => {
  if (!activeEditCard) {
    return;
  }

  const candidate = normalizeHexColor(globalEditPicker.value);
  if (isColorAlreadyInPalette(candidate, activeEditCard)) {
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

  if (isColorAlreadyInPalette(candidate, activeEditCard)) {
    alert("El color ya esta en la paleta. No se anaden duplicados para mantener el conjunto limpio y consistente.");
    setCardColor(activeEditCard, activeEditOriginalColor);
    syncCurrentPaletteFromDom();
    return;
  }

  setCardColor(activeEditCard, candidate);
  activeEditOriginalColor = candidate;
  persistCurrentPaletteSnapshot(candidate !== previousColor);
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

function createColorCard(color, options = {}) {
  // Build one card and insert it before add button
  const card = document.createElement("div");
  card.className = "color-card";
  card.dataset.pinned = "false";

  const colorName = document.createElement("div");
  colorName.className = "color-name";

  const label = document.createElement("div");
  label.className = "color-label";

  attachCardActions(card);
  card.appendChild(colorName);
  card.appendChild(label);
  setCardColor(card, color);
  setCardPinnedState(card, !!options.pinned);

  if (addColorElement) {
    paletteContainer.insertBefore(card, addColorElement);
  } else {
    paletteContainer.appendChild(card);
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();

  return card;
}

// COPY CURRENT PALETTE

function getNearestColorName(hex) {
  if (normalizeHexColor(hex) === "#FFFFFF") {
    return "Pure white";
  }

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
  return getCurrentPaletteCardEntries().map((entry) => entry.hex);
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
  copyHexBtn.addEventListener("click", async () => {
    const hexValues = getCurrentPaletteHexValues();

    if (hexValues.length === 0) {
      alert("No hay colores en la paleta actual.");
      return;
    }
    const paletteDisplayNames = getPaletteDisplayNames(hexValues);

    // Copy each HEX together with current display name.
    const plainText = hexValues
      .map((hex, index) => `${hex} - ${paletteDisplayNames[index]}`)
      .join("\n");

    try {
      await copyTextToClipboard(plainText);

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
    const { color, isFallbackWhite } = getAddedColorForCurrentMode(existingColors);
    if (!color) {
      alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
      return;
    }

    const card = createColorCard(color);

    if (card) {
      card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
    }

    persistCurrentPaletteSnapshot();
  });
}
