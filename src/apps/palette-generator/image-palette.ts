import PaletteGeneratorImagePaletteHelpers from "./image-palette-helpers";
import PaletteGeneratorImagePaletteStateful from "./image-palette-stateful";
import PaletteGeneratorImagePaletteRuntime from "./image-palette-runtime";
import { IMAGE_INSPIRATION_VARIANT_PROFILES, IMAGE_PALETTE_VARIANT_PROFILES } from "./image-variant-profiles";

let hasInitializedPaletteGeneratorImagePalette = false;

function getPaletteGeneratorImagePaletteWindow() {
  return window as any;
}

function getImagePaletteInspiredHelperOptions(runtimeWindow: any) {
  return {
    profiles: IMAGE_INSPIRATION_VARIANT_PROFILES,
    isDisallowedColor:
      typeof runtimeWindow.isDisallowedColor === "function" ? runtimeWindow.isDisallowedColor : null,
    orderImageClustersByHarmony:
      typeof runtimeWindow.orderImageClustersByHarmony === "function"
        ? runtimeWindow.orderImageClustersByHarmony
        : null,
  };
}

function getImagePaletteStatefulDependencies(runtimeWindow: any) {
  return {
    getCachedImageColorClusters:
      typeof runtimeWindow.getCachedImageColorClusters === "function"
        ? runtimeWindow.getCachedImageColorClusters
        : () => [],
    getImagePaletteVariantHex:
      typeof runtimeWindow.getImagePaletteVariantHex === "function"
        ? runtimeWindow.getImagePaletteVariantHex
        : () => null,
    isDisallowedColor:
      typeof runtimeWindow.isDisallowedColor === "function"
        ? runtimeWindow.isDisallowedColor
        : (() => false),
    getNearestColorName:
      typeof runtimeWindow.getNearestColorName === "function"
        ? runtimeWindow.getNearestColorName
        : null,
    getImageClusterPriorityScore:
      typeof runtimeWindow.getImageClusterPriorityScore === "function"
        ? runtimeWindow.getImageClusterPriorityScore
        : () => 0,
    orderImageClustersByHarmony:
      typeof runtimeWindow.orderImageClustersByHarmony === "function"
        ? runtimeWindow.orderImageClustersByHarmony
        : (clusters: unknown[]) => clusters,
    expandImagePalette:
      typeof runtimeWindow.expandImagePalette === "function"
        ? runtimeWindow.expandImagePalette
        : () => [],
    mergePaletteWithPinnedColors:
      typeof runtimeWindow.mergePaletteWithPinnedColors === "function"
        ? runtimeWindow.mergePaletteWithPinnedColors
        : (palette: string[]) => palette,
    getPinnedPaletteIndexSet:
      typeof runtimeWindow.getPinnedPaletteIndexSet === "function"
        ? runtimeWindow.getPinnedPaletteIndexSet
        : () => new Set<number>(),
    getComparablePaletteSlice:
      typeof runtimeWindow.getComparablePaletteSlice === "function"
        ? runtimeWindow.getComparablePaletteSlice
        : (colors: string[]) => colors,
    getPalettePositionalSimilarityMetrics:
      typeof runtimeWindow.getPalettePositionalSimilarityMetrics === "function"
        ? runtimeWindow.getPalettePositionalSimilarityMetrics
        : () => ({ samePositionCount: 0, changedPositionCount: 0 }),
    arePalettesTooSimilar:
      typeof runtimeWindow.arePalettesTooSimilar === "function"
        ? runtimeWindow.arePalettesTooSimilar
        : () => false,
    selectRelevantImageClusters:
      typeof runtimeWindow.selectRelevantImageClusters === "function"
        ? runtimeWindow.selectRelevantImageClusters
        : () => [],
    buildInspiredPaletteFromClusters:
      typeof runtimeWindow.buildInspiredPaletteFromClusters === "function"
        ? runtimeWindow.buildInspiredPaletteFromClusters
        : () => [],
    orderPaletteHexColorsByHarmony:
      typeof runtimeWindow.orderPaletteHexColorsByHarmony === "function"
        ? runtimeWindow.orderPaletteHexColorsByHarmony
        : (colors: string[]) => colors,
    isPaletteTooSimilarToRecentInspiredPalettes:
      typeof runtimeWindow.isPaletteTooSimilarToRecentInspiredPalettes === "function"
        ? runtimeWindow.isPaletteTooSimilarToRecentInspiredPalettes
        : () => false,
    getComparableMergedPaletteSlice:
      typeof runtimeWindow.getComparableMergedPaletteSlice === "function"
        ? runtimeWindow.getComparableMergedPaletteSlice
        : (colors: string[]) => colors,
  };
}

