function getImageBasedCandidateColor(
  existingColors = new Set(),
  adjacentBaseNames = [],
  options = {}
) {
  const imageClusters = getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  const excludedColors = options.excludedColors instanceof Set
    ? options.excludedColors
    : new Set();
  const variantSeed = Number.isFinite(options.variantSeed)
    ? Math.max(0, options.variantSeed)
    : Math.max(0, imagePaletteVariantIndex + 1);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, options.maxVariantSweeps)
    : Math.max(8, IMAGE_PALETTE_VARIANT_PROFILES.length * 3);
  let bestCandidate = null;
  let bestConflictCount = Infinity;
  let bestPriorityScore = -Infinity;

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    imageClusters.forEach((cluster, clusterIndex) => {
      const candidate = getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        isDisallowedColor(candidate)
      ) {
        return;
      }

      const candidateBaseName = typeof getNearestColorName === "function"
        ? getNearestColorName(candidate)
        : "";
      const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
        return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
      }, 0);
      const priorityScore =
        getImageClusterPriorityScore(cluster, imageClusters) - variantOffset * 0.04;

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
  const clusters = getCachedImageColorClusters();
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return null;
  }

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex += 1) {
      const cluster = clusters[clusterIndex];
      const candidate = getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        isDisallowedColor(candidate)
      ) {
        continue;
      }

      return candidate;
    }
  }

  return null;
}

function ensureMutableImagePaletteSlotsChange(
  candidatePalette,
  referencePalette,
  pinnedEntries = getPinnedPaletteEntriesSnapshot(),
  variantSeed = 0
) {
  const mergedPalette = mergePaletteWithPinnedColors(candidatePalette, pinnedEntries);
  const normalizedReferencePalette = normalizePaletteHexCollection(referencePalette);
  const pinnedIndexSet = getPinnedPaletteIndexSet(pinnedEntries);
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
    const alternative = getAlternativeImagePaletteColor(
      existingColors,
      new Set([color]),
      variantSeed + index * 3
    );

    if (alternative) {
      nextPalette[index] = alternative;
    }
  });

  return nextPalette;
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
  let fallbackSamePositionCount = Infinity;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = variantStartIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(clusters, targetCount, variantIndex);
    const candidatePalette = buildImagePaletteCandidate(
      selectedClusters,
      targetCount,
      variantIndex
    );
    const referenceSourcePalette =
      options.referencePalette ??
      (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette);
    const repairedPalette = ensureMutableImagePaletteSlotsChange(
      candidatePalette,
      referenceSourcePalette,
      pinnedEntries,
      variantIndex
    );
    const candidateComparablePalette = getComparablePaletteSlice(
      repairedPalette,
      pinnedEntries
    );
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      candidateComparablePalette,
      referencePalette
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
      !arePalettesTooSimilar(candidateComparablePalette, referencePalette)
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

function getImageInspirationAtmosphere(clusters) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return {
      averageSaturation: 42,
      averageLightness: 58,
      averageHue: 35,
      maxWeight: 1,
      maxSaturation: 58,
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
    const hueRadians = ((cluster.oklch?.h ?? cluster.hsl?.h ?? 0) / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians) * weight,
      y: sum.y + Math.sin(hueRadians) * weight,
    };
  }, { x: 0, y: 0 });
  const maxSaturation = Math.max(
    ...clusters.map((cluster) =>
      clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100)
    ),
    0
  );
  const lightnessValues = clusters.map((cluster) =>
    clampControlValue((cluster.oklch?.l ?? 0.5) * 100, 0, 100)
  );
  const averageSaturation = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) * weight;
  }, 0) / totalWeight;
  const averageLightness = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + clampControlValue((cluster.oklch?.l ?? 0.5) * 100, 0, 100) * weight;
  }, 0) / totalWeight;
  const warmthBias = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hue = cluster.oklch?.h ?? cluster.hsl?.h ?? 0;
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
    oklch: window.AppColorUtils?.hexToOklch?.(hex) || null,
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex);
}

