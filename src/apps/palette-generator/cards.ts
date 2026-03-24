import AppClipboard from "../../shared/services/clipboard";
import AppColorUtils from "../../shared/color/color-utils";
import AppSharedColors from "../../shared/services/shared-colors";

let hasInitializedPaletteGeneratorCards = false;
let activeEditCard: HTMLElement | null = null;
let activeEditOriginalColor = "#000000";

function getPaletteGeneratorCardsWindow() {
  return window as any;
}

function getDom() {
  return getPaletteGeneratorCardsWindow().AppDom || {};
}

function getConstants() {
  return getPaletteGeneratorCardsWindow().AppConstants || {};
}

function getGlobals() {
  return getPaletteGeneratorCardsWindow().PaletteGeneratorLegacyGlobals || {};
}

function getCardsRuntime() {
  return getPaletteGeneratorCardsWindow().PaletteGeneratorCardsRuntime || {};
}

function getCardRoleState(card: HTMLElement | null) {
  const runtimeWindow = getPaletteGeneratorCardsWindow();
  const globals = getGlobals();
  const cards = Array.from(runtimeWindow.getColorCards?.() || []);
  const cardIndex = cards.indexOf(card as any);
  const effectiveType =
    typeof runtimeWindow.getEffectiveColorPaletteType === "function"
      ? runtimeWindow.getEffectiveColorPaletteType(cards.length || globals.paletteSize)
      : globals.selectedColorPaletteType;

  return getCardsRuntime().resolveCardRoleState({
    paletteBaseMode: globals.paletteBaseMode,
    effectiveType,
    totalCount: cards.length,
    cardIndex,
  });
}

