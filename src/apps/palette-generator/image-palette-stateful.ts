import PaletteGeneratorCoreHelpers from "./core-helpers";
import PaletteGeneratorImagePaletteHelpers from "./image-palette-helpers";
import type {
  ImagePaletteAtmosphere,
  ImagePaletteCluster,
} from "./image-types";

type PinnedPaletteEntry = {
  index?: number;
  hex?: string;
  [key: string]: unknown;
};

type PalettePositionSimilarityMetrics = ReturnType<
  typeof PaletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics
>;

type InspiredPaletteValidation = ReturnType<
  typeof PaletteGeneratorImagePaletteHelpers.validateInspiredPaletteCandidate
>;

type DerivedPaletteAdjustmentSettings = ReturnType<
  typeof PaletteGeneratorImagePaletteHelpers.derivePaletteAdjustmentSettingsFromColors
>;

type InspiredPaletteCandidate = {
  palette: string[];
  mergedPalette?: string[];
  variantIndex: number;
  validation: InspiredPaletteValidation | null;
  isTooSimilarToRecentInspired?: boolean;
  settings: DerivedPaletteAdjustmentSettings;
  score?: number;
};

type StatefulDeps = {
  getCachedImageColorClusters: () => ImagePaletteCluster[];
  getImagePaletteVariantHex: (
    cluster: ImagePaletteCluster,
    clusterIndex: number,
    variantIndex: number
  ) => string | null;
  isDisallowedColor: (hex: string) => boolean;
  getNearestColorName?: (hex: string) => string;
  getImageClusterPriorityScore: (
    cluster: ImagePaletteCluster,
    allClusters: ImagePaletteCluster[],
    selectedClusters?: ImagePaletteCluster[]
  ) => number;
  orderImageClustersByHarmony: (clusters: ImagePaletteCluster[]) => ImagePaletteCluster[];
  expandImagePalette: (
    selectedClusters: ImagePaletteCluster[],
    targetCount: number,
    variantIndex: number,
    seedPalette?: string[]
  ) => string[];
  mergePaletteWithPinnedColors: (
    palette: string[],
    pinnedEntries: PinnedPaletteEntry[]
  ) => string[];
  getPinnedPaletteIndexSet: (pinnedEntries: PinnedPaletteEntry[]) => Set<number>;
  getComparablePaletteSlice: (
    colors: string[],
    pinnedEntries: PinnedPaletteEntry[]
  ) => string[];
  getPalettePositionalSimilarityMetrics: (
    nextPalette: string[],
    referencePalette: string[]
  ) => PalettePositionSimilarityMetrics;
  arePalettesTooSimilar: (nextPalette: string[], referencePalette: string[]) => boolean;
  selectRelevantImageClusters: (
    clusters: ImagePaletteCluster[],
    targetCount: number,
    variantIndex?: number
  ) => ImagePaletteCluster[];
  buildInspiredPaletteFromClusters: (
    selectedClusters: ImagePaletteCluster[],
    targetCount: number,
    variantIndex: number,
    atmosphere: ImagePaletteAtmosphere
  ) => string[];
  orderPaletteHexColorsByHarmony: (colors: string[]) => string[];
  isPaletteTooSimilarToRecentInspiredPalettes: (
    nextPalette: string[],
    recentPalettes: string[][]
  ) => boolean;
  getComparableMergedPaletteSlice: (
    colors: string[],
    pinnedEntries: PinnedPaletteEntry[]
  ) => string[];
};

type CandidateColorArgs = {
  existingColors?: Set<string>;
  adjacentBaseNames?: string[];
  options?: Record<string, unknown>;
  imagePaletteVariantIndex?: number;
  imagePaletteVariantProfileCount?: number;
  deps: StatefulDeps;
};

type AlternativeColorArgs = {
  existingColors?: Set<string>;
  excludedColors?: Set<string>;
  variantSeed?: number;
  maxVariantSweeps?: number;
  imagePaletteVariantProfileCount?: number;
  deps: StatefulDeps;
};

type BuildImagePaletteCandidateArgs = {
  selectedClusters: ImagePaletteCluster[];
  targetCount: number;
  variantIndex: number;
  deps: StatefulDeps;
};

type EnsureMutableSlotsArgs = {
  candidatePalette: string[];
  referencePalette: string[];
  pinnedEntries: PinnedPaletteEntry[];
  variantSeed?: number;
  imagePaletteVariantProfileCount?: number;
  deps: StatefulDeps;
};

