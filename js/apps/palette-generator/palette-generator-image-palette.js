function getImageBasedCandidateColor(existingColors = new Set(), adjacentBaseNames = []) {
  const imageClusters = getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  let bestCandidate = null;
  let bestConflictCount = Infinity;
  let bestPriorityScore = -Infinity;

  imageClusters.forEach((cluster, clusterIndex) => {
    const candidate = getAdjustedPaletteColor(cluster.hex, clusterIndex);

    if (existingColors.has(candidate)) {
      return;
    }

    const candidateBaseName = typeof getNearestColorName === "function"
      ? getNearestColorName(candidate)
      : "";
    const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
      return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
    }, 0);
    const priorityScore = getImageClusterPriorityScore(cluster, imageClusters);

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

  return bestCandidate;
}

function getImageRegenerationColorForCard(card, existingColors = new Set()) {
  const adjacentBaseNames = typeof getAdjacentBaseColorNames === "function"
    ? getAdjacentBaseColorNames(card)
    : [];

  return getImageBasedCandidateColor(existingColors, adjacentBaseNames);
}

function buildImagePaletteCandidate(selectedClusters, targetCount, variantIndex) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const basePalette = [];
  const usedColors = new Set();

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    const variantHex = getImagePaletteVariantHex(cluster, clusterIndex, variantIndex);
    const nextHex =
      !usedColors.has(variantHex) && !isDisallowedColor(variantHex)
        ? variantHex
        : cluster.hex;

    if (usedColors.has(nextHex) || isDisallowedColor(nextHex)) {
      return;
    }

    usedColors.add(nextHex);
    basePalette.push(nextHex);
  });

  return expandImagePalette(harmonyOrderedClusters, targetCount, variantIndex, basePalette);
}

async function buildImageBasedPalette(targetCount) {
  const result = await buildImageBasedPaletteCandidate(targetCount);
  imagePaletteVariantIndex = result.variantIndex;
  return result.palette;
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
  let fallbackPalette = [];
  let fallbackVariantIndex = variantStartIndex;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = variantStartIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(clusters, targetCount, variantIndex);
    const candidatePalette = buildImagePaletteCandidate(
      selectedClusters,
      targetCount,
      variantIndex
    );
    const candidateComparablePalette = getComparablePaletteSlice(candidatePalette, pinnedEntries);

    if (candidatePalette.length === 0) {
      continue;
    }

    fallbackPalette = candidatePalette;
    fallbackVariantIndex = variantIndex;

    if (!arePalettesTooSimilar(candidateComparablePalette, referencePalette)) {
      return {
        palette: candidatePalette,
        variantIndex,
      };
    }
  }

  return {
    palette: fallbackPalette,
    variantIndex: fallbackVariantIndex,
  };
}

function getImageInspirationAtmosphere(clusters) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return {
      averageSaturation: 56,
      averageLightness: 54,
      averageHue: 35,
      maxWeight: 1,
      maxSaturation: 72,
      lightnessSpread: 0.3,
      warmthBias: 0,
    };
  }

  const totalWeight = clusters.reduce((sum, cluster) => sum + Math.max(cluster.weight || 0, 1), 0);
  const maxWeight = Math.max(
    ...clusters.map((cluster) => Math.max(cluster.weight || 0, 1)),
    1
  );
  const hueVector = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hueRadians = ((cluster.hsl?.h ?? 0) / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians) * weight,
      y: sum.y + Math.sin(hueRadians) * weight,
    };
  }, { x: 0, y: 0 });
  const maxSaturation = Math.max(
    ...clusters.map((cluster) => clampControlValue(cluster.hsl?.s ?? 0, 0, 100)),
    0
  );
  const lightnessValues = clusters.map((cluster) => clampControlValue(cluster.hsl?.l ?? 50, 0, 100));
  const averageSaturation = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + (cluster.hsl?.s ?? 0) * weight;
  }, 0) / totalWeight;
  const averageLightness = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + (cluster.hsl?.l ?? 50) * weight;
  }, 0) / totalWeight;
  const warmthBias = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hue = cluster.hsl?.h ?? 0;
    const hueRadians = (hue / 180) * Math.PI;
    return sum + Math.cos(hueRadians) * weight;
  }, 0) / totalWeight;
  const averageHue = (
    (Math.atan2(hueVector.y, hueVector.x) * 180) / Math.PI + 360
  ) % 360;

  return {
    averageSaturation,
    averageLightness,
    averageHue,
    maxWeight,
    maxSaturation,
    lightnessSpread:
      (Math.max(...lightnessValues, averageLightness) - Math.min(...lightnessValues, averageLightness)) /
      100,
    warmthBias,
  };
}

