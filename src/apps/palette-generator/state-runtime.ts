import APP_CONSTANTS from "../../shared/constants";
import type {
  AnalogousSeparationMode,
  ColorPaletteType,
  MonochromaticGenerationMode,
  PaletteBaseMode,
  PaletteGeneratorAdjustments,
  PaletteGeneratorHistoryEntry,
  PaletteGeneratorTemperatureSelection,
  PaletteGeneratorUploadedImage,
} from "./types";
import type {
  PaletteGeneratorLegacyRuntimeState,
  PaletteGeneratorLegacySyncRuntimeState,
} from "./selectors";

type NormalizeLegacyRuntimeStateArgs = {
  nextState?: Partial<PaletteGeneratorLegacyRuntimeState> | null;
  prioritizeImageDominantColorsFallback?: boolean;
};

type BuildLegacySyncRuntimeStateArgs = {
  paletteSize: number;
  paletteHistory: unknown[];
  paletteHistoryIndex: number;
  paletteBaseMode: string;
  uploadedBaseImage?: unknown;
  prioritizeImageDominantColors: boolean;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  selectedPaletteBaseColor: string;
  selectedColorPaletteType: string;
  selectedMonochromaticGenerationMode: string;
  selectedAnalogousSeparationMode: string;
  resolvedAutomaticColorPaletteType: string;
  temperature?: Partial<PaletteGeneratorTemperatureSelection> | null;
  currentPalette?: string[];
  colorPaletteVariantIndex?: number;
};

const PALETTE_BASE_MODES = new Set<PaletteBaseMode>(["color", "temperature", "image"]);
const COLOR_PALETTE_TYPES = new Set<ColorPaletteType>([
  "automatic",
  "monochromatic",
  "complementary",
  "analogous",
  "triad",
  "tetrad",
]);
const MONOCHROMATIC_GENERATION_MODES = new Set<MonochromaticGenerationMode>([
  "automatic",
  "shades",
  "tints",
]);
const ANALOGOUS_SEPARATION_MODES = new Set<AnalogousSeparationMode>([
  "soft",
  "medium",
  "intense",
]);

function normalizePaletteBaseMode(value: unknown): PaletteBaseMode {
  return PALETTE_BASE_MODES.has(value as PaletteBaseMode)
    ? (value as PaletteBaseMode)
    : (APP_CONSTANTS.DEFAULT_PALETTE_BASE_MODE as PaletteBaseMode);
}

function normalizeColorPaletteType(value: unknown): ColorPaletteType {
  return COLOR_PALETTE_TYPES.has(value as ColorPaletteType)
    ? (value as ColorPaletteType)
    : (APP_CONSTANTS.DEFAULT_COLOR_PALETTE_TYPE as ColorPaletteType);
}

function normalizeMonochromaticGenerationMode(value: unknown): MonochromaticGenerationMode {
  return MONOCHROMATIC_GENERATION_MODES.has(value as MonochromaticGenerationMode)
    ? (value as MonochromaticGenerationMode)
    : (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode);
}

function normalizeAnalogousSeparationMode(value: unknown): AnalogousSeparationMode {
  return ANALOGOUS_SEPARATION_MODES.has(value as AnalogousSeparationMode)
    ? (value as AnalogousSeparationMode)
    : (APP_CONSTANTS.DEFAULT_ANALOGOUS_SEPARATION_MODE as AnalogousSeparationMode);
}

function normalizeUploadedBaseImage(
  value: unknown
): PaletteGeneratorUploadedImage | null {
  if (
    !value ||
    typeof value !== "object" ||
    typeof (value as PaletteGeneratorUploadedImage).name !== "string" ||
    typeof (value as PaletteGeneratorUploadedImage).type !== "string" ||
    typeof (value as PaletteGeneratorUploadedImage).dataUrl !== "string"
  ) {
    return null;
  }

  return {
    ...(value as PaletteGeneratorUploadedImage),
  };
}

function normalizePaletteHistory(value: unknown): PaletteGeneratorHistoryEntry[] {
  return Array.isArray(value)
    ? [...(value as PaletteGeneratorHistoryEntry[])]
    : [];
}

function normalizeAdjustments(
  settings: Partial<PaletteGeneratorAdjustments> | null | undefined
): PaletteGeneratorAdjustments {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? Number(settings?.brightness)
      : APP_CONSTANTS.DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? Number(settings?.saturation)
      : APP_CONSTANTS.DEFAULT_SATURATION,
  };
}

function normalizeTemperatureSelection(
  value: Partial<PaletteGeneratorTemperatureSelection> | null | undefined
): PaletteGeneratorTemperatureSelection {
  return value
    ? {
        warm: !!value.warm,
        cool: !!value.cool,
      }
    : {
        warm: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.warm,
        cool: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.cool,
      };
}

