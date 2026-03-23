const paletteGeneratorImagePaletteHelpers = window.PaletteGeneratorImagePaletteHelpers || {};
const paletteGeneratorImagePaletteStateful = window.PaletteGeneratorImagePaletteStateful || {};
const paletteGeneratorImagePaletteRuntime = window.PaletteGeneratorImagePaletteRuntime || {};
if (
  typeof paletteGeneratorImagePaletteHelpers.getImageInspirationAtmosphere !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.isPaletteColorTooClose !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.getInspiredClusterRole !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.getShortestHueDelta !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.shiftHueTowards !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.getPaletteAtmosphereMetrics !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.getAtmosphereAlignmentScore !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.getInspiredImageVariantHex !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.expandInspiredPalette !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.buildInspiredPaletteFromClusters !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.validateInspiredPaletteCandidate !== "function" ||
  typeof paletteGeneratorImagePaletteHelpers.derivePaletteAdjustmentSettingsFromColors !== "function"
) {
  throw new Error("PaletteGeneratorImagePaletteHelpers are required before palette-generator-image-palette.js loads.");
}
if (
  typeof paletteGeneratorImagePaletteStateful.getImageBasedCandidateColor !== "function" ||
  typeof paletteGeneratorImagePaletteStateful.getAlternativeImagePaletteColor !== "function" ||
  typeof paletteGeneratorImagePaletteStateful.buildImagePaletteCandidate !== "function" ||
  typeof paletteGeneratorImagePaletteStateful.ensureMutableImagePaletteSlotsChange !== "function" ||
  typeof paletteGeneratorImagePaletteStateful.buildImageBasedPaletteCandidate !== "function" ||
  typeof paletteGeneratorImagePaletteStateful.buildInspiredImagePaletteCandidate !== "function"
) {
  throw new Error("PaletteGeneratorImagePaletteStateful is required before palette-generator-image-palette.js loads.");
}
if (
  typeof paletteGeneratorImagePaletteRuntime.getImageRegenerationColorForCard !== "function" ||
  typeof paletteGeneratorImagePaletteRuntime.buildImageBasedPaletteCandidate !== "function" ||
  typeof paletteGeneratorImagePaletteRuntime.orderPaletteHexColorsByHarmony !== "function" ||
  typeof paletteGeneratorImagePaletteRuntime.buildInspiredImagePaletteCandidate !== "function"
) {
  throw new Error("PaletteGeneratorImagePaletteRuntime is required before palette-generator-image-palette.js loads.");
}

function getImagePaletteInspiredHelperOptions() {
  return {
    profiles: IMAGE_INSPIRATION_VARIANT_PROFILES,
    isDisallowedColor,
    orderImageClustersByHarmony,
  };
}

function getImagePaletteStatefulDependencies() {
  return {
    getCachedImageColorClusters,
    getImagePaletteVariantHex,
    isDisallowedColor,
    getNearestColorName:
      typeof getNearestColorName === "function" ? getNearestColorName : null,
    getImageClusterPriorityScore,
    orderImageClustersByHarmony,
    expandImagePalette,
    mergePaletteWithPinnedColors,
    getPinnedPaletteIndexSet,
    getComparablePaletteSlice,
    getPalettePositionalSimilarityMetrics,
    arePalettesTooSimilar,
    selectRelevantImageClusters,
    buildInspiredPaletteFromClusters,
    orderPaletteHexColorsByHarmony,
    isPaletteTooSimilarToRecentInspiredPalettes,
    getComparableMergedPaletteSlice,
  };
}

function getImageBasedCandidateColor(
  existingColors = new Set(),
  adjacentBaseNames = [],
  options = {}
) {
  return paletteGeneratorImagePaletteStateful.getImageBasedCandidateColor({
    existingColors,
    adjacentBaseNames,
    options,
    imagePaletteVariantIndex,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    deps: getImagePaletteStatefulDependencies(),
  });
}

function getImageRegenerationColorForCard(card, existingColors = new Set(), options = {}) {
  const adjacentBaseNames = typeof getAdjacentBaseColorNames === "function"
    ? getAdjacentBaseColorNames(card)
    : [];
  const currentHex = normalizeHexColor(
    card?.querySelector(".color-label")?.textContent?.trim() || ""
  );
  const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
  const result = paletteGeneratorImagePaletteRuntime.getImageRegenerationColorForCard({
    adjacentBaseNames,
    currentHex,
    cardIndex,
    existingColors,
    imagePaletteVariantIndex,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    isValidPaletteHex,
    options,
    deps: getImagePaletteStatefulDependencies(),
  });

  imagePaletteVariantIndex = result.nextVariantIndex;
  return result.color;
}

function buildImagePaletteCandidate(selectedClusters, targetCount, variantIndex) {
  return paletteGeneratorImagePaletteStateful.buildImagePaletteCandidate({
    selectedClusters,
    targetCount,
    variantIndex,
    deps: getImagePaletteStatefulDependencies(),
  });
}

async function buildImageBasedPalette(targetCount) {
  const result = await buildImageBasedPaletteCandidate(targetCount);
  imagePaletteVariantIndex = result.variantIndex;
  syncPaletteGeneratorStoreState(
    {
      imagePaletteVariantIndex,
    },
    {
      scope: "image-palette-variant",
    }
  );
  return result.palette;
}