function orderPaletteHexColorsByHarmony(colors) {
  const nodes = normalizePaletteHexCollection(colors).map((hex) => ({
    hex,
    hsl: controlsHexToHsl(hex),
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex);
}

function isPaletteColorTooClose(candidateColor, palette, minimumDistance = 24) {
  const candidateRgb = controlsHexToRgb(candidateColor);
  return palette.some((existingColor) => {
    const existingRgb = controlsHexToRgb(existingColor);
    return getRgbDistanceBetween(candidateRgb, existingRgb) < minimumDistance;
  });
}

function getInspiredClusterRole(seedIndex, targetCount) {
  if (seedIndex === 0) {
    return "dominant";
  }

  if (targetCount >= 6 && seedIndex === 1) {
    return "dominant";
  }

  if (seedIndex === targetCount - 1) {
    return "accent";
  }

  if (targetCount >= 5 && seedIndex === targetCount - 2) {
    return "accent";
  }

  return "support";
}

function getShortestHueDelta(fromHue, toHue) {
  return ((toHue - fromHue + 540) % 360) - 180;
}

function shiftHueTowards(fromHue, toHue, ratio) {
  return (fromHue + getShortestHueDelta(fromHue, toHue) * ratio + 360) % 360;
}

function getPaletteAtmosphereMetrics(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return {
      averageHue: 35,
      averageSaturation: 56,
      averageLightness: 54,
      warmthBias: 0,
      lightnessSpread: 0.3,
    };
  }

  const paletteHsl = normalizedColors.map((color) => controlsHexToHsl(color));
  const hueVector = paletteHsl.reduce((sum, color) => {
    const hueRadians = (color.h / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians),
      y: sum.y + Math.sin(hueRadians),
    };
  }, { x: 0, y: 0 });
  const lightnessValues = paletteHsl.map((color) => color.l);
  const averageSaturation =
    paletteHsl.reduce((sum, color) => sum + color.s, 0) / paletteHsl.length;
  const averageLightness =
    paletteHsl.reduce((sum, color) => sum + color.l, 0) / paletteHsl.length;
  const warmthBias =
    paletteHsl.reduce((sum, color) => {
      const hueRadians = (color.h / 180) * Math.PI;
      return sum + Math.cos(hueRadians);
    }, 0) / paletteHsl.length;

  return {
    averageHue: (
      (Math.atan2(hueVector.y, hueVector.x) * 180) / Math.PI + 360
    ) % 360,
    averageSaturation,
    averageLightness,
    warmthBias,
    lightnessSpread:
      (Math.max(...lightnessValues) - Math.min(...lightnessValues)) / 100,
  };
}

function getAtmosphereAlignmentScore(candidateMetrics, referenceMetrics) {
  const saturationAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.averageSaturation - referenceMetrics.averageSaturation) / 30,
    1
  );
  const lightnessAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.averageLightness - referenceMetrics.averageLightness) / 24,
    1
  );
  const warmthAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.warmthBias - referenceMetrics.warmthBias) / 1.2,
    1
  );
  const spreadAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.lightnessSpread - referenceMetrics.lightnessSpread) / 0.3,
    1
  );

  return (
    saturationAlignment * 0.3 +
    lightnessAlignment * 0.35 +
    warmthAlignment * 0.25 +
    spreadAlignment * 0.1
  );
}