export function initializePaletteGeneratorCards() {
  if (hasInitializedPaletteGeneratorCards) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorCardsWindow();
  const dom = getDom();
  const constants = getConstants();
  const addColorDefaultLabel = dom.addColorLabel?.textContent?.trim() ?? "Añadir color";

  runtimeWindow.getCardRoleState = getCardRoleState;

  runtimeWindow.persistCurrentPaletteSnapshot = function persistCurrentPaletteSnapshot(
    saveHistoryEntry = true
  ) {
    const globals = getGlobals();
    runtimeWindow.syncCurrentPaletteFromDom?.();
    runtimeWindow.capturePaletteAdjustmentBase?.(globals.currentPalette);

    if (saveHistoryEntry) {
      runtimeWindow.saveHistory?.(globals.currentPalette);
    }
  };

  runtimeWindow.updateCardPinButtonState = function updateCardPinButtonState(card: HTMLElement) {
    const pinBtn = card?.querySelector(".color-pin-btn") as HTMLElement | null;
    if (!pinBtn) {
      return;
    }

    const isPinned = runtimeWindow.isCardPinned?.(card);
    const nextTooltip = isPinned ? "Desfijar color" : "Fijar color";
    const iconWrap = pinBtn.querySelector(".pin-icon-wrap") as HTMLElement | null;
    const pinOverlayIconWrap = card?.querySelector(".color-pin-overlay-icon-wrap") as HTMLElement | null;

    pinBtn.classList.toggle("is-pinned", !!isPinned);
    pinBtn.setAttribute("aria-label", nextTooltip);
    pinBtn.setAttribute("aria-pressed", isPinned ? "true" : "false");

    if (iconWrap) {
      iconWrap.innerHTML = runtimeWindow.getPinButtonIconMarkup?.(!!isPinned) || "";
    }

    if (pinOverlayIconWrap) {
      pinOverlayIconWrap.innerHTML = runtimeWindow.getPinOverlayIconMarkup?.(!!isPinned) || "";
    }
  };

  runtimeWindow.isLockedColorModeBaseCard = function isLockedColorModeBaseCard(card: HTMLElement) {
    return !!getCardRoleState(card)?.isBaseCard;
  };

  runtimeWindow.isCardPinningAvailable = function isCardPinningAvailable() {
    return getCardsRuntime().isCardPinningAvailable(getGlobals().paletteBaseMode);
  };

  runtimeWindow.isLockedComplementaryRoleCard = function isLockedComplementaryRoleCard(
    card: HTMLElement
  ) {
    return !!card && !!getCardRoleState(card)?.isComplementaryCard;
  };

  runtimeWindow.shouldShowLockedColorModeBasePin = function shouldShowLockedColorModeBasePin(
    card: HTMLElement
  ) {
    return !!card && !!getCardRoleState(card)?.isBaseCard;
  };

  runtimeWindow.shouldShowLockedComplementaryPin = function shouldShowLockedComplementaryPin(
    card: HTMLElement
  ) {
    return !!card && !!getCardRoleState(card)?.isComplementaryCard;
  };

  runtimeWindow.clearUnavailablePinnedCards = function clearUnavailablePinnedCards() {
    if (runtimeWindow.isCardPinningAvailable?.()) {
      return false;
    }

    let hasChanged = false;
    Array.from(runtimeWindow.getColorCards?.() || []).forEach((card: any) => {
      const shouldPreserveReadonlyFixedPin =
        runtimeWindow.shouldShowLockedColorModeBasePin?.(card) ||
        runtimeWindow.shouldShowLockedComplementaryPin?.(card);

      if (shouldPreserveReadonlyFixedPin || !runtimeWindow.isCardPinned?.(card)) {
        return;
      }

      runtimeWindow.setCardPinnedState?.(card, false);
      hasChanged = true;
    });

    return hasChanged;
  };

  runtimeWindow.updateColorModeCardActionVisibility =
    function updateColorModeCardActionVisibility() {
      const globals = getGlobals();
      const cards = Array.from(runtimeWindow.getColorCards?.() || []);

      cards.forEach((card: any, index: number) => {
        const editBtn = card.querySelector(".action-edit");
        const pinBtn = card.querySelector(".color-pin-btn");
        const pinOverlay = card.querySelector(".color-pin-overlay");
        const effectiveType =
          typeof runtimeWindow.getEffectiveColorPaletteType === "function"
            ? runtimeWindow.getEffectiveColorPaletteType(cards.length || globals.paletteSize)
            : globals.selectedColorPaletteType;
        const actionVisibility = getCardsRuntime().getCardActionVisibilityState({
          paletteBaseMode: globals.paletteBaseMode,
          effectiveType,
          totalCount: cards.length,
          cardIndex: index,
          isPinned: runtimeWindow.isCardPinned?.(card),
        });

        if (editBtn) {
          editBtn.classList.toggle("is-hidden", !!actionVisibility.editHidden);
        }
        if (pinBtn) {
          pinBtn.classList.toggle("is-hidden", !!actionVisibility.pinButtonHidden);
        }
        if (pinOverlay) {
          pinOverlay.classList.toggle("is-hidden", !!actionVisibility.pinOverlayHidden);
          pinOverlay.classList.toggle(
            "is-always-visible",
            !!actionVisibility.pinOverlayAlwaysVisible
          );
          pinOverlay.classList.toggle("is-corner", !!actionVisibility.pinOverlayCorner);
          pinOverlay.classList.toggle("is-readonly", !!actionVisibility.pinOverlayReadonly);
          pinOverlay.classList.toggle("is-fixed-role", !!actionVisibility.pinOverlayFixedRole);
        }
      });
    };

  runtimeWindow.toggleCardPinnedState = function toggleCardPinnedState(card: HTMLElement) {
    if (!card) {
      return;
    }

    if (
      runtimeWindow.isLockedColorModeBaseCard?.(card) ||
      runtimeWindow.isLockedComplementaryRoleCard?.(card) ||
      !runtimeWindow.isCardPinningAvailable?.()
    ) {
      return;
    }

    runtimeWindow.setCardPinnedState?.(card, !runtimeWindow.isCardPinned?.(card));
    runtimeWindow.persistCurrentPaletteSnapshot?.();
  };

  runtimeWindow.setCardPinnedState = function setCardPinnedState(card: HTMLElement, isPinned: boolean) {
    if (!card) {
      return;
    }

    const roleState = getCardRoleState(card);
    const resolvedPinnedState = getCardsRuntime().resolvePinnedCardState(isPinned, roleState);
    card.dataset.pinned = resolvedPinnedState ? "true" : "false";
    card.classList.toggle("is-pinned", resolvedPinnedState);
    runtimeWindow.updateCardPinButtonState?.(card);
  };

  runtimeWindow.setRegenerateButtonAvailability = function setRegenerateButtonAvailability(
    button: HTMLElement,
    isAvailable: boolean,
    tooltipText: string | null = null
  ) {
    if (!button) {
      return;
    }

    button.classList.toggle("is-disabled", !isAvailable);
    button.setAttribute("aria-disabled", isAvailable ? "false" : "true");
    runtimeWindow.setActionButtonTooltipText?.(
      button,
      tooltipText ||
        (isAvailable
          ? "Regenerar color"
          : "No hay suficiente variedad de colores en la imagen de referencia")
    );
  };

  runtimeWindow.refreshDeleteButtonsVisibility = function refreshDeleteButtonsVisibility() {
    const globals = getGlobals();
    const cards = Array.from(runtimeWindow.getColorCards?.() || []);
    const canDelete = cards.length > 1;
    const effectiveType =
      typeof runtimeWindow.getEffectiveColorPaletteType === "function"
        ? runtimeWindow.getEffectiveColorPaletteType(cards.length || globals.paletteSize)
        : globals.selectedColorPaletteType;

    cards.forEach((card: any, index: number) => {
      const deleteBtn = card.querySelector(".action-delete");
      if (!deleteBtn) {
        return;
      }
      const actionVisibility = getCardsRuntime().getCardActionVisibilityState({
        paletteBaseMode: globals.paletteBaseMode,
        effectiveType,
        totalCount: cards.length,
        cardIndex: index,
        canDelete,
        isPinned: runtimeWindow.isCardPinned?.(card),
      });
      deleteBtn.classList.toggle("is-hidden", !!actionVisibility.deleteHidden);
    });
  };

  runtimeWindow.updateAddColorButtonState = function updateAddColorButtonState() {
    if (!dom.addColorBtn || !dom.addColorLabel) {
      return;
    }

    const shouldHideAddColor = getGlobals().paletteBaseMode === "color";
    if (dom.addColorElement) {
      dom.addColorElement.hidden = shouldHideAddColor;
    }

    if (shouldHideAddColor) {
      return;
    }

    const totalCards = runtimeWindow.getColorCards?.().length || 0;
    const isAtMax = totalCards >= (constants.MAX_PALETTE_COLORS || 0);

    dom.addColorBtn.classList.toggle("is-disabled", isAtMax);
    dom.addColorBtn.setAttribute("aria-disabled", String(isAtMax));
    dom.addColorLabel.textContent = isAtMax
      ? constants.ADD_DISABLED_LABEL || "Límite alcanzado"
      : addColorDefaultLabel;
  };

  runtimeWindow.getAdjacentBaseColorNames = function getAdjacentBaseColorNames(card: HTMLElement) {
    const cards = Array.from(runtimeWindow.getColorCards?.() || []);
    const cardIndex = cards.indexOf(card as any);

    if (cardIndex === -1) {
      return [];
    }

    return [cards[cardIndex - 1], cards[cardIndex + 1]]
      .filter(Boolean)
      .map((adjacentCard: any) => adjacentCard.querySelector(".color-label")?.textContent?.trim() || "")
      .map((hex: string) => AppColorUtils.normalizeHexColor(hex))
      .filter((hex: string) => AppColorUtils.isValidHexColor(hex))
      .map((hex: string) => runtimeWindow.getNearestColorName?.(hex));
  };

  runtimeWindow.getRegeneratedColorForCard = function getRegeneratedColorForCard(
    card: HTMLElement,
    existingColors: Set<string>,
    options: Record<string, unknown> = {}
  ) {
    const globals = getGlobals();
    if (
      globals.paletteBaseMode === "color" &&
      typeof runtimeWindow.getColorModeRegenerationColorForCard === "function"
    ) {
      return runtimeWindow.getColorModeRegenerationColorForCard(card, existingColors, options);
    }

    if (
      globals.paletteBaseMode === "image" &&
      typeof runtimeWindow.getImageRegenerationColorForCard === "function"
    ) {
      return runtimeWindow.getImageRegenerationColorForCard(card, existingColors, options);
    }

    const maxCandidateSearches = 18;
    const seenCandidates = new Set<string>();
    const adjacentBaseNames = runtimeWindow.getAdjacentBaseColorNames?.(card) || [];
    let bestCandidate: string | null = null;
    let bestConflictCount = Infinity;

    for (let attempt = 0; attempt < maxCandidateSearches; attempt += 1) {
      const candidate = runtimeWindow.getUniqueGeneratedColor?.(existingColors);
      if (!candidate || seenCandidates.has(candidate)) {
        continue;
      }

      seenCandidates.add(candidate);

      const candidateBaseName = runtimeWindow.getNearestColorName?.(candidate);
      const conflictCount = adjacentBaseNames.reduce((count: number, adjacentBaseName: string) => {
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

    return bestCandidate || runtimeWindow.getUniqueGeneratedColor?.(existingColors);
  };

  runtimeWindow.getAddedColorForCurrentMode = function getAddedColorForCurrentMode(
    existingColors: Set<string>
  ) {
    if (getGlobals().paletteBaseMode === "image") {
      const imageCandidate =
        typeof runtimeWindow.getImageBasedCandidateColor === "function"
          ? runtimeWindow.getImageBasedCandidateColor(existingColors, [])
          : null;

      return {
        color: imageCandidate || "#FFFFFF",
        isFallbackWhite: !imageCandidate,
      };
    }

    return {
      color: runtimeWindow.getUniqueGeneratedColor?.(existingColors),
      isFallbackWhite: false,
    };
  };

  runtimeWindow.updateRegenerateButtonsAvailability =
    function updateRegenerateButtonsAvailability() {
      const globals = getGlobals();
      const cards = Array.from(runtimeWindow.getColorCards?.() || []);
      const effectiveType =
        typeof runtimeWindow.getEffectiveColorPaletteType === "function"
          ? runtimeWindow.getEffectiveColorPaletteType(cards.length || globals.paletteSize)
          : globals.selectedColorPaletteType;
      const isMonochromaticScaleActive =
        typeof runtimeWindow.isColorModeMonochromaticScaleActive === "function" &&
        runtimeWindow.isColorModeMonochromaticScaleActive();

      cards.forEach((card: any, index: number) => {
        const regenerateBtn = card.querySelector(".action-regenerate");
        if (!regenerateBtn) {
          return;
        }
        let hasImageCandidate = null;
        if (
          globals.paletteBaseMode === "image" &&
          card.dataset.regenerateLocked !== "true"
        ) {
          const existingColors = new Set(runtimeWindow.getCurrentPaletteHexValues?.() || []);
          hasImageCandidate = !!runtimeWindow.getRegeneratedColorForCard?.(card, existingColors);
        }

        const state = getCardsRuntime().getRegenerateButtonState({
          paletteBaseMode: globals.paletteBaseMode,
          effectiveType,
          totalCount: cards.length,
          cardIndex: index,
          isMonochromaticScaleActive,
          isPinned: runtimeWindow.isCardPinned?.(card),
          regenerateLocked: card.dataset.regenerateLocked === "true",
          hasImageCandidate,
        });

        regenerateBtn.classList.toggle("is-hidden", !!state.hidden);
        runtimeWindow.setRegenerateButtonAvailability?.(
          regenerateBtn,
          !!state.available,
          state.tooltip
        );
      });
    };

  function attachCardActions(card: HTMLElement) {
    const actions = document.createElement("div");
    actions.className = "color-actions";

    const regenerateBtn = runtimeWindow.createCardActionButton?.("regenerate", "Regenerar color");
    const editBtn = runtimeWindow.createCardActionButton?.("edit", "Editar color");
    const copyBtn = runtimeWindow.createCardActionButton?.(
      "copy",
      constants.CARD_COPY_TOOLTIP_DEFAULT
    );
    const deleteBtn = runtimeWindow.createCardActionButton?.("delete", "Eliminar color");
    const pinBtn = runtimeWindow.createCardPinButton?.();
    const pinOverlay = document.createElement("div");
    pinOverlay.className = "color-pin-overlay";
    const pinOverlayContent = document.createElement("div");
    pinOverlayContent.className = "color-pin-overlay-content";
    const pinOverlayIconWrap = document.createElement("span");
    pinOverlayIconWrap.className = "color-pin-overlay-icon-wrap";
    pinOverlayContent.appendChild(pinOverlayIconWrap);
    pinOverlay.appendChild(pinOverlayContent);

    let cardCopyFeedbackTimeout: number | null = null;

    regenerateBtn?.addEventListener("click", (event: Event) => {
      event.stopPropagation();

      if (runtimeWindow.isLockedColorModeBaseCard?.(card)) {
        return;
      }

      if (regenerateBtn.classList.contains("is-disabled")) {
        return;
      }

      const existingColors = new Set(runtimeWindow.getCurrentPaletteHexValues?.() || []);
      const newColor = runtimeWindow.getRegeneratedColorForCard?.(card, existingColors);
      if (!newColor) {
        alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
        return;
      }

      runtimeWindow.setCardColor?.(card, newColor);
      runtimeWindow.persistCurrentPaletteSnapshot?.();
    });

    editBtn?.addEventListener("click", (event: Event) => {
      event.stopPropagation();

      if (
        runtimeWindow.isLockedColorModeBaseCard?.(card) ||
        runtimeWindow.isLockedComplementaryRoleCard?.(card) ||
        runtimeWindow.isCardPinned?.(card)
      ) {
        return;
      }

      const currentHex = AppColorUtils.normalizeHexColor(
        card.querySelector(".color-label")?.textContent?.trim() || "#000000"
      );
      activeEditCard = card;
      activeEditOriginalColor = currentHex;
      dom.globalEditPicker.value = currentHex;
      runtimeWindow.positionEditPickerAtButton?.(editBtn, dom.globalEditPicker);

      requestAnimationFrame(() => {
        if (!runtimeWindow.openNativeColorPicker?.(dom.globalEditPicker)) {
          alert("No se ha podido abrir el selector de color. Intentalo de nuevo.");
        }
      });
    });

    copyBtn?.addEventListener("click", async (event: Event) => {
      event.stopPropagation();
      const hex = card.querySelector(".color-label")?.textContent?.trim()?.toUpperCase();
      if (!hex || !AppColorUtils.isValidHexColor(hex)) {
        return;
      }

      try {
        await AppClipboard.writeText(hex);
        AppSharedColors.setActiveColor?.(hex, {
          source: "palette-generator",
          action: "card-copy",
        });

        if (cardCopyFeedbackTimeout) {
          clearTimeout(cardCopyFeedbackTimeout);
        }

        const feedbackBg = AppColorUtils.normalizeHexColor(hex);
        const feedbackTextColor = runtimeWindow.getReadableTooltipTextColor?.(feedbackBg);
        cardCopyFeedbackTimeout = runtimeWindow.showButtonCopyFeedback?.(copyBtn, {
          defaultTooltipText: constants.CARD_COPY_TOOLTIP_DEFAULT,
          feedbackBg,
          feedbackTextColor,
        });
      } catch (error) {
        alert("No se ha podido copiar este valor HEX.");
      }
    });

    deleteBtn?.addEventListener("click", (event: Event) => {
      event.stopPropagation();
      if (
        runtimeWindow.isLockedColorModeBaseCard?.(card) ||
        runtimeWindow.isLockedComplementaryRoleCard?.(card) ||
        runtimeWindow.isCardPinned?.(card)
      ) {
        return;
      }

      const totalCards = runtimeWindow.getColorCards?.().length || 0;
      if (totalCards <= 1) {
        return;
      }

      card.remove();
      runtimeWindow.refreshDeleteButtonsVisibility?.();
      runtimeWindow.persistCurrentPaletteSnapshot?.();
    });

    pinBtn?.addEventListener("click", (event: Event) => {
      event.stopPropagation();
      runtimeWindow.toggleCardPinnedState?.(card);
    });

    card.addEventListener("click", (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.closest(".color-action-btn") || target.closest(".color-pin-btn")) {
        return;
      }

      runtimeWindow.toggleCardPinnedState?.(card);
    });

    if (regenerateBtn) actions.appendChild(regenerateBtn);
    if (editBtn) actions.appendChild(editBtn);
    if (copyBtn) actions.appendChild(copyBtn);
    if (deleteBtn) actions.appendChild(deleteBtn);

    card.appendChild(actions);
    if (pinBtn) {
      card.appendChild(pinBtn);
    }
    card.appendChild(pinOverlay);
    runtimeWindow.updateCardPinButtonState?.(card);
  }

  if (dom.globalEditPicker) {
    dom.globalEditPicker.addEventListener("input", () => {
      if (!activeEditCard) {
        return;
      }

      const candidate = AppColorUtils.normalizeHexColor(dom.globalEditPicker.value);
      if (runtimeWindow.isColorAlreadyInPalette?.(candidate, activeEditCard)) {
        return;
      }

      runtimeWindow.setCardColor?.(activeEditCard, candidate);
      runtimeWindow.syncCurrentPaletteFromDom?.();
    });

    dom.globalEditPicker.addEventListener("change", () => {
      if (!activeEditCard) {
        return;
      }

      const candidate = AppColorUtils.normalizeHexColor(dom.globalEditPicker.value);
      const previousColor = activeEditOriginalColor;

      if (runtimeWindow.isColorAlreadyInPalette?.(candidate, activeEditCard)) {
        alert(
          "El color ya esta en la paleta. No se anaden duplicados para mantener el conjunto limpio y consistente."
        );
        runtimeWindow.setCardColor?.(activeEditCard, activeEditOriginalColor);
        runtimeWindow.syncCurrentPaletteFromDom?.();
        return;
      }

      runtimeWindow.setCardColor?.(activeEditCard, candidate);
      activeEditOriginalColor = candidate;
      runtimeWindow.persistCurrentPaletteSnapshot?.(candidate !== previousColor);
    });

    dom.globalEditPicker.addEventListener("blur", () => {
      activeEditCard = null;
    });
  }

  runtimeWindow.closeAllCardEditors = function closeAllCardEditors(exceptCard: HTMLElement | null = null) {
    dom.paletteContainer
      ?.querySelectorAll(".color-card.is-editing")
      ?.forEach((card: any) => {
        if (card !== exceptCard) {
          card.classList.remove("is-editing");
        }
      });
  };

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest(".color-card")) {
      return;
    }

    runtimeWindow.closeAllCardEditors?.();
  });

  runtimeWindow.createColorCard = function createColorCard(
    color: string,
    options: { pinned?: boolean; suppressUiRefresh?: boolean } = {}
  ) {
    const card = document.createElement("div");
    card.className = "color-card";
    card.dataset.pinned = "false";
    card.dataset.readonlyFixedPin = "false";

    const colorName = document.createElement("div");
    colorName.className = "color-name";
    const colorBaseIndicator = document.createElement("div");
    colorBaseIndicator.className = "color-base-indicator";
    colorBaseIndicator.textContent = "Color base";
    const complementaryIndicator = document.createElement("div");
    complementaryIndicator.className = "color-complementary-indicator";
    complementaryIndicator.textContent = "Complementario";

    const label = document.createElement("div");
    label.className = "color-label";

    attachCardActions(card);
    card.appendChild(colorBaseIndicator);
    card.appendChild(complementaryIndicator);
    card.appendChild(colorName);
    card.appendChild(label);
    runtimeWindow.setCardColor?.(card, color);
    runtimeWindow.setCardPinnedState?.(card, !!options.pinned);

    if (dom.addColorElement) {
      dom.paletteContainer?.insertBefore(card, dom.addColorElement);
    } else {
      dom.paletteContainer?.appendChild(card);
    }

    if (!options.suppressUiRefresh) {
      runtimeWindow.updateColorModeCardActionVisibility?.();
      runtimeWindow.refreshDeleteButtonsVisibility?.();
      runtimeWindow.updateAddColorButtonState?.();
    }

    return card;
  };

  if (dom.addColorBtn) {
    dom.addColorBtn.addEventListener("click", (event: Event) => {
      event.preventDefault();

      runtimeWindow.updateAddColorButtonState?.();
      if (dom.addColorBtn.classList.contains("is-disabled")) {
        return;
      }

      const existingColors = new Set(runtimeWindow.getCurrentPaletteHexValues?.() || []);
      const { color, isFallbackWhite } = runtimeWindow.getAddedColorForCurrentMode?.(
        existingColors
      ) || { color: null, isFallbackWhite: false };
      if (!color) {
        alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
        return;
      }

      const card = runtimeWindow.createColorCard?.(color);

      if (card) {
        card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
      }

      runtimeWindow.persistCurrentPaletteSnapshot?.();
    });
  }

  hasInitializedPaletteGeneratorCards = true;
}

export default initializePaletteGeneratorCards;
