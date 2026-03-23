const paletteGeneratorImagePaletteHelpers = window.PaletteGeneratorImagePaletteHelpers || {};
const paletteGeneratorImagePaletteStateful = window.PaletteGeneratorImagePaletteStateful || {};
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
  const excludedColors = options.excludedColors instanceof Set
    ? new Set(options.excludedColors)
    : new Set();

  if (isValidPaletteHex(currentHex)) {
    excludedColors.add(currentHex);
  }

  const variantSeedBase = Number.isFinite(options.variantSeed)
    ? Math.max(0, options.variantSeed)
    : imagePaletteVariantIndex + 1;
  const variantSeedOffset = Number.isFinite(options.variantSeedOffset)
    ? options.variantSeedOffset
    : 0;
  const variantSeed =
    variantSeedBase +
    variantSeedOffset +
    (Number.isFinite(cardIndex) && cardIndex >= 0 ? cardIndex * 2 : 0);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, options.maxVariantSweeps)
    : Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6);
  const candidate = getImageBasedCandidateColor(existingColors, adjacentBaseNames, {
    excludedColors,
    variantSeed,
    maxVariantSweeps,
  });

  const fallbackCandidate = candidate || getAlternativeImagePaletteColor(
    existingColors,
    excludedColors,
    variantSeed +
      (Number.isFinite(cardIndex) && cardIndex >= 0 ? cardIndex : 0),
    maxVariantSweeps
  );

  if (fallbackCandidate) {
    imagePaletteVariantIndex += 1;
  }

  return fallbackCandidate;
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

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(
      options.referencePalette ??
      (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette),
      pinnedEntries
    )
  );
  const variantStartIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imagePaletteVariantIndex;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 3);
  const referenceSourcePalette =
    options.referencePalette ??
    (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette);

  return paletteGeneratorImagePaletteStateful.buildImageBasedPaletteCandidate({
    targetCount,
    clusters,
    pinnedEntries,
    referencePalette,
    referenceSourcePalette,
    variantStartIndex,
    maxVariantAttempts,
    deps: getImagePaletteStatefulDependencies(),
  });
}

function getImageInspirationAtmosphere(clusters) {
  return paletteGeneratorImagePaletteHelpers.getImageInspirationAtmosphere(clusters);
}

function orderPaletteHexColorsByHarmony(colors) {
  const nodes = normalizePaletteHexCollection(colors).map((hex) => ({
    hex,
    hsl: controlsHexToHsl(hex),
    oklch: window.AppColorUtils?.hexToOklch?.(hex) || null,
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex);
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

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const safeTargetCount = Number.isFinite(targetCount) && targetCount > 0 ? targetCount : 5;
  const atmosphere = getImageInspirationAtmosphere(clusters);
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  const recentInspiredReferences = Array.isArray(options.recentPalettes)
    ? options.recentPalettes.map((palette) => getComparableMergedPaletteSlice(palette, pinnedEntries))
    : recentInspiredPalettes.map((palette) => getComparableMergedPaletteSlice(palette, pinnedEntries));
  const startVariantIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imageInspirationVariantIndex + 1;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(
        18,
        IMAGE_INSPIRATION_VARIANT_PROFILES.length * 8,
        recentInspiredReferences.length * 4 + 12
      );
  const resolvedCandidate = paletteGeneratorImagePaletteStateful.buildInspiredImagePaletteCandidate({
    targetCount: safeTargetCount,
    clusters,
    pinnedEntries,
    atmosphere,
    referencePalette,
    recentInspiredReferences,
    startVariantIndex,
    maxVariantAttempts,
    imageInspirationVariantProfileCount: IMAGE_INSPIRATION_VARIANT_PROFILES.length,
    deps: getImagePaletteStatefulDependencies(),
  });
  updateUploadedImageAnalysisCache({
    lastInspiredPaletteValidation: resolvedCandidate.validation,
  });
  return resolvedCandidate;
}
