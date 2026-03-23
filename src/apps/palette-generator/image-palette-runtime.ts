import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import PaletteGeneratorImagePaletteHelpers from "./image-palette-helpers";
import PaletteGeneratorImagePaletteStateful, {
  type ImagePaletteInspiredCandidate,
  type ImagePalettePinnedEntry,
  type ImagePaletteStatefulDeps,
} from "./image-palette-stateful";
import type { ImagePaletteCluster } from "./image-types";

type RuntimeOptions = Record<string, unknown>;

type ImagePaletteBuildCandidateArgs = {
  targetCount: number;
  uploadedImageDataUrl?: string | null;
  imagePaletteVariantIndex: number;
  imagePaletteVariantProfileCount: number;
  currentPalette: string[];
  paletteAdjustmentBase: string[];
  options?: RuntimeOptions;
  deps: ImagePaletteStatefulDeps;
  getImageColorClusters: () => Promise<ImagePaletteCluster[]>;
  getPinnedPaletteEntriesSnapshot: () => ImagePalettePinnedEntry[];
  getComparablePaletteSlice: (
    colors: string[],
    pinnedEntries: ImagePalettePinnedEntry[]
  ) => string[];
};

type ImagePaletteBuildInspiredArgs = {
  targetCount: number;
  uploadedImageDataUrl?: string | null;
  imageInspirationVariantIndex: number;
  imageInspirationVariantProfileCount: number;
  currentPalette: string[];
  recentInspiredPalettes: string[][];
  options?: RuntimeOptions;
  deps: ImagePaletteStatefulDeps;
  getImageColorClusters: () => Promise<ImagePaletteCluster[]>;
  getPinnedPaletteEntriesSnapshot: () => ImagePalettePinnedEntry[];
  getComparablePaletteSlice: (
    colors: string[],
    pinnedEntries: ImagePalettePinnedEntry[]
  ) => string[];
  getComparableMergedPaletteSlice: (
    colors: string[],
    pinnedEntries: ImagePalettePinnedEntry[]
  ) => string[];
};

type ImageRegenerationArgs = {
  adjacentBaseNames?: string[];
  currentHex?: string;
  cardIndex?: number;
  existingColors?: Set<string>;
  imagePaletteVariantIndex: number;
  imagePaletteVariantProfileCount: number;
  isValidPaletteHex: (hex: string) => boolean;
  options?: RuntimeOptions;
  deps: ImagePaletteStatefulDeps;
};

const { normalizeHexColor, hexToHsl, hexToOklch } = AppColorUtils;
const { normalizePaletteHexCollection, resolvePaletteAdjustmentSettings } =
  PaletteGeneratorCoreHelpers;
const { getImageInspirationAtmosphere } = PaletteGeneratorImagePaletteHelpers;

function toStringSet(value: unknown) {
  if (!(value instanceof Set)) {
    return new Set<string>();
  }

  return new Set(
    Array.from(value).filter((entry): entry is string => typeof entry === "string")
  );
}

function getImageRegenerationColorForCard(args: ImageRegenerationArgs) {
  const existingColors = toStringSet(args.existingColors);
  const adjacentBaseNames = Array.isArray(args.adjacentBaseNames) ? args.adjacentBaseNames : [];
  const currentHex = normalizeHexColor(args.currentHex || "");
  const cardIndex = Number.isFinite(args.cardIndex) ? Number(args.cardIndex) : -1;
  const options =
    args.options && typeof args.options === "object" ? args.options : ({} as RuntimeOptions);
  const excludedColors = toStringSet(options.excludedColors);

  if (args.isValidPaletteHex(currentHex)) {
    excludedColors.add(currentHex);
  }

  const variantSeedBase = Number.isFinite(options.variantSeed)
    ? Math.max(0, Number(options.variantSeed))
    : args.imagePaletteVariantIndex + 1;
  const variantSeedOffset = Number.isFinite(options.variantSeedOffset)
    ? Number(options.variantSeedOffset)
    : 0;
  const variantSeed =
    variantSeedBase +
    variantSeedOffset +
    (cardIndex >= 0 ? cardIndex * 2 : 0);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, Number(options.maxVariantSweeps))
    : Math.max(12, args.imagePaletteVariantProfileCount * 6);
  const candidate = PaletteGeneratorImagePaletteStateful.getImageBasedCandidateColor({
    existingColors,
    adjacentBaseNames,
    options: {
      ...options,
      excludedColors,
      variantSeed,
      maxVariantSweeps,
    },
    imagePaletteVariantIndex: args.imagePaletteVariantIndex,
    imagePaletteVariantProfileCount: args.imagePaletteVariantProfileCount,
    deps: args.deps,
  });

  const fallbackCandidate =
    candidate ||
    PaletteGeneratorImagePaletteStateful.getAlternativeImagePaletteColor({
      existingColors,
      excludedColors,
      variantSeed: variantSeed + (cardIndex >= 0 ? cardIndex : 0),
      maxVariantSweeps,
      imagePaletteVariantProfileCount: args.imagePaletteVariantProfileCount,
      deps: args.deps,
    });

  return {
    color: fallbackCandidate,
    nextVariantIndex: fallbackCandidate
      ? args.imagePaletteVariantIndex + 1
      : args.imagePaletteVariantIndex,
  };
}

