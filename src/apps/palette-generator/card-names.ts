import AppColorUtils from "../../shared/color/color-utils";
import AppClipboard from "../../shared/services/clipboard";

let hasInitializedPaletteGeneratorCardNames = false;

function getPaletteGeneratorCardNamesWindow() {
  return window as any;
}

function getColorNameReferencesWithColor(runtimeWindow: any) {
  const entries = Array.isArray(runtimeWindow.AppColorNames) ? runtimeWindow.AppColorNames : [];
  return entries.map((entry: any) => ({
    ...entry,
    color: AppColorUtils.createColor(entry.hex),
  }));
}

function getNearestColorNameFactory(runtimeWindow: any) {
  return function getNearestColorName(hex: string) {
    if (AppColorUtils.normalizeHexColor(hex) === "#FFFFFF") {
      return "Pure white";
    }

    let closestName = "Unknown";
    let minDistance = Infinity;

    getColorNameReferencesWithColor(runtimeWindow).forEach((entry: any) => {
      if (!entry.color) {
        return;
      }

      const distance = AppColorUtils.getColorDistance(hex, entry.color, {
        method: "deltae2000",
      });

      if (distance < minDistance) {
        minDistance = distance;
        closestName = entry.name;
      }
    });

    return closestName;
  };
}

function getRepetitionSuffixByIndex(index: number) {
  const REPETITION_SUFFIXES = ["Shade", "Tone", "Variant", "Tint", "Alt"];
  if (index < REPETITION_SUFFIXES.length) {
    return REPETITION_SUFFIXES[index];
  }

  return `Alt ${index - REPETITION_SUFFIXES.length + 2}`;
}

function buildPaletteShareUrl(hexValues: string[]) {
  const normalizedHexValues = hexValues
    .map((hex) => AppColorUtils.normalizeHexColor(hex))
    .filter((hex) => AppColorUtils.isValidHexColor(hex));

  const shareUrl = new URL(window.location.href);
  shareUrl.search = "";
  shareUrl.hash = "";
  shareUrl.searchParams.set("view", "palette_generator");
  shareUrl.searchParams.set("palette", normalizedHexValues.join(","));

  return shareUrl.toString();
}

