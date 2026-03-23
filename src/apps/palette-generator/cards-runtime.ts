import type { ColorPaletteType, PaletteBaseMode } from "./types";

type CardRoleArgs = {
  paletteBaseMode?: unknown;
  effectiveType?: unknown;
  totalCount?: unknown;
  cardIndex?: unknown;
};

type PaletteCardPinnedEntry = {
  index: number;
  pinned?: boolean;
  readonlyFixedPin?: boolean;
};

type PinnedPaletteIndexesArgs = {
  entries?: PaletteCardPinnedEntry[] | null;
  paletteBaseMode?: unknown;
  effectiveType?: unknown;
  totalCount?: unknown;
};

type ResolvedCardRoleState = {
  baseCardIndex: number;
  complementaryCardIndex: number;
  isBaseCard: boolean;
  isComplementaryCard: boolean;
  hasReadonlyFixedPin: boolean;
  pinningAvailable: boolean;
};

type CardActionVisibilityArgs = CardRoleArgs & {
  canDelete?: unknown;
  isPinned?: unknown;
};

type RegenerateButtonStateArgs = CardRoleArgs & {
  isMonochromaticScaleActive?: unknown;
  isPinned?: unknown;
  regenerateLocked?: unknown;
  hasImageCandidate?: unknown;
};

function normalizePaletteBaseMode(value: unknown): PaletteBaseMode {
  if (value === "image") {
    return "image";
  }

  if (value === "temperature") {
    return "temperature";
  }

  return "color";
}

function normalizeEffectiveType(value: unknown): ColorPaletteType | null {
  switch (value) {
    case "automatic":
    case "monochromatic":
    case "complementary":
    case "analogous":
    case "triad":
    case "tetrad":
      return value;
    default:
      return null;
  }
}

function getColorModeBaseCardIndex(args: CardRoleArgs) {
  if (normalizePaletteBaseMode(args.paletteBaseMode) !== "color") {
    return -1;
  }

  const effectiveType = normalizeEffectiveType(args.effectiveType);
  const totalCount = Number.isFinite(args.totalCount) ? Number(args.totalCount) : 0;

  if (effectiveType === "complementary" && totalCount === 6) {
    return 1;
  }

  if ((effectiveType === "analogous" || effectiveType === "triad") && totalCount === 3) {
    return 1;
  }

  return 0;
}

function getComplementaryRoleCardIndex(args: CardRoleArgs) {
  if (normalizePaletteBaseMode(args.paletteBaseMode) !== "color") {
    return -1;
  }

  const effectiveType = normalizeEffectiveType(args.effectiveType);
  const totalCount = Number.isFinite(args.totalCount) ? Number(args.totalCount) : 0;

  if (effectiveType !== "complementary") {
    return -1;
  }

  if (totalCount === 2) {
    return 1;
  }

  if (totalCount === 6) {
    return 4;
  }

  return -1;
}

function isCardPinningAvailable(paletteBaseMode: unknown) {
  return normalizePaletteBaseMode(paletteBaseMode) !== "color";
}

function resolveCardRoleState(args: CardRoleArgs): ResolvedCardRoleState {
  const paletteBaseMode = normalizePaletteBaseMode(args.paletteBaseMode);
  const totalCount = Number.isFinite(args.totalCount) ? Number(args.totalCount) : 0;
  const cardIndex = Number.isFinite(args.cardIndex) ? Number(args.cardIndex) : -1;
  const baseCardIndex = getColorModeBaseCardIndex({
    paletteBaseMode,
    effectiveType: args.effectiveType,
    totalCount,
  });
  const complementaryCardIndex = getComplementaryRoleCardIndex({
    paletteBaseMode,
    effectiveType: args.effectiveType,
    totalCount,
  });
  const isBaseCard = paletteBaseMode === "color" && cardIndex === baseCardIndex;
  const isComplementaryCard =
    paletteBaseMode === "color" && cardIndex === complementaryCardIndex && complementaryCardIndex >= 0;
  const hasReadonlyFixedPin = isBaseCard || isComplementaryCard;

  return {
    baseCardIndex,
    complementaryCardIndex,
    isBaseCard,
    isComplementaryCard,
    hasReadonlyFixedPin,
    pinningAvailable: isCardPinningAvailable(paletteBaseMode),
  };
}

function resolvePinnedCardState(
  requestedPinned: unknown,
  roleState: Pick<ResolvedCardRoleState, "hasReadonlyFixedPin" | "pinningAvailable">
) {
  if (roleState.hasReadonlyFixedPin) {
    return true;
  }

  return roleState.pinningAvailable && !!requestedPinned;
}