function normalizeLegacyRuntimeState(
  args: NormalizeLegacyRuntimeStateArgs = {}
): PaletteGeneratorLegacyRuntimeState {
  const nextState = args.nextState || {};

  return {
    paletteSize: Number.isFinite(nextState.paletteSize)
      ? Number(nextState.paletteSize)
      : APP_CONSTANTS.DEFAULT_PALETTE_SIZE,
    paletteHistory: Array.isArray(nextState.paletteHistory)
      ? normalizePaletteHistory(nextState.paletteHistory)
      : [],
    paletteHistoryIndex: Number.isFinite(nextState.paletteHistoryIndex)
      ? Number(nextState.paletteHistoryIndex)
      : -1,
    paletteBaseMode: normalizePaletteBaseMode(nextState.paletteBaseMode),
    uploadedBaseImage: normalizeUploadedBaseImage(nextState.uploadedBaseImage),
    prioritizeImageDominantColors:
      typeof nextState.prioritizeImageDominantColors === "boolean"
        ? nextState.prioritizeImageDominantColors
        : !!args.prioritizeImageDominantColorsFallback,
    imagePaletteVariantIndex: Number.isFinite(nextState.imagePaletteVariantIndex)
      ? Number(nextState.imagePaletteVariantIndex)
      : 0,
    imageInspirationVariantIndex: Number.isFinite(nextState.imageInspirationVariantIndex)
      ? Number(nextState.imageInspirationVariantIndex)
      : 0,
    selectedPaletteBaseColor:
      nextState.selectedPaletteBaseColor || APP_CONSTANTS.DEFAULT_COLOR_BASE,
    selectedColorPaletteType: normalizeColorPaletteType(nextState.selectedColorPaletteType),
    selectedMonochromaticGenerationMode: normalizeMonochromaticGenerationMode(
      nextState.selectedMonochromaticGenerationMode
    ),
    selectedAnalogousSeparationMode: normalizeAnalogousSeparationMode(
      nextState.selectedAnalogousSeparationMode
    ),
    resolvedAutomaticColorPaletteType:
      nextState.resolvedAutomaticColorPaletteType || "triad",
    temperature: normalizeTemperatureSelection(nextState.temperature),
    currentPalette: Array.isArray(nextState.currentPalette)
      ? [...nextState.currentPalette]
      : [],
    paletteAdjustmentBaseSettings: normalizeAdjustments(
      nextState.paletteAdjustmentBaseSettings
    ),
  };
}

function buildLegacySyncRuntimeState(
  args: BuildLegacySyncRuntimeStateArgs
): PaletteGeneratorLegacySyncRuntimeState {
  return {
    paletteSize: Number.isFinite(args.paletteSize)
      ? Number(args.paletteSize)
      : APP_CONSTANTS.DEFAULT_PALETTE_SIZE,
    paletteHistory: normalizePaletteHistory(args.paletteHistory),
    paletteHistoryIndex: Number.isFinite(args.paletteHistoryIndex)
      ? Number(args.paletteHistoryIndex)
      : -1,
    paletteBaseMode: normalizePaletteBaseMode(args.paletteBaseMode),
    uploadedBaseImage: normalizeUploadedBaseImage(args.uploadedBaseImage),
    prioritizeImageDominantColors: !!args.prioritizeImageDominantColors,
    imagePaletteVariantIndex: Number.isFinite(args.imagePaletteVariantIndex)
      ? Number(args.imagePaletteVariantIndex)
      : 0,
    imageInspirationVariantIndex: Number.isFinite(args.imageInspirationVariantIndex)
      ? Number(args.imageInspirationVariantIndex)
      : 0,
    selectedPaletteBaseColor:
      args.selectedPaletteBaseColor || APP_CONSTANTS.DEFAULT_COLOR_BASE,
    selectedColorPaletteType: normalizeColorPaletteType(args.selectedColorPaletteType),
    selectedMonochromaticGenerationMode: normalizeMonochromaticGenerationMode(
      args.selectedMonochromaticGenerationMode
    ),
    selectedAnalogousSeparationMode: normalizeAnalogousSeparationMode(
      args.selectedAnalogousSeparationMode
    ),
    resolvedAutomaticColorPaletteType:
      (args.resolvedAutomaticColorPaletteType || "triad") as
        PaletteGeneratorLegacySyncRuntimeState["resolvedAutomaticColorPaletteType"],
    temperature: normalizeTemperatureSelection(args.temperature),
    currentPalette: Array.isArray(args.currentPalette) ? [...args.currentPalette] : [],
    colorPaletteVariantIndex: Number.isFinite(args.colorPaletteVariantIndex)
      ? Number(args.colorPaletteVariantIndex)
      : 0,
  };
}

export const PaletteGeneratorStateRuntime = {
  normalizeLegacyRuntimeState,
  buildLegacySyncRuntimeState,
};

window.PaletteGeneratorStateRuntime = PaletteGeneratorStateRuntime;

export default PaletteGeneratorStateRuntime;
