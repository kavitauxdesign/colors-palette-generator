import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type { PaletteGeneratorAdjustments } from "./types";

type PalettePinnedEntry = {
  index: number;
  hex: string;
};

type PaletteCardEntry = {
  index: number;
  hex: string;
  pinned?: boolean;
  readonlyFixedPin?: boolean;
};

type UpdateRangeControlArgs = {
  input?: HTMLInputElement | null;
  valueLabel?: HTMLElement | null;
  lowIcon?: HTMLElement | null;
  highIcon?: HTMLElement | null;
};

type CapturePaletteAdjustmentBaseArgs = {
  colors?: unknown;
  settings?: Partial<PaletteGeneratorAdjustments> | null;
  defaultBrightness?: number;
  defaultSaturation?: number;
};

type BuildAdjustedPaletteFromBaseArgs = {
  colors?: string[];
  settings: PaletteGeneratorAdjustments;
  baseSettings: PaletteGeneratorAdjustments;
  paletteBaseMode?: string;
  selectedPaletteBaseColor?: string | null;
  getColorModeBaseCardIndex?: ((totalCount: number) => number) | null;
  getComplementaryRoleCardIndex?: ((totalCount: number) => number) | null;
  getAdjustedPaletteColor: (
    hex: string,
    variantIndex: number,
    settings: PaletteGeneratorAdjustments,
    baseSettings: PaletteGeneratorAdjustments
  ) => string;
};

type MergePaletteWithPinnedColorsArgs = {
  nextPalette?: unknown;
  pinnedEntries?: PalettePinnedEntry[];
};

type RenderAdjustedPaletteArgs = {
  colors?: string[];
  pinnedEntries?: PalettePinnedEntry[];
  previewOnly?: boolean;
  getColorCards: () => Element[] | NodeListOf<Element>;
  createColorCard: (
    color: string,
    options?: { pinned?: boolean; suppressUiRefresh?: boolean }
  ) => void;
  setCardColor: (card: Element, color: string) => void;
  setCardPinnedState: (card: Element, isPinned: boolean) => void;
  refreshDeleteButtonsVisibility: () => void;
  updateAddColorButtonState: () => void;
  syncCurrentPaletteFromDom: () => void;
};

type RecentInspiredPaletteArgs = {
  recentPalettes?: string[][];
  colors?: unknown;
  maxCount?: number;
};

type SimilarInspiredPaletteArgs = {
  nextPalette?: unknown;
  recentPalettes?: string[][];
  arePalettesTooSimilar?: ((nextPalette: string[], referencePalette: string[]) => boolean) | null;
};

type GetPinnedPaletteEntriesSnapshotArgs = {
  entries?: PaletteCardEntry[];
  pinningAvailable?: unknown;
  monochromaticScaleActive?: unknown;
  paletteBaseMode?: unknown;
  baseCardIndex?: unknown;
  complementaryCardIndex?: unknown;
};

type CommitGeneratedPaletteArgs = {
  nextPalette?: unknown;
  previousPalette?: unknown;
  pinnedEntries?: PalettePinnedEntry[];
  paletteBaseMode?: unknown;
  effectiveType?: unknown;
  usedAlternativePalette?: unknown;
  paletteHistoryLength?: unknown;
  setPaletteImageExtractionFeedback: (isVisible: boolean) => void;
  getColorCards: () => Element[] | NodeListOf<Element>;
  capturePaletteAdjustmentBase: (colors: string[]) => void;
  buildAdjustedPaletteFromBase: () => string[];
  createColorCard: (
    color: string,
    options?: { pinned?: boolean; suppressUiRefresh?: boolean }
  ) => void;
  syncCurrentPaletteFromDom: () => void;
  saveHistory: (
    colors: string[],
    metadata?: { isAlternative?: boolean; pinnedIndexes?: number[] }
  ) => void;
};

const { normalizeHexColor, isValidHexColor } = AppColorUtils;
const {
  clampControlValue,
  normalizePaletteHexCollection,
  resolvePaletteAdjustmentSettings,
} = PaletteGeneratorCoreHelpers;

