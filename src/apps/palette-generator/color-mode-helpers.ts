import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils, { type ParsedCssColor } from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type {
  AnalogousSeparationMode,
  ColorPaletteType,
  MonochromaticGenerationMode,
  PaletteGeneratorAdjustments,
} from "./types";

type HarmonyPaletteType =
  | "monochromatic"
  | "complementary"
  | "analogous"
  | "triad"
  | "tetrad";

type DisallowedColorPredicate = ((hex: string) => boolean) | null | undefined;

type ColorModeHarmonyOptions = {
  baseColor?: ParsedCssColor | null;
  effectiveType?: ColorPaletteType | null;
  variantIndex?: unknown;
  selectedMonochromaticGenerationMode?: unknown;
  selectedAnalogousSeparationMode?: unknown;
  isDisallowedColor?: DisallowedColorPredicate;
};

type OklchChannels = {
  lightness: number;
  chroma: number;
  hue: number;
};

const MONOCHROMATIC_GENERATION_MODES = new Set<MonochromaticGenerationMode>([
  "automatic",
  "shades",
  "tints",
]);
const ANALOGOUS_SEPARATION_DEGREES: Record<AnalogousSeparationMode, number> = {
  soft: 15,
  medium: 30,
  intense: 60,
};
const COMPLEMENTARY_VARIANT_PROFILES = Object.freeze([
  { complementLightnessOffset: 0, complementChromaScale: 1, tintStrength: 0.66, shadeStrength: 0.58 },
  { complementLightnessOffset: 0.02, complementChromaScale: 0.94, tintStrength: 0.72, shadeStrength: 0.54 },
  { complementLightnessOffset: -0.02, complementChromaScale: 1.06, tintStrength: 0.62, shadeStrength: 0.62 },
]);
const TRIAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [120, -120], lightnessBiases: [-0.014, 0.014], chromaScales: [0.98, 0.92] },
  { offsets: [114, -114], lightnessBiases: [-0.01, 0.01], chromaScales: [0.94, 0.96] },
  { offsets: [126, -126], lightnessBiases: [-0.018, 0.018], chromaScales: [1, 0.9] },
]);
const TETRAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [90, 180, 270], lightnessBiases: [-0.012, 0, -0.006], chromaScales: [0.92, 0.88, 0.94] },
  { offsets: [84, 180, 276], lightnessBiases: [-0.008, 0.004, -0.012], chromaScales: [0.94, 0.9, 0.9] },
  { offsets: [96, 180, 264], lightnessBiases: [-0.016, -0.002, -0.004], chromaScales: [0.9, 0.86, 0.96] },
]);

const {
  normalizeHexColor,
  createColor,
  oklchToHex,
  getHexColorSteps,
  getPerceivedLightness,
  getColorDistance,
} = AppColorUtils;
const {
  clampControlValue,
  blendControlValue,
  resolvePaletteAdjustmentSettings,
  mapBrightnessValueToOklchLightness,
} = PaletteGeneratorCoreHelpers;

function resolveColorModeSettings(
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined
) {
  return resolvePaletteAdjustmentSettings(settings, {
    brightness: APP_CONSTANTS.DEFAULT_BRIGHTNESS,
    saturation: APP_CONSTANTS.DEFAULT_SATURATION,
  });
}

function normalizeMonochromaticGenerationMode(
  value: unknown
): MonochromaticGenerationMode {
  return MONOCHROMATIC_GENERATION_MODES.has(value as MonochromaticGenerationMode)
    ? (value as MonochromaticGenerationMode)
    : (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode);
}

function normalizeAnalogousSeparationMode(
  value: unknown
): AnalogousSeparationMode {
  return Object.prototype.hasOwnProperty.call(ANALOGOUS_SEPARATION_DEGREES, value)
    ? (value as AnalogousSeparationMode)
    : (APP_CONSTANTS.DEFAULT_ANALOGOUS_SEPARATION_MODE as AnalogousSeparationMode);
}

