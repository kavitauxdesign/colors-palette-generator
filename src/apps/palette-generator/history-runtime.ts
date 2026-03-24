import AppColorUtils from "../../shared/color/color-utils";
import type { PaletteGeneratorTemperatureSelection } from "./types";

type HistoryCaptureSettingsArgs = {
  paletteSize: number;
  actualPaletteSize?: unknown;
  paletteBaseMode: string;
  selectedPaletteBaseColor: string;
  selectedColorPaletteType: string;
  selectedMonochromaticGenerationMode: string;
  selectedAnalogousSeparationMode: string;
  prioritizeImageDominantColors: boolean;
  temperature?: Partial<PaletteGeneratorTemperatureSelection> | null;
  brightness?: unknown;
  saturation?: unknown;
  defaultBrightness: number;
  defaultSaturation: number;
};

type HistoryNavigationStateArgs = {
  paletteHistoryIndex: number;
  paletteHistoryLength: number;
};

type HistoryCreateEntryArgs = {
  colors?: unknown[];
  metadata?: {
    isAlternative?: unknown;
    pinnedIndexes?: unknown;
  } | null;
  settings?: Record<string, unknown> | null;
};

type ResolvedHistoryEntryLoad = {
  validColors: string[];
  fallbackSize: number;
  settings: Record<string, unknown> | null;
  pinnedIndexes: number[];
};

const { normalizeHexColor, isValidHexColor } = AppColorUtils;

function captureCurrentGeneratorSettings(args: HistoryCaptureSettingsArgs) {
  const resolvedPaletteSize = Number.isFinite(args.actualPaletteSize)
    ? Number(args.actualPaletteSize)
    : (Number.isFinite(args.paletteSize) ? Number(args.paletteSize) : 0);

  return {
    paletteSize: resolvedPaletteSize,
    baseMode: args.paletteBaseMode,
    baseColor: args.selectedPaletteBaseColor,
    colorPaletteType: args.selectedColorPaletteType,
    monochromaticGenerationMode: args.selectedMonochromaticGenerationMode,
    analogousSeparationMode: args.selectedAnalogousSeparationMode,
    prioritizeImageDominantColors: !!args.prioritizeImageDominantColors,
    temperature: {
      warm: !!args.temperature?.warm,
      cool: !!args.temperature?.cool,
    },
    brightness: Number.isFinite(args.brightness)
      ? Number(args.brightness)
      : args.defaultBrightness,
    saturation: Number.isFinite(args.saturation)
      ? Number(args.saturation)
      : args.defaultSaturation,
  };
}

function resolveAppliedPaletteSize(settings: Record<string, unknown> | null, fallbackSize: number) {
  const requestedSize = Number.isFinite(settings?.paletteSize)
    ? Number(settings.paletteSize)
    : null;
  const baseMode = typeof settings?.baseMode === "string" ? settings.baseMode : null;
  const resolvedFallbackSize = Number.isFinite(fallbackSize) ? Number(fallbackSize) : 0;

  if (baseMode && baseMode !== "color" && resolvedFallbackSize > 0) {
    return resolvedFallbackSize;
  }

  return requestedSize ?? resolvedFallbackSize;
}

function getHistoryNavigationState(args: HistoryNavigationStateArgs) {
  const canUndo = args.paletteHistoryIndex > 0;
  const canRedo =
    args.paletteHistoryIndex >= 0 &&
    args.paletteHistoryIndex < args.paletteHistoryLength - 1;

  return {
    canUndo,
    canRedo,
  };
}

function createHistoryEntry(args: HistoryCreateEntryArgs) {
  const validColors = Array.isArray(args.colors)
    ? args.colors
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];
  const pinnedIndexes = Array.isArray(args.metadata?.pinnedIndexes)
    ? args.metadata?.pinnedIndexes
        .filter((index) => Number.isFinite(index))
        .map((index) => Number(index))
    : [];

  return {
    colors: validColors,
    createdAt: new Date(),
    isAlternative: !!args.metadata?.isAlternative,
    pinnedIndexes,
    settings: args.settings && typeof args.settings === "object" ? { ...args.settings } : null,
  };
}

function formatHistoryTime(dateValue: unknown) {
  const date = dateValue instanceof Date ? dateValue : new Date(String(dateValue || ""));
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function resolveHistoryEntryForLoad(historyEntry: unknown): ResolvedHistoryEntryLoad | null {
  const colors = Array.isArray(historyEntry)
    ? historyEntry
    : (historyEntry as { colors?: unknown[] } | null)?.colors;

  if (!Array.isArray(colors)) {
    return null;
  }

  const validColors = colors
    .map((color) => normalizeHexColor(color))
    .filter((hex) => isValidHexColor(hex));

  if (validColors.length === 0) {
    return null;
  }

  return {
    validColors,
    fallbackSize: validColors.length,
    settings: Array.isArray(historyEntry)
      ? null
      : (
          (historyEntry as { settings?: Record<string, unknown> | null } | null)?.settings || null
        ),
    pinnedIndexes: Array.isArray((historyEntry as { pinnedIndexes?: unknown[] } | null)?.pinnedIndexes)
      ? (historyEntry as { pinnedIndexes: unknown[] }).pinnedIndexes
          .filter((index) => Number.isFinite(index))
          .map((index) => Number(index))
      : [],
  };
}

function getTargetHistoryIndex(
  direction: number,
  paletteHistoryIndex: number,
  paletteHistoryLength: number
) {
  const targetIndex = paletteHistoryIndex + direction;
  return targetIndex < 0 || targetIndex >= paletteHistoryLength
    ? null
    : targetIndex;
}

export const PaletteGeneratorHistoryRuntime = {
  captureCurrentGeneratorSettings,
  resolveAppliedPaletteSize,
  getHistoryNavigationState,
  createHistoryEntry,
  formatHistoryTime,
  resolveHistoryEntryForLoad,
  getTargetHistoryIndex,
};

window.PaletteGeneratorHistoryRuntime = PaletteGeneratorHistoryRuntime;

export default PaletteGeneratorHistoryRuntime;