function updateRangeControl(args: UpdateRangeControlArgs) {
  const input = args.input;
  if (!input) {
    return;
  }

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);
  const percent = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--value", `${percent}%`);
  if (args.valueLabel) {
    args.valueLabel.textContent = `${Math.round(percent)}%`;
  }

  if (args.lowIcon) {
    args.lowIcon.style.transform = "none";
    args.lowIcon.style.opacity = `${Math.max(0.5, 1 - (percent / 100) * 0.4)}`;
  }

  if (args.highIcon) {
    args.highIcon.style.transform = "none";
    args.highIcon.style.opacity = `${Math.max(0.5, 0.5 + (percent / 100) * 0.4)}`;
  }
}

function capturePaletteAdjustmentBase(args: CapturePaletteAdjustmentBaseArgs = {}) {
  const validColors = Array.isArray(args.colors)
    ? args.colors
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];

  return {
    colors: [...validColors],
    baseSettings: resolvePaletteAdjustmentSettings(
      {
        brightness: Number.isFinite(args.settings?.brightness)
          ? args.settings?.brightness
          : args.defaultBrightness,
        saturation: Number.isFinite(args.settings?.saturation)
          ? args.settings?.saturation
          : args.defaultSaturation,
      },
      {
        brightness: args.defaultBrightness,
        saturation: args.defaultSaturation,
      }
    ),
  };
}

function buildAdjustedPaletteFromBase(
  args: BuildAdjustedPaletteFromBaseArgs
) {
  const colors = Array.isArray(args.colors) ? args.colors : [];
  const adjustedPalette: string[] = [];
  const usedColors = new Set<string>();
  const baseCardIndex =
    args.paletteBaseMode === "color" && typeof args.getColorModeBaseCardIndex === "function"
      ? args.getColorModeBaseCardIndex(colors.length)
      : -1;
  const complementaryCardIndex =
    args.paletteBaseMode === "color" &&
    typeof args.getComplementaryRoleCardIndex === "function"
      ? args.getComplementaryRoleCardIndex(colors.length)
      : -1;

  colors.forEach((color, colorIndex) => {
    if (colorIndex === baseCardIndex && args.paletteBaseMode === "color") {
      const fixedBaseColor = normalizeHexColor(args.selectedPaletteBaseColor || color);
      if (!usedColors.has(fixedBaseColor)) {
        usedColors.add(fixedBaseColor);
        adjustedPalette.push(fixedBaseColor);
        return;
      }
    }

    if (colorIndex === complementaryCardIndex && args.paletteBaseMode === "color") {
      const fixedComplementaryColor = normalizeHexColor(color);
      if (!usedColors.has(fixedComplementaryColor)) {
        usedColors.add(fixedComplementaryColor);
        adjustedPalette.push(fixedComplementaryColor);
        return;
      }
    }

    let fallbackCandidate = normalizeHexColor(color);

    for (let variantIndex = 0; variantIndex < 28; variantIndex += 1) {
      const candidate = args.getAdjustedPaletteColor(
        color,
        variantIndex + colorIndex * 2,
        args.settings,
        args.baseSettings
      );
      fallbackCandidate = candidate || fallbackCandidate;
      if (usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      adjustedPalette.push(candidate);
      return;
    }

    adjustedPalette.push(fallbackCandidate);
  });

  return adjustedPalette;
}

function getPinnedPaletteIndexSet(pinnedEntries: PalettePinnedEntry[] = []) {
  const indexSet = new Set<number>();

  if (!Array.isArray(pinnedEntries)) {
    return indexSet;
  }

  pinnedEntries.forEach((entry) => {
    if (Number.isFinite(entry?.index) && entry.index >= 0) {
      indexSet.add(entry.index);
    }
  });

  return indexSet;
}

function mergePaletteWithPinnedColors(args: MergePaletteWithPinnedColorsArgs = {}) {
  const normalizedPalette = normalizePaletteHexCollection(args.nextPalette);
  if (
    normalizedPalette.length === 0 ||
    !Array.isArray(args.pinnedEntries) ||
    args.pinnedEntries.length === 0
  ) {
    return normalizedPalette;
  }

  const mergedPalette = new Array<string | null>(normalizedPalette.length).fill(null);
  const usedColors = new Set<string>();

  args.pinnedEntries.forEach((entry) => {
    if (!Number.isFinite(entry?.index) || entry.index < 0 || entry.index >= mergedPalette.length) {
      return;
    }

    const normalizedHex = normalizeHexColor(entry.hex);
    if (!isValidHexColor(normalizedHex) || usedColors.has(normalizedHex)) {
      return;
    }

    mergedPalette[entry.index] = normalizedHex;
    usedColors.add(normalizedHex);
  });

  const availableColors = normalizedPalette.filter((color) => !usedColors.has(color));
  let colorCursor = 0;

  for (let index = 0; index < mergedPalette.length; index += 1) {
    if (mergedPalette[index]) {
      continue;
    }

    const nextColor = availableColors[colorCursor];
    if (!nextColor) {
      break;
    }

    mergedPalette[index] = nextColor;
    usedColors.add(nextColor);
    colorCursor += 1;
  }

  return mergedPalette.filter((color): color is string => isValidHexColor(color));
}

function renderAdjustedPalette(args: RenderAdjustedPaletteArgs) {
  const mergedColors = mergePaletteWithPinnedColors({
    nextPalette: args.colors,
    pinnedEntries: args.pinnedEntries,
  });
  const isPreviewOnly = !!args.previewOnly;
  const pinnedIndexes = (Array.isArray(args.pinnedEntries) ? args.pinnedEntries : [])
    .filter(
      (entry) =>
        Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedColors.length
    )
    .map((entry) => entry.index);
  const cards = Array.from(args.getColorCards());

  if (cards.length !== mergedColors.length) {
    Array.from(args.getColorCards()).forEach((card) => card.remove());
    mergedColors.forEach((color, index) => {
      args.createColorCard(color, {
        pinned: pinnedIndexes.includes(index),
        suppressUiRefresh: true,
      });
    });
  } else {
    cards.forEach((card, index) => {
      args.setCardColor(card, mergedColors[index]);
      args.setCardPinnedState(card, pinnedIndexes.includes(index));
    });
  }

  if (isPreviewOnly) {
    return mergedColors;
  }

  args.refreshDeleteButtonsVisibility();
  args.updateAddColorButtonState();
  args.syncCurrentPaletteFromDom();

  return mergedColors;
}

function getComparablePaletteSlice(colors: unknown, pinnedEntries: PalettePinnedEntry[] = []) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);

  if (normalizedColors.length === 0 || pinnedIndexes.size === 0) {
    return normalizedColors;
  }

  return normalizedColors.filter((_, index) => !pinnedIndexes.has(index));
}