function isDisallowedColorValue(
  hex: string,
  predicate: DisallowedColorPredicate
) {
  return typeof predicate === "function" ? !!predicate(hex) : false;
}

function createColorModeOklchHex(lightness: unknown, chroma: unknown, hue: unknown) {
  return normalizeHexColor(
    oklchToHex(
      clampControlValue(lightness, 0, 1),
      clampControlValue(chroma, 0, 0.4),
      Number(hue) || 0,
      {
        minLightness: 0.08,
        maxLightness: 0.97,
        maxChroma: 0.28,
      }
    ) || ""
  );
}

function getMonochromaticBaseOklch(baseColor: ParsedCssColor | null | undefined): OklchChannels | null {
  const color = baseColor?.color || createColor(baseColor?.hex);
  const [lightness = 0, chroma = 0, hue = 0] = color?.to("oklch")?.coords || [];

  if (!color) {
    return null;
  }

  return {
    lightness: clampControlValue(lightness, 0, 1),
    chroma: clampControlValue(chroma, 0, 0.4),
    hue: Number.isFinite(hue) ? Number(hue) : 0,
  };
}

function getColorModeSaturationInfluence(
  saturation: unknown,
  options: {
    knee?: unknown;
    protectedFloor?: unknown;
    upperGamma?: unknown;
    lowerGamma?: unknown;
  } = {}
) {
  const ratio = clampControlValue((Number(saturation) || 0) / 100, 0, 1);
  const knee = Number.isFinite(options.knee) ? Number(options.knee) : 0.2;
  const protectedFloor = Number.isFinite(options.protectedFloor)
    ? Number(options.protectedFloor)
    : 0.2;
  const upperGamma = Number.isFinite(options.upperGamma) ? Number(options.upperGamma) : 0.78;
  const lowerGamma = Number.isFinite(options.lowerGamma) ? Number(options.lowerGamma) : 1.85;

  if (ratio <= 0) {
    return 0;
  }

  if (ratio >= 1) {
    return 1;
  }

  if (ratio > knee) {
    const normalizedUpperRatio = (ratio - knee) / (1 - knee);
    return protectedFloor + (1 - protectedFloor) * (normalizedUpperRatio ** upperGamma);
  }

  return protectedFloor * ((ratio / knee) ** lowerGamma);
}

function resolveAutomaticMonochromaticScaleDirection(
  baseColor: ParsedCssColor | null | undefined
) {
  const baseLightness = Number.isFinite(baseColor?.oklch?.l)
    ? Number(baseColor?.oklch?.l)
    : Number.isFinite(baseColor?.hsl?.l)
      ? Number(baseColor?.hsl?.l) / 100
      : 0.5;
  const perceivedLightness = typeof baseColor?.hex === "string"
    ? getPerceivedLightness(baseColor.hex)
    : baseLightness;
  const resolvedLightness = blendControlValue(baseLightness, perceivedLightness, 0.68);

  return resolvedLightness >= 0.72 ? "dark" : "light";
}

function getMonochromaticScaleDirection(
  baseColor: ParsedCssColor | null | undefined,
  selectedMode: unknown
) {
  const mode = normalizeMonochromaticGenerationMode(selectedMode);

  if (mode === "shades") {
    return "dark";
  }

  if (mode === "tints") {
    return "light";
  }

  return resolveAutomaticMonochromaticScaleDirection(baseColor);
}