function getInspiredImageVariantHex(cluster, role, clusterIndex, variantIndex, atmosphere) {
  const profile =
    IMAGE_INSPIRATION_VARIANT_PROFILES[
      Math.abs(variantIndex) % IMAGE_INSPIRATION_VARIANT_PROFILES.length
    ];
  const direction = (clusterIndex + variantIndex) % 2 === 0 ? 1 : -1;
  const variantCycle = Math.floor(
    Math.abs(variantIndex) / IMAGE_INSPIRATION_VARIANT_PROFILES.length
  );
  const hsl = cluster.hsl;
  const weightRatio = clampControlValue(
    Math.max(cluster.weight || 0, 1) / Math.max(atmosphere.maxWeight || 1, 1),
    0,
    1
  );
  const atmosphereHue = Number.isFinite(atmosphere.averageHue)
    ? atmosphere.averageHue
    : hsl.h;
  const warmthAdjustment = atmosphere.warmthBias * 9;
  const orbitOffset =
    (variantCycle % 3 - 1) * (role === "accent" ? 18 : role === "dominant" ? 10 : 14);
  let hue = shiftHueTowards(
    hsl.h,
    atmosphereHue,
    role === "dominant" ? 0.42 : role === "accent" ? 0.22 : 0.3
  );
  let saturation = hsl.s;
  let lightness = hsl.l;

  if (role === "dominant") {
    hue += profile.hueShift * 0.95 * direction + orbitOffset * 0.45 + warmthAdjustment * 0.4;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(
        atmosphere.averageSaturation + 4 + profile.saturationShift - weightRatio * 4,
        20,
        68
      ),
      0.58
    );
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(
        atmosphere.averageLightness + profile.neutralLift + orbitOffset * 0.18,
        28,
        72
      ),
      0.62
    );
  } else if (role === "accent") {
    hue += profile.accentHueShift * 1.15 * direction + orbitOffset + warmthAdjustment * 0.24;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(
        Math.max(
          atmosphere.averageSaturation + profile.accentBoost,
          atmosphere.maxSaturation * 0.7
        ),
        40,
        84
      ),
      0.72
    );
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(
        atmosphere.averageLightness +
          profile.lightnessShift +
          direction * 12 * (0.5 + atmosphere.lightnessSpread) +
          orbitOffset * 0.3,
        24,
        80
      ),
      0.64
    );
  } else {
    hue +=
      profile.hueShift * 1.1 * direction +
      direction * 8 +
      orbitOffset * 0.75 +
      warmthAdjustment * 0.28;
    saturation = blendControlValue(
      hsl.s,
      clampControlValue(
        atmosphere.averageSaturation + 8 + profile.saturationShift,
        24,
        78
      ),
      0.66
    );
    lightness = blendControlValue(
      hsl.l,
      clampControlValue(
        atmosphere.averageLightness +
          profile.lightnessShift +
          direction * 7 * (0.45 + atmosphere.lightnessSpread) +
          orbitOffset * 0.22,
        24,
        78
      ),
      0.6
    );
  }

  hue = (hue + 360) % 360;
  saturation = clampControlValue(
    saturation,
    role === "accent" ? 42 : 24,
    role === "dominant" ? 68 : 82
  );
  lightness = clampControlValue(lightness, 22, role === "accent" ? 82 : 78);

  let candidate = controlsNormalizeHexColor(
    controlsHslToHex(hue, saturation, lightness)
  );

  if (candidate === cluster.hex || isPaletteColorTooClose(candidate, [cluster.hex], 18)) {
    candidate = controlsNormalizeHexColor(
      controlsHslToHex(
        (hue + direction * (role === "accent" ? 18 : 12) + orbitOffset + 360) % 360,
        clampControlValue(saturation + (role === "accent" ? 10 : 6), 0, 100),
        clampControlValue(lightness + direction * (role === "accent" ? 8 : 6), 12, 88)
      )
    );
  }

  return candidate;
}

