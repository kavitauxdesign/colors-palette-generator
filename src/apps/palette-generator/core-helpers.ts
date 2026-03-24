import AppColorUtils from "../../shared/color/color-utils";

type AdjustmentSettingsLike = {
  brightness?: unknown;
  saturation?: unknown;
};

type LightnessMappingOptions = {
  minLightness?: unknown;
  maxLightness?: unknown;
  gamma?: unknown;
};

type ChromaMappingOptions = {
  minChroma?: unknown;
  maxChroma?: unknown;
  gamma?: unknown;
};

type AdjustedPaletteColorOptions = {
  variantIndex?: unknown;
  settings?: AdjustmentSettingsLike;
  baseSettings?: AdjustmentSettingsLike;
  fallbackSettings?: AdjustmentSettingsLike;
};

type PaletteFallbackCandidate = {
  samePositionCount?: number;
  isTooSimilar?: boolean;
  score?: number;
};

const {
  normalizeHexColor,
  isValidHexColor,
  hexToOklch,
  oklchToHex,
  getColorDistance,
} = AppColorUtils;

function clampControlValue(value: unknown, min: number, max: number) {
  return Math.min(max, Math.max(min, Number(value)));
}

function blendControlValue(fromValue: unknown, toValue: unknown, ratio: unknown) {
  const resolvedFrom = Number(fromValue) || 0;
  const resolvedTo = Number(toValue) || 0;
  const resolvedRatio = Number(ratio) || 0;
  return resolvedFrom + (resolvedTo - resolvedFrom) * resolvedRatio;
}

function resolvePaletteAdjustmentSettings(
  settings: AdjustmentSettingsLike = {},
  fallbackSettings: AdjustmentSettingsLike = {}
) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? Number(settings.brightness)
      : (Number.isFinite(fallbackSettings?.brightness) ? Number(fallbackSettings.brightness) : 0),
    saturation: Number.isFinite(settings?.saturation)
      ? Number(settings.saturation)
      : (Number.isFinite(fallbackSettings?.saturation) ? Number(fallbackSettings.saturation) : 0),
  };
}

function getPaletteAdjustmentDeltas(
  settings: AdjustmentSettingsLike = {},
  baseSettings: AdjustmentSettingsLike = {},
  fallbackSettings: AdjustmentSettingsLike = {}
) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings, fallbackSettings);
  const resolvedBaseSettings = resolvePaletteAdjustmentSettings(baseSettings, fallbackSettings);

  return {
    brightnessDelta: resolvedSettings.brightness - resolvedBaseSettings.brightness,
    saturationDelta: resolvedSettings.saturation - resolvedBaseSettings.saturation,
  };
}

function mapBrightnessValueToOklchLightness(
  brightness: unknown,
  options: LightnessMappingOptions = {}
) {
  const minimumLightness = Number.isFinite(options.minLightness)
    ? Number(options.minLightness)
    : 0.18;
  const maximumLightness = Number.isFinite(options.maxLightness)
    ? Number(options.maxLightness)
    : 0.94;
  const gamma = Number.isFinite(options.gamma) ? Number(options.gamma) : 0.84;
  const ratio = clampControlValue((Number(brightness) || 0) / 100, 0, 1);

  return minimumLightness + (maximumLightness - minimumLightness) * (ratio ** gamma);
}

function mapSaturationValueToOklchChroma(
  saturation: unknown,
  options: ChromaMappingOptions = {}
) {
  const minimumChroma = Number.isFinite(options.minChroma)
    ? Number(options.minChroma)
    : 0.0015;
  const maximumChroma = Number.isFinite(options.maxChroma)
    ? Number(options.maxChroma)
    : 0.24;
  const gamma = Number.isFinite(options.gamma) ? Number(options.gamma) : 1.7;
  const ratio = clampControlValue((Number(saturation) || 0) / 100, 0, 1);

  return minimumChroma + (maximumChroma - minimumChroma) * (ratio ** gamma);
}