function getMonochromaticScaleTarget(
  baseColor: ParsedCssColor,
  settings: PaletteGeneratorAdjustments,
  direction: "light" | "dark"
) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  if (direction === "light") {
    const maximumLightness = clampControlValue(0.992 - (1 - brightnessRatio) * 0.008, 0.965, 0.995);
    const lightnessRoom = Math.max(0.2, maximumLightness - baseOklch.lightness);
    const targetLightness = clampControlValue(
      baseOklch.lightness + lightnessRoom * (0.86 + brightnessRatio * 0.1),
      Math.min(maximumLightness, baseOklch.lightness + 0.22),
      maximumLightness
    );
    const chromaScale = 0.05 + saturationInfluence * 0.22;

    return {
      lightness: targetLightness,
      chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.001, 0.085),
      hue: baseOklch.hue,
    };
  }

  const minimumLightness = clampControlValue(0.1 + (1 - brightnessRatio) * 0.035, 0.085, 0.16);
  const darknessRoom = Math.max(0.16, baseOklch.lightness - minimumLightness);
  const targetLightness = clampControlValue(
    baseOklch.lightness - darknessRoom * (0.72 + (1 - brightnessRatio) * 0.08),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.18)
  );
  const chromaScale = 0.22 + saturationInfluence * 0.64;

  return {
    lightness: targetLightness,
    chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.003, 0.22),
    hue: baseOklch.hue,
  };
}

function createMonochromaticScaleTargetHex(
  baseColor: ParsedCssColor,
  settings: PaletteGeneratorAdjustments,
  direction: "light" | "dark"
) {
  const target = getMonochromaticScaleTarget(baseColor, settings, direction);
  if (!target) {
    return null;
  }

  return normalizeHexColor(
    oklchToHex(target.lightness, target.chroma, target.hue, {
      minLightness: 0.085,
      maxLightness: 0.995,
      maxChroma: 0.28,
    }) || ""
  );
}

function buildMonochromaticScaleCandidates(baseHex: string, targetHex: string, stepCount: number) {
  return getHexColorSteps(baseHex, targetHex, stepCount, {
    space: "oklch",
    outputSpace: "srgb",
  });
}

function getMonochromaticColorOklchLightness(hex: string) {
  const [lightness = 0] = createColor(hex)?.to("oklch")?.coords || [];
  return clampControlValue(lightness, 0, 1);
}

function filterDistinctMonochromaticScaleColors(
  baseHex: string,
  colors: string[],
  desiredCount: number,
  targetCount: number,
  isDisallowedColor: DisallowedColorPredicate
) {
  const palette: string[] = [];
  const usedColors = new Set([baseHex]);
  const strictMinimumDistance = targetCount >= 12 ? 1.9 : targetCount >= 9 ? 2.5 : 3.8;
  const relaxedMinimumDistance = targetCount >= 12 ? 1.2 : targetCount >= 9 ? 1.6 : 2.4;
  const strictMinimumLightnessGap = targetCount >= 12 ? 0.008 : targetCount >= 9 ? 0.012 : 0.02;
  const relaxedMinimumLightnessGap = targetCount >= 12 ? 0.005 : targetCount >= 9 ? 0.008 : 0.014;

  [true, false].forEach((useStrictThresholds) => {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = normalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColorValue(normalizedColor, isDisallowedColor)
      ) {
        return;
      }

      const candidateLightness = getMonochromaticColorOklchLightness(normalizedColor);
      const minimumDistance = useStrictThresholds
        ? strictMinimumDistance
        : relaxedMinimumDistance;
      const minimumLightnessGap = useStrictThresholds
        ? strictMinimumLightnessGap
        : relaxedMinimumLightnessGap;
      const hasEnoughSeparation = palette.every((existingColor) => {
        const deltaE = getColorDistance(normalizedColor, existingColor, {
          method: "deltae2000",
        });
        const lightnessGap = Math.abs(
          candidateLightness - getMonochromaticColorOklchLightness(existingColor)
        );

        return deltaE >= minimumDistance && lightnessGap >= minimumLightnessGap;
      });

      if (!hasEnoughSeparation) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  });

  if (palette.length < desiredCount * 2) {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = normalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColorValue(normalizedColor, isDisallowedColor)
      ) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  }

  return palette;
}

