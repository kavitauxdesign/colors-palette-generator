import type { UploadedImageAnalysisCache } from "./image-types";

export type PaletteBaseMode = "color" | "temperature" | "image";

export type ColorPaletteType =
  | "automatic"
  | "monochromatic"
  | "complementary"
  | "analogous"
  | "triad"
  | "tetrad";

export type MonochromaticGenerationMode = "automatic" | "shades" | "tints";

export type AnalogousSeparationMode = "soft" | "medium" | "intense";

export interface PaletteGeneratorTemperatureSelection {
  warm: boolean;
  cool: boolean;
}

export interface PaletteGeneratorAdjustments {
  brightness: number;
  saturation: number;
}

export interface PaletteGeneratorUploadedImage {
  name: string;
  type: string;
  dataUrl: string;
  analysisCache: UploadedImageAnalysisCache | null;
}

export interface PaletteGeneratorHistoryEntry {
  colors: string[];
  createdAt: Date | string | null;
  isAlternative: boolean;
  pinnedIndexes: number[];
  settings: Record<string, unknown> | null;
}

export interface PaletteGeneratorState {
  paletteSize: number;
  paletteHistory: PaletteGeneratorHistoryEntry[];
  paletteHistoryIndex: number;
  paletteBaseMode: PaletteBaseMode;
  uploadedBaseImage: PaletteGeneratorUploadedImage | null;
  prioritizeImageDominantColors: boolean;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  colorPaletteVariantIndex: number;
  selectedPaletteBaseColor: string;
  selectedColorPaletteType: ColorPaletteType;
  selectedMonochromaticGenerationMode: MonochromaticGenerationMode;
  selectedAnalogousSeparationMode: AnalogousSeparationMode;
  resolvedAutomaticColorPaletteType: ColorPaletteType;
  temperature: PaletteGeneratorTemperatureSelection;
  currentPalette: string[];
  adjustments: PaletteGeneratorAdjustments;
}

export type PaletteGeneratorStatePatch = Partial<{
  [Key in keyof PaletteGeneratorState]:
    PaletteGeneratorState[Key] extends Array<infer Item>
      ? Array<Item>
      : PaletteGeneratorState[Key] extends object
        ? Partial<PaletteGeneratorState[Key]>
        : PaletteGeneratorState[Key];
}>;

export type PaletteGeneratorStoreListener = (
  state: PaletteGeneratorState,
  metadata?: Record<string, unknown>
) => void;

export interface PaletteGeneratorStoreApi {
  getState: () => PaletteGeneratorState;
  patchState: (
    patch: PaletteGeneratorStatePatch,
    metadata?: Record<string, unknown>
  ) => PaletteGeneratorState;
  syncFromLegacy: (
    patch: PaletteGeneratorStatePatch,
    metadata?: Record<string, unknown>
  ) => PaletteGeneratorState;
  syncCurrentPalette: (
    colors: string[],
    metadata?: Record<string, unknown>
  ) => PaletteGeneratorState;
  syncHistory: (
    history: PaletteGeneratorHistoryEntry[],
    historyIndex: number,
    metadata?: Record<string, unknown>
  ) => PaletteGeneratorState;
  syncAdjustments: (
    adjustments: Partial<PaletteGeneratorAdjustments>,
    metadata?: Record<string, unknown>
  ) => PaletteGeneratorState;
  subscribe: (listener: PaletteGeneratorStoreListener) => () => void;
}