function getComparableMergedPaletteSlice(
  colors: unknown,
  pinnedEntries: PalettePinnedEntry[] = []
) {
  return getComparablePaletteSlice(
    mergePaletteWithPinnedColors({
      nextPalette: colors,
      pinnedEntries,
    }),
    pinnedEntries
  );
}

function getMutablePaletteSlotCount(
  totalCount = 0,
  pinnedEntries: PalettePinnedEntry[] = []
) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) {
    return 0;
  }

  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);
  let pinnedCount = 0;

  pinnedIndexes.forEach((index) => {
    if (index < totalCount) {
      pinnedCount += 1;
    }
  });

  return Math.max(0, totalCount - pinnedCount);
}

function getPinnedPaletteEntriesSnapshot(args: GetPinnedPaletteEntriesSnapshotArgs = {}) {
  if (!args.pinningAvailable || args.monochromaticScaleActive) {
    return [] as PalettePinnedEntry[];
  }

  const entries = Array.isArray(args.entries) ? args.entries : [];
  const baseCardIndex = Number.isFinite(args.baseCardIndex) ? Number(args.baseCardIndex) : -1;
  const complementaryCardIndex = Number.isFinite(args.complementaryCardIndex)
    ? Number(args.complementaryCardIndex)
    : -1;

  return entries
    .filter((entry) => {
      if (!entry?.pinned) {
        return false;
      }

      if (entry.readonlyFixedPin) {
        return false;
      }

      if (args.paletteBaseMode === "color" && entry.index === baseCardIndex) {
        return false;
      }

      if (args.paletteBaseMode === "color" && entry.index === complementaryCardIndex) {
        return false;
      }

      return true;
    })
    .map((entry) => ({
      index: Number(entry.index),
      hex: normalizeHexColor(entry.hex),
    }))
    .filter((entry) => Number.isFinite(entry.index) && entry.index >= 0 && isValidHexColor(entry.hex));
}