function selectMonochromaticScaleStops(
  colors: string[],
  desiredCount: number,
  direction: "light" | "dark"
) {
  if (colors.length <= desiredCount) {
    return [...colors];
  }

  const selectedIndexes = new Set<number>();
  const maxIndex = colors.length - 1;
  const distributionGamma = direction === "dark" ? 1.32 : 1;

  for (let slotIndex = 1; slotIndex <= desiredCount; slotIndex += 1) {
    const normalizedPosition = slotIndex / desiredCount;
    const idealIndex = Math.round((normalizedPosition ** distributionGamma) * maxIndex);
    let resolvedIndex = idealIndex;
    let searchOffset = 0;

    while (selectedIndexes.has(resolvedIndex) && searchOffset <= maxIndex) {
      searchOffset += 1;
      const forwardIndex = idealIndex + searchOffset;
      const backwardIndex = idealIndex - searchOffset;

      if (forwardIndex <= maxIndex && !selectedIndexes.has(forwardIndex)) {
        resolvedIndex = forwardIndex;
        break;
      }

      if (backwardIndex >= 0 && !selectedIndexes.has(backwardIndex)) {
        resolvedIndex = backwardIndex;
        break;
      }
    }

    selectedIndexes.add(resolvedIndex);
  }

  return [...selectedIndexes]
    .sort((left, right) => left - right)
    .map((index) => colors[index])
    .filter(Boolean);
}

function orderMonochromaticScaleColors(
  baseHex: string,
  colors: string[],
  direction: "light" | "dark"
) {
  const baseLightness = getMonochromaticColorOklchLightness(baseHex);

  return [...colors].sort((leftColor, rightColor) => {
    const leftLightness = getMonochromaticColorOklchLightness(leftColor);
    const rightLightness = getMonochromaticColorOklchLightness(rightColor);
    const leftDistanceFromBase = Math.abs(leftLightness - baseLightness);
    const rightDistanceFromBase = Math.abs(rightLightness - baseLightness);

    if (leftDistanceFromBase !== rightDistanceFromBase) {
      return leftDistanceFromBase - rightDistanceFromBase;
    }

    return direction === "dark"
      ? rightLightness - leftLightness
      : leftLightness - rightLightness;
  });
}

function buildMonochromaticColorModePalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const parsedBaseColor = options.baseColor || null;
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolveColorModeSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const direction = getMonochromaticScaleDirection(
    parsedBaseColor,
    options.selectedMonochromaticGenerationMode
  );
  const targetHex = createMonochromaticScaleTargetHex(
    parsedBaseColor,
    resolvedSettings,
    direction
  );

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (!targetHex || targetHex === baseHex) {
    return [baseHex];
  }

  const desiredCount = targetCount - 1;
  const stepCounts = [
    desiredCount * 2 + 4,
    desiredCount * 4 + 6,
    desiredCount * 6 + 8,
  ];
  let scaleColors: string[] = [];

  stepCounts.some((stepCount) => {
    const candidates = buildMonochromaticScaleCandidates(baseHex, targetHex, stepCount).slice(1);
    const distinctColors = filterDistinctMonochromaticScaleColors(
      baseHex,
      candidates,
      desiredCount,
      targetCount,
      options.isDisallowedColor
    );
    const sampledColors = selectMonochromaticScaleStops(
      distinctColors,
      desiredCount,
      direction
    );

    if (sampledColors.length > scaleColors.length) {
      scaleColors = sampledColors;
    }

    return sampledColors.length >= desiredCount;
  });

  return [baseHex, ...orderMonochromaticScaleColors(baseHex, scaleColors, direction)];
}

function getComplementaryVariantProfile(variantIndex = 0) {
  return COMPLEMENTARY_VARIANT_PROFILES[
    Math.abs(variantIndex) % COMPLEMENTARY_VARIANT_PROFILES.length
  ] || COMPLEMENTARY_VARIANT_PROFILES[0];
}