function getAdjustedPaletteColor(
  hex: unknown,
  options: AdjustedPaletteColorOptions = {}
) {
  const normalizedHex = normalizeHexColor(hex);
  const oklch = hexToOklch(normalizedHex);
  if (!oklch) {
    return normalizedHex;
  }

  const variantIndex = Number.isFinite(options.variantIndex) ? Number(options.variantIndex) : 0;
  const settings = resolvePaletteAdjustmentSettings(
    options.settings,
    options.fallbackSettings
  );
  const baseSettings = resolvePaletteAdjustmentSettings(
    options.baseSettings,
    options.fallbackSettings
  );
  const lightnessVariants = [0, -0.014, 0.014, -0.028, 0.028, -0.04, 0.04];
  const hueVariants = [0];
  const chromaVariants = [1, 0.99, 1.01, 0.97, 1.03];
  const lightnessOffset = lightnessVariants[variantIndex % lightnessVariants.length];
  const hueOffset =
    hueVariants[Math.floor(variantIndex / lightnessVariants.length) % hueVariants.length];
  const chromaScale =
    chromaVariants[
      Math.floor(variantIndex / (lightnessVariants.length * hueVariants.length)) %
        chromaVariants.length
    ];
  const saturationMappingOptions = {
    minChroma: 0.001,
    maxChroma: 0.24,
    gamma: 1.35,
  };
  const baseLightnessAnchor = mapBrightnessValueToOklchLightness(baseSettings.brightness);
  const targetLightnessAnchor = mapBrightnessValueToOklchLightness(settings.brightness);
  const baseSaturationAnchor = mapSaturationValueToOklchChroma(
    baseSettings.saturation,
    saturationMappingOptions
  );
  const targetSaturationAnchor = mapSaturationValueToOklchChroma(
    settings.saturation,
    saturationMappingOptions
  );
  const brightnessShift = (targetLightnessAnchor - baseLightnessAnchor) * 0.7;
  const chromaRatio =
    baseSaturationAnchor > 0.0001 ? targetSaturationAnchor / baseSaturationAnchor : 1;
  const nextLightness = clampControlValue(
    oklch.l + brightnessShift + lightnessOffset,
    0.14,
    0.96
  );
  const variantChroma = Math.max(oklch.c, 0.003) * chromaScale;
  const nextChroma = clampControlValue(
    variantChroma * clampControlValue(chromaRatio, 0.02, 1.25),
    0.001,
    0.28
  );

  return normalizeHexColor(
    oklchToHex(nextLightness, nextChroma, oklch.h + hueOffset, {
      minLightness: 0.14,
      maxLightness: 0.96,
      maxChroma: 0.28,
    }) || normalizedHex
  );
}

function normalizePaletteHexCollection(colors: unknown) {
  return Array.isArray(colors)
    ? colors
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];
}

function getPaletteSimilarityMetrics(nextPalette: unknown, referencePalette: unknown) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);

  if (nextColors.length === 0 || referenceColors.length === 0) {
    return {
      exactMatch: false,
      sharedColorCount: 0,
      nextCount: nextColors.length,
      referenceCount: referenceColors.length,
    };
  }

  const exactMatch =
    nextColors.length === referenceColors.length &&
    nextColors.every((color, index) => color === referenceColors[index]);

  const referenceSet = new Set(referenceColors);
  const sharedColorCount = nextColors.reduce((count, color) => {
    return count + (referenceSet.has(color) ? 1 : 0);
  }, 0);

  return {
    exactMatch,
    sharedColorCount,
    nextCount: nextColors.length,
    referenceCount: referenceColors.length,
  };
}

function getPalettePositionalSimilarityMetrics(nextPalette: unknown, referencePalette: unknown) {
  const nextColors = normalizePaletteHexCollection(nextPalette);
  const referenceColors = normalizePaletteHexCollection(referencePalette);
  const comparableCount = Math.min(nextColors.length, referenceColors.length);
  let samePositionCount = 0;

  for (let index = 0; index < comparableCount; index += 1) {
    if (nextColors[index] === referenceColors[index]) {
      samePositionCount += 1;
    }
  }

  return {
    samePositionCount,
    comparableCount,
    nextCount: nextColors.length,
    referenceCount: referenceColors.length,
  };
}

function arePalettesTooSimilar(nextPalette: unknown, referencePalette: unknown) {
  const similarityMetrics = getPaletteSimilarityMetrics(nextPalette, referencePalette);
  return (
    similarityMetrics.exactMatch ||
    similarityMetrics.sharedColorCount >= Math.max(similarityMetrics.nextCount - 1, 3)
  );
}