async function buildImageBasedPaletteCandidate(args: ImagePaletteBuildCandidateArgs) {
  if (!args.uploadedImageDataUrl) {
    return {
      palette: [],
      variantIndex: args.imagePaletteVariantIndex,
    };
  }

  const clusters = await args.getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: args.imagePaletteVariantIndex,
    };
  }

  const options =
    args.options && typeof args.options === "object" ? args.options : ({} as RuntimeOptions);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? (options.pinnedEntries as ImagePalettePinnedEntry[])
    : args.getPinnedPaletteEntriesSnapshot();
  const referenceSourcePalette = Array.isArray(options.referencePalette)
    ? (options.referencePalette as string[])
    : (args.paletteAdjustmentBase.length > 0 ? args.paletteAdjustmentBase : args.currentPalette);
  const referencePalette = normalizePaletteHexCollection(
    args.getComparablePaletteSlice(referenceSourcePalette, pinnedEntries)
  );
  const variantStartIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, Number(options.startVariantIndex))
    : args.imagePaletteVariantIndex;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, Number(options.maxVariantAttempts))
    : Math.max(6, args.imagePaletteVariantProfileCount * 3);

  return PaletteGeneratorImagePaletteStateful.buildImageBasedPaletteCandidate({
    targetCount: args.targetCount,
    clusters,
    pinnedEntries,
    referencePalette,
    referenceSourcePalette,
    variantStartIndex,
    maxVariantAttempts,
    deps: args.deps,
  });
}

function orderPaletteHexColorsByHarmony(
  colors: unknown[],
  orderImageClustersByHarmony: (clusters: ImagePaletteCluster[]) => ImagePaletteCluster[]
) {
  const nodes = normalizePaletteHexCollection(colors).map((hex) => ({
    hex,
    hsl: hexToHsl(hex),
    oklch: hexToOklch(hex) || null,
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex || "");
}

async function buildInspiredImagePaletteCandidate(args: ImagePaletteBuildInspiredArgs) {
  if (!args.uploadedImageDataUrl) {
    return {
      palette: [],
      variantIndex: args.imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    } satisfies ImagePaletteInspiredCandidate;
  }

  const clusters = await args.getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: args.imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    } satisfies ImagePaletteInspiredCandidate;
  }

  const options =
    args.options && typeof args.options === "object" ? args.options : ({} as RuntimeOptions);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? (options.pinnedEntries as ImagePalettePinnedEntry[])
    : args.getPinnedPaletteEntriesSnapshot();
  const safeTargetCount = Number.isFinite(args.targetCount) && args.targetCount > 0
    ? args.targetCount
    : 5;
  const atmosphere = getImageInspirationAtmosphere(clusters);
  const referencePalette = normalizePaletteHexCollection(
    args.getComparablePaletteSlice(
      Array.isArray(options.referencePalette)
        ? (options.referencePalette as string[])
        : args.currentPalette,
      pinnedEntries
    )
  );
  const recentInspiredReferences = Array.isArray(options.recentPalettes)
    ? (options.recentPalettes as string[][]).map((palette) =>
        args.getComparableMergedPaletteSlice(palette, pinnedEntries)
      )
    : args.recentInspiredPalettes.map((palette) =>
        args.getComparableMergedPaletteSlice(palette, pinnedEntries)
      );
  const startVariantIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, Number(options.startVariantIndex))
    : args.imageInspirationVariantIndex + 1;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, Number(options.maxVariantAttempts))
    : Math.max(
        18,
        args.imageInspirationVariantProfileCount * 8,
        recentInspiredReferences.length * 4 + 12
      );

  return PaletteGeneratorImagePaletteStateful.buildInspiredImagePaletteCandidate({
    targetCount: safeTargetCount,
    clusters,
    pinnedEntries,
    atmosphere,
    referencePalette,
    recentInspiredReferences,
    startVariantIndex,
    maxVariantAttempts,
    imageInspirationVariantProfileCount: args.imageInspirationVariantProfileCount,
    deps: args.deps,
  });
}

export const PaletteGeneratorImagePaletteRuntime = {
  getImageRegenerationColorForCard,
  buildImageBasedPaletteCandidate,
  orderPaletteHexColorsByHarmony,
  buildInspiredImagePaletteCandidate,
};

window.PaletteGeneratorImagePaletteRuntime = PaletteGeneratorImagePaletteRuntime;

export default PaletteGeneratorImagePaletteRuntime;
