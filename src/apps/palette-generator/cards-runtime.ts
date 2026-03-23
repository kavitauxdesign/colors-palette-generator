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

export const PaletteGeneratorCardsRuntime = {
  normalizePaletteBaseMode,
  normalizeEffectiveType,
  getColorModeBaseCardIndex,
  getComplementaryRoleCardIndex,
  isCardPinningAvailable,
  resolveCardRoleState,
  resolvePinnedCardState,
  getPinnedPaletteIndexes,
};

window.PaletteGeneratorCardsRuntime = PaletteGeneratorCardsRuntime;

export default PaletteGeneratorCardsRuntime;
