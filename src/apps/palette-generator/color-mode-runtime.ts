import PaletteGeneratorCoreHelpers from "./core-helpers";
import type {
  ColorPaletteType,
  PaletteGeneratorAdjustments,
} from "./types";
import type { ParsedCssColor } from "../../shared/color/color-utils";

type PalettePinnedEntry = {
  index: number;
  hex: string;
};

type ColorModePaletteCandidate = {
  palette: string[];
  effectiveType: ColorPaletteType;
  variantIndex: number;
  samePositionCount: number;
  isTooSimilar: boolean;
  score: number;
} | null;

type BuildPaletteForSettingsFn = (
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options?: {
    baseColor?: ParsedCssColor | null;
    effectiveType?: ColorPaletteType | null;
    variantIndex?: number;
  }
) => string[];

type ComparablePaletteSliceFn = (
  colors: string[],
  pinnedEntries: PalettePinnedEntry[]
) => string[];

type CreateColorModePaletteCandidateArgs = {
  paletteSize: number;
  currentPalette?: string[];
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined;
  effectiveType: ColorPaletteType;
  currentVariantIndex?: number;
  attemptCount?: number;
  pinnedEntries?: PalettePinnedEntry[];
  referencePalette?: string[];
  baseColor?: ParsedCssColor | null;
  buildColorModePaletteForSettings: BuildPaletteForSettingsFn;
  getComparablePaletteSlice: ComparablePaletteSliceFn;
  getComparableMergedPaletteSlice: ComparablePaletteSliceFn;
};

type GetColorModeRegenerationColorForCardArgs = CreateColorModePaletteCandidateArgs & {
  cardIndex: number;
  currentHex?: string;
  existingColors?: Set<string>;
};

const {
  normalizePaletteHexCollection,
  getPaletteSimilarityMetrics,
  getPalettePositionalSimilarityMetrics,
  arePalettesTooSimilar,
  isBetterPaletteFallbackCandidate,
  scorePaletteHarmony,
} = PaletteGeneratorCoreHelpers;

function createScoredCandidate(
  palette: string[],
  effectiveType: ColorPaletteType,
  variantIndex: number,
  pinnedEntries: PalettePinnedEntry[],
  referencePalette: string[],
  getComparableMergedPaletteSlice: ComparablePaletteSliceFn,
  applySimilarityPenalty = false
) {
  const comparablePalette = getComparableMergedPaletteSlice(palette, pinnedEntries);
  const similarityMetrics = getPaletteSimilarityMetrics(comparablePalette, referencePalette);
  const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
    comparablePalette,
    referencePalette
  );
  const similarityPenalty = applySimilarityPenalty
    ? similarityMetrics.sharedColorCount / Math.max(comparablePalette.length, 1)
    : 0;

  return {
    palette,
    effectiveType,
    variantIndex,
    samePositionCount: positionalSimilarityMetrics.samePositionCount,
    isTooSimilar: arePalettesTooSimilar(comparablePalette, referencePalette),
    score: scorePaletteHarmony(palette) - similarityPenalty * 0.8,
  };
}

function buildSingleVariantCandidate(
  args: CreateColorModePaletteCandidateArgs,
  variantIndex: number,
  effectiveType: ColorPaletteType
): ColorModePaletteCandidate {
  const pinnedEntries = Array.isArray(args.pinnedEntries) ? args.pinnedEntries : [];
  const referencePalette = normalizePaletteHexCollection(
    args.getComparablePaletteSlice(
      Array.isArray(args.referencePalette) ? args.referencePalette : (args.currentPalette || []),
      pinnedEntries
    )
  );
  const palette = args.buildColorModePaletteForSettings(args.paletteSize, args.settings, {
    baseColor: args.baseColor || null,
    effectiveType,
    variantIndex,
  });

  if (palette.length !== args.paletteSize) {
    return null;
  }

  return createScoredCandidate(
    palette,
    effectiveType,
    variantIndex,
    pinnedEntries,
    referencePalette,
    args.getComparableMergedPaletteSlice
  );
}

