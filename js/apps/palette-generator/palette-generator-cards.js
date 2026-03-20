// Palette generator card actions and card DOM wiring.

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
      await writeTextToClipboard(text);
      sharedColors?.setActiveColor(hex, {
        source: "palette-generator",
        action: "card-copy",
      });

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
