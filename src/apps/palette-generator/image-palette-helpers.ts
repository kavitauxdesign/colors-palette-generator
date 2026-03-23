import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type {
  ImagePaletteAtmosphere,
  ImagePaletteCluster,
  InspiredVariantProfile,
} from "./image-types";

type InspiredPaletteOptions = {
  profiles?: InspiredVariantProfile[];
  isDisallowedColor?: ((hex: string) => boolean) | null;
  orderImageClustersByHarmony?: ((clusters: ImagePaletteCluster[]) => ImagePaletteCluster[]) | null;
};

type ValidateInspiredPaletteOptions = {
  getRgbDistanceBetween?: ((colorA: unknown, colorB: unknown) => number) | null;
};

const {
  normalizeHexColor,
  hexToHsl,
  hexToOklch,
  oklchToHex,
  getRgbDistance,
} = AppColorUtils;
const {
  normalizePaletteHexCollection,
  clampControlValue,
  blendControlValue,
  getPaletteSimilarityMetrics,
  resolvePaletteAdjustmentSettings,
} = PaletteGeneratorCoreHelpers;

function getImageInspirationAtmosphere(clusters: ImagePaletteCluster[] = []) {
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

function isPaletteColorTooClose(candidateColor: unknown, palette: unknown[] = [], minimumDistance = 24) {
  return palette.some((existingColor) => {
    return (getRgbDistance?.(candidateColor, existingColor) || 0) < minimumDistance;
  });
}

function getInspiredClusterRole(seedIndex: number, targetCount: number) {
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

function getShortestHueDelta(fromHue: number, toHue: number) {
  return ((toHue - fromHue + 540) % 360) - 180;
}

function shiftHueTowards(fromHue: number, toHue: number, ratio: number) {
  return (fromHue + getShortestHueDelta(fromHue, toHue) * ratio + 360) % 360;
}

function getPaletteAtmosphereMetrics(colors: unknown[] = []) {
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

  const paletteOklch = normalizedColors.map((color) => hexToOklch(color));
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
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
    }, 0) / paletteOklch.length;
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

function getAtmosphereAlignmentScore(
  candidateMetrics: ImagePaletteAtmosphere,
  referenceMetrics: ImagePaletteAtmosphere
) {
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

function getInspiredImageVariantHex(
  cluster: ImagePaletteCluster,
  role: string,
  clusterIndex: number,
  variantIndex: number,
  atmosphere: ImagePaletteAtmosphere,
  options: InspiredPaletteOptions = {}
) {
  const profiles = Array.isArray(options.profiles) ? options.profiles : [];
  const profile =
    profiles[Math.abs(variantIndex) % Math.max(profiles.length, 1)] || {
      hueShift: 0,
      saturationShift: 0,
      lightnessShift: 0,
      accentHueShift: 0,
      accentBoost: 0,
      neutralLift: 0,
    };
  const direction = (clusterIndex + variantIndex) % 2 === 0 ? 1 : -1;
  const variantCycle = Math.floor(
    Math.abs(variantIndex) / Math.max(profiles.length, 1)
  );
  const oklch = cluster.oklch || hexToOklch(cluster.hex);
  if (!oklch) {
    return normalizeHexColor(cluster.hex);
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
  const maximumAtmosphereChroma = clampControlValue((atmosphere.maxSaturation || 0) / 100 * 0.24, 0.01, 0.26);
  const atmosphereLightness = clampControlValue(atmosphere.averageLightness / 100, 0.18, 0.86);
  const warmthAdjustment = atmosphere.warmthBias * 9;
  const orbitOffset =
    (variantCycle % 3 - 1) * (role === "accent" ? 18 : role === "dominant" ? 10 : 14);
  let hue = shiftHueTowards(
    oklch.h || 0,
    atmosphereHue,
    role === "dominant" ? 0.42 : role === "accent" ? 0.22 : 0.3
  );
  let chroma = oklch.c || 0;
  let lightness = oklch.l || 0.5;

  if (role === "dominant") {
    hue += profile.hueShift * 0.95 * direction + orbitOffset * 0.45 + warmthAdjustment * 0.4;
    chroma = blendControlValue(
      oklch.c || 0,
      clampControlValue(
        atmosphereChroma + 0.012 + profile.saturationShift * 0.0018 - weightRatio * 0.008,
        0.04,
        0.18
      ),
      0.58
    );
    lightness = blendControlValue(
      oklch.l || 0.5,
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
      oklch.c || 0,
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
      oklch.l || 0.5,
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
      oklch.c || 0,
      clampControlValue(
        atmosphereChroma + 0.02 + profile.saturationShift * 0.0018,
        0.05,
        0.2
      ),
      0.66
    );
    lightness = blendControlValue(
      oklch.l || 0.5,
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

  let candidate = normalizeHexColor(
    oklchToHex(lightness, chroma, hue, {
      minLightness: 0.22,
      maxLightness: role === "accent" ? 0.82 : 0.78,
      maxChroma: 0.26,
    }) || cluster.hex
  );

  if (candidate === cluster.hex || isPaletteColorTooClose(candidate, [cluster.hex], 18)) {
    candidate = normalizeHexColor(
      oklchToHex(
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

function expandInspiredPalette(
  selectedClusters: ImagePaletteCluster[],
  targetCount: number,
  variantIndex: number,
  atmosphere: ImagePaletteAtmosphere,
  seedPalette: string[] = [],
  options: InspiredPaletteOptions = {}
) {
  const palette = [...seedPalette];
  const isDisallowedColor =
    typeof options.isDisallowedColor === "function" ? options.isDisallowedColor : () => false;
  const candidateRoles = ["support", "accent", "dominant", "support"];

  for (let cycleIndex = 0; palette.length < targetCount && cycleIndex < targetCount * 6; cycleIndex += 1) {
    const cluster = selectedClusters[cycleIndex % selectedClusters.length];
    const role = candidateRoles[cycleIndex % candidateRoles.length];
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      cycleIndex,
      variantIndex + cycleIndex + 1,
      atmosphere,
      options
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

function buildInspiredPaletteFromClusters(
  selectedClusters: ImagePaletteCluster[],
  targetCount: number,
  variantIndex: number,
  atmosphere: ImagePaletteAtmosphere,
  options: InspiredPaletteOptions = {}
) {
  const orderImageClustersByHarmony =
    typeof options.orderImageClustersByHarmony === "function"
      ? options.orderImageClustersByHarmony
      : (clusters: ImagePaletteCluster[]) => clusters;
  const isDisallowedColor =
    typeof options.isDisallowedColor === "function" ? options.isDisallowedColor : () => false;
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const seedPalette: string[] = [];

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
      atmosphere,
      options
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
    seedPalette,
    options
  );
}

function validateInspiredPaletteCandidate(
  candidatePalette: unknown[],
  extractedPalette: unknown[],
  clusters: ImagePaletteCluster[] = [],
  atmosphere: ImagePaletteAtmosphere,
  options: ValidateInspiredPaletteOptions = {}
) {
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
  const distanceBetween =
    typeof options.getRgbDistanceBetween === "function"
      ? options.getRgbDistanceBetween
      : ((colorA: unknown, colorB: unknown) => getRgbDistance?.(colorA, colorB) || 0);

  const nearestClusterDistances = normalizedCandidate.map((color) => {
    return Math.min(
      ...clusters.map((cluster) =>
        distanceBetween(color, {
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

function derivePaletteAdjustmentSettingsFromColors(colors: unknown[] = []) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return resolvePaletteAdjustmentSettings();
  }

  const paletteOklch = normalizedColors.map((color) => hexToOklch(color));
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
    }, 0) / paletteOklch.length;

  return resolvePaletteAdjustmentSettings({
    saturation: clampControlValue(Math.round(averageSaturation / 5) * 5, 0, 100),
    brightness: clampControlValue(
      Math.round(((((averageLightness / 100) - 0.18) / 0.76) * 100) / 5) * 5,
      0,
      100
    ),
  });
}

export const PaletteGeneratorImagePaletteHelpers = {
  getImageInspirationAtmosphere,
  isPaletteColorTooClose,
  getInspiredClusterRole,
  getShortestHueDelta,
  shiftHueTowards,
  getPaletteAtmosphereMetrics,
  getAtmosphereAlignmentScore,
  getInspiredImageVariantHex,
  expandInspiredPalette,
  buildInspiredPaletteFromClusters,
  validateInspiredPaletteCandidate,
  derivePaletteAdjustmentSettingsFromColors,
};

window.PaletteGeneratorImagePaletteHelpers = PaletteGeneratorImagePaletteHelpers;

export default PaletteGeneratorImagePaletteHelpers;