function createColorModePaletteCandidate(
  args: CreateColorModePaletteCandidateArgs
): ColorModePaletteCandidate {
  const safePaletteSize = Number.isFinite(args.paletteSize) ? Math.max(1, Number(args.paletteSize)) : 1;
  const currentVariantIndex = Number.isFinite(args.currentVariantIndex)
    ? Number(args.currentVariantIndex)
    : 0;
  const attemptCount = Number.isFinite(args.attemptCount)
    ? Math.max(1, Number(args.attemptCount))
    : Math.max(18, safePaletteSize * 6);
  const pinnedEntries = Array.isArray(args.pinnedEntries) ? args.pinnedEntries : [];
  const referencePalette = normalizePaletteHexCollection(
    args.getComparablePaletteSlice(
      Array.isArray(args.referencePalette) ? args.referencePalette : (args.currentPalette || []),
      pinnedEntries
    )
  );
  const effectiveType = args.effectiveType;

  if (
    effectiveType === "monochromatic" ||
    effectiveType === "complementary" ||
    effectiveType === "triad"
  ) {
    return buildSingleVariantCandidate(args, 0, effectiveType);
  }

  if (effectiveType === "tetrad") {
    let bestCandidate: ColorModePaletteCandidate = null;

    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const variantForAttempt = currentVariantIndex + 1 + attempt;
      const palette = args.buildColorModePaletteForSettings(safePaletteSize, args.settings, {
        baseColor: args.baseColor || null,
        effectiveType,
        variantIndex: variantForAttempt,
      });

      if (palette.length !== safePaletteSize) {
        continue;
      }

      const candidate = createScoredCandidate(
        palette,
        effectiveType,
        variantForAttempt,
        pinnedEntries,
        referencePalette,
        args.getComparableMergedPaletteSlice
      );

      if (!bestCandidate || isBetterPaletteFallbackCandidate(candidate, bestCandidate)) {
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  let bestDistinctCandidate: ColorModePaletteCandidate = null;
  let bestFallbackCandidate: ColorModePaletteCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const variantIndex = currentVariantIndex + 1 + attempt;
    const palette = args.buildColorModePaletteForSettings(safePaletteSize, args.settings, {
      baseColor: args.baseColor || null,
      effectiveType,
      variantIndex,
    });

    if (palette.length !== safePaletteSize) {
      continue;
    }

    const candidate = createScoredCandidate(
      palette,
      effectiveType,
      variantIndex,
      pinnedEntries,
      referencePalette,
      args.getComparableMergedPaletteSlice,
      true
    );

    if (isBetterPaletteFallbackCandidate(candidate, bestFallbackCandidate)) {
      bestFallbackCandidate = candidate;
    }

    if (
      candidate.samePositionCount === 0 &&
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

function getColorModeRegenerationColorForCard(
  args: GetColorModeRegenerationColorForCardArgs
) {
  const cardIndex = Number.isFinite(args.cardIndex) ? Number(args.cardIndex) : -1;
  const currentHex = String(args.currentHex || "").trim().toUpperCase();
  const existingColors = args.existingColors instanceof Set
    ? new Set(Array.from(args.existingColors))
    : new Set<string>();

  if (cardIndex <= 0) {
    return null;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = createColorModePaletteCandidate({
      ...args,
      attemptCount: 1,
    });

    if (!candidate?.palette?.[cardIndex]) {
      continue;
    }

    const nextColor = candidate.palette[cardIndex];
    if (nextColor && nextColor !== currentHex && !existingColors.has(nextColor)) {
      return {
        color: nextColor,
        variantIndex: candidate.variantIndex,
      };
    }
  }

  return null;
}

export const PaletteGeneratorColorModeRuntime = {
  createColorModePaletteCandidate,
  getColorModeRegenerationColorForCard,
};

window.PaletteGeneratorColorModeRuntime = PaletteGeneratorColorModeRuntime;

export default PaletteGeneratorColorModeRuntime;