function getAlternativeImagePaletteColor(
  existingColors = new Set(),
  excludedColors = new Set(),
  variantSeed = 0,
  maxVariantSweeps = Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6)
) {
  return paletteGeneratorImagePaletteStateful.getAlternativeImagePaletteColor({
    existingColors,
    excludedColors,
    variantSeed,
    maxVariantSweeps,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    deps: getImagePaletteStatefulDependencies(),
  });
}

function ensureMutableImagePaletteSlotsChange(
  candidatePalette,
  referencePalette,
  pinnedEntries = getPinnedPaletteEntriesSnapshot(),
  variantSeed = 0
) {
  return paletteGeneratorImagePaletteStateful.ensureMutableImagePaletteSlotsChange({
    candidatePalette,
    referencePalette,
    pinnedEntries,
    variantSeed,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    deps: getImagePaletteStatefulDependencies(),
  });
}

async function buildImageBasedPaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para generar una paleta desde ella.");
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  return paletteGeneratorImagePaletteRuntime.buildImageBasedPaletteCandidate({
    targetCount,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    imagePaletteVariantIndex,
    imagePaletteVariantProfileCount: IMAGE_PALETTE_VARIANT_PROFILES.length,
    currentPalette,
    paletteAdjustmentBase,
    options,
    deps: getImagePaletteStatefulDependencies(),
    getImageColorClusters,
    getPinnedPaletteEntriesSnapshot,
    getComparablePaletteSlice,
  });
}

function getImageInspirationAtmosphere(clusters) {
  return paletteGeneratorImagePaletteHelpers.getImageInspirationAtmosphere(clusters);
}

function orderPaletteHexColorsByHarmony(colors) {
  return paletteGeneratorImagePaletteRuntime.orderPaletteHexColorsByHarmony(
    colors,
    orderImageClustersByHarmony
  );
}

function isPaletteColorTooClose(candidateColor, palette, minimumDistance = 24) {
  return paletteGeneratorImagePaletteHelpers.isPaletteColorTooClose(
    candidateColor,
    palette,
    minimumDistance
  );
}

function getInspiredClusterRole(seedIndex, targetCount) {
  return paletteGeneratorImagePaletteHelpers.getInspiredClusterRole(seedIndex, targetCount);
}

function getShortestHueDelta(fromHue, toHue) {
  return paletteGeneratorImagePaletteHelpers.getShortestHueDelta(fromHue, toHue);
}

function shiftHueTowards(fromHue, toHue, ratio) {
  return paletteGeneratorImagePaletteHelpers.shiftHueTowards(fromHue, toHue, ratio);
}

function getPaletteAtmosphereMetrics(colors) {
  return paletteGeneratorImagePaletteHelpers.getPaletteAtmosphereMetrics(colors);
}

function getAtmosphereAlignmentScore(candidateMetrics, referenceMetrics) {
  return paletteGeneratorImagePaletteHelpers.getAtmosphereAlignmentScore(
    candidateMetrics,
    referenceMetrics
  );
}

function getInspiredImageVariantHex(cluster, role, clusterIndex, variantIndex, atmosphere) {
  return paletteGeneratorImagePaletteHelpers.getInspiredImageVariantHex(
    cluster,
    role,
    clusterIndex,
    variantIndex,
    atmosphere,
    getImagePaletteInspiredHelperOptions()
  );
}

function expandInspiredPalette(selectedClusters, targetCount, variantIndex, atmosphere, seedPalette = []) {
  return paletteGeneratorImagePaletteHelpers.expandInspiredPalette(
    selectedClusters,
    targetCount,
    variantIndex,
    atmosphere,
    seedPalette,
    getImagePaletteInspiredHelperOptions()
  );
}

function buildInspiredPaletteFromClusters(selectedClusters, targetCount, variantIndex, atmosphere) {
  return paletteGeneratorImagePaletteHelpers.buildInspiredPaletteFromClusters(
    selectedClusters,
    targetCount,
    variantIndex,
    atmosphere,
    getImagePaletteInspiredHelperOptions()
  );
}

function validateInspiredPaletteCandidate(candidatePalette, extractedPalette, clusters, atmosphere) {
  return paletteGeneratorImagePaletteHelpers.validateInspiredPaletteCandidate(
    candidatePalette,
    extractedPalette,
    clusters,
    atmosphere,
    {
      getRgbDistanceBetween,
    }
  );
}

function derivePaletteAdjustmentSettingsFromColors(colors) {
  return paletteGeneratorImagePaletteHelpers.derivePaletteAdjustmentSettingsFromColors(colors);
}

async function buildInspiredImagePaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para activar el modo inspiración.");
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const resolvedCandidate = await paletteGeneratorImagePaletteRuntime.buildInspiredImagePaletteCandidate({
    targetCount,
    uploadedImageDataUrl: uploadedBaseImage?.dataUrl,
    imageInspirationVariantIndex,
    imageInspirationVariantProfileCount: IMAGE_INSPIRATION_VARIANT_PROFILES.length,
    currentPalette,
    recentInspiredPalettes,
    options,
    deps: getImagePaletteStatefulDependencies(),
    getImageColorClusters,
    getPinnedPaletteEntriesSnapshot,
    getComparablePaletteSlice,
    getComparableMergedPaletteSlice,
  });
  updateUploadedImageAnalysisCache({
    lastInspiredPaletteValidation: resolvedCandidate.validation,
  });
  return resolvedCandidate;
}
