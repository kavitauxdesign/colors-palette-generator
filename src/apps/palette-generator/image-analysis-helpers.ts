import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type {
  ImagePaletteCluster,
  ImagePaletteVariantProfile,
  ImageSamplePoint,
} from "./image-types";

type ImageAnalysisHelperOptions = {
  prioritizeImageDominantColors?: unknown;
  isDisallowedColor?: ((hex: string) => boolean) | null;
  profiles?: ImagePaletteVariantProfile[] | null;
};

const {
  rgbToHex,
  getRgbDistance,
  normalizeHexColor,
  hexToHsl,
  hexToOklch,
  oklchToHex,
} = AppColorUtils;
const { clampControlValue, normalizePaletteHexCollection } = PaletteGeneratorCoreHelpers;

function isDisallowedColorFactory(
  predicate: ImageAnalysisHelperOptions["isDisallowedColor"]
) {
  return typeof predicate === "function" ? predicate : () => false;
}

function resolveVariantProfiles(profiles: ImagePaletteVariantProfile[] | null | undefined) {
  return Array.isArray(profiles) && profiles.length > 0
    ? profiles
    : [
        {
          hueShift: 0,
          saturationShift: 0,
          lightnessShift: 0,
          stagger: [0, 10, -10, 16],
        },
      ];
}

function resolveClusterHex(cluster: ImagePaletteCluster) {
  return normalizeHexColor(cluster?.hex || rgbToHex(cluster) || "");
}