function getPinnedPaletteIndexes(args: PinnedPaletteIndexesArgs) {
  const entries = Array.isArray(args.entries) ? args.entries : [];
  const totalCount = Number.isFinite(args.totalCount) ? Number(args.totalCount) : entries.length;

  return entries
    .filter((entry) => {
      if (!entry?.pinned) {
        return false;
      }

      if (entry.readonlyFixedPin) {
        return false;
      }

      const roleState = resolveCardRoleState({
        paletteBaseMode: args.paletteBaseMode,
        effectiveType: args.effectiveType,
        totalCount,
        cardIndex: entry.index,
      });

      return !roleState.hasReadonlyFixedPin && roleState.pinningAvailable;
    })
    .map((entry) => entry.index);
}

function shouldHideCardRegenerateButtons(args: {
  paletteBaseMode?: unknown;
  effectiveType?: unknown;
  isMonochromaticScaleActive?: unknown;
}) {
  if (args.isMonochromaticScaleActive) {
    return true;
  }

  if (normalizePaletteBaseMode(args.paletteBaseMode) !== "color") {
    return false;
  }

  const effectiveType = normalizeEffectiveType(args.effectiveType);
  return ["complementary", "analogous", "triad", "tetrad"].includes(
    String(effectiveType || "")
  );
}

function getCardActionVisibilityState(args: CardActionVisibilityArgs) {
  const roleState = resolveCardRoleState(args);
  const canDelete = !!args.canDelete;
  const isPinned = !!args.isPinned;

  return {
    editHidden: isPinned || roleState.isBaseCard || roleState.isComplementaryCard,
    deleteHidden: !canDelete || isPinned || roleState.isBaseCard || roleState.isComplementaryCard,
    pinButtonHidden: !roleState.pinningAvailable || roleState.hasReadonlyFixedPin,
    pinOverlayHidden: !roleState.pinningAvailable && !roleState.hasReadonlyFixedPin,
    pinOverlayAlwaysVisible: roleState.hasReadonlyFixedPin,
    pinOverlayCorner: roleState.hasReadonlyFixedPin,
    pinOverlayReadonly: roleState.hasReadonlyFixedPin,
    pinOverlayFixedRole: roleState.hasReadonlyFixedPin,
  };
}

function getRegenerateButtonState(args: RegenerateButtonStateArgs) {
  const roleState = resolveCardRoleState(args);
  const shouldHideRegenerateButton =
    shouldHideCardRegenerateButtons(args) ||
    roleState.isBaseCard ||
    roleState.isComplementaryCard;

  if (roleState.isBaseCard) {
    return {
      hidden: shouldHideRegenerateButton,
      available: false,
      tooltip: "El color base se ajusta desde el panel de controles",
    };
  }

  if (roleState.isComplementaryCard) {
    return {
      hidden: shouldHideRegenerateButton,
      available: false,
      tooltip: "El complementario se ajusta automáticamente desde el color base",
    };
  }

  if (shouldHideCardRegenerateButtons(args)) {
    return {
      hidden: shouldHideRegenerateButton,
      available: false,
      tooltip: "Ajusta el color base o Brillo/Saturación",
    };
  }

  if (args.isPinned) {
    return {
      hidden: true,
      available: false,
      tooltip: "El color está fijado",
    };
  }

  if (normalizePaletteBaseMode(args.paletteBaseMode) !== "image") {
    return {
      hidden: shouldHideRegenerateButton,
      available: true,
      tooltip: "Regenerar color",
    };
  }

  if (args.regenerateLocked) {
    return {
      hidden: shouldHideRegenerateButton,
      available: false,
      tooltip: "No hay suficiente variedad de colores en la imagen de referencia",
    };
  }

  return {
    hidden: shouldHideRegenerateButton,
    available: !!args.hasImageCandidate,
    tooltip: !!args.hasImageCandidate
      ? "Regenerar color"
      : "No hay suficiente variedad de colores en la imagen de referencia",
  };
}

export const PaletteGeneratorCardsRuntime = {
  normalizePaletteBaseMode,
  normalizeEffectiveType,
  getColorModeBaseCardIndex,
  getComplementaryRoleCardIndex,
  isCardPinningAvailable,
  resolveCardRoleState,
  resolvePinnedCardState,
  getPinnedPaletteIndexes,
  shouldHideCardRegenerateButtons,
  getCardActionVisibilityState,
  getRegenerateButtonState,
};

window.PaletteGeneratorCardsRuntime = PaletteGeneratorCardsRuntime;

export default PaletteGeneratorCardsRuntime;