function isBetterPaletteFallbackCandidate(
  nextCandidate: PaletteFallbackCandidate,
  currentFallbackCandidate: PaletteFallbackCandidate | null | undefined
) {
  if (!currentFallbackCandidate) {
    return true;
  }

  if (nextCandidate.samePositionCount !== currentFallbackCandidate.samePositionCount) {
    return (nextCandidate.samePositionCount || 0) < (currentFallbackCandidate.samePositionCount || 0);
  }

  if (nextCandidate.isTooSimilar !== currentFallbackCandidate.isTooSimilar) {
    return !nextCandidate.isTooSimilar;
  }

  return (nextCandidate.score || 0) > (currentFallbackCandidate.score || 0);
}

function scorePaletteHarmony(colors: unknown) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
  }

  if (normalizedColors.length === 1) {
    return 0;
  }

  const paletteOklch = normalizedColors.map((color) => hexToOklch(color));
  let pairwiseDistanceScore = 0;
  let pairCount = 0;
  let closePairPenalty = 0;

  for (let leftIndex = 0; leftIndex < normalizedColors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalizedColors.length; rightIndex += 1) {
      const distance = getColorDistance?.(
        normalizedColors[leftIndex],
        normalizedColors[rightIndex],
        { method: "deltae2000" }
      ) || 0;

      pairwiseDistanceScore += Math.min(distance / 34, 1);
      if (distance < 10) {
        closePairPenalty += (10 - distance) / 10;
      }
      pairCount += 1;
    }
  }

  const averageDistanceScore = pairCount > 0 ? pairwiseDistanceScore / pairCount : 0;
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const saturationBalance = 1 - Math.min(Math.abs(averageSaturation - 42) / 42, 1);
  const lightnessBalance = 1 - Math.min(Math.abs(averageLightness - 58) / 58, 1);

  return (
    averageDistanceScore * 2.1 +
    saturationBalance * 0.75 +
    lightnessBalance * 0.7 -
    closePairPenalty * 0.9
  );
}

function scorePaletteElegance(colors: unknown) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return -Infinity;
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
  const averageSaturationDeviation =
    paletteOklch.reduce((sum, color) => {
      const chromaPercent = clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
      return sum + Math.abs(chromaPercent - averageSaturation);
    }, 0) / paletteOklch.length;
  const averageLightnessDeviation =
    paletteOklch.reduce((sum, color) => {
      const lightnessPercent = clampControlValue((color?.l ?? 0.5) * 100, 0, 100);
      return sum + Math.abs(lightnessPercent - averageLightness);
    }, 0) / paletteOklch.length;
  const vividCount = paletteOklch.filter((color) => ((color?.c ?? 0) / 0.24) * 100 > 62).length;
  const extremeLightnessCount = paletteOklch.filter((color) => {
    const lightnessPercent = ((color?.l ?? 0.5) * 100);
    return lightnessPercent < 22 || lightnessPercent > 82;
  }).length;
  const softColorCount = paletteOklch.filter((color) => {
    const chromaPercent = ((color?.c ?? 0) / 0.24) * 100;
    return chromaPercent >= 18 && chromaPercent <= 52;
  }).length;
  const elegantSaturationBalance = 1 - Math.min(Math.abs(averageSaturation - 36) / 36, 1);
  const elegantLightnessBalance = 1 - Math.min(Math.abs(averageLightness - 58) / 58, 1);
  const saturationSpreadBalance = 1 - Math.min(Math.abs(averageSaturationDeviation - 12) / 20, 1);
  const lightnessSpreadBalance = 1 - Math.min(Math.abs(averageLightnessDeviation - 13) / 22, 1);

  return (
    elegantSaturationBalance * 0.95 +
    elegantLightnessBalance * 0.85 +
    saturationSpreadBalance * 0.65 +
    lightnessSpreadBalance * 0.6 +
    (softColorCount / paletteOklch.length) * 0.4 -
    (vividCount / paletteOklch.length) * 0.85 -
    (extremeLightnessCount / paletteOklch.length) * 0.75
  );
}

export const PaletteGeneratorCoreHelpers = {
  clampControlValue,
  blendControlValue,
  resolvePaletteAdjustmentSettings,
  getPaletteAdjustmentDeltas,
  mapBrightnessValueToOklchLightness,
  mapSaturationValueToOklchChroma,
  getAdjustedPaletteColor,
  normalizePaletteHexCollection,
  getPaletteSimilarityMetrics,
  getPalettePositionalSimilarityMetrics,
  arePalettesTooSimilar,
  isBetterPaletteFallbackCandidate,
  scorePaletteHarmony,
  scorePaletteElegance,
};

window.PaletteGeneratorCoreHelpers = PaletteGeneratorCoreHelpers;

export default PaletteGeneratorCoreHelpers;
