import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import PaletteGeneratorCoreHelpers from "./core-helpers";
import type { PaletteGeneratorTemperatureSelection } from "./types";

type AdjustmentSettingsLike = {
  brightness?: unknown;
  saturation?: unknown;
};

type TemperatureChromaOptions = {
  fallbackSaturation?: unknown;
  minChroma?: unknown;
  maxChroma?: unknown;
  gamma?: unknown;
};

type TemperatureLightnessOptions = {
  fallbackBrightness?: unknown;
  minLightness?: unknown;
  maxLightness?: unknown;
  gamma?: unknown;
};

type TemperaturePaletteOptions = {
  temperatureSelection?: Partial<PaletteGeneratorTemperatureSelection> | null;
  fallbackBrightness?: unknown;
  fallbackSaturation?: unknown;
  lowSaturationThreshold?: unknown;
  isDisallowedColor?: ((hex: string) => boolean) | null;
  maxRetriesPerColor?: unknown;
};

const { normalizeHexColor, oklchToHex } = AppColorUtils;
const {
  clampControlValue,
  mapBrightnessValueToOklchLightness,
  mapSaturationValueToOklchChroma,
} = PaletteGeneratorCoreHelpers;

function normalizeTemperatureSelection(
  value: Partial<PaletteGeneratorTemperatureSelection> | null | undefined
) {
  const warm = !!value?.warm;
  const cool = !!value?.cool;

  if (!warm && !cool) {
    return {
      warm: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.warm,
      cool: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.cool,
    };
  }

  return { warm, cool };
}

function resolveTemperatureSettings(
  settings: AdjustmentSettingsLike = {},
  options: TemperaturePaletteOptions = {}
) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? Number(settings.brightness)
      : (Number.isFinite(options.fallbackBrightness)
        ? Number(options.fallbackBrightness)
        : APP_CONSTANTS.DEFAULT_BRIGHTNESS),
    saturation: Number.isFinite(settings?.saturation)
      ? Number(settings.saturation)
      : (Number.isFinite(options.fallbackSaturation)
        ? Number(options.fallbackSaturation)
        : APP_CONSTANTS.DEFAULT_SATURATION),
  };
}

