// Palette generator image analysis: sampling, clustering and derived candidates.
function rotateImagePaletteCandidates(values, offset) {
  if (!Array.isArray(values) || values.length <= 1) {
    return Array.isArray(values) ? [...values] : [];
  }

  const normalizedOffset = ((offset % values.length) + values.length) % values.length;
  if (normalizedOffset === 0) {
    return [...values];
  }

  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function rgbToHex(color) {
  return `#${[color.r, color.g, color.b]
    .map((channel) =>
      clampControlValue(Math.round(channel), 0, 255).toString(16).padStart(2, "0")
    )
    .join("")
    .toUpperCase()}`;
}

function getRgbDistanceBetween(colorA, colorB) {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for palette extraction."));
    image.src = dataUrl;
  });
}

async function getUploadedImageSamplePoints() {
  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  if (Array.isArray(uploadedBaseImage.analysisCache?.points)) {
    return uploadedBaseImage.analysisCache.points;
  }

  const image = await loadImageElement(uploadedBaseImage.dataUrl);
  const maxDimension = 56;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  );
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const quantizedColors = new Map();

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 40) {
      continue;
    }

    const r = Math.round(imageData[index] / 16) * 16;
    const g = Math.round(imageData[index + 1] / 16) * 16;
    const b = Math.round(imageData[index + 2] / 16) * 16;
    const key = `${r}-${g}-${b}`;
    const existingPoint = quantizedColors.get(key);

    if (existingPoint) {
      existingPoint.weight += 1;
      continue;
    }

    quantizedColors.set(key, {
      r,
      g,
      b,
      weight: 1,
    });
  }

  const points = Array.from(quantizedColors.values());
  updateUploadedImageAnalysisCache({
    points,
    width,
    height,
  });
  return points;
}

function getWeightedRandomPoint(points, weightResolver) {
  const totalWeight = points.reduce((sum, point) => sum + weightResolver(point), 0);
  if (totalWeight <= 0) {
    return points[Math.floor(Math.random() * points.length)];
  }

  let threshold = Math.random() * totalWeight;
  for (const point of points) {
    threshold -= weightResolver(point);
    if (threshold <= 0) {
      return point;
    }
  }

  return points[points.length - 1];
}

function initializeImageClusterCenters(points, clusterCount) {
  const centers = [];
  centers.push({ ...getWeightedRandomPoint(points, (point) => point.weight) });

  while (centers.length < clusterCount) {
    const nextPoint = getWeightedRandomPoint(points, (point) => {
      const nearestDistance = Math.min(
        ...centers.map((center) => {
          const distance = getRgbDistanceBetween(point, center);
          return distance * distance;
        })
      );
      return point.weight * Math.max(nearestDistance, 1);
    });

    centers.push({ ...nextPoint });
  }

  return centers;
}

