import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import AppSharedColors from "../../shared/services/shared-colors";
import type {
  AnalogousSeparationMode,
  ColorPaletteType,
  MonochromaticGenerationMode,
  PaletteGeneratorAdjustments,
  PaletteGeneratorHistoryEntry,
  PaletteBaseMode,
  PaletteGeneratorState,
  PaletteGeneratorTemperatureSelection,
  PaletteGeneratorUploadedImage,
} from "./types";

export type PaletteGeneratorLegacyRuntimeState = {
  paletteSize: number;
  paletteHistory: PaletteGeneratorHistoryEntry[];
  paletteHistoryIndex: number;
  paletteBaseMode: PaletteGeneratorState["paletteBaseMode"];
  uploadedBaseImage: PaletteGeneratorUploadedImage | null;
  prioritizeImageDominantColors: boolean;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  selectedPaletteBaseColor: string;
  selectedColorPaletteType: PaletteGeneratorState["selectedColorPaletteType"];
  selectedMonochromaticGenerationMode: PaletteGeneratorState["selectedMonochromaticGenerationMode"];
  selectedAnalogousSeparationMode: PaletteGeneratorState["selectedAnalogousSeparationMode"];
  resolvedAutomaticColorPaletteType: PaletteGeneratorState["resolvedAutomaticColorPaletteType"];
  temperature: PaletteGeneratorTemperatureSelection;
  currentPalette: string[];
  paletteAdjustmentBaseSettings: PaletteGeneratorAdjustments;
};

export type PaletteGeneratorLegacySyncRuntimeState = {
  paletteSize: number;
  paletteHistory: PaletteGeneratorHistoryEntry[];
  paletteHistoryIndex: number;
  paletteBaseMode: PaletteGeneratorState["paletteBaseMode"];
  uploadedBaseImage: PaletteGeneratorUploadedImage | null;
  prioritizeImageDominantColors: boolean;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  selectedPaletteBaseColor: string;
  selectedColorPaletteType: PaletteGeneratorState["selectedColorPaletteType"];
  selectedMonochromaticGenerationMode: PaletteGeneratorState["selectedMonochromaticGenerationMode"];
  selectedAnalogousSeparationMode: PaletteGeneratorState["selectedAnalogousSeparationMode"];
  resolvedAutomaticColorPaletteType: PaletteGeneratorState["resolvedAutomaticColorPaletteType"];
  temperature: PaletteGeneratorTemperatureSelection;
  currentPalette: string[];
  colorPaletteVariantIndex?: number;
};

type LegacyRuntimeStateArgs = {
  storeState?: Partial<PaletteGeneratorState> | null;
  dominantToggleChecked?: boolean;
  sharedActiveColor?: string | null;
};

type LegacyAdjustmentValueArgs = {
  settings?: Partial<PaletteGeneratorAdjustments> | null;
  brightnessInputValue?: number | null;
  saturationInputValue?: number | null;
  fallbackAdjustments?: Partial<PaletteGeneratorAdjustments> | null;
};

type LegacyStoreSyncPayloadArgs = {
  runtimeState: PaletteGeneratorLegacySyncRuntimeState;
  adjustments: PaletteGeneratorAdjustments;
  partial?: Record<string, unknown>;
};

const { normalizeHexColor, isValidHexColor } = AppColorUtils;

function cloneUploadedBaseImage(image: PaletteGeneratorUploadedImage | null) {
  if (!image) {
    return null;
  }

  return {
    ...image,
    analysisCache:
      image.analysisCache && typeof image.analysisCache === "object"
        ? { ...(image.analysisCache as Record<string, unknown>) }
        : image.analysisCache,
  };
}

function cloneHistoryEntry(entry: PaletteGeneratorHistoryEntry): PaletteGeneratorHistoryEntry {
  return {
    colors: [...entry.colors],
    createdAt:
      entry.createdAt instanceof Date
        ? new Date(entry.createdAt.getTime())
        : entry.createdAt ?? null,
    isAlternative: !!entry.isAlternative,
    pinnedIndexes: [...entry.pinnedIndexes],
    settings:
      entry.settings && typeof entry.settings === "object"
        ? { ...entry.settings }
        : null,
  };
}

function clampPercentValue(value: unknown, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Number(value)));
}

