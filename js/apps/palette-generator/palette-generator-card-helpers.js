// Palette generator card helpers: color utilities, accessibility and shared button UI.

const {
  normalizeHexColor,
  isValidHexColor,
  hexToRgb,
  hexToHsl,
  getRelativeLuminance,
  getContrastRatio: getContrastRatioForColors,
  mixHexColors,
  getReadableTextColor,
  getRgbDistance: getRgbDistanceBetweenColors,
} = window.AppColorUtils || {};

if (
  typeof normalizeHexColor !== "function" ||
  typeof isValidHexColor !== "function" ||
  typeof hexToRgb !== "function" ||
  typeof hexToHsl !== "function" ||
  typeof getRelativeLuminance !== "function" ||
  typeof getContrastRatioForColors !== "function" ||
  typeof mixHexColors !== "function" ||
  typeof getReadableTextColor !== "function" ||
  typeof getRgbDistanceBetweenColors !== "function"
) {
  throw new Error("AppColorUtils helpers are required before palette-generator-card-helpers.js loads.");
}

const writeTextToClipboard =
  window.AppClipboard?.writeText || window.copyTextToClipboard;
const sharedColors = window.AppSharedColors || null;
const COPY_FEEDBACK_TEXT = "¡Copiado!";
const COPY_FEEDBACK_DURATION_MS = 2000;

function syncCurrentPaletteFromDom() {
  Array.from(getColorCards()).forEach((card, index) => {
    card.dataset.index = String(index);
  });

  currentPalette = getCurrentPaletteHexValues();
  syncPaletteGeneratorStoreCurrentPalette(currentPalette, {
    scope: "current-palette",
  });
  sharedColors?.setPalette(currentPalette, {
    source: "palette-generator",
  });
  refreshColorCardNames();
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  updateRegenerateButtonsAvailability();
  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }
  updateAddColorButtonState();
}

function getColorCards() {
  return paletteContainer.querySelectorAll(".color-card");
}

function isExplicitMonochromaticColorModeSelected() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "monochromatic";
}

function isExplicitComplementaryColorModeSelected() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "complementary";
}

function getColorModeBaseCardIndex(totalCount = getColorCards().length) {
  if (paletteBaseMode !== "color") {
    return -1;
  }

  const effectiveType =
    typeof getEffectiveColorPaletteType === "function"
      ? getEffectiveColorPaletteType(totalCount || paletteSize)
      : selectedColorPaletteType;

  if (effectiveType === "complementary" && totalCount === 6) {
    return 1;
  }

  if (effectiveType === "analogous" && totalCount === 3) {
    return 1;
  }

  if (effectiveType === "triad" && totalCount === 3) {
    return 1;
  }

  return 0;
}

function getComplementaryRoleCardIndex(totalCount = getColorCards().length) {
  if (paletteBaseMode !== "color") {
    return -1;
  }

  const effectiveType =
    typeof getEffectiveColorPaletteType === "function"
      ? getEffectiveColorPaletteType(totalCount || paletteSize)
      : selectedColorPaletteType;

  if (effectiveType === "complementary") {
    if (totalCount === 2) {
      return 1;
    }

    if (totalCount === 6) {
      return 4;
    }
  }

  return -1;
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
  if (
    typeof isCardPinningAvailable === "function" &&
    !isCardPinningAvailable()
  ) {
    return [];
  }

  return getCurrentPaletteCardEntries()
    .filter((entry) => {
      if (!entry.pinned) {
        return false;
      }

      if (entry.card?.dataset.readonlyFixedPin === "true") {
        return false;
      }

      const baseCardIndex =
        typeof getColorModeBaseCardIndex === "function"
          ? getColorModeBaseCardIndex(getColorCards().length)
          : 0;
      if (paletteBaseMode === "color" && entry.index === baseCardIndex) {
        return false;
      }

      const complementaryCardIndex =
        typeof getComplementaryRoleCardIndex === "function"
          ? getComplementaryRoleCardIndex(getColorCards().length)
          : -1;
      if (
        typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected() &&
        paletteBaseMode === "color" &&
        entry.index === complementaryCardIndex
      ) {
        return false;
      }

      return true;
    })
    .map((entry) => entry.index);
}