function rotateImagePaletteCandidates<T>(values: T[] | null | undefined, offset: number) {
  if (!Array.isArray(values) || values.length <= 1) {
    return Array.isArray(values) ? [...values] : [];
  }

  const normalizedOffset = ((offset % values.length) + values.length) % values.length;
  if (normalizedOffset === 0) {
    return [...values];
  }

  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function getRgbDistanceBetween(colorA: unknown, colorB: unknown) {
  return getRgbDistance(colorA, colorB);
}

function getWeightedRandomPoint(
  points: ImageSamplePoint[],
  weightResolver: (point: ImageSamplePoint) => number
) {
  const safePoints = Array.isArray(points) ? points : [];
  if (safePoints.length === 0) {
    return null;
  }

  const totalWeight = safePoints.reduce((sum, point) => sum + weightResolver(point), 0);
  if (totalWeight <= 0) {
    return safePoints[Math.floor(Math.random() * safePoints.length)] || null;
  }

  let threshold = Math.random() * totalWeight;
  for (const point of safePoints) {
    threshold -= weightResolver(point);
    if (threshold <= 0) {
      return point;
    }
  }

  return safePoints[safePoints.length - 1] || null;
}

function initializeImageClusterCenters(points: ImageSamplePoint[], clusterCount: number) {
  const safePoints = Array.isArray(points) ? points : [];
  const safeClusterCount = Math.max(1, Math.min(Math.round(clusterCount || 0), safePoints.length));

  if (safePoints.length === 0 || safeClusterCount <= 0) {
    return [];
  }

  const firstPoint = getWeightedRandomPoint(safePoints, (point) => point.weight);
  if (!firstPoint) {
    return [];
  }

  const centers: ImageSamplePoint[] = [{ ...firstPoint }];

  while (centers.length < safeClusterCount) {
    const nextPoint = getWeightedRandomPoint(safePoints, (point) => {
      const nearestDistance = Math.min(
        ...centers.map((center) => {
          const distance = getRgbDistanceBetween(point, center);
          return distance * distance;
        })
      );
      return point.weight * Math.max(nearestDistance, 1);
    });

    if (!nextPoint) {
      break;
    }

    centers.push({ ...nextPoint });
  }

  return centers;
}

function clusterImageColors(points: ImageSamplePoint[], clusterCount: number) {
  const safePoints = Array.isArray(points) ? points : [];
  const safeClusterCount = Math.max(1, Math.min(clusterCount, safePoints.length));
  if (safePoints.length === 0 || safeClusterCount <= 0) {
    return [];
  }

  let centers = initializeImageClusterCenters(safePoints, safeClusterCount);
  if (centers.length === 0) {
    return [];
  }

  for (let iteration = 0; iteration < 8; iteration += 1) {
    const buckets = Array.from({ length: safeClusterCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    safePoints.forEach((point) => {
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
        const fallbackPoint = getWeightedRandomPoint(safePoints, (point) => point.weight);
        return fallbackPoint ? { ...fallbackPoint } : center;
      }

      return {
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
        weight: 0,
      };
    });
  }

  const clusters = centers.map((center) => ({
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    weight: 0,
  }));

  safePoints.forEach((point) => {
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

function cleanImageClusterDuplicates(
  clusters: ImagePaletteCluster[],
  options: ImageAnalysisHelperOptions = {}
) {
  const isDisallowedColor = isDisallowedColorFactory(options.isDisallowedColor);
  const deduplicatedClusters: ImagePaletteCluster[] = [];

  (Array.isArray(clusters) ? clusters : []).forEach((cluster) => {
    const hex = resolveClusterHex(cluster);
    if (!hex || isDisallowedColor(hex)) {
      return;
    }

    const isNearExistingCluster = deduplicatedClusters.some(
      (existingCluster) => getRgbDistanceBetween(existingCluster, cluster) < 26
    );
    if (isNearExistingCluster) {
      return;
    }

    const hsl = hexToHsl(hex);
    const oklch = hexToOklch(hex);
    const chromaPercent = clampControlValue(((oklch?.c ?? 0) / 0.24) * 100, 0, 100);
    const lightnessPercent = clampControlValue((oklch?.l ?? 0.5) * 100, 0, 100);

    deduplicatedClusters.push({
      ...cluster,
      hex,
      hsl,
      oklch,
      relevance:
        (cluster.weight || 0) *
        (1 + chromaPercent / 260) *
        (0.92 + Math.abs(lightnessPercent - 58) / 190),
    });
  });

  return deduplicatedClusters.sort(
    (clusterA, clusterB) => (clusterB.relevance || 0) - (clusterA.relevance || 0)
  );
}

function getImageClusterPriorityScore(
  cluster: ImagePaletteCluster,
  allClusters: ImagePaletteCluster[],
  selectedClusters: ImagePaletteCluster[] = [],
  options: ImageAnalysisHelperOptions = {}
) {
  const prioritizeImageDominantColors = !!options.prioritizeImageDominantColors;
  const safeClusters =
    Array.isArray(allClusters) && allClusters.length > 0 ? allClusters : [cluster];
  const maxWeight = Math.max(
    ...safeClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor =
    clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) / 100;
  const lightnessDistance = Math.min(
    Math.abs((cluster.oklch?.l ?? 0.5) - 0.5) / 0.42,
    1
  );
  const nearestDistance =
    selectedClusters.length > 0
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

function selectRelevantImageClusters(
  clusters: ImagePaletteCluster[],
  targetCount: number,
  variantIndex = 0,
  options: ImageAnalysisHelperOptions = {}
) {
  const safeClusters = Array.isArray(clusters) ? clusters : [];
  if (safeClusters.length === 0) {
    return [];
  }

  const candidatePoolSize = Math.min(
    safeClusters.length,
    Math.max(targetCount + 4, targetCount * 2)
  );
  const prioritizedClusters = [...safeClusters].sort((clusterA, clusterB) => {
    const scoreA = getImageClusterPriorityScore(clusterA, safeClusters, [], options);
    const scoreB = getImageClusterPriorityScore(clusterB, safeClusters, [], options);
    return scoreB - scoreA;
  });
  const rotatedPriorityPool = rotateImagePaletteCandidates(
    prioritizedClusters.slice(0, candidatePoolSize),
    variantIndex
  );
  const pool = [...rotatedPriorityPool, ...prioritizedClusters.slice(candidatePoolSize)];
  const selectedClusters: ImagePaletteCluster[] = [];
  const selectionTarget = Math.min(targetCount, safeClusters.length);

  if (pool.length > 0) {
    const firstCluster = pool.shift();
    if (firstCluster) {
      selectedClusters.push(firstCluster);
    }
  }

  while (pool.length > 0 && selectedClusters.length < selectionTarget) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((cluster, index) => {
      const poolOffset = Math.max(0, candidatePoolSize - index);
      const rotationBias = 1 + (poolOffset / Math.max(candidatePoolSize, 1)) * 0.12;
      const score =
        getImageClusterPriorityScore(cluster, safeClusters, selectedClusters, options) *
        rotationBias;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const nextCluster = pool.splice(bestIndex, 1)[0];
    if (nextCluster) {
      selectedClusters.push(nextCluster);
    }
  }

  return selectedClusters.sort(
    (clusterA, clusterB) => (clusterB.relevance || 0) - (clusterA.relevance || 0)
  );
}

function getImagePaletteVariantHex(
  cluster: ImagePaletteCluster,
  clusterIndex: number,
  variantIndex: number,
  options: ImageAnalysisHelperOptions = {}
) {
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profiles = resolveVariantProfiles(options.profiles);
  const profile = profiles[normalizedVariantIndex % profiles.length];

  if (normalizedVariantIndex === 0) {
    return resolveClusterHex(cluster);
  }

  const baseHex = resolveClusterHex(cluster);
  const baseOklch = cluster.oklch || hexToOklch(baseHex);
  if (!baseOklch) {
    return baseHex;
  }

  const stagger = Array.isArray(profile.stagger) ? profile.stagger : [0];
  const direction = (clusterIndex + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
  const staggerValue = stagger[clusterIndex % stagger.length] || 0;
  const hueOffset = (profile.hueShift || 0) * direction + (clusterIndex % 3) * direction * 2;
  const chromaOffset = ((profile.saturationShift || 0) + staggerValue * 0.45) * 0.0018;
  const lightnessOffset = ((profile.lightnessShift || 0) + staggerValue * 0.8) * 0.006;

  return normalizeHexColor(
    oklchToHex(
      clampControlValue((baseOklch.l ?? 0.5) + lightnessOffset, 0.08, 0.95),
      clampControlValue(Math.max(baseOklch.c ?? 0, 0.01) + chromaOffset, 0.004, 0.26),
      (baseOklch.h ?? 0) + hueOffset,
      {
        minLightness: 0.08,
        maxLightness: 0.95,
        maxChroma: 0.26,
      }
    ) || baseHex
  );
}

function getImageClusterStartPenalty(
  cluster: ImagePaletteCluster,
  allClusters: ImagePaletteCluster[],
  options: ImageAnalysisHelperOptions = {}
) {
  const prioritizeImageDominantColors = !!options.prioritizeImageDominantColors;
  const safeClusters =
    Array.isArray(allClusters) && allClusters.length > 0 ? allClusters : [cluster];
  const maxWeight = Math.max(
    ...safeClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor =
    clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) / 100;
  const balancedLightness =
    1 - Math.min(Math.abs((cluster.oklch?.l ?? 0.58) - 0.58) / 0.38, 1);

  if (prioritizeImageDominantColors) {
    return (1 - normalizedWeight) * 0.2 + (1 - balancedLightness) * 0.04;
  }

  return (1 - saturationFactor) * 0.12 + (1 - balancedLightness) * 0.05;
}

function getImageClusterHarmonyDistance(
  clusterA: ImagePaletteCluster,
  clusterB: ImagePaletteCluster
) {
  const hueDifference = Math.abs(
    (clusterA.oklch?.h ?? clusterA.hsl?.h ?? 0) - (clusterB.oklch?.h ?? clusterB.hsl?.h ?? 0)
  );
  const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180;
  const saturationDifference =
    Math.abs((clusterA.oklch?.c ?? 0) - (clusterB.oklch?.c ?? 0)) / 0.24;
  const lightnessDifference = Math.abs(
    (clusterA.oklch?.l ?? 0.5) - (clusterB.oklch?.l ?? 0.5)
  );

  return wrappedHueDifference * 0.6 + saturationDifference * 0.2 + lightnessDifference * 0.2;
}

function orderImageClustersByHarmony(
  clusters: ImagePaletteCluster[],
  options: ImageAnalysisHelperOptions = {}
) {
  const safeClusters = Array.isArray(clusters) ? clusters : [];
  if (safeClusters.length <= 2) {
    return [...safeClusters];
  }

  const totalClusters = safeClusters.length;
  const totalMasks = 1 << totalClusters;
  const pathCosts = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(Infinity)
  );
  const previousIndexes = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(-1)
  );

  safeClusters.forEach((cluster, index) => {
    pathCosts[1 << index][index] = getImageClusterStartPenalty(cluster, safeClusters, options);
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
          getImageClusterHarmonyDistance(safeClusters[lastIndex], safeClusters[nextIndex]);

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

  const orderedClusters: ImagePaletteCluster[] = [];
  let currentMask = fullMask;
  let currentIndex = bestLastIndex;

  while (currentIndex !== -1) {
    orderedClusters.unshift(safeClusters[currentIndex]);
    const previousIndex = previousIndexes[currentMask][currentIndex];
    currentMask ^= 1 << currentIndex;
    currentIndex = previousIndex;
  }

  return orderedClusters;
}

function expandImagePalette(
  selectedClusters: ImagePaletteCluster[],
  targetCount: number,
  variantIndex = 0,
  seedPalette: string[] = [],
  options: ImageAnalysisHelperOptions = {}
) {
  const palette = normalizePaletteHexCollection(seedPalette);
  const usedColors = new Set(palette);
  const safeClusters = Array.isArray(selectedClusters) ? selectedClusters : [];
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profiles = resolveVariantProfiles(options.profiles);
  const profile = profiles[normalizedVariantIndex % profiles.length];
  const lightnessOffsets =
    normalizedVariantIndex === 0
      ? [-0.14, 0.14, -0.08, 0.08, -0.2, 0.2, -0.26, 0.26]
      : (Array.isArray(profile.stagger) ? profile.stagger : [])
          .map((offset) => offset * 0.01)
          .concat([-0.16, 0.16, -0.22, 0.22]);
  const isDisallowedColor = isDisallowedColorFactory(options.isDisallowedColor);
  let expansionStep = 0;

  while (palette.length < targetCount && safeClusters.length > 0) {
    const cluster = safeClusters[(normalizedVariantIndex + expansionStep) % safeClusters.length];
    const offset =
      lightnessOffsets[
        Math.floor(expansionStep / safeClusters.length) % lightnessOffsets.length
      ];
    const direction = (expansionStep + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
    const baseHex = resolveClusterHex(cluster);
    const baseOklch = cluster.oklch || hexToOklch(baseHex);

    if (!baseOklch) {
      expansionStep += 1;
      if (expansionStep > safeClusters.length * lightnessOffsets.length * 2) {
        break;
      }
      continue;
    }

    const variantHex = normalizeHexColor(
      oklchToHex(
        clampControlValue(
          (baseOklch.l ?? 0.5) + offset + (profile.lightnessShift || 0) * 0.0055,
          0.08,
          0.95
        ),
        clampControlValue(
          Math.max(baseOklch.c ?? 0, 0.01) +
            ((offset > 0 ? -6 : 8) + (profile.saturationShift || 0) * 0.7) * 0.0018,
          0.004,
          0.26
        ),
        (baseOklch.h ?? 0) + (profile.hueShift || 0) * direction,
        {
          minLightness: 0.08,
          maxLightness: 0.95,
          maxChroma: 0.26,
        }
      ) || baseHex
    );

    if (variantHex && !usedColors.has(variantHex) && !isDisallowedColor(variantHex)) {
      usedColors.add(variantHex);
      palette.push(variantHex);
    }

    expansionStep += 1;
    if (expansionStep > safeClusters.length * lightnessOffsets.length * 2) {
      break;
    }
  }

  return palette.slice(0, targetCount);
}

export const PaletteGeneratorImageAnalysisHelpers = {
  rgbToHex,
  getRgbDistanceBetween,
  rotateImagePaletteCandidates,
  getWeightedRandomPoint,
  initializeImageClusterCenters,
  clusterImageColors,
  cleanImageClusterDuplicates,
  getImageClusterPriorityScore,
  selectRelevantImageClusters,
  getImagePaletteVariantHex,
  getImageClusterStartPenalty,
  getImageClusterHarmonyDistance,
  orderImageClustersByHarmony,
  expandImagePalette,
};

window.PaletteGeneratorImageAnalysisHelpers = PaletteGeneratorImageAnalysisHelpers;

export default PaletteGeneratorImageAnalysisHelpers;
