import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import AppSharedColors from "../../shared/services/shared-colors";
import type {
  AnalogousSeparationMode,
  ColorPaletteType,
  MonochromaticGenerationMode,
  PaletteBaseMode,
  PaletteGeneratorAdjustments,
  PaletteGeneratorHistoryEntry,
  PaletteGeneratorState,
  PaletteGeneratorStatePatch,
  PaletteGeneratorStoreApi,
  PaletteGeneratorStoreListener,
  PaletteGeneratorTemperatureSelection,
  PaletteGeneratorUploadedImage,
} from "./types";

const COLOR_PALETTE_TYPES = new Set<ColorPaletteType>([
  "automatic",
  "monochromatic",
  "complementary",
  "analogous",
  "triad",
  "tetrad",
]);
const PALETTE_BASE_MODES = new Set<PaletteBaseMode>([
  "color",
  "temperature",
  "image",
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

const { normalizeHexColor, isValidHexColor } = AppColorUtils;
const listeners = new Set<PaletteGeneratorStoreListener>();

function clampPercentValue(value: unknown, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Number(value)));
}

function normalizePalette(colors: unknown) {
  return Array.isArray(colors)
    ? colors
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];
}

function normalizeBaseMode(value: unknown): PaletteBaseMode {
  return PALETTE_BASE_MODES.has(value as PaletteBaseMode)
    ? (value as PaletteBaseMode)
    : (APP_CONSTANTS.DEFAULT_PALETTE_BASE_MODE as PaletteBaseMode);
}

function normalizeColorPaletteType(
  value: unknown,
  fallback: ColorPaletteType = APP_CONSTANTS.DEFAULT_COLOR_PALETTE_TYPE as ColorPaletteType
) {
  return COLOR_PALETTE_TYPES.has(value as ColorPaletteType)
    ? (value as ColorPaletteType)
    : fallback;
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

function normalizeTemperatureSelection(
  value: Partial<PaletteGeneratorTemperatureSelection> | null | undefined,
  fallback: PaletteGeneratorTemperatureSelection
) {
  const warm = !!value?.warm;
  const cool = !!value?.cool;

  if (!warm && !cool) {
    return { ...fallback };
  }

  return { warm, cool };
}

function normalizeUploadedBaseImage(
  value: Partial<PaletteGeneratorUploadedImage> | null | undefined
) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const dataUrl = String(value.dataUrl || "").trim();
  if (!dataUrl) {
    return null;
  }

  return {
    name: String(value.name || ""),
    type: String(value.type || ""),
    dataUrl,
    analysisCache: value.analysisCache ?? null,
  };
}