type BuildImageBasedPaletteCandidateArgs = {
  targetCount: number;
  clusters: ImagePaletteCluster[];
  pinnedEntries: PinnedPaletteEntry[];
  referencePalette: string[];
  referenceSourcePalette: string[];
  variantStartIndex: number;
  maxVariantAttempts: number;
  deps: StatefulDeps;
};

type BuildInspiredImagePaletteCandidateArgs = {
  targetCount: number;
  clusters: ImagePaletteCluster[];
  pinnedEntries: PinnedPaletteEntry[];
  atmosphere: ImagePaletteAtmosphere;
  referencePalette: string[];
  recentInspiredReferences: string[][];
  startVariantIndex: number;
  maxVariantAttempts: number;
  imageInspirationVariantProfileCount: number;
  deps: StatefulDeps;
};

const {
  normalizePaletteHexCollection,
  getPaletteSimilarityMetrics,
  scorePaletteElegance,
  scorePaletteHarmony,
  resolvePaletteAdjustmentSettings,
} = PaletteGeneratorCoreHelpers;
const {
  getImageInspirationAtmosphere,
  validateInspiredPaletteCandidate,
  derivePaletteAdjustmentSettingsFromColors,
} = PaletteGeneratorImagePaletteHelpers;

function getImageBasedCandidateColor(args: CandidateColorArgs) {
  const {
    deps,
    imagePaletteVariantIndex = 0,
    imagePaletteVariantProfileCount = 1,
  } = args;
  const imageClusters = deps.getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  const existingColors = args.existingColors instanceof Set ? args.existingColors : new Set();
  const adjacentBaseNames = Array.isArray(args.adjacentBaseNames) ? args.adjacentBaseNames : [];
  const options = args.options && typeof args.options === "object" ? args.options : {};
  const excludedColors = options.excludedColors instanceof Set
    ? options.excludedColors
    : new Set();
  const variantSeed = Number.isFinite(options.variantSeed)
    ? Math.max(0, Number(options.variantSeed))
    : Math.max(0, imagePaletteVariantIndex + 1);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, Number(options.maxVariantSweeps))
    : Math.max(8, imagePaletteVariantProfileCount * 3);
  let bestCandidate: string | null = null;
  let bestConflictCount = Infinity;
  let bestPriorityScore = -Infinity;

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    imageClusters.forEach((cluster, clusterIndex) => {
      const candidate = deps.getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        deps.isDisallowedColor(candidate)
      ) {
        return;
      }

      const candidateBaseName =
        typeof deps.getNearestColorName === "function"
          ? deps.getNearestColorName(candidate)
          : "";
      const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
        return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
      }, 0);
      const priorityScore =
        deps.getImageClusterPriorityScore(cluster, imageClusters) - variantOffset * 0.04;

      if (conflictCount === 0) {
        if (priorityScore > bestPriorityScore) {
          bestCandidate = candidate;
          bestConflictCount = 0;
          bestPriorityScore = priorityScore;
        }
        return;
      }

      if (
        conflictCount < bestConflictCount ||
        (conflictCount === bestConflictCount && priorityScore > bestPriorityScore)
      ) {
        bestCandidate = candidate;
        bestConflictCount = conflictCount;
        bestPriorityScore = priorityScore;
      }
    });

    if (bestCandidate && bestConflictCount === 0) {
      break;
    }
  }

  return bestCandidate;
}

function getAlternativeImagePaletteColor(args: AlternativeColorArgs) {
  const {
    deps,
    variantSeed = 0,
    imagePaletteVariantProfileCount = 1,
  } = args;
  const clusters = deps.getCachedImageColorClusters();
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return null;
  }

  const existingColors = args.existingColors instanceof Set ? args.existingColors : new Set();
  const excludedColors = args.excludedColors instanceof Set ? args.excludedColors : new Set();
  const maxVariantSweeps = Number.isFinite(args.maxVariantSweeps)
    ? Math.max(1, Number(args.maxVariantSweeps))
    : Math.max(12, imagePaletteVariantProfileCount * 6);

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex += 1) {
      const cluster = clusters[clusterIndex];
      const candidate = deps.getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        deps.isDisallowedColor(candidate)
      ) {
        continue;
      }

      return candidate;
    }
  }

  return null;
}