function getLegacyRuntimeState(
  args: LegacyRuntimeStateArgs = {}
): PaletteGeneratorLegacyRuntimeState {
  const storeState = args.storeState || {};
  const sharedActiveColor =
    args.sharedActiveColor ||
    AppSharedColors.getDefaultActiveColor?.() ||
    AppSharedColors.getState?.().activeColor ||
    APP_CONSTANTS.DEFAULT_COLOR_BASE;
  const selectedPaletteBaseColor =
    typeof storeState.selectedPaletteBaseColor === "string" &&
    isValidHexColor(normalizeHexColor(storeState.selectedPaletteBaseColor))
      ? normalizeHexColor(storeState.selectedPaletteBaseColor)
      : (
          isValidHexColor(normalizeHexColor(sharedActiveColor))
            ? normalizeHexColor(sharedActiveColor)
            : normalizeHexColor(APP_CONSTANTS.DEFAULT_COLOR_BASE)
        );

  return {
    paletteSize: Number.isFinite(storeState.paletteSize)
      ? Number(storeState.paletteSize)
      : APP_CONSTANTS.DEFAULT_PALETTE_SIZE,
    paletteHistory: Array.isArray(storeState.paletteHistory)
      ? storeState.paletteHistory.map(cloneHistoryEntry)
      : [],
    paletteHistoryIndex: Number.isFinite(storeState.paletteHistoryIndex)
      ? Number(storeState.paletteHistoryIndex)
      : -1,
    paletteBaseMode:
      storeState.paletteBaseMode ||
      (APP_CONSTANTS.DEFAULT_PALETTE_BASE_MODE as PaletteBaseMode),
    uploadedBaseImage: cloneUploadedBaseImage(storeState.uploadedBaseImage || null),
    prioritizeImageDominantColors:
      typeof storeState.prioritizeImageDominantColors === "boolean"
        ? storeState.prioritizeImageDominantColors
        : !!args.dominantToggleChecked,
    imagePaletteVariantIndex: Number.isFinite(storeState.imagePaletteVariantIndex)
      ? Number(storeState.imagePaletteVariantIndex)
      : 0,
    imageInspirationVariantIndex: Number.isFinite(storeState.imageInspirationVariantIndex)
      ? Number(storeState.imageInspirationVariantIndex)
      : 0,
    selectedPaletteBaseColor,
    selectedColorPaletteType:
      storeState.selectedColorPaletteType ||
      (APP_CONSTANTS.DEFAULT_COLOR_PALETTE_TYPE as ColorPaletteType),
    selectedMonochromaticGenerationMode:
      storeState.selectedMonochromaticGenerationMode ||
      (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode),
    selectedAnalogousSeparationMode:
      storeState.selectedAnalogousSeparationMode ||
      (APP_CONSTANTS.DEFAULT_ANALOGOUS_SEPARATION_MODE as AnalogousSeparationMode),
    resolvedAutomaticColorPaletteType:
      storeState.resolvedAutomaticColorPaletteType || "triad",
    temperature: storeState.temperature
      ? {
          warm: !!storeState.temperature.warm,
          cool: !!storeState.temperature.cool,
        }
      : {
          warm: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.warm,
          cool: !!APP_CONSTANTS.DEFAULT_TEMPERATURE.cool,
        },
    currentPalette: Array.isArray(storeState.currentPalette)
      ? [...storeState.currentPalette]
      : [],
    paletteAdjustmentBaseSettings: {
      brightness: clampPercentValue(
        storeState.adjustments?.brightness,
        APP_CONSTANTS.DEFAULT_BRIGHTNESS
      ),
      saturation: clampPercentValue(
        storeState.adjustments?.saturation,
        APP_CONSTANTS.DEFAULT_SATURATION
      ),
    },
  };
}

function getLegacyAdjustmentValues(
  args: LegacyAdjustmentValueArgs = {}
): PaletteGeneratorAdjustments {
  const fallbackAdjustments = args.fallbackAdjustments || {};

  return {
    brightness: Number.isFinite(args.settings?.brightness)
      ? Number(args.settings?.brightness)
      : (
          Number.isFinite(args.brightnessInputValue)
            ? Number(args.brightnessInputValue)
            : clampPercentValue(
                fallbackAdjustments.brightness,
                APP_CONSTANTS.DEFAULT_BRIGHTNESS
              )
        ),
    saturation: Number.isFinite(args.settings?.saturation)
      ? Number(args.settings?.saturation)
      : (
          Number.isFinite(args.saturationInputValue)
            ? Number(args.saturationInputValue)
            : clampPercentValue(
                fallbackAdjustments.saturation,
                APP_CONSTANTS.DEFAULT_SATURATION
              )
        ),
  };
}

function buildLegacyStoreSyncPayload(args: LegacyStoreSyncPayloadArgs) {
  const payload = {
    paletteSize: args.runtimeState.paletteSize,
    paletteHistory: args.runtimeState.paletteHistory,
    paletteHistoryIndex: args.runtimeState.paletteHistoryIndex,
    paletteBaseMode: args.runtimeState.paletteBaseMode,
    uploadedBaseImage: args.runtimeState.uploadedBaseImage,
    prioritizeImageDominantColors: args.runtimeState.prioritizeImageDominantColors,
    imagePaletteVariantIndex: args.runtimeState.imagePaletteVariantIndex,
    imageInspirationVariantIndex: args.runtimeState.imageInspirationVariantIndex,
    selectedPaletteBaseColor: args.runtimeState.selectedPaletteBaseColor,
    selectedColorPaletteType: args.runtimeState.selectedColorPaletteType,
    selectedMonochromaticGenerationMode: args.runtimeState.selectedMonochromaticGenerationMode,
    selectedAnalogousSeparationMode: args.runtimeState.selectedAnalogousSeparationMode,
    resolvedAutomaticColorPaletteType: args.runtimeState.resolvedAutomaticColorPaletteType,
    temperature: {
      warm: !!args.runtimeState.temperature?.warm,
      cool: !!args.runtimeState.temperature?.cool,
    },
    currentPalette: args.runtimeState.currentPalette,
    adjustments: args.adjustments,
    ...(args.partial || {}),
  } as Record<string, unknown>;

  if (Number.isFinite(args.runtimeState.colorPaletteVariantIndex)) {
    payload.colorPaletteVariantIndex = Number(args.runtimeState.colorPaletteVariantIndex);
  }

  return payload;
}

export const PaletteGeneratorStateSelectors = {
  getLegacyRuntimeState,
  getLegacyAdjustmentValues,
  buildLegacyStoreSyncPayload,
};

window.PaletteGeneratorStateSelectors = PaletteGeneratorStateSelectors;

export default PaletteGeneratorStateSelectors;
