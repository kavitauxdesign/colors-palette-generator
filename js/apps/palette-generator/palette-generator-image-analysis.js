// Palette generator image analysis: sampling, clustering and derived candidates.
const paletteGeneratorImageAnalysisHelpers = window.PaletteGeneratorImageAnalysisHelpers || {};
const paletteGeneratorImageAnalysisStateful = window.PaletteGeneratorImageAnalysisStateful || {};
const imageAnalysisColorUtils = window.AppColorUtils || {};
const imageAnalysisRgbToHex = imageAnalysisColorUtils.rgbToHex;

if (
  typeof imageAnalysisRgbToHex !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getRgbDistanceBetween !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.rotateImagePaletteCandidates !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getWeightedRandomPoint !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.initializeImageClusterCenters !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.clusterImageColors !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.cleanImageClusterDuplicates !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getImageClusterPriorityScore !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.selectRelevantImageClusters !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getImagePaletteVariantHex !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getImageClusterStartPenalty !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.getImageClusterHarmonyDistance !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.orderImageClustersByHarmony !== "function" ||
  typeof paletteGeneratorImageAnalysisHelpers.expandImagePalette !== "function" ||
  typeof paletteGeneratorImageAnalysisStateful.loadImageElement !== "function" ||
  typeof paletteGeneratorImageAnalysisStateful.getUploadedImageSamplePoints !== "function" ||
  typeof paletteGeneratorImageAnalysisStateful.getCachedImageColorClusters !== "function" ||
  typeof paletteGeneratorImageAnalysisStateful.getImageColorClusters !== "function"
) {
  throw new Error(
    "PaletteGeneratorImageAnalysis helpers are required before palette-generator-image-analysis.js loads."
  );
}

function getImageAnalysisHelperOptions() {
  return {
    prioritizeImageDominantColors,
    isDisallowedColor,
    profiles: IMAGE_PALETTE_VARIANT_PROFILES,
  };
}

function getImageAnalysisStatefulOptions() {
  return {
    uploadedBaseImage,
    updateUploadedImageAnalysisCache,
    maxPaletteColors: MAX_PALETTE_COLORS,
    isDisallowedColor,
  };
}

function rotateImagePaletteCandidates(values, offset) {
  return paletteGeneratorImageAnalysisHelpers.rotateImagePaletteCandidates(values, offset);
}

function rgbToHex(color) {
  return imageAnalysisRgbToHex(color);
}

function getRgbDistanceBetween(colorA, colorB) {
  return paletteGeneratorImageAnalysisHelpers.getRgbDistanceBetween(colorA, colorB);
}

function loadImageElement(dataUrl) {
  return paletteGeneratorImageAnalysisStateful.loadImageElement(dataUrl);
}

async function getUploadedImageSamplePoints() {
  return paletteGeneratorImageAnalysisStateful.getUploadedImageSamplePoints(
    getImageAnalysisStatefulOptions()
  );
}

function getWeightedRandomPoint(points, weightResolver) {
  return paletteGeneratorImageAnalysisHelpers.getWeightedRandomPoint(points, weightResolver);
}

function initializeImageClusterCenters(points, clusterCount) {
  return paletteGeneratorImageAnalysisHelpers.initializeImageClusterCenters(points, clusterCount);
}

function clusterImageColors(points, clusterCount) {
  return paletteGeneratorImageAnalysisHelpers.clusterImageColors(points, clusterCount);
}

function cleanImageClusterDuplicates(clusters) {
  return paletteGeneratorImageAnalysisHelpers.cleanImageClusterDuplicates(
    clusters,
    getImageAnalysisHelperOptions()
  );
}

function getImageClusterPriorityScore(cluster, allClusters, selectedClusters = []) {
  return paletteGeneratorImageAnalysisHelpers.getImageClusterPriorityScore(
    cluster,
    allClusters,
    selectedClusters,
    getImageAnalysisHelperOptions()
  );
}

function selectRelevantImageClusters(clusters, targetCount, variantIndex = 0) {
  return paletteGeneratorImageAnalysisHelpers.selectRelevantImageClusters(
    clusters,
    targetCount,
    variantIndex,
    getImageAnalysisHelperOptions()
  );
}

function getImagePaletteVariantHex(cluster, clusterIndex, variantIndex) {
  return paletteGeneratorImageAnalysisHelpers.getImagePaletteVariantHex(
    cluster,
    clusterIndex,
    variantIndex,
    getImageAnalysisHelperOptions()
  );
}

function getImageClusterStartPenalty(cluster, allClusters) {
  return paletteGeneratorImageAnalysisHelpers.getImageClusterStartPenalty(
    cluster,
    allClusters,
    getImageAnalysisHelperOptions()
  );
}

function getImageClusterHarmonyDistance(clusterA, clusterB) {
  return paletteGeneratorImageAnalysisHelpers.getImageClusterHarmonyDistance(clusterA, clusterB);
}

function orderImageClustersByHarmony(clusters) {
  return paletteGeneratorImageAnalysisHelpers.orderImageClustersByHarmony(
    clusters,
    getImageAnalysisHelperOptions()
  );
}

function expandImagePalette(selectedClusters, targetCount, variantIndex = 0, seedPalette = []) {
  return paletteGeneratorImageAnalysisHelpers.expandImagePalette(
    selectedClusters,
    targetCount,
    variantIndex,
    seedPalette,
    getImageAnalysisHelperOptions()
  );
}

function getCachedImageColorClusters() {
  return paletteGeneratorImageAnalysisStateful.getCachedImageColorClusters(uploadedBaseImage);
}

async function getImageColorClusters() {
  return paletteGeneratorImageAnalysisStateful.getImageColorClusters(
    getImageAnalysisStatefulOptions()
  );
}