function expandInspiredPalette(selectedClusters, targetCount, variantIndex, atmosphere, seedPalette = []) {
  const palette = [...seedPalette];
  const candidateRoles = ["support", "accent", "dominant", "support"];

  for (let cycleIndex = 0; palette.length < targetCount && cycleIndex < targetCount * 6; cycleIndex += 1) {
    const cluster = selectedClusters[cycleIndex % selectedClusters.length];
    const role = candidateRoles[cycleIndex % candidateRoles.length];
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      cycleIndex,
      variantIndex + cycleIndex + 1,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      palette.includes(candidate) ||
      isPaletteColorTooClose(candidate, palette, 22)
    ) {
      continue;
    }

    palette.push(candidate);
  }

  return palette.slice(0, targetCount);
}

function buildInspiredPaletteFromClusters(selectedClusters, targetCount, variantIndex, atmosphere) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const seedPalette = [];

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    if (seedPalette.length >= targetCount) {
      return;
    }

    const role = getInspiredClusterRole(seedPalette.length, targetCount);
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      clusterIndex,
      variantIndex,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      seedPalette.includes(candidate) ||
      isPaletteColorTooClose(candidate, seedPalette, 22)
    ) {
      return;
    }

    seedPalette.push(candidate);
  });

  return expandInspiredPalette(
    harmonyOrderedClusters,
    targetCount,
    variantIndex,
    atmosphere,
    seedPalette
  );
}

function validateInspiredPaletteCandidate(candidatePalette, extractedPalette, clusters, atmosphere) {
  const normalizedCandidate = normalizePaletteHexCollection(candidatePalette);
  const uniqueCount = new Set(normalizedCandidate).size;
  const extractedAtmosphere = getPaletteAtmosphereMetrics(extractedPalette);
  const candidateAtmosphere = getPaletteAtmosphereMetrics(normalizedCandidate);
  const targetAtmosphere = {
    averageHue: atmosphere?.averageHue ?? extractedAtmosphere.averageHue,
    averageSaturation: blendControlValue(
      extractedAtmosphere.averageSaturation,
      atmosphere?.averageSaturation ?? extractedAtmosphere.averageSaturation,
      0.5
    ),
    averageLightness: blendControlValue(
      extractedAtmosphere.averageLightness,
      atmosphere?.averageLightness ?? extractedAtmosphere.averageLightness,
      0.5
    ),
    warmthBias: blendControlValue(
      extractedAtmosphere.warmthBias,
      atmosphere?.warmthBias ?? extractedAtmosphere.warmthBias,
      0.5
    ),
    lightnessSpread: blendControlValue(
      extractedAtmosphere.lightnessSpread,
      atmosphere?.lightnessSpread ?? extractedAtmosphere.lightnessSpread,
      0.5
    ),
  };
  const similarityToExtraction = getPaletteSimilarityMetrics(
    normalizedCandidate,
    extractedPalette
  );

  const nearestClusterDistances = normalizedCandidate.map((color) => {
    const colorRgb = controlsHexToRgb(color);
    return Math.min(
      ...clusters.map((cluster) =>
        getRgbDistanceBetween(colorRgb, {
          r: cluster.r,
          g: cluster.g,
          b: cluster.b,
        })
      )
    );
  });

  const averageNearestClusterDistance =
    nearestClusterDistances.length > 0
      ? nearestClusterDistances.reduce((sum, distance) => sum + distance, 0) /
        nearestClusterDistances.length
      : 0;
  const inspirationDistanceScore = clampControlValue(
    1 - Math.abs(averageNearestClusterDistance - 58) / 34,
    0,
    1
  );
  const atmosphereAlignmentScore = getAtmosphereAlignmentScore(
    candidateAtmosphere,
    targetAtmosphere
  );
  const sharedColorRatioToExtraction =
    similarityToExtraction.sharedColorCount / Math.max(normalizedCandidate.length, 1);

  return {
    hasRepeatedColors: uniqueCount !== normalizedCandidate.length,
    isExactExtractionCopy: similarityToExtraction.exactMatch,
    similarityToExtraction,
    sharedColorRatioToExtraction,
    averageNearestClusterDistance,
    inspirationDistanceScore,
    atmosphereAlignmentScore,
    isCoherentWithImage: atmosphereAlignmentScore >= 0.42,
  };
}