function buildComplementaryHueColor(
  baseColor: ParsedCssColor,
  variantIndex = 0
) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const profile = getComplementaryVariantProfile(variantIndex);
  const lightness = clampControlValue(
    baseOklch.lightness + profile.complementLightnessOffset,
    0.22,
    0.9
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.038) * profile.complementChromaScale,
    0.03,
    0.24
  );

  return createColorModeOklchHex(lightness, chroma, baseOklch.hue + 180);
}

function createComplementaryScaleTargetHex(
  baseColor: ParsedCssColor,
  settings: PaletteGeneratorAdjustments,
  direction: "light" | "dark"
) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation, {
    protectedFloor: 0.22,
  });
  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const targetCenterLightness = mapBrightnessValueToOklchLightness(settings.brightness, {
    minLightness: 0.22,
    maxLightness: 0.93,
    gamma: 0.86,
  });

  if (direction === "light") {
    const maximumLightness = clampControlValue(0.94 + brightnessRatio * 0.04, 0.88, 0.985);
    const lightnessRoom = Math.max(0.1, maximumLightness - baseOklch.lightness);
    const lightnessPull = clampControlValue(0.42 + brightnessRatio * 0.34, 0.42, 0.78);
    const targetLightness = clampControlValue(
      blendControlValue(
        baseOklch.lightness + lightnessRoom * lightnessPull,
        Math.max(baseOklch.lightness + 0.07, targetCenterLightness + 0.08),
        0.4
      ),
      Math.min(maximumLightness, baseOklch.lightness + 0.1 + brightnessRatio * 0.08),
      maximumLightness
    );
    const chromaScale = 0.002 + saturationInfluence * 0.86;
    const minimumChroma = 0.0002 + saturationInfluence * 0.0016;
    const maximumChroma = 0.004 + saturationInfluence * 0.094;

    return createColorModeOklchHex(
      targetLightness,
      clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
      baseOklch.hue
    );
  }

  const minimumLightness = clampControlValue(0.3 - brightnessRatio * 0.04, 0.24, 0.32);
  const darknessRoom = Math.max(0.1, baseOklch.lightness - minimumLightness);
  const darknessPull = clampControlValue(0.18 + (1 - brightnessRatio) * 0.2, 0.16, 0.4);
  const targetLightness = clampControlValue(
    blendControlValue(
      baseOklch.lightness - darknessRoom * darknessPull,
      Math.min(baseOklch.lightness - 0.05, targetCenterLightness - 0.08),
      0.28
    ),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.06)
  );
  const chromaScale = 0.004 + saturationInfluence * 0.98;
  const minimumChroma = 0.00025 + saturationInfluence * 0.0018;
  const maximumChroma = 0.005 + saturationInfluence * 0.112;

  return createColorModeOklchHex(
    targetLightness,
    clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
    baseOklch.hue
  );
}