function buildImagePaletteCandidate(args: BuildImagePaletteCandidateArgs) {
  const harmonyOrderedClusters = args.deps.orderImageClustersByHarmony(args.selectedClusters);
  const basePalette: string[] = [];
  const usedColors = new Set<string>();

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    const variantHex = args.deps.getImagePaletteVariantHex(
      cluster,
      clusterIndex,
      args.variantIndex
    );
    const nextHex =
      !usedColors.has(variantHex || "") && !args.deps.isDisallowedColor(variantHex || "")
        ? variantHex
        : cluster.hex;

    if (!nextHex || usedColors.has(nextHex) || args.deps.isDisallowedColor(nextHex)) {
      return;
    }

    usedColors.add(nextHex);
    basePalette.push(nextHex);
  });

  return args.deps.expandImagePalette(
    harmonyOrderedClusters,
    args.targetCount,
    args.variantIndex,
    basePalette
  );
}

function ensureMutableImagePaletteSlotsChange(args: EnsureMutableSlotsArgs) {
  const mergedPalette = args.deps.mergePaletteWithPinnedColors(
    args.candidatePalette,
    args.pinnedEntries
  );
  const normalizedReferencePalette = normalizePaletteHexCollection(args.referencePalette);
  const pinnedIndexSet = args.deps.getPinnedPaletteIndexSet(args.pinnedEntries);
  const nextPalette = [...mergedPalette];

  nextPalette.forEach((color, index) => {
    if (pinnedIndexSet.has(index)) {
      return;
    }

    const referenceColor = normalizedReferencePalette[index];
    if (!referenceColor || referenceColor !== color) {
      return;
    }

    const existingColors = new Set(
      nextPalette.filter((entry, entryIndex) => entryIndex !== index)
    );
    const alternative = getAlternativeImagePaletteColor({
      existingColors,
      excludedColors: new Set([color]),
      variantSeed: (args.variantSeed || 0) + index * 3,
      imagePaletteVariantProfileCount: args.imagePaletteVariantProfileCount,
      deps: args.deps,
    });

    if (alternative) {
      nextPalette[index] = alternative;
    }
  });

  return nextPalette;
}

function buildImageBasedPaletteCandidate(args: BuildImageBasedPaletteCandidateArgs) {
  let fallbackPalette: string[] = [];
  let fallbackVariantIndex = args.variantStartIndex;
  let fallbackSamePositionCount = Infinity;

  for (let attempt = 0; attempt < args.maxVariantAttempts; attempt += 1) {
    const variantIndex = args.variantStartIndex + attempt;
    const selectedClusters = args.deps.selectRelevantImageClusters(
      args.clusters,
      args.targetCount,
      variantIndex
    );
    const candidatePalette = buildImagePaletteCandidate({
      selectedClusters,
      targetCount: args.targetCount,
      variantIndex,
      deps: args.deps,
    });
    const repairedPalette = ensureMutableImagePaletteSlotsChange({
      candidatePalette,
      referencePalette: args.referenceSourcePalette,
      pinnedEntries: args.pinnedEntries,
      variantSeed: variantIndex,
      deps: args.deps,
    });
    const candidateComparablePalette = args.deps.getComparablePaletteSlice(
      repairedPalette,
      args.pinnedEntries
    );
    const positionalSimilarityMetrics = args.deps.getPalettePositionalSimilarityMetrics(
      candidateComparablePalette,
      args.referencePalette
    );

    if (candidatePalette.length === 0) {
      continue;
    }

    if (positionalSimilarityMetrics.samePositionCount < fallbackSamePositionCount) {
      fallbackPalette = repairedPalette;
      fallbackVariantIndex = variantIndex;
      fallbackSamePositionCount = positionalSimilarityMetrics.samePositionCount;
    }

    if (
      positionalSimilarityMetrics.samePositionCount === 0 &&
      !args.deps.arePalettesTooSimilar(candidateComparablePalette, args.referencePalette)
    ) {
      return {
        palette: repairedPalette,
        variantIndex,
      };
    }
  }

  return {
    palette: fallbackPalette,
    variantIndex: fallbackVariantIndex,
  };
}