function getRandomSteppedValue(min = 0, max = 100, step = 5) {
  const steps = Math.round((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function getRandomTemperatureSelection(): PaletteGeneratorTemperatureSelection {
  return [
    { warm: true, cool: false },
    { warm: false, cool: true },
    { warm: true, cool: true },
  ][Math.floor(Math.random() * 3)];
}

function getTemperatureSelectionKey(
  selection: Partial<PaletteGeneratorTemperatureSelection> | null | undefined
) {
  const normalizedSelection = normalizeTemperatureSelection(selection);
  return `${normalizedSelection.warm ? 1 : 0}:${normalizedSelection.cool ? 1 : 0}`;
}

function getTemperatureTargetLightness(
  settings: AdjustmentSettingsLike = {},
  options: TemperatureLightnessOptions = {}
) {
  const brightness = Number.isFinite(settings?.brightness)
    ? Number(settings.brightness)
    : (Number.isFinite(options.fallbackBrightness)
      ? Number(options.fallbackBrightness)
      : APP_CONSTANTS.DEFAULT_BRIGHTNESS);

  return mapBrightnessValueToOklchLightness(brightness, {
    minLightness: Number.isFinite(options.minLightness) ? Number(options.minLightness) : 0.2,
    maxLightness: Number.isFinite(options.maxLightness) ? Number(options.maxLightness) : 0.92,
    gamma: Number.isFinite(options.gamma) ? Number(options.gamma) : 0.86,
  });
}

function getTemperatureTargetChroma(
  settings: AdjustmentSettingsLike = {},
  options: TemperatureChromaOptions = {}
) {
  const saturation = Number.isFinite(settings?.saturation)
    ? Number(settings.saturation)
    : (Number.isFinite(options.fallbackSaturation)
      ? Number(options.fallbackSaturation)
      : APP_CONSTANTS.DEFAULT_SATURATION);

  return mapSaturationValueToOklchChroma(saturation, {
    minChroma: Number.isFinite(options.minChroma) ? Number(options.minChroma) : 0.0015,
    maxChroma: Number.isFinite(options.maxChroma) ? Number(options.maxChroma) : 0.22,
    gamma: Number.isFinite(options.gamma) ? Number(options.gamma) : 1.7,
  });
}

function createTemperatureOklchHex(hue: unknown, lightness: unknown, chroma: unknown) {
  return normalizeHexColor(
    oklchToHex(Number(lightness), Number(chroma), Number(hue), {
      minLightness: 0.12,
      maxLightness: 0.94,
      maxChroma: 0.24,
    })
  );
}

function getTemperatureBasedHue(
  selection: Partial<PaletteGeneratorTemperatureSelection> | null | undefined,
  primaryRandom = Math.random(),
  secondaryRandom = Math.random()
) {
  const normalizedSelection = normalizeTemperatureSelection(selection);
  const useWarmPalette =
    normalizedSelection.warm && (!normalizedSelection.cool || primaryRandom < 0.5);

  if (useWarmPalette) {
    return secondaryRandom < 0.2
      ? 300 + Math.random() * 60
      : Math.random() * 60;
  }

  return 120 + Math.random() * 180;
}

function buildAlternativeMonochromePaletteForSettings(
  targetCount: number,
  settings: AdjustmentSettingsLike = {},
  options: TemperaturePaletteOptions = {}
) {
  if (targetCount <= 0) {
    return [];
  }

  const resolvedSettings = resolveTemperatureSettings(settings, options);
  const usedColors = new Set<string>();
  const palette: string[] = [];
  const isDisallowedColor =
    typeof options.isDisallowedColor === "function" ? options.isDisallowedColor : () => false;
  const centerLightness = getTemperatureTargetLightness(resolvedSettings, {
    fallbackBrightness: options.fallbackBrightness,
    minLightness: 0.2,
    maxLightness: 0.92,
    gamma: 0.86,
  });
  const monochromeChroma = getTemperatureTargetChroma(
    {
      saturation: clampControlValue(
        resolvedSettings.saturation,
        0,
        Number.isFinite(options.lowSaturationThreshold)
          ? Number(options.lowSaturationThreshold)
          : APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD
      ),
    },
    {
      fallbackSaturation: options.fallbackSaturation,
      minChroma: 0.001,
      maxChroma: 0.05,
      gamma: 1.5,
    }
  );
  const baseHue = getTemperatureBasedHue(options.temperatureSelection);
  const spread = clampControlValue(targetCount * 0.07, 0.28, 0.56);

  let minLightness = clampControlValue(centerLightness - spread / 2, 0.14, 0.9);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 0.18, 0.94);

  if (maxLightness - minLightness < 0.24) {
    minLightness = 0.14;
    maxLightness = 0.94;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -0.018, 0.018, -0.036, 0.036, -0.054, 0.054];
  const chromaAdjustments = [0, -0.004, 0.004, -0.008, 0.008];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const chromaAdjustment =
        chromaAdjustments[
          Math.abs(Math.round((adjustment || 0) * 1000)) % chromaAdjustments.length
        ];
      const candidate = createTemperatureOklchHex(
        baseHue,
        clampControlValue(baseLightness + adjustment, 0.12, 0.94),
        clampControlValue(monochromeChroma + chromaAdjustment, 0.004, 0.07)
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function buildTemperatureColorFromSettings(
  settings: AdjustmentSettingsLike = {},
  options: TemperaturePaletteOptions = {}
) {
  const resolvedSettings = resolveTemperatureSettings(settings, options);
  const hue = getTemperatureBasedHue(options.temperatureSelection);
  const lightness = getTemperatureTargetLightness(resolvedSettings, {
    fallbackBrightness: options.fallbackBrightness,
    minLightness: 0.2,
    maxLightness: 0.92,
    gamma: 0.86,
  });
  const chroma = getTemperatureTargetChroma(resolvedSettings, {
    fallbackSaturation: options.fallbackSaturation,
    minChroma: 0.0015,
    maxChroma: 0.22,
    gamma: 1.7,
  });

  return createTemperatureOklchHex(hue, lightness, chroma);
}

function buildTemperaturePaletteForSettings(
  targetCount: number,
  settings: AdjustmentSettingsLike = {},
  options: TemperaturePaletteOptions = {}
) {
  const resolvedSettings = resolveTemperatureSettings(settings, options);
  const usedColors = new Set<string>();
  const nextPalette: string[] = [];
  const maxRetriesPerColor = Number.isFinite(options.maxRetriesPerColor)
    ? Math.max(1, Number(options.maxRetriesPerColor))
    : 12;
  const lowSaturationThreshold = Number.isFinite(options.lowSaturationThreshold)
    ? Number(options.lowSaturationThreshold)
    : APP_CONSTANTS.LOW_SATURATION_FALLBACK_THRESHOLD;

  for (let index = 0; index < targetCount; index += 1) {
    let color: string | null = null;
    let retries = 0;

    while (!color && retries < maxRetriesPerColor) {
      const candidate = buildTemperatureColorFromSettings(resolvedSettings, options);
      if (!usedColors.has(candidate)) {
        color = candidate;
      }
      retries += 1;
    }

    if (!color) {
      break;
    }

    usedColors.add(color);
    nextPalette.push(color);
  }

  if (nextPalette.length < targetCount && resolvedSettings.saturation <= lowSaturationThreshold) {
    const alternativePalette = buildAlternativeMonochromePaletteForSettings(
      targetCount,
      resolvedSettings,
      {
        ...options,
        lowSaturationThreshold,
      }
    );

    if (alternativePalette.length === targetCount) {
      return {
        palette: alternativePalette,
        usedAlternativePalette: true,
      };
    }
  }

  return {
    palette: nextPalette,
    usedAlternativePalette: false,
  };
}

export const PaletteGeneratorTemperatureHelpers = {
  getRandomSteppedValue,
  getRandomTemperatureSelection,
  getTemperatureSelectionKey,
  getTemperatureTargetLightness,
  getTemperatureTargetChroma,
  createTemperatureOklchHex,
  getTemperatureBasedHue,
  buildAlternativeMonochromePaletteForSettings,
  buildTemperatureColorFromSettings,
  buildTemperaturePaletteForSettings,
};

window.PaletteGeneratorTemperatureHelpers = PaletteGeneratorTemperatureHelpers;

export default PaletteGeneratorTemperatureHelpers;