function setCardColor(card, color) {
  const normalizedColor = normalizeHexColor(color);
  const overlayStyle = getAccessibleOverlayIconStyle(normalizedColor);
  card.style.background = normalizedColor;
  card.style.setProperty("--pin-overlay-color", overlayStyle.color);
  card.style.setProperty("--pin-overlay-shadow-color", overlayStyle.shadowColor);
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRelativeLuminanceFromHex(hex) {
  return getRelativeLuminance(hex);
}

function getContrastRatio(hexA, hexB) {
  return getContrastRatioForColors(hexA, hexB);
}

function getAccessibleColorNameStyle(backgroundHex) {
  const normalized = normalizeHexColor(backgroundHex);
  const bgLuminance = getRelativeLuminanceFromHex(normalized);
  const needsLighterText = bgLuminance < 0.42;
  const contrastTarget = 3.2;
  const contrastFallbackTarget = 2.8;
  const extremeColor = needsLighterText ? "#FFFFFF" : "#000000";
  let mixAmount = 0.34;
  let candidate = mixHexColors(normalized, extremeColor, mixAmount);
  let contrast = getContrastRatio(candidate, normalized);

  while (contrast < contrastTarget && mixAmount < 0.92) {
    mixAmount += 0.06;
    candidate = mixHexColors(normalized, extremeColor, mixAmount);
    contrast = getContrastRatio(candidate, normalized);
  }

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

function getReadableTooltipTextColor(backgroundHex) {
  return getReadableTextColor(backgroundHex);
}

function getAccessibleOverlayIconStyle(backgroundHex) {
  const normalized = normalizeHexColor(backgroundHex);
  const accessibleStyle = getAccessibleColorNameStyle(normalized);
  const bgLuminance = getRelativeLuminanceFromHex(normalized);

  return {
    color: accessibleStyle.textColor,
    shadowColor: bgLuminance < 0.42
      ? "rgba(0, 0, 0, 0.42)"
      : "rgba(255, 255, 255, 0.45)",
  };
}

function isDisallowedColor(color) {
  return DISALLOWED_COLORS.has(normalizeHexColor(color));
}

function getAdaptiveMinColorDistance(existingCount, attempt) {
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
  return getRgbDistanceBetweenColors(colorA, colorB);
}

function isColorTooCloseToExisting(candidateHex, existingColors, attempt) {
  if (existingColors.size === 0) {
    return false;
  }

  const minDistance = getAdaptiveMinColorDistance(existingColors.size, attempt);

  for (const existingHex of existingColors) {
    if (getRgbDistance(candidateHex, existingHex) < minDistance) {
      return true;
    }
  }

  return false;
}

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
      // Ignore second error and report failure.
    }
    return false;
  }
}

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

function getPinOverlayIconMarkup(isPinned) {
  if (isPinned) {
    return `
      <span class="pin-overlay-icon-state pin-overlay-icon-state-filled is-visible">
        ${getPinButtonIconMarkup(true).replace(
          'class="pin-icon"',
          'class="pin-icon pin-overlay-icon"'
        )}
      </span>
    `;
  }

  return `
    <span class="pin-overlay-icon-state pin-overlay-icon-state-outline is-visible">
      ${getPinButtonIconMarkup(false).replace(
        'class="pin-icon"',
        'class="pin-icon pin-overlay-icon"'
      )}
    </span>
    <span class="pin-overlay-icon-state pin-overlay-icon-state-filled">
      ${getPinButtonIconMarkup(true).replace(
        'class="pin-icon"',
        'class="pin-icon pin-overlay-icon"'
      )}
    </span>
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