function derivePaletteAdjustmentSettingsFromColors(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return resolvePaletteAdjustmentSettings();
  }

  const paletteHsl = normalizedColors.map((color) => controlsHexToHsl(color));
  const averageSaturation =
    paletteHsl.reduce((sum, color) => sum + color.s, 0) / paletteHsl.length;
  const averageLightness =
    paletteHsl.reduce((sum, color) => sum + color.l, 0) / paletteHsl.length;

  return resolvePaletteAdjustmentSettings({
    saturation: clampControlValue(Math.round(averageSaturation / 5) * 5, 0, 100),
    brightness: clampControlValue(
      Math.round((((averageLightness - 10) / 80) * 100) / 5) * 5,
      0,
      100
    ),
  });
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
    ? options.recentPalettes.map((palette) => getComparablePaletteSlice(palette, pinnedEntries))
    : recentInspiredPalettes.map((palette) => getComparablePaletteSlice(palette, pinnedEntries));
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
  let fallbackCandidate = null;
  let bestCandidate = null;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = startVariantIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(
      clusters,
      Math.min(clusters.length, Math.max(safeTargetCount + 3, 6)),
      variantIndex
    );
    const extractedReferencePalette = orderImageClustersByHarmony(selectedClusters)
      .map((cluster) => cluster.hex)
      .slice(0, safeTargetCount);
    const candidatePalette = buildInspiredPaletteFromClusters(
      selectedClusters,
      safeTargetCount,
      variantIndex,
      atmosphere
    );
    const orderedPalette = orderPaletteHexColorsByHarmony(candidatePalette);
    const comparableOrderedPalette = getComparablePaletteSlice(orderedPalette, pinnedEntries);

    if (orderedPalette.length === 0) {
      continue;
    }

    const validation = validateInspiredPaletteCandidate(
      orderedPalette,
      extractedReferencePalette,
      clusters,
      atmosphere
    );
    const isTooSimilarToRecentInspired = isPaletteTooSimilarToRecentInspiredPalettes(
      comparableOrderedPalette,
      recentInspiredReferences
    );
    const similarityToCurrent =
      getPaletteSimilarityMetrics(comparableOrderedPalette, referencePalette).sharedColorCount /
      Math.max(comparableOrderedPalette.length, 1);
    const eleganceScore = scorePaletteElegance(orderedPalette);
    const score =
      scorePaletteHarmony(orderedPalette) +
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
      variantIndex,
      validation,
      isTooSimilarToRecentInspired,
      settings: derivePaletteAdjustmentSettingsFromColors(orderedPalette),
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
      !arePalettesTooSimilar(comparableOrderedPalette, referencePalette) &&
      (!bestCandidate || candidate.score > bestCandidate.score)
    ) {
      bestCandidate = candidate;
    }
  }

  const resolvedCandidate = bestCandidate || fallbackCandidate || {
    palette: [],
    variantIndex: startVariantIndex,
    validation: null,
    settings: resolvePaletteAdjustmentSettings(),
  };
  updateUploadedImageAnalysisCache({
    lastInspiredPaletteValidation: resolvedCandidate.validation,
  });
  return resolvedCandidate;
}
