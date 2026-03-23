import APP_CONSTANTS from "../../shared/constants";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type {
  AnalogousSeparationMode,
  ColorPaletteType,
  MonochromaticGenerationMode,
  PaletteBaseMode,
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

type AutomaticColorPaletteTypeArgs = {
  targetCount?: unknown;
  referenceSaturation?: unknown;
};

type EffectiveColorPaletteTypeArgs = AutomaticColorPaletteTypeArgs & {
  selectedColorPaletteType?: unknown;
};

type ControlVisibilityArgs = {
  paletteBaseMode?: unknown;
  selectedColorPaletteType?: unknown;
};

type CurrentModeSizeArgs = {
  paletteBaseMode?: unknown;
  selectedColorPaletteType?: unknown;
};

type ResolveCurrentModeSizeArgs = CurrentModeSizeArgs & {
  paletteSize?: unknown;
};

const COLOR_MODE_PALETTE_SIZES: Record<ColorPaletteType, number[]> = {
  automatic: [2, 3, 4, 6, 9],
  monochromatic: [6, 9, 12],
  complementary: [2, 6],
  analogous: [3],
  triad: [3],
  tetrad: [4],
};
const MONOCHROMATIC_GENERATION_MODES = new Set<MonochromaticGenerationMode>([
  "automatic",
  "shades",
  "tints",
]);
const ANALOGOUS_SEPARATION_MODES = new Set<AnalogousSeparationMode>([
  "soft",
  "medium",
  "intense",
]);

const {
  normalizePaletteHexCollection,
  getPaletteSimilarityMetrics,
  getPalettePositionalSimilarityMetrics,
  arePalettesTooSimilar,
  isBetterPaletteFallbackCandidate,
  scorePaletteHarmony,
} = PaletteGeneratorCoreHelpers;

function normalizeColorPaletteType(value: unknown): ColorPaletteType {
  return Object.prototype.hasOwnProperty.call(COLOR_MODE_PALETTE_SIZES, value)
    ? (value as ColorPaletteType)
    : (APP_CONSTANTS.DEFAULT_COLOR_PALETTE_TYPE as ColorPaletteType);
}

function normalizeMonochromaticGenerationMode(value: unknown): MonochromaticGenerationMode {
  return MONOCHROMATIC_GENERATION_MODES.has(value as MonochromaticGenerationMode)
    ? (value as MonochromaticGenerationMode)
    : (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode);
}

function normalizeAnalogousSeparationMode(value: unknown): AnalogousSeparationMode {
  return ANALOGOUS_SEPARATION_MODES.has(value as AnalogousSeparationMode)
    ? (value as AnalogousSeparationMode)
    : (APP_CONSTANTS.DEFAULT_ANALOGOUS_SEPARATION_MODE as AnalogousSeparationMode);
}

function getAllowedPaletteSizesForType(type: unknown) {
  return COLOR_MODE_PALETTE_SIZES[normalizeColorPaletteType(type)] ||
    COLOR_MODE_PALETTE_SIZES.automatic;
}

function getDefaultPaletteSizeForType(type: unknown) {
  if (type === "monochromatic") {
    return 9;
  }

  const allowedSizes = getAllowedPaletteSizesForType(type);
  return allowedSizes[0];
}

function resolveAutomaticColorPaletteType(
  args: AutomaticColorPaletteTypeArgs
): Exclude<ColorPaletteType, "automatic"> {
  const targetCount = Number.isFinite(args.targetCount) ? Number(args.targetCount) : 0;

  if (targetCount === 2) {
    return "complementary";
  }

  if (targetCount === 3) {
    return "triad";
  }

  if (targetCount === 4) {
    return "tetrad";
  }

  if (targetCount === 6) {
    return "analogous";
  }

  const referenceSaturation = Number.isFinite(args.referenceSaturation)
    ? Number(args.referenceSaturation)
    : 0;
  return referenceSaturation <= 42 ? "monochromatic" : "analogous";
}

function getEffectiveColorPaletteType(
  args: EffectiveColorPaletteTypeArgs
): Exclude<ColorPaletteType, "automatic"> {
  const selectedType = normalizeColorPaletteType(args.selectedColorPaletteType);
  if (selectedType !== "automatic") {
    return selectedType;
  }

  return resolveAutomaticColorPaletteType(args);
}

function isColorModeMonochromaticScaleActive(args: EffectiveColorPaletteTypeArgs & {
  paletteBaseMode?: unknown;
}) {
  return (
    args.paletteBaseMode === "color" &&
    getEffectiveColorPaletteType(args) === "monochromatic"
  );
}

function getAllowedPaletteSizesForCurrentMode(args: CurrentModeSizeArgs) {
  if (args.paletteBaseMode !== "color") {
    return [3, 6, 9];
  }

  return getAllowedPaletteSizesForType(args.selectedColorPaletteType);
}

function getNearestAllowedPaletteSize(nextSize: unknown, allowedSizes: number[]) {
  const resolvedNextSize = Number.isFinite(nextSize) ? Number(nextSize) : allowedSizes[0] || 0;
  if (allowedSizes.includes(resolvedNextSize)) {
    return resolvedNextSize;
  }

  return [...allowedSizes]
    .sort((left, right) => {
      const leftDistance = Math.abs(left - resolvedNextSize);
      const rightDistance = Math.abs(right - resolvedNextSize);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left - right;
    })[0];
}

function resolvePaletteSizeForType(type: unknown, nextSize: unknown) {
  const allowedSizes = getAllowedPaletteSizesForType(type);

  if (allowedSizes.includes(Number(nextSize))) {
    return Number(nextSize);
  }

  const defaultSize = getDefaultPaletteSizeForType(type);
  if (allowedSizes.includes(defaultSize)) {
    return defaultSize;
  }

  return getNearestAllowedPaletteSize(nextSize, allowedSizes);
}

function resolveCurrentModePaletteSize(args: ResolveCurrentModeSizeArgs) {
  const allowedSizes = getAllowedPaletteSizesForCurrentMode(args);
  const nextSize = args.selectedColorPaletteType === "monochromatic"
    ? resolvePaletteSizeForType(args.selectedColorPaletteType, args.paletteSize)
    : getNearestAllowedPaletteSize(args.paletteSize, allowedSizes);

  return {
    allowedSizes,
    nextSize,
  };
}

function shouldShowMonochromaticModeControl(args: ControlVisibilityArgs) {
  return args.paletteBaseMode === "color" &&
    normalizeColorPaletteType(args.selectedColorPaletteType) === "monochromatic";
}

function shouldShowAnalogousSeparationControl(args: ControlVisibilityArgs) {
  return args.paletteBaseMode === "color" &&
    normalizeColorPaletteType(args.selectedColorPaletteType) === "analogous";
}

function getPaletteTypeDisplayLabel(type: unknown) {
  switch (normalizeColorPaletteType(type)) {
    case "monochromatic":
      return "Monocromática";
    case "complementary":
      return "Complementaria";
    case "analogous":
      return "Análoga";
    case "triad":
      return "Triada";
    case "tetrad":
      return "Tétrada";
    default:
      return "Automática";
  }
}

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
  normalizeColorPaletteType,
  normalizeMonochromaticGenerationMode,
  normalizeAnalogousSeparationMode,
  getAllowedPaletteSizesForType,
  getDefaultPaletteSizeForType,
  resolveAutomaticColorPaletteType,
  getEffectiveColorPaletteType,
  isColorModeMonochromaticScaleActive,
  getAllowedPaletteSizesForCurrentMode,
  getNearestAllowedPaletteSize,
  resolvePaletteSizeForType,
  resolveCurrentModePaletteSize,
  shouldShowMonochromaticModeControl,
  shouldShowAnalogousSeparationControl,
  getPaletteTypeDisplayLabel,
  createColorModePaletteCandidate,
  getColorModeRegenerationColorForCard,
};

window.PaletteGeneratorColorModeRuntime = PaletteGeneratorColorModeRuntime;

export default PaletteGeneratorColorModeRuntime;