function isPaletteColorTooClose(candidateColor, palette, minimumDistance = 24) {
  return palette.some((existingColor) => {
    return getRgbDistanceBetween(candidateColor, existingColor) < minimumDistance;
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
      averageSaturation: 42,
      averageLightness: 58,
      warmthBias: 0,
      lightnessSpread: 0.3,
    };
  }

  const paletteOklch = normalizedColors.map((color) => window.AppColorUtils?.hexToOklch?.(color));
  const hueVector = paletteOklch.reduce((sum, color) => {
    const hueRadians = ((color?.h ?? 0) / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians),
      y: sum.y + Math.sin(hueRadians),
    };
  }, { x: 0, y: 0 });
  const lightnessValues = paletteOklch.map((color) =>
    clampControlValue((color?.l ?? 0.5) * 100, 0, 100)
  );
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100), 0) /
    paletteOklch.length;
  const warmthBias =
    paletteOklch.reduce((sum, color) => {
      const hueRadians = ((color?.h ?? 0) / 180) * Math.PI;
      return sum + Math.cos(hueRadians);
    }, 0) / paletteOklch.length;

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
  const oklch = cluster.oklch || window.AppColorUtils?.hexToOklch?.(cluster.hex);
  if (!oklch) {
    return cluster.hex;
  }

  const weightRatio = clampControlValue(
    Math.max(cluster.weight || 0, 1) / Math.max(atmosphere.maxWeight || 1, 1),
    0,
    1
  );
  const atmosphereHue = Number.isFinite(atmosphere.averageHue)
    ? atmosphere.averageHue
    : oklch.h;
  const atmosphereChroma = clampControlValue((atmosphere.averageSaturation / 100) * 0.24, 0.01, 0.24);
  const maximumAtmosphereChroma = clampControlValue((atmosphere.maxSaturation / 100) * 0.24, 0.01, 0.26);
  const atmosphereLightness = clampControlValue(atmosphere.averageLightness / 100, 0.18, 0.86);
  const warmthAdjustment = atmosphere.warmthBias * 9;
  const orbitOffset =
    (variantCycle % 3 - 1) * (role === "accent" ? 18 : role === "dominant" ? 10 : 14);
  let hue = shiftHueTowards(
    oklch.h,
    atmosphereHue,
    role === "dominant" ? 0.42 : role === "accent" ? 0.22 : 0.3
  );
  let chroma = oklch.c;
  let lightness = oklch.l;

  if (role === "dominant") {
    hue += profile.hueShift * 0.95 * direction + orbitOffset * 0.45 + warmthAdjustment * 0.4;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        atmosphereChroma + 0.012 + profile.saturationShift * 0.0018 - weightRatio * 0.008,
        0.04,
        0.18
      ),
      0.58
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness + profile.neutralLift * 0.006 + orbitOffset * 0.0018,
        0.28,
        0.72
      ),
      0.62
    );
  } else if (role === "accent") {
    hue += profile.accentHueShift * 1.15 * direction + orbitOffset + warmthAdjustment * 0.24;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        Math.max(
          atmosphereChroma + profile.accentBoost * 0.0018,
          maximumAtmosphereChroma * 0.7
        ),
        0.08,
        0.24
      ),
      0.72
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness +
          profile.lightnessShift * 0.006 +
          direction * 0.12 * (0.5 + atmosphere.lightnessSpread) +
          orbitOffset * 0.003,
        0.24,
        0.8
      ),
      0.64
    );
  } else {
    hue +=
      profile.hueShift * 1.1 * direction +
      direction * 8 +
      orbitOffset * 0.75 +
      warmthAdjustment * 0.28;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        atmosphereChroma + 0.02 + profile.saturationShift * 0.0018,
        0.05,
        0.2
      ),
      0.66
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness +
          profile.lightnessShift * 0.006 +
          direction * 0.07 * (0.45 + atmosphere.lightnessSpread) +
          orbitOffset * 0.0022,
        0.24,
        0.78
      ),
      0.6
    );
  }

  hue = (hue + 360) % 360;
  chroma = clampControlValue(
    chroma,
    role === "accent" ? 0.07 : 0.035,
    role === "dominant" ? 0.18 : 0.24
  );
  lightness = clampControlValue(lightness, 0.22, role === "accent" ? 0.82 : 0.78);

  let candidate = controlsNormalizeHexColor(
    window.AppColorUtils?.oklchToHex(lightness, chroma, hue, {
      minLightness: 0.22,
      maxLightness: role === "accent" ? 0.82 : 0.78,
      maxChroma: 0.26,
    }) || cluster.hex
  );

  if (candidate === cluster.hex || isPaletteColorTooClose(candidate, [cluster.hex], 18)) {
    candidate = controlsNormalizeHexColor(
      window.AppColorUtils?.oklchToHex(
        clampControlValue(lightness + direction * (role === "accent" ? 0.08 : 0.06), 0.12, 0.88),
        clampControlValue(chroma + (role === "accent" ? 0.018 : 0.012), 0.01, 0.26),
        (hue + direction * (role === "accent" ? 18 : 12) + orbitOffset + 360) % 360,
        {
          minLightness: 0.12,
          maxLightness: 0.88,
          maxChroma: 0.26,
        }
      ) || candidate
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
    return Math.min(
      ...clusters.map((cluster) =>
        getRgbDistanceBetween(color, {
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

  const paletteOklch = normalizedColors.map((color) => window.AppColorUtils?.hexToOklch?.(color));
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100), 0) /
    paletteOklch.length;

  return resolvePaletteAdjustmentSettings({
    saturation: clampControlValue(Math.round(averageSaturation / 5) * 5, 0, 100),
    brightness: clampControlValue(
      Math.round(((((averageLightness / 100) - 0.18) / 0.76) * 100) / 5) * 5,
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
    const mergedOrderedPalette = mergePaletteWithPinnedColors(orderedPalette, pinnedEntries);
    const comparableOrderedPalette = getComparablePaletteSlice(
      mergedOrderedPalette,
      pinnedEntries
    );

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