function buildComplementaryScaleVariant(
  baseHex: string,
  direction: "light" | "dark",
  settings: PaletteGeneratorAdjustments,
  ratio: number,
  existingColors: Set<string>,
  isDisallowedColor: DisallowedColorPredicate
) {
  const parsedColor = AppColorUtils.parseCssColor(baseHex);
  if (!parsedColor) {
    return null;
  }

  const targetHex = createComplementaryScaleTargetHex(parsedColor, settings, direction);
  if (!targetHex || targetHex === baseHex) {
    return null;
  }

  const steps = buildMonochromaticScaleCandidates(baseHex, targetHex, 8).slice(1);
  if (steps.length === 0) {
    return null;
  }

  const idealIndex = Math.max(
    0,
    Math.min(
      steps.length - 1,
      Math.round((steps.length - 1) * clampControlValue(ratio, 0.35, 0.9))
    )
  );
  const candidateIndexes = [
    ...steps.slice(idealIndex).map((_, index) => idealIndex + index),
    ...steps.slice(0, idealIndex).map((_, index) => idealIndex - index - 1),
  ];

  function resolveComplementaryScaleCandidate(candidateIndex: number) {
    let resolvedIndex = candidateIndex;
    let candidate = normalizeHexColor(steps[resolvedIndex]);

    while (resolvedIndex > 0 && (candidate === "#FFFFFF" || candidate === "#000000")) {
      resolvedIndex -= 1;
      candidate = normalizeHexColor(steps[resolvedIndex]);
    }

    return candidate;
  }

  for (const candidateIndex of candidateIndexes) {
    const candidate = resolveComplementaryScaleCandidate(candidateIndex);
    if (
      !candidate ||
      candidate === baseHex ||
      existingColors.has(candidate) ||
      isDisallowedColorValue(candidate, isDisallowedColor)
    ) {
      continue;
    }

    const isDistinctEnough = [...existingColors].every((existingColor) => {
      const deltaE = getColorDistance(candidate, existingColor, {
        method: "deltae2000",
      });
      return deltaE >= 8;
    });

    if (isDistinctEnough) {
      return candidate;
    }
  }

  const fallbackCandidate = resolveComplementaryScaleCandidate(steps.length - 1);
  if (
    fallbackCandidate &&
    fallbackCandidate !== baseHex &&
    !existingColors.has(fallbackCandidate) &&
    !isDisallowedColorValue(fallbackCandidate, isDisallowedColor)
  ) {
    return fallbackCandidate;
  }

  return null;
}

function buildComplementaryColorModePalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const parsedBaseColor = options.baseColor || null;
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolveColorModeSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? Number(options.variantIndex)
    : 0;
  const profile = getComplementaryVariantProfile(variantIndex);
  const brightnessBias = clampControlValue(
    (resolvedSettings.brightness - APP_CONSTANTS.DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationLoss = Math.pow(
    clampControlValue(
      (APP_CONSTANTS.DEFAULT_SATURATION - resolvedSettings.saturation) / 100,
      0,
      1
    ),
    0.9
  );
  const tintRatio = targetCount >= 6
    ? clampControlValue(
        profile.tintStrength - 0.34 + brightnessBias * 0.08 - saturationLoss * 0.08,
        0.18,
        0.5
      )
    : profile.tintStrength;
  const shadeRatio = clampControlValue(
    profile.shadeStrength - 0.22 - brightnessBias * 0.08 + saturationLoss * 0.06,
    0.24,
    0.54
  );
  const baseHex = parsedBaseColor.hex;
  const complementHex = buildComplementaryHueColor(parsedBaseColor, variantIndex);

  if (!complementHex || complementHex === baseHex) {
    return [baseHex];
  }

  if (targetCount <= 2) {
    return [baseHex, complementHex];
  }

  const palette: string[] = [];
  const usedColors = new Set<string>();
  const baseTint = buildComplementaryScaleVariant(
    baseHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors,
    options.isDisallowedColor
  );
  if (baseTint) {
    palette.push(baseTint);
    usedColors.add(baseTint);
  }

  palette.push(baseHex);
  usedColors.add(baseHex);

  const baseShade = buildComplementaryScaleVariant(
    baseHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors,
    options.isDisallowedColor
  );
  if (baseShade) {
    palette.push(baseShade);
    usedColors.add(baseShade);
  }

  const complementTint = buildComplementaryScaleVariant(
    complementHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors,
    options.isDisallowedColor
  );
  if (complementTint) {
    palette.push(complementTint);
    usedColors.add(complementTint);
  }

  if (!usedColors.has(complementHex)) {
    palette.push(complementHex);
    usedColors.add(complementHex);
  }

  const complementShade = buildComplementaryScaleVariant(
    complementHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors,
    options.isDisallowedColor
  );
  if (complementShade) {
    palette.push(complementShade);
    usedColors.add(complementShade);
  }

  return palette.slice(0, targetCount);
}

function buildAnalogousRoleColor(
  baseColor: ParsedCssColor,
  settings: PaletteGeneratorAdjustments,
  directionSign: -1 | 1,
  degreeOffset: number
) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const lightnessOffset = directionSign < 0
    ? 0.016 - (1 - brightnessRatio) * 0.006
    : -0.016 + brightnessRatio * 0.006;
  const chromaScale = directionSign < 0
    ? 0.28 + saturationInfluence * 0.82
    : 0.24 + saturationInfluence * 0.86;

  return createColorModeOklchHex(
    clampControlValue(baseOklch.lightness + lightnessOffset, 0.22, 0.9),
    clampControlValue(Math.max(baseOklch.chroma, 0.02) * chromaScale, 0.0015, 0.22),
    baseOklch.hue + degreeOffset * directionSign
  );
}

function buildAnalogousColorModePalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const parsedBaseColor = options.baseColor || null;
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolveColorModeSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const separationMode = normalizeAnalogousSeparationMode(
    options.selectedAnalogousSeparationMode
  );
  const separationDegrees = ANALOGOUS_SEPARATION_DEGREES[separationMode];
  const attemptOffsets = [0, 6, 10, 14];
  let leftHex: string | null = null;
  let rightHex: string | null = null;

  for (const extraOffset of attemptOffsets) {
    const nextDegrees = separationDegrees + extraOffset;
    const candidateLeft = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      -1,
      nextDegrees
    );
    const candidateRight = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      1,
      nextDegrees
    );

    if (
      candidateLeft &&
      candidateRight &&
      candidateLeft !== baseHex &&
      candidateRight !== baseHex &&
      candidateLeft !== candidateRight &&
      !isDisallowedColorValue(candidateLeft, options.isDisallowedColor) &&
      !isDisallowedColorValue(candidateRight, options.isDisallowedColor)
    ) {
      leftHex = normalizeHexColor(candidateLeft);
      rightHex = normalizeHexColor(candidateRight);
      break;
    }
  }

  if (!leftHex || !rightHex) {
    return [baseHex];
  }

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (targetCount === 2) {
    return [baseHex, rightHex];
  }

  return [leftHex, baseHex, rightHex];
}

function getTriadVariantProfile(variantIndex = 0) {
  return TRIAD_VARIANT_PROFILES[Math.abs(variantIndex) % TRIAD_VARIANT_PROFILES.length] ||
    TRIAD_VARIANT_PROFILES[0];
}

function getTetradVariantProfile(variantIndex = 0) {
  return TETRAD_VARIANT_PROFILES[Math.abs(variantIndex) % TETRAD_VARIANT_PROFILES.length] ||
    TETRAD_VARIANT_PROFILES[0];
}

function buildBalancedHarmonyRoleColor(
  baseColor: ParsedCssColor,
  settings: PaletteGeneratorAdjustments,
  hueOffset: number,
  lightnessBias = 0,
  chromaScale = 1
) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessBias = clampControlValue(
    (settings.brightness - APP_CONSTANTS.DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const balancedLightness = blendControlValue(
    baseOklch.lightness,
    0.56 + brightnessBias * 0.08,
    0.42
  );
  const lightness = clampControlValue(
    balancedLightness + lightnessBias,
    0.34,
    0.76
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.02) * (0.18 + saturationInfluence * 0.92) * chromaScale,
    0.0015,
    0.18
  );

  return createColorModeOklchHex(lightness, chroma, baseOklch.hue + hueOffset);
}

function buildTriadColorModePalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const parsedBaseColor = options.baseColor || null;
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolveColorModeSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? Number(options.variantIndex)
    : 0;
  const baseHex = parsedBaseColor.hex;
  const activeProfile = getTriadVariantProfile(variantIndex);
  const variantProfiles = [
    activeProfile,
    ...TRIAD_VARIANT_PROFILES.filter((profile) => profile !== activeProfile),
  ];

  for (const profile of variantProfiles) {
    const [leftOffset, rightOffset] = profile.offsets;
    const leftHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      leftOffset,
      profile.lightnessBiases[0],
      profile.chromaScales[0]
    );
    const rightHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      rightOffset,
      profile.lightnessBiases[1],
      profile.chromaScales[1]
    );

    if (
      !leftHex ||
      !rightHex ||
      leftHex === baseHex ||
      rightHex === baseHex ||
      leftHex === rightHex ||
      isDisallowedColorValue(leftHex, options.isDisallowedColor) ||
      isDisallowedColorValue(rightHex, options.isDisallowedColor)
    ) {
      continue;
    }

    const sideDistance = getColorDistance(leftHex, rightHex, {
      method: "deltae2000",
    });
    const leftDistanceFromBase = getColorDistance(leftHex, baseHex, {
      method: "deltae2000",
    });
    const rightDistanceFromBase = getColorDistance(rightHex, baseHex, {
      method: "deltae2000",
    });

    if (sideDistance >= 10 && leftDistanceFromBase >= 8 && rightDistanceFromBase >= 8) {
      return [leftHex, baseHex, rightHex].slice(0, targetCount);
    }
  }

  return [baseHex];
}

function buildTetradColorModePalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const parsedBaseColor = options.baseColor || null;
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolveColorModeSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? Number(options.variantIndex)
    : 0;
  const baseHex = parsedBaseColor.hex;
  const activeProfile = getTetradVariantProfile(variantIndex);
  const variantProfiles = [
    activeProfile,
    ...TETRAD_VARIANT_PROFILES.filter((profile) => profile !== activeProfile),
  ];

  for (const profile of variantProfiles) {
    const roleHexes = profile.offsets.map((offset, index) =>
      buildBalancedHarmonyRoleColor(
        parsedBaseColor,
        resolvedSettings,
        offset,
        profile.lightnessBiases[index],
        profile.chromaScales[index]
      )
    );

    if (
      roleHexes.some((hex) => !hex || hex === baseHex || isDisallowedColorValue(hex, options.isDisallowedColor)) ||
      new Set(roleHexes).size !== roleHexes.length
    ) {
      continue;
    }

    const palette = [baseHex, ...roleHexes];
    const hasEnoughDistance = palette.every((color, colorIndex) => {
      return palette.every((otherColor, otherIndex) => {
        if (otherIndex <= colorIndex) {
          return true;
        }

        const minimumDistance = colorIndex === 0 || otherIndex === 0 ? 8 : 10;
        const distance = getColorDistance(color, otherColor, {
          method: "deltae2000",
        });

        return distance >= minimumDistance;
      });
    });

    if (hasEnoughDistance) {
      return palette.slice(0, targetCount);
    }
  }

  return [baseHex];
}

function buildColorModeHarmonyPalette(
  targetCount: number,
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined,
  options: ColorModeHarmonyOptions = {}
) {
  const effectiveType = options.effectiveType as HarmonyPaletteType | null;

  switch (effectiveType) {
    case "monochromatic":
      return buildMonochromaticColorModePalette(targetCount, settings, options);
    case "complementary":
      return buildComplementaryColorModePalette(targetCount, settings, options);
    case "analogous":
      return buildAnalogousColorModePalette(targetCount, settings, options);
    case "triad":
      return buildTriadColorModePalette(targetCount, settings, options);
    case "tetrad":
      return buildTetradColorModePalette(targetCount, settings, options);
    default:
      return [];
  }
}

export const PaletteGeneratorColorModeHelpers = {
  buildColorModeHarmonyPalette,
  buildMonochromaticColorModePalette,
  buildComplementaryColorModePalette,
  buildAnalogousColorModePalette,
  buildTriadColorModePalette,
  buildTetradColorModePalette,
};

window.PaletteGeneratorColorModeHelpers = PaletteGeneratorColorModeHelpers;

export default PaletteGeneratorColorModeHelpers;