function clusterImageColors(points, clusterCount) {
  const safeClusterCount = Math.max(1, Math.min(clusterCount, points.length));
  let centers = initializeImageClusterCenters(points, safeClusterCount);

  for (let iteration = 0; iteration < 8; iteration++) {
    const buckets = Array.from({ length: safeClusterCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    points.forEach((point) => {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      centers.forEach((center, index) => {
        const distance = getRgbDistanceBetween(point, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const bucket = buckets[nearestIndex];
      bucket.r += point.r * point.weight;
      bucket.g += point.g * point.weight;
      bucket.b += point.b * point.weight;
      bucket.weight += point.weight;
    });

    centers = centers.map((center, index) => {
      const bucket = buckets[index];
      if (!bucket.weight) {
        return { ...getWeightedRandomPoint(points, (point) => point.weight) };
      }

      return {
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
      };
    });
  }

  const clusters = centers.map((center) => ({
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    weight: 0,
  }));

  points.forEach((point) => {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    clusters.forEach((cluster, index) => {
      const distance = getRgbDistanceBetween(point, cluster);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    clusters[nearestIndex].weight += point.weight;
  });

  return clusters
    .filter((cluster) => cluster.weight > 0)
    .sort((clusterA, clusterB) => clusterB.weight - clusterA.weight);
}

function cleanImageClusterDuplicates(clusters) {
  const deduplicatedClusters = [];

  clusters.forEach((cluster) => {
    const hex = controlsNormalizeHexColor(rgbToHex(cluster));
    if (isDisallowedColor(hex)) {
      return;
    }

    const isNearExistingCluster = deduplicatedClusters.some(
      (existingCluster) => getRgbDistanceBetween(existingCluster, cluster) < 26
    );
    if (isNearExistingCluster) {
      return;
    }

    const hsl = controlsHexToHsl(hex);
    deduplicatedClusters.push({
      ...cluster,
      hex,
      hsl,
      relevance:
        cluster.weight *
        (1 + hsl.s / 220) *
        (0.92 + Math.abs(hsl.l - 50) / 180),
    });
  });

  return deduplicatedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImageClusterPriorityScore(cluster, allClusters, selectedClusters = []) {
  const safeClusters = Array.isArray(allClusters) && allClusters.length > 0
    ? allClusters
    : [cluster];
  const maxWeight = Math.max(
    ...safeClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(cluster.hsl?.s ?? 0, 0, 100) / 100;
  const lightnessDistance = Math.min(Math.abs((cluster.hsl?.l ?? 50) - 50) / 50, 1);
  const nearestDistance = selectedClusters.length > 0
    ? Math.min(
        ...selectedClusters.map((selectedCluster) =>
          getRgbDistanceBetween(selectedCluster, cluster)
        )
      )
    : 72;
  const normalizedDistance = Math.min(nearestDistance / 100, 1.25);

  if (prioritizeImageDominantColors) {
    const dominanceBaseScore =
      (cluster.weight || 0) *
      (1 + saturationFactor * 0.35) *
      (0.96 + lightnessDistance * 0.18);
    const diversityBoost = selectedClusters.length > 0
      ? 0.8 + normalizedDistance * 0.34
      : 1;

    return dominanceBaseScore * diversityBoost;
  }

  const accentBaseScore =
    Math.pow(Math.max(cluster.weight || 1, 1), 0.45) *
    (1 + saturationFactor * 1.15) *
    (1 + lightnessDistance * 0.45) *
    (0.62 + (1 - normalizedWeight) * 1.12);
  const diversityBoost = selectedClusters.length > 0
    ? 0.96 + normalizedDistance * 0.62
    : 1.12;

  return accentBaseScore * diversityBoost;
}

function selectRelevantImageClusters(clusters, targetCount, variantIndex = 0) {
  const candidatePoolSize = Math.min(
    clusters.length,
    Math.max(targetCount + 4, targetCount * 2)
  );
  const prioritizedClusters = [...clusters].sort((clusterA, clusterB) => {
    const scoreA = getImageClusterPriorityScore(clusterA, clusters);
    const scoreB = getImageClusterPriorityScore(clusterB, clusters);
    return scoreB - scoreA;
  });
  const rotatedPriorityPool = rotateImagePaletteCandidates(
    prioritizedClusters.slice(0, candidatePoolSize),
    variantIndex
  );
  const pool = [
    ...rotatedPriorityPool,
    ...prioritizedClusters.slice(candidatePoolSize),
  ];
  const selectedClusters = [];
  const selectionTarget = Math.min(targetCount, clusters.length);

  if (pool.length > 0) {
    selectedClusters.push(pool.shift());
  }

  while (pool.length > 0 && selectedClusters.length < selectionTarget) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((cluster, index) => {
      const poolOffset = Math.max(0, candidatePoolSize - index);
      const rotationBias = 1 + (poolOffset / Math.max(candidatePoolSize, 1)) * 0.12;
      const score =
        getImageClusterPriorityScore(cluster, clusters, selectedClusters) * rotationBias;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selectedClusters.push(pool.splice(bestIndex, 1)[0]);
  }

  return selectedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImagePaletteVariantHex(cluster, clusterIndex, variantIndex) {
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];

  if (normalizedVariantIndex === 0) {
    return cluster.hex;
  }

  const direction = (clusterIndex + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
  const stagger = profile.stagger[clusterIndex % profile.stagger.length] || 0;
  const hueOffset = profile.hueShift * direction + (clusterIndex % 3) * direction * 2;
  const saturationOffset = profile.saturationShift + stagger * 0.45;
  const lightnessOffset = profile.lightnessShift + stagger * 0.8;

  return controlsNormalizeHexColor(
    controlsHslToHex(
      (cluster.hsl.h + hueOffset + 360) % 360,
      clampControlValue(cluster.hsl.s + saturationOffset, 4, 100),
      clampControlValue(cluster.hsl.l + lightnessOffset, 8, 92)
    )
  );
}

function getImageClusterStartPenalty(cluster, allClusters) {
  const maxWeight = Math.max(
    ...allClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(cluster.hsl?.s ?? 0, 0, 100) / 100;
  const balancedLightness = 1 - Math.min(Math.abs((cluster.hsl?.l ?? 50) - 58) / 58, 1);

  if (prioritizeImageDominantColors) {
    return (1 - normalizedWeight) * 0.2 + (1 - balancedLightness) * 0.04;
  }

  return (1 - saturationFactor) * 0.12 + (1 - balancedLightness) * 0.05;
}

function getImageClusterHarmonyDistance(clusterA, clusterB) {
  const hueDifference = Math.abs((clusterA.hsl?.h ?? 0) - (clusterB.hsl?.h ?? 0));
  const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180;
  const saturationDifference =
    Math.abs((clusterA.hsl?.s ?? 0) - (clusterB.hsl?.s ?? 0)) / 100;
  const lightnessDifference =
    Math.abs((clusterA.hsl?.l ?? 50) - (clusterB.hsl?.l ?? 50)) / 100;

  return (
    wrappedHueDifference * 0.6 +
    saturationDifference * 0.2 +
    lightnessDifference * 0.2
  );
}

function orderImageClustersByHarmony(clusters) {
  if (!Array.isArray(clusters) || clusters.length <= 2) {
    return [...clusters];
  }

  const totalClusters = clusters.length;
  const totalMasks = 1 << totalClusters;
  const pathCosts = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(Infinity)
  );
  const previousIndexes = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(-1)
  );

  clusters.forEach((cluster, index) => {
    pathCosts[1 << index][index] = getImageClusterStartPenalty(cluster, clusters);
  });

  for (let mask = 1; mask < totalMasks; mask += 1) {
    for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
      const currentCost = pathCosts[mask][lastIndex];
      if (!Number.isFinite(currentCost)) {
        continue;
      }

      for (let nextIndex = 0; nextIndex < totalClusters; nextIndex += 1) {
        if (mask & (1 << nextIndex)) {
          continue;
        }

        const nextMask = mask | (1 << nextIndex);
        const nextCost =
          currentCost +
          getImageClusterHarmonyDistance(clusters[lastIndex], clusters[nextIndex]);

        if (nextCost < pathCosts[nextMask][nextIndex]) {
          pathCosts[nextMask][nextIndex] = nextCost;
          previousIndexes[nextMask][nextIndex] = lastIndex;
        }
      }
    }
  }

  const fullMask = totalMasks - 1;
  let bestLastIndex = 0;
  let bestPathCost = Infinity;

  for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
    if (pathCosts[fullMask][lastIndex] < bestPathCost) {
      bestPathCost = pathCosts[fullMask][lastIndex];
      bestLastIndex = lastIndex;
    }
  }

  const orderedClusters = [];
  let currentMask = fullMask;
  let currentIndex = bestLastIndex;

  while (currentIndex !== -1) {
    orderedClusters.unshift(clusters[currentIndex]);
    const previousIndex = previousIndexes[currentMask][currentIndex];
    currentMask ^= 1 << currentIndex;
    currentIndex = previousIndex;
  }

  return orderedClusters;
}

function expandImagePalette(selectedClusters, targetCount, variantIndex = 0, seedPalette = []) {
  const palette = [...seedPalette];
  const usedColors = new Set(palette);
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];
  const lightnessOffsets = normalizedVariantIndex === 0
    ? [-18, 18, -10, 10, -28, 28, -36, 36]
    : profile.stagger.map((offset) => Math.round(offset * 1.4)).concat([-20, 20, -30, 30]);
  let expansionStep = 0;

  while (palette.length < targetCount && selectedClusters.length > 0) {
    const cluster = selectedClusters[
      (normalizedVariantIndex + expansionStep) % selectedClusters.length
    ];
    const offset = lightnessOffsets[
      Math.floor(expansionStep / selectedClusters.length) % lightnessOffsets.length
    ];
    const direction = (expansionStep + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
    const variantHex = controlsNormalizeHexColor(
      controlsHslToHex(
        (cluster.hsl.h + profile.hueShift * direction + 360) % 360,
        clampControlValue(
          cluster.hsl.s + (offset > 0 ? -6 : 8) + profile.saturationShift * 0.7,
          4,
          100
        ),
        clampControlValue(cluster.hsl.l + offset + profile.lightnessShift * 0.55, 8, 92)
      )
    );

    if (!usedColors.has(variantHex) && !isDisallowedColor(variantHex)) {
      usedColors.add(variantHex);
      palette.push(variantHex);
    }

    expansionStep += 1;
    if (expansionStep > selectedClusters.length * lightnessOffsets.length * 2) {
      break;
    }
  }

  return palette.slice(0, targetCount);
}

function getCachedImageColorClusters() {
  return Array.isArray(uploadedBaseImage?.analysisCache?.deduplicatedClusters)
    ? uploadedBaseImage.analysisCache.deduplicatedClusters
    : [];
}

async function getImageColorClusters() {
  const cachedClusters = getCachedImageColorClusters();
  if (cachedClusters.length > 0) {
    return cachedClusters;
  }

  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  const points = await getUploadedImageSamplePoints();
  if (points.length === 0) {
    return [];
  }

  const clusterCount = Math.min(Math.max(MAX_PALETTE_COLORS, 12), points.length);
  const clusters = cleanImageClusterDuplicates(clusterImageColors(points, clusterCount));

  updateUploadedImageAnalysisCache({
    deduplicatedClusters: clusters,
  });

  return clusters;
}