export function initializePaletteGeneratorImagePalette() {
  if (hasInitializedPaletteGeneratorImagePalette) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorImagePaletteWindow();

  runtimeWindow.getImageBasedCandidateColor = function getImageBasedCandidateColor(
    existingColors = new Set<string>(),
    adjacentBaseNames: string[] = [],
    options: Record<string, unknown> = {}
  ) {
    const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
    return PaletteGeneratorImagePaletteStateful.getImageBasedCandidateColor({
      existingColors,
      adjacentBaseNames,
      options,
      imagePaletteVariantIndex: Number(globals.imagePaletteVariantIndex) || 0,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
    });
  };

  runtimeWindow.getImageRegenerationColorForCard = function getImageRegenerationColorForCard(
    card: HTMLElement,
    existingColors = new Set<string>(),
    options: Record<string, unknown> = {}
  ) {
    const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
    const adjacentBaseNames =
      typeof runtimeWindow.getAdjacentBaseColorNames === "function"
        ? runtimeWindow.getAdjacentBaseColorNames(card)
        : [];
    const currentHex = runtimeWindow.normalizeHexColor?.(
      card?.querySelector(".color-label")?.textContent?.trim() || ""
    );
    const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
    const result = PaletteGeneratorImagePaletteRuntime.getImageRegenerationColorForCard({
      adjacentBaseNames,
      currentHex,
      cardIndex,
      existingColors,
      imagePaletteVariantIndex: Number(globals.imagePaletteVariantIndex) || 0,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      isValidPaletteHex:
        typeof runtimeWindow.isValidPaletteHex === "function"
          ? runtimeWindow.isValidPaletteHex
          : () => false,
      options,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
    });

    globals.imagePaletteVariantIndex = result.nextVariantIndex;
    return result.color;
  };

  runtimeWindow.buildImagePaletteCandidate = function buildImagePaletteCandidate(
    selectedClusters: unknown[],
    targetCount: number,
    variantIndex: number
  ) {
    return PaletteGeneratorImagePaletteStateful.buildImagePaletteCandidate({
      selectedClusters: selectedClusters as any,
      targetCount,
      variantIndex,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
    });
  };

  runtimeWindow.buildImageBasedPalette = async function buildImageBasedPalette(targetCount: number) {
    const result = await runtimeWindow.buildImageBasedPaletteCandidate(targetCount);
    const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
    globals.imagePaletteVariantIndex = result.variantIndex;
    runtimeWindow.syncPaletteGeneratorStoreState?.(
      {
        imagePaletteVariantIndex: globals.imagePaletteVariantIndex,
      },
      {
        scope: "image-palette-variant",
      }
    );
    return result.palette;
  };

  runtimeWindow.getAlternativeImagePaletteColor = function getAlternativeImagePaletteColor(
    existingColors = new Set<string>(),
    excludedColors = new Set<string>(),
    variantSeed = 0,
    maxVariantSweeps = Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6)
  ) {
    return PaletteGeneratorImagePaletteStateful.getAlternativeImagePaletteColor({
      existingColors,
      excludedColors,
      variantSeed,
      maxVariantSweeps,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
    });
  };

  runtimeWindow.ensureMutableImagePaletteSlotsChange = function ensureMutableImagePaletteSlotsChange(
    candidatePalette: string[],
    referencePalette: string[],
    pinnedEntries = runtimeWindow.getPinnedPaletteEntriesSnapshot?.() || [],
    variantSeed = 0
  ) {
    return PaletteGeneratorImagePaletteStateful.ensureMutableImagePaletteSlotsChange({
      candidatePalette,
      referencePalette,
      pinnedEntries,
      variantSeed,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
    });
  };

  runtimeWindow.buildImageBasedPaletteCandidate = async function buildImageBasedPaletteCandidate(
    targetCount: number,
    options: Record<string, unknown> = {}
  ) {
    const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
    if (!globals.uploadedBaseImage?.dataUrl) {
      alert("Sube una imagen primero para generar una paleta desde ella.");
      return {
        palette: [],
        variantIndex: Number(globals.imagePaletteVariantIndex) || 0,
      };
    }

    return PaletteGeneratorImagePaletteRuntime.buildImageBasedPaletteCandidate({
      targetCount,
      uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
      imagePaletteVariantIndex: Number(globals.imagePaletteVariantIndex) || 0,
      imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
      currentPalette: Array.isArray(globals.currentPalette) ? globals.currentPalette : [],
      paletteAdjustmentBase: Array.isArray(globals.paletteAdjustmentBase)
        ? globals.paletteAdjustmentBase
        : [],
      options,
      deps: getImagePaletteStatefulDependencies(runtimeWindow),
      getImageColorClusters:
        typeof runtimeWindow.getImageColorClusters === "function"
          ? runtimeWindow.getImageColorClusters
          : async () => [],
      getPinnedPaletteEntriesSnapshot:
        typeof runtimeWindow.getPinnedPaletteEntriesSnapshot === "function"
          ? runtimeWindow.getPinnedPaletteEntriesSnapshot
          : () => [],
      getComparablePaletteSlice:
        typeof runtimeWindow.getComparablePaletteSlice === "function"
          ? runtimeWindow.getComparablePaletteSlice
          : (colors: string[]) => colors,
    });
  };

  runtimeWindow.getImageInspirationAtmosphere = function getImageInspirationAtmosphere(clusters: unknown[]) {
    return PaletteGeneratorImagePaletteHelpers.getImageInspirationAtmosphere(clusters as any);
  };

  runtimeWindow.orderPaletteHexColorsByHarmony = function orderPaletteHexColorsByHarmony(colors: string[]) {
    return PaletteGeneratorImagePaletteRuntime.orderPaletteHexColorsByHarmony(
      colors,
      typeof runtimeWindow.orderImageClustersByHarmony === "function"
        ? runtimeWindow.orderImageClustersByHarmony
        : (clusters: unknown[]) => clusters
    );
  };

  runtimeWindow.isPaletteColorTooClose = function isPaletteColorTooClose(
    candidateColor: unknown,
    palette: unknown[] = [],
    minimumDistance = 24
  ) {
    return PaletteGeneratorImagePaletteHelpers.isPaletteColorTooClose(
      candidateColor,
      palette,
      minimumDistance
    );
  };

  runtimeWindow.getInspiredClusterRole = function getInspiredClusterRole(
    seedIndex: number,
    targetCount: number
  ) {
    return PaletteGeneratorImagePaletteHelpers.getInspiredClusterRole(seedIndex, targetCount);
  };

  runtimeWindow.getShortestHueDelta = function getShortestHueDelta(fromHue: number, toHue: number) {
    return PaletteGeneratorImagePaletteHelpers.getShortestHueDelta(fromHue, toHue);
  };

  runtimeWindow.shiftHueTowards = function shiftHueTowards(fromHue: number, toHue: number, ratio: number) {
    return PaletteGeneratorImagePaletteHelpers.shiftHueTowards(fromHue, toHue, ratio);
  };

  runtimeWindow.getPaletteAtmosphereMetrics = function getPaletteAtmosphereMetrics(colors: unknown[]) {
    return PaletteGeneratorImagePaletteHelpers.getPaletteAtmosphereMetrics(colors);
  };

  runtimeWindow.getAtmosphereAlignmentScore = function getAtmosphereAlignmentScore(
    candidateMetrics: unknown,
    referenceMetrics: unknown
  ) {
    return PaletteGeneratorImagePaletteHelpers.getAtmosphereAlignmentScore(
      candidateMetrics as any,
      referenceMetrics as any
    );
  };

  runtimeWindow.getInspiredImageVariantHex = function getInspiredImageVariantHex(
    cluster: unknown,
    role: string,
    clusterIndex: number,
    variantIndex: number,
    atmosphere: unknown
  ) {
    return PaletteGeneratorImagePaletteHelpers.getInspiredImageVariantHex(
      cluster as any,
      role,
      clusterIndex,
      variantIndex,
      atmosphere as any,
      getImagePaletteInspiredHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.expandInspiredPalette = function expandInspiredPalette(
    selectedClusters: unknown[],
    targetCount: number,
    variantIndex: number,
    atmosphere: unknown,
    seedPalette: string[] = []
  ) {
    return PaletteGeneratorImagePaletteHelpers.expandInspiredPalette(
      selectedClusters as any,
      targetCount,
      variantIndex,
      atmosphere as any,
      seedPalette,
      getImagePaletteInspiredHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.buildInspiredPaletteFromClusters = function buildInspiredPaletteFromClusters(
    selectedClusters: unknown[],
    targetCount: number,
    variantIndex: number,
    atmosphere: unknown
  ) {
    return PaletteGeneratorImagePaletteHelpers.buildInspiredPaletteFromClusters(
      selectedClusters as any,
      targetCount,
      variantIndex,
      atmosphere as any,
      getImagePaletteInspiredHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.validateInspiredPaletteCandidate = function validateInspiredPaletteCandidate(
    candidatePalette: string[],
    extractedPalette: string[],
    clusters: unknown[],
    atmosphere: unknown
  ) {
    return PaletteGeneratorImagePaletteHelpers.validateInspiredPaletteCandidate(
      candidatePalette,
      extractedPalette,
      clusters as any,
      atmosphere as any,
      {
        getRgbDistanceBetween:
          typeof runtimeWindow.getRgbDistanceBetween === "function"
            ? runtimeWindow.getRgbDistanceBetween
            : null,
      }
    );
  };

  runtimeWindow.derivePaletteAdjustmentSettingsFromColors =
    function derivePaletteAdjustmentSettingsFromColors(colors: string[]) {
      return PaletteGeneratorImagePaletteHelpers.derivePaletteAdjustmentSettingsFromColors(colors);
    };

  runtimeWindow.buildInspiredImagePaletteCandidate =
    async function buildInspiredImagePaletteCandidate(
      targetCount: number,
      options: Record<string, unknown> = {}
    ) {
      const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
      if (!globals.uploadedBaseImage?.dataUrl) {
        alert("Sube una imagen primero para activar el modo inspiración.");
        return {
          palette: [],
          variantIndex: Number(globals.imageInspirationVariantIndex) || 0,
          validation: null,
          settings: runtimeWindow.resolvePaletteAdjustmentSettings?.() || {
            brightness: runtimeWindow.AppConstants?.DEFAULT_BRIGHTNESS || 65,
            saturation: runtimeWindow.AppConstants?.DEFAULT_SATURATION || 100,
          },
        };
      }

      const resolvedCandidate = await PaletteGeneratorImagePaletteRuntime.buildInspiredImagePaletteCandidate({
        targetCount,
        uploadedImageDataUrl: globals.uploadedBaseImage?.dataUrl,
        imageInspirationVariantIndex: Number(globals.imageInspirationVariantIndex) || 0,
        imageInspirationVariantProfileCount: IMAGE_INSPIRATION_VARIANT_PROFILES.length,
        currentPalette: Array.isArray(globals.currentPalette) ? globals.currentPalette : [],
        recentInspiredPalettes: Array.isArray(globals.recentInspiredPalettes)
          ? globals.recentInspiredPalettes
          : [],
        options,
        deps: getImagePaletteStatefulDependencies(runtimeWindow),
        getImageColorClusters:
          typeof runtimeWindow.getImageColorClusters === "function"
            ? runtimeWindow.getImageColorClusters
            : async () => [],
        getPinnedPaletteEntriesSnapshot:
          typeof runtimeWindow.getPinnedPaletteEntriesSnapshot === "function"
            ? runtimeWindow.getPinnedPaletteEntriesSnapshot
            : () => [],
        getComparablePaletteSlice:
          typeof runtimeWindow.getComparablePaletteSlice === "function"
            ? runtimeWindow.getComparablePaletteSlice
            : (colors: string[]) => colors,
        getComparableMergedPaletteSlice:
          typeof runtimeWindow.getComparableMergedPaletteSlice === "function"
            ? runtimeWindow.getComparableMergedPaletteSlice
            : (colors: string[]) => colors,
      });
      runtimeWindow.updateUploadedImageAnalysisCache?.({
        lastInspiredPaletteValidation: resolvedCandidate.validation,
      });
      return resolvedCandidate;
    };

  hasInitializedPaletteGeneratorImagePalette = true;
}

export default initializePaletteGeneratorImagePalette;