function commitGeneratedPalette(args: CommitGeneratedPaletteArgs) {
  const previousPalette = normalizePaletteHexCollection(args.previousPalette);
  const pinnedEntries = Array.isArray(args.pinnedEntries) ? args.pinnedEntries : [];
  const mergedPalette = mergePaletteWithPinnedColors({
    nextPalette: args.nextPalette,
    pinnedEntries,
  });
  const pinnedIndexes = pinnedEntries
    .filter(
      (entry) =>
        Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedPalette.length
    )
    .map((entry) => entry.index);
  args.capturePaletteAdjustmentBase(mergedPalette);
  const shouldRenderRawGeneratedPalette =
    args.paletteBaseMode === "color" &&
    ["monochromatic", "complementary", "analogous", "triad", "tetrad"].includes(
      String(args.effectiveType || "")
    );
  const renderedPalette = shouldRenderRawGeneratedPalette
    ? [...mergedPalette]
    : mergePaletteWithPinnedColors({
        nextPalette: args.buildAdjustedPaletteFromBase(),
        pinnedEntries,
      });

  args.setPaletteImageExtractionFeedback(false);
  Array.from(args.getColorCards()).forEach((card) => card.remove());
  renderedPalette.forEach((color, index) => {
    args.createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
      suppressUiRefresh: true,
    });
  });
  args.capturePaletteAdjustmentBase(renderedPalette);
  args.syncCurrentPaletteFromDom();

  const generatedPalette = normalizePaletteHexCollection(renderedPalette);
  const hasExactPaletteChanged =
    previousPalette.length !== generatedPalette.length ||
    previousPalette.some((color, index) => color !== generatedPalette[index]);

  if (hasExactPaletteChanged || !Number.isFinite(args.paletteHistoryLength) || Number(args.paletteHistoryLength) === 0) {
    args.saveHistory(generatedPalette, {
      isAlternative: !!args.usedAlternativePalette,
      pinnedIndexes,
    });
  }

  return {
    mergedPalette,
    renderedPalette,
    pinnedIndexes,
    hasExactPaletteChanged,
  };
}

function clearRecentInspiredPalettes() {
  return [] as string[][];
}

function rememberInspiredPalette(args: RecentInspiredPaletteArgs = {}) {
  const normalizedPalette = normalizePaletteHexCollection(args.colors);
  const currentRecentPalettes = Array.isArray(args.recentPalettes) ? args.recentPalettes : [];

  if (normalizedPalette.length === 0) {
    return [...currentRecentPalettes];
  }

  const signature = normalizedPalette.join("|");
  return currentRecentPalettes
    .filter((palette) => normalizePaletteHexCollection(palette).join("|") !== signature)
    .concat([normalizedPalette])
    .slice(-(Number.isFinite(args.maxCount) ? Number(args.maxCount) : 8));
}

function isPaletteTooSimilarToRecentInspiredPalettes(
  args: SimilarInspiredPaletteArgs = {}
) {
  const normalizedPalette = normalizePaletteHexCollection(args.nextPalette);
  const recentPalettes = Array.isArray(args.recentPalettes) ? args.recentPalettes : [];

  if (
    normalizedPalette.length === 0 ||
    recentPalettes.length === 0 ||
    typeof args.arePalettesTooSimilar !== "function"
  ) {
    return false;
  }

  return recentPalettes.some((palette) =>
    args.arePalettesTooSimilar?.(normalizedPalette, normalizePaletteHexCollection(palette))
  );
}

export const PaletteGeneratorCoreRuntime = {
  updateRangeControl,
  capturePaletteAdjustmentBase,
  buildAdjustedPaletteFromBase,
  getPinnedPaletteIndexSet,
  mergePaletteWithPinnedColors,
  renderAdjustedPalette,
  getComparablePaletteSlice,
  getComparableMergedPaletteSlice,
  getMutablePaletteSlotCount,
  getPinnedPaletteEntriesSnapshot,
  commitGeneratedPalette,
  clearRecentInspiredPalettes,
  rememberInspiredPalette,
  isPaletteTooSimilarToRecentInspiredPalettes,
  clampControlValue,
};

window.PaletteGeneratorCoreRuntime = PaletteGeneratorCoreRuntime;

export default PaletteGeneratorCoreRuntime;