function buildInspiredImagePaletteCandidate(args: BuildInspiredImagePaletteCandidateArgs) {
  const safeTargetCount = Number.isFinite(args.targetCount) && args.targetCount > 0
    ? args.targetCount
    : 5;
  let fallbackCandidate: InspiredPaletteCandidate | null = null;
  let bestCandidate: InspiredPaletteCandidate | null = null;

  for (let attempt = 0; attempt < args.maxVariantAttempts; attempt += 1) {
    const variantIndex = args.startVariantIndex + attempt;
    const selectedClusters = args.deps.selectRelevantImageClusters(
      args.clusters,
      Math.min(args.clusters.length, Math.max(safeTargetCount + 3, 6)),
      variantIndex
    );
    const extractedReferencePalette = args.deps
      .orderImageClustersByHarmony(selectedClusters)
      .map((cluster) => cluster.hex)
      .slice(0, safeTargetCount);
    const candidatePalette = args.deps.buildInspiredPaletteFromClusters(
      selectedClusters,
      safeTargetCount,
      variantIndex,
      args.atmosphere
    );
    const orderedPalette = args.deps.orderPaletteHexColorsByHarmony(candidatePalette);
    const mergedOrderedPalette = args.deps.mergePaletteWithPinnedColors(
      orderedPalette,
      args.pinnedEntries
    );
    const comparableOrderedPalette = args.deps.getComparablePaletteSlice(
      mergedOrderedPalette,
      args.pinnedEntries
    );

    if (orderedPalette.length === 0) {
      continue;
    }

    const validation = validateInspiredPaletteCandidate(
      orderedPalette,
      extractedReferencePalette,
      args.clusters,
      args.atmosphere
    );
    const isTooSimilarToRecentInspired = args.deps.isPaletteTooSimilarToRecentInspiredPalettes(
      comparableOrderedPalette,
      args.recentInspiredReferences
    );
    const similarityToCurrent =
      getPaletteSimilarityMetrics(comparableOrderedPalette, args.referencePalette).sharedColorCount /
      Math.max(comparableOrderedPalette.length, 1);
    const eleganceScore = scorePaletteElegance(mergedOrderedPalette);
    const score =
      scorePaletteHarmony(mergedOrderedPalette) +
      eleganceScore * 1.2 +
      validation.atmosphereAlignmentScore * 1.8 +
      validation.inspirationDistanceScore * 1.45 +
      (validation.isCoherentWithImage ? 0.45 : 0) -
      similarityToCurrent * 1.05 -
      validation.sharedColorRatioToExtraction * 1.2 -
      (isTooSimilarToRecentInspired ? 1.1 : 0) -
      (validation.isExactExtractionCopy ? 1.4 : 0) -
      (validation.hasRepeatedColors ? 3 : 0);
    const candidate = {
      palette: orderedPalette,
      mergedPalette: mergedOrderedPalette,
      variantIndex,
      validation,
      isTooSimilarToRecentInspired,
      settings: derivePaletteAdjustmentSettingsFromColors(mergedOrderedPalette),
      score,
    };

    if (
      !fallbackCandidate ||
      (fallbackCandidate.isTooSimilarToRecentInspired && !candidate.isTooSimilarToRecentInspired) ||
      (
        fallbackCandidate.isTooSimilarToRecentInspired === candidate.isTooSimilarToRecentInspired &&
        candidate.score > fallbackCandidate.score
      )
    ) {
      fallbackCandidate = candidate;
    }

    if (
      !validation.hasRepeatedColors &&
      !validation.isExactExtractionCopy &&
      !isTooSimilarToRecentInspired &&
      validation.averageNearestClusterDistance >= 34 &&
      validation.atmosphereAlignmentScore >= 0.42 &&
      !args.deps.arePalettesTooSimilar(comparableOrderedPalette, args.referencePalette) &&
      (!bestCandidate || candidate.score > bestCandidate.score)
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate || fallbackCandidate || {
    palette: [],
    variantIndex: args.startVariantIndex,
    validation: null,
    settings: resolvePaletteAdjustmentSettings(),
  };
}

export const PaletteGeneratorImagePaletteStateful = {
  getImageBasedCandidateColor,
  getAlternativeImagePaletteColor,
  buildImagePaletteCandidate,
  ensureMutableImagePaletteSlotsChange,
  buildImageBasedPaletteCandidate,
  buildInspiredImagePaletteCandidate,
  getImageInspirationAtmosphere,
};

window.PaletteGeneratorImagePaletteStateful = PaletteGeneratorImagePaletteStateful;

export default PaletteGeneratorImagePaletteStateful;
