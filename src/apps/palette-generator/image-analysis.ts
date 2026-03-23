import AppColorUtils from "../../shared/color/color-utils";
import APP_CONSTANTS from "../../shared/constants";
import PaletteGeneratorImageAnalysisHelpers from "./image-analysis-helpers";
import PaletteGeneratorImageAnalysisStateful from "./image-analysis-stateful";
import { IMAGE_PALETTE_VARIANT_PROFILES } from "./image-variant-profiles";

let hasInitializedPaletteGeneratorImageAnalysis = false;

function getPaletteGeneratorImageAnalysisWindow() {
  return window as any;
}

function getImageAnalysisHelperOptions(runtimeWindow: any) {
  const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};

  return {
    prioritizeImageDominantColors: !!globals.prioritizeImageDominantColors,
    isDisallowedColor:
      typeof runtimeWindow.isDisallowedColor === "function" ? runtimeWindow.isDisallowedColor : null,
    profiles: IMAGE_PALETTE_VARIANT_PROFILES,
  };
}

function getImageAnalysisStatefulOptions(runtimeWindow: any) {
  const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};

  return {
    uploadedBaseImage: globals.uploadedBaseImage || null,
    updateUploadedImageAnalysisCache:
      typeof runtimeWindow.updateUploadedImageAnalysisCache === "function"
        ? runtimeWindow.updateUploadedImageAnalysisCache
        : null,
    maxPaletteColors: APP_CONSTANTS.MAX_PALETTE_COLORS,
    isDisallowedColor:
      typeof runtimeWindow.isDisallowedColor === "function" ? runtimeWindow.isDisallowedColor : null,
  };
}

export function initializePaletteGeneratorImageAnalysis() {
  if (hasInitializedPaletteGeneratorImageAnalysis) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorImageAnalysisWindow();

  runtimeWindow.rotateImagePaletteCandidates = function rotateImagePaletteCandidates(
    values: unknown[],
    offset: number
  ) {
    return PaletteGeneratorImageAnalysisHelpers.rotateImagePaletteCandidates(values, offset);
  };

  runtimeWindow.rgbToHex = function rgbToHex(color: unknown) {
    return AppColorUtils.rgbToHex(color);
  };

  runtimeWindow.getRgbDistanceBetween = function getRgbDistanceBetween(colorA: unknown, colorB: unknown) {
    return PaletteGeneratorImageAnalysisHelpers.getRgbDistanceBetween(colorA, colorB);
  };

  runtimeWindow.loadImageElement = function loadImageElement(dataUrl: string) {
    return PaletteGeneratorImageAnalysisStateful.loadImageElement(dataUrl);
  };

  runtimeWindow.getUploadedImageSamplePoints = async function getUploadedImageSamplePoints() {
    return PaletteGeneratorImageAnalysisStateful.getUploadedImageSamplePoints(
      getImageAnalysisStatefulOptions(runtimeWindow)
    );
  };

  runtimeWindow.getWeightedRandomPoint = function getWeightedRandomPoint(
    points: unknown[],
    weightResolver: ((point: unknown) => number) | null
  ) {
    return PaletteGeneratorImageAnalysisHelpers.getWeightedRandomPoint(points as any, weightResolver as any);
  };

  runtimeWindow.initializeImageClusterCenters = function initializeImageClusterCenters(
    points: unknown[],
    clusterCount: number
  ) {
    return PaletteGeneratorImageAnalysisHelpers.initializeImageClusterCenters(points as any, clusterCount);
  };

  runtimeWindow.clusterImageColors = function clusterImageColors(
    points: unknown[],
    clusterCount: number
  ) {
    return PaletteGeneratorImageAnalysisHelpers.clusterImageColors(points as any, clusterCount);
  };

  runtimeWindow.cleanImageClusterDuplicates = function cleanImageClusterDuplicates(clusters: unknown[]) {
    return PaletteGeneratorImageAnalysisHelpers.cleanImageClusterDuplicates(
      clusters,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.getImageClusterPriorityScore = function getImageClusterPriorityScore(
    cluster: unknown,
    allClusters: unknown[],
    selectedClusters: unknown[] = []
  ) {
    return PaletteGeneratorImageAnalysisHelpers.getImageClusterPriorityScore(
      cluster as any,
      allClusters as any,
      selectedClusters as any,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.selectRelevantImageClusters = function selectRelevantImageClusters(
    clusters: unknown[],
    targetCount: number,
    variantIndex = 0
  ) {
    return PaletteGeneratorImageAnalysisHelpers.selectRelevantImageClusters(
      clusters as any,
      targetCount,
      variantIndex,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.getImagePaletteVariantHex = function getImagePaletteVariantHex(
    cluster: unknown,
    clusterIndex: number,
    variantIndex: number
  ) {
    return PaletteGeneratorImageAnalysisHelpers.getImagePaletteVariantHex(
      cluster as any,
      clusterIndex,
      variantIndex,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.getImageClusterStartPenalty = function getImageClusterStartPenalty(
    cluster: unknown,
    allClusters: unknown[]
  ) {
    return PaletteGeneratorImageAnalysisHelpers.getImageClusterStartPenalty(
      cluster as any,
      allClusters as any,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.getImageClusterHarmonyDistance = function getImageClusterHarmonyDistance(
    clusterA: unknown,
    clusterB: unknown
  ) {
    return PaletteGeneratorImageAnalysisHelpers.getImageClusterHarmonyDistance(
      clusterA as any,
      clusterB as any
    );
  };

  runtimeWindow.orderImageClustersByHarmony = function orderImageClustersByHarmony(clusters: unknown[]) {
    return PaletteGeneratorImageAnalysisHelpers.orderImageClustersByHarmony(
      clusters as any,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.expandImagePalette = function expandImagePalette(
    selectedClusters: unknown[],
    targetCount: number,
    variantIndex = 0,
    seedPalette: string[] = []
  ) {
    return PaletteGeneratorImageAnalysisHelpers.expandImagePalette(
      selectedClusters as any,
      targetCount,
      variantIndex,
      seedPalette,
      getImageAnalysisHelperOptions(runtimeWindow)
    );
  };

  runtimeWindow.getCachedImageColorClusters = function getCachedImageColorClusters() {
    const globals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
    return PaletteGeneratorImageAnalysisStateful.getCachedImageColorClusters(
      globals.uploadedBaseImage || null
    );
  };

  runtimeWindow.getImageColorClusters = async function getImageColorClusters() {
    return PaletteGeneratorImageAnalysisStateful.getImageColorClusters(
      getImageAnalysisStatefulOptions(runtimeWindow)
    );
  };

  hasInitializedPaletteGeneratorImageAnalysis = true;
}

export default initializePaletteGeneratorImageAnalysis;