export function initializePaletteGeneratorCardNames() {
  if (hasInitializedPaletteGeneratorCardNames) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorCardNamesWindow();
  const dom = runtimeWindow.AppDom || {};
  const getNearestColorName = getNearestColorNameFactory(runtimeWindow);

  runtimeWindow.getNearestColorName = getNearestColorName;

  runtimeWindow.getPaletteDisplayNames = function getPaletteDisplayNames(hexValues: string[]) {
    const normalizedHexValues = hexValues.map((hex) => AppColorUtils.normalizeHexColor(hex));
    const baseNames = normalizedHexValues.map((hex) => getNearestColorName(hex));
    const displayNames = [...baseNames];
    const groups = new Map<string, Array<{ index: number; hex: string }>>();

    baseNames.forEach((name, index) => {
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)?.push({ index, hex: normalizedHexValues[index] });
    });

    groups.forEach((entries, baseName) => {
      if (entries.length <= 1) {
        return;
      }

      displayNames[entries[0].index] = baseName;

      for (let repetitionIndex = 1; repetitionIndex < entries.length; repetitionIndex += 1) {
        const suffix = getRepetitionSuffixByIndex(repetitionIndex - 1);
        displayNames[entries[repetitionIndex].index] = `${baseName} ${suffix}`;
      }
    });

    return displayNames;
  };

  runtimeWindow.refreshColorCardNames = function refreshColorCardNames() {
    const cards = Array.from(runtimeWindow.getColorCards?.() || []);
    if (cards.length === 0) {
      return;
    }

    const hexValues = cards
      .map((card: Element) => card.querySelector(".color-label")?.textContent?.trim() || "")
      .map((hex: string) => AppColorUtils.normalizeHexColor(hex))
      .filter((hex: string) => AppColorUtils.isValidHexColor(hex));

    if (hexValues.length !== cards.length) {
      return;
    }

    const displayNames = runtimeWindow.getPaletteDisplayNames(hexValues);

    cards.forEach((card: any, index: number) => {
      const colorName = card.querySelector(".color-name");
      const colorBaseIndicator = card.querySelector(".color-base-indicator");
      const complementaryIndicator = card.querySelector(".color-complementary-indicator");
      if (!colorName) {
        return;
      }

      const hex = hexValues[index];
      const displayName = displayNames[index] || getNearestColorName(hex);
      const effectiveType =
        typeof runtimeWindow.getEffectiveColorPaletteType === "function"
          ? runtimeWindow.getEffectiveColorPaletteType(cards.length || runtimeWindow.PaletteGeneratorLegacyGlobals?.paletteSize)
          : runtimeWindow.PaletteGeneratorLegacyGlobals?.selectedColorPaletteType;
      const roleState = runtimeWindow.PaletteGeneratorCardsRuntime?.resolveCardRoleState?.({
        paletteBaseMode: runtimeWindow.PaletteGeneratorLegacyGlobals?.paletteBaseMode,
        effectiveType,
        totalCount: cards.length,
        cardIndex: index,
      }) || {};
      const isBaseColorCard = !!roleState.isBaseCard;
      const isComplementaryColorCard = !!roleState.isComplementaryCard;
      const shouldShowReadonlyFixedPin = !!roleState.hasReadonlyFixedPin;
      const hadReadonlyFixedPin = card.dataset.readonlyFixedPin === "true";

      card.classList.toggle("is-base-color", isBaseColorCard);
      card.classList.toggle("is-complementary-color", isComplementaryColorCard);

      if (hadReadonlyFixedPin && !shouldShowReadonlyFixedPin && !isBaseColorCard) {
        runtimeWindow.setCardPinnedState?.(card, false);
      }

      card.dataset.readonlyFixedPin = shouldShowReadonlyFixedPin ? "true" : "false";

      if ((isBaseColorCard || shouldShowReadonlyFixedPin) && !runtimeWindow.isCardPinned?.(card)) {
        runtimeWindow.setCardPinnedState?.(card, true);
      }

      colorName.textContent = displayName;
      runtimeWindow.applyAccessibleColorNameStyle?.(colorName, hex);

      if (colorBaseIndicator) {
        colorBaseIndicator.hidden = !isBaseColorCard;
        runtimeWindow.applyAccessibleColorNameStyle?.(colorBaseIndicator, hex);
      }

      if (complementaryIndicator) {
        complementaryIndicator.hidden = !isComplementaryColorCard;
        runtimeWindow.applyAccessibleColorNameStyle?.(complementaryIndicator, hex);
      }
    });
  };

  runtimeWindow.getCurrentPaletteHexValues = function getCurrentPaletteHexValues() {
    return runtimeWindow.getCurrentPaletteCardEntries?.().map((entry: any) => entry.hex) || [];
  };

  runtimeWindow.isColorAlreadyInPalette = function isColorAlreadyInPalette(
    color: string,
    excludeCard: Element | null = null
  ) {
    const normalized = AppColorUtils.normalizeHexColor(color);
    const cards = runtimeWindow.getColorCards?.() || [];

    return Array.from(cards).some((card: any) => {
      if (excludeCard && card === excludeCard) {
        return false;
      }

      const label = card.querySelector(".color-label");
      return label && label.textContent.trim().toUpperCase() === normalized;
    });
  };

  dom.copyHexBtn?.addEventListener("click", async () => {
    const hexValues = runtimeWindow.getCurrentPaletteHexValues?.() || [];

    if (hexValues.length === 0) {
      alert("No hay colores en la paleta actual.");
      return;
    }

    const paletteDisplayNames = runtimeWindow.getPaletteDisplayNames?.(hexValues) || [];
    const plainText = hexValues
      .map((hex: string, index: number) => `${hex} - ${paletteDisplayNames[index]}`)
      .join("\n");

    try {
      await AppClipboard.writeText(plainText);

      if (runtimeWindow.copyBtnFeedbackTimeout) {
        clearTimeout(runtimeWindow.copyBtnFeedbackTimeout);
      }

      runtimeWindow.copyBtnFeedbackTimeout = runtimeWindow.showButtonCopyFeedback?.(
        dom.copyHexBtn,
        {
          defaultTooltipText:
            dom.copyHexBtnTooltip?.textContent ||
            runtimeWindow.AppConstants?.HISTORY_COPY_TOOLTIP_DEFAULT ||
            "Copiar HEX",
        }
      );
    } catch (error) {
      alert("No se han podido copiar los valores de la paleta.");
    }
  });

  dom.copyPaletteUrlBtn?.addEventListener("click", async () => {
    const hexValues = runtimeWindow.getCurrentPaletteHexValues?.() || [];

    if (hexValues.length === 0) {
      alert("No hay colores en la paleta actual.");
      return;
    }

    try {
      await AppClipboard.writeText(buildPaletteShareUrl(hexValues));

      if (runtimeWindow.copyPaletteUrlBtnFeedbackTimeout) {
        clearTimeout(runtimeWindow.copyPaletteUrlBtnFeedbackTimeout);
      }

      runtimeWindow.copyPaletteUrlBtnFeedbackTimeout = runtimeWindow.showButtonCopyFeedback?.(
        dom.copyPaletteUrlBtn,
        {
          defaultTooltipText:
            dom.copyPaletteUrlBtnTooltip?.textContent || "Copiar URL de la paleta",
        }
      );
    } catch (error) {
      alert("No se ha podido copiar la URL de la paleta.");
    }
  });

  hasInitializedPaletteGeneratorCardNames = true;
}

export default initializePaletteGeneratorCardNames;