function normalizeHistoryEntry(entry: unknown): PaletteGeneratorHistoryEntry | null {
  if (Array.isArray(entry)) {
    const colors = normalizePalette(entry);
    if (colors.length === 0) {
      return null;
    }

    return {
      colors,
      createdAt: null,
      isAlternative: false,
      pinnedIndexes: [],
      settings: null,
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const colors = normalizePalette(candidate.colors);
  if (colors.length === 0) {
    return null;
  }

  const createdAt = candidate.createdAt;
  const normalizedCreatedAt =
    createdAt instanceof Date
      ? new Date(createdAt.getTime())
      : typeof createdAt === "string"
        ? createdAt
        : null;

  return {
    colors,
    createdAt: normalizedCreatedAt,
    isAlternative: !!candidate.isAlternative,
    pinnedIndexes: Array.isArray(candidate.pinnedIndexes)
      ? candidate.pinnedIndexes
          .map((index) => Number(index))
          .filter((index) => Number.isFinite(index) && index >= 0)
      : [],
    settings:
      candidate.settings && typeof candidate.settings === "object"
        ? { ...(candidate.settings as Record<string, unknown>) }
        : null,
  };
}

function normalizeHistory(entries: unknown) {
  return Array.isArray(entries)
    ? entries
        .map(normalizeHistoryEntry)
        .filter((entry): entry is PaletteGeneratorHistoryEntry => !!entry)
    : [];
}

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

function buildSnapshot(state: PaletteGeneratorState): PaletteGeneratorState {
  return {
    ...state,
    paletteHistory: state.paletteHistory.map(cloneHistoryEntry),
    uploadedBaseImage: cloneUploadedBaseImage(state.uploadedBaseImage),
    temperature: { ...state.temperature },
    currentPalette: [...state.currentPalette],
    adjustments: { ...state.adjustments },
  };
}

function emitChange(metadata: Record<string, unknown> = {}) {
  const snapshot = getState();
  listeners.forEach((listener) => {
    listener(snapshot, metadata);
  });
}

const sharedDefaultActiveColor =
  AppSharedColors.getDefaultActiveColor?.() ||
  AppSharedColors.getState?.().activeColor ||
  APP_CONSTANTS.DEFAULT_COLOR_BASE;

let paletteGeneratorState: PaletteGeneratorState = {
  paletteSize: Number(APP_CONSTANTS.DEFAULT_PALETTE_SIZE) || 0,
  paletteHistory: [],
  paletteHistoryIndex: -1,
  paletteBaseMode: normalizeBaseMode(APP_CONSTANTS.DEFAULT_PALETTE_BASE_MODE),
  uploadedBaseImage: null,
  prioritizeImageDominantColors: true,
  imagePaletteVariantIndex: 0,
  imageInspirationVariantIndex: 0,
  colorPaletteVariantIndex: 0,
  selectedPaletteBaseColor:
    isValidHexColor(normalizeHexColor(sharedDefaultActiveColor))
      ? normalizeHexColor(sharedDefaultActiveColor)
      : normalizeHexColor(APP_CONSTANTS.DEFAULT_COLOR_BASE),
  selectedColorPaletteType: normalizeColorPaletteType(
    APP_CONSTANTS.DEFAULT_COLOR_PALETTE_TYPE
  ),
  selectedMonochromaticGenerationMode: normalizeMonochromaticGenerationMode(
    APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE
  ),
  selectedAnalogousSeparationMode: normalizeAnalogousSeparationMode(
    APP_CONSTANTS.DEFAULT_ANALOGOUS_SEPARATION_MODE
  ),
  resolvedAutomaticColorPaletteType: "triad",
  temperature: normalizeTemperatureSelection(
    APP_CONSTANTS.DEFAULT_TEMPERATURE,
    { warm: true, cool: false }
  ),
  currentPalette: [],
  adjustments: {
    brightness: clampPercentValue(
      APP_CONSTANTS.DEFAULT_BRIGHTNESS,
      APP_CONSTANTS.DEFAULT_BRIGHTNESS
    ),
    saturation: clampPercentValue(
      APP_CONSTANTS.DEFAULT_SATURATION,
      APP_CONSTANTS.DEFAULT_SATURATION
    ),
  },
};

function patchState(
  patch: PaletteGeneratorStatePatch,
  metadata: Record<string, unknown> = {}
) {
  if (!patch || typeof patch !== "object") {
    return getState();
  }

  const nextState: PaletteGeneratorState = {
    ...paletteGeneratorState,
    paletteSize: Number.isFinite(patch.paletteSize)
      ? Math.max(0, Number(patch.paletteSize))
      : paletteGeneratorState.paletteSize,
    paletteHistory: Object.prototype.hasOwnProperty.call(patch, "paletteHistory")
      ? normalizeHistory(patch.paletteHistory)
      : paletteGeneratorState.paletteHistory,
    paletteHistoryIndex: Number.isFinite(patch.paletteHistoryIndex)
      ? Number(patch.paletteHistoryIndex)
      : paletteGeneratorState.paletteHistoryIndex,
    paletteBaseMode: Object.prototype.hasOwnProperty.call(patch, "paletteBaseMode")
      ? normalizeBaseMode(patch.paletteBaseMode)
      : paletteGeneratorState.paletteBaseMode,
    uploadedBaseImage: Object.prototype.hasOwnProperty.call(patch, "uploadedBaseImage")
      ? normalizeUploadedBaseImage(patch.uploadedBaseImage)
      : paletteGeneratorState.uploadedBaseImage,
    prioritizeImageDominantColors: Object.prototype.hasOwnProperty.call(
      patch,
      "prioritizeImageDominantColors"
    )
      ? !!patch.prioritizeImageDominantColors
      : paletteGeneratorState.prioritizeImageDominantColors,
    imagePaletteVariantIndex: Number.isFinite(patch.imagePaletteVariantIndex)
      ? Math.max(0, Number(patch.imagePaletteVariantIndex))
      : paletteGeneratorState.imagePaletteVariantIndex,
    imageInspirationVariantIndex: Number.isFinite(patch.imageInspirationVariantIndex)
      ? Math.max(0, Number(patch.imageInspirationVariantIndex))
      : paletteGeneratorState.imageInspirationVariantIndex,
    colorPaletteVariantIndex: Number.isFinite(patch.colorPaletteVariantIndex)
      ? Math.max(0, Number(patch.colorPaletteVariantIndex))
      : paletteGeneratorState.colorPaletteVariantIndex,
    selectedPaletteBaseColor: Object.prototype.hasOwnProperty.call(
      patch,
      "selectedPaletteBaseColor"
    )
      ? (() => {
          const normalizedColor = normalizeHexColor(patch.selectedPaletteBaseColor);
          return isValidHexColor(normalizedColor)
            ? normalizedColor
            : paletteGeneratorState.selectedPaletteBaseColor;
        })()
      : paletteGeneratorState.selectedPaletteBaseColor,
    selectedColorPaletteType: Object.prototype.hasOwnProperty.call(
      patch,
      "selectedColorPaletteType"
    )
      ? normalizeColorPaletteType(
          patch.selectedColorPaletteType,
          paletteGeneratorState.selectedColorPaletteType
        )
      : paletteGeneratorState.selectedColorPaletteType,
    selectedMonochromaticGenerationMode: Object.prototype.hasOwnProperty.call(
      patch,
      "selectedMonochromaticGenerationMode"
    )
      ? normalizeMonochromaticGenerationMode(patch.selectedMonochromaticGenerationMode)
      : paletteGeneratorState.selectedMonochromaticGenerationMode,
    selectedAnalogousSeparationMode: Object.prototype.hasOwnProperty.call(
      patch,
      "selectedAnalogousSeparationMode"
    )
      ? normalizeAnalogousSeparationMode(patch.selectedAnalogousSeparationMode)
      : paletteGeneratorState.selectedAnalogousSeparationMode,
    resolvedAutomaticColorPaletteType: Object.prototype.hasOwnProperty.call(
      patch,
      "resolvedAutomaticColorPaletteType"
    )
      ? normalizeColorPaletteType(
          patch.resolvedAutomaticColorPaletteType,
          paletteGeneratorState.resolvedAutomaticColorPaletteType
        )
      : paletteGeneratorState.resolvedAutomaticColorPaletteType,
    temperature: Object.prototype.hasOwnProperty.call(patch, "temperature")
      ? normalizeTemperatureSelection(
          patch.temperature,
          paletteGeneratorState.temperature
        )
      : { ...paletteGeneratorState.temperature },
    currentPalette: Object.prototype.hasOwnProperty.call(patch, "currentPalette")
      ? normalizePalette(patch.currentPalette)
      : paletteGeneratorState.currentPalette,
    adjustments: {
      brightness: Object.prototype.hasOwnProperty.call(patch, "adjustments")
        ? clampPercentValue(
            patch.adjustments?.brightness,
            paletteGeneratorState.adjustments.brightness
          )
        : paletteGeneratorState.adjustments.brightness,
      saturation: Object.prototype.hasOwnProperty.call(patch, "adjustments")
        ? clampPercentValue(
            patch.adjustments?.saturation,
            paletteGeneratorState.adjustments.saturation
          )
        : paletteGeneratorState.adjustments.saturation,
    },
  };

  if (nextState.paletteHistory.length === 0) {
    nextState.paletteHistoryIndex = -1;
  } else {
    nextState.paletteHistoryIndex = Math.max(
      -1,
      Math.min(nextState.paletteHistoryIndex, nextState.paletteHistory.length - 1)
    );
  }

  paletteGeneratorState = nextState;
  emitChange(metadata);
  return getState();
}

function getState() {
  return buildSnapshot(paletteGeneratorState);
}

function subscribe(listener: PaletteGeneratorStoreListener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const PaletteGeneratorStore: PaletteGeneratorStoreApi = {
  getState,
  patchState,
  syncFromLegacy(patch, metadata = {}) {
    return patchState(patch, {
      ...metadata,
      source: metadata.source || "legacy",
    });
  },
  syncCurrentPalette(colors, metadata = {}) {
    return patchState(
      {
        currentPalette: colors,
      },
      metadata
    );
  },
  syncHistory(history, historyIndex, metadata = {}) {
    return patchState(
      {
        paletteHistory: history,
        paletteHistoryIndex: historyIndex,
      },
      metadata
    );
  },
  syncAdjustments(adjustments, metadata = {}) {
    return patchState(
      {
        adjustments,
      },
      metadata
    );
  },
  subscribe,
};

window.PaletteGeneratorStore = PaletteGeneratorStore;

export default PaletteGeneratorStore;
