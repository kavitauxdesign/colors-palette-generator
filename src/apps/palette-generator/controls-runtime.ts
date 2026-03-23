import APP_CONSTANTS from "../../shared/constants";
import type { PaletteGeneratorTemperatureSelection } from "./types";

type AddedColorResult = {
  color: string | null;
  isFallbackWhite?: boolean;
};

type ApplyPaletteSizeChangeArgs = {
  paletteBaseMode: string;
  nextSize: number;
  paletteSize: number;
  currentPalette?: string[];
  uploadedImageDataUrl?: string | null;
  setPaletteSize: (size: number) => void;
  getColorCards: () => Element[] | NodeListOf<Element>;
  refreshDeleteButtonsVisibility: () => void;
  syncCurrentPaletteFromDom: () => void;
  capturePaletteAdjustmentBase: (colors?: string[]) => void;
  getCurrentPaletteHexValues: () => string[];
  getAddedColorForCurrentMode: (existingColors: Set<string>) => AddedColorResult;
  createColorCard: (color: string) => Element | null | undefined;
  saveHistory: (colors: string[]) => void;
  syncImagePaletteFromSource: () => Promise<unknown>;
  getAllowedPaletteSizesForCurrentMode?: (() => number[]) | null;
  getNearestAllowedPaletteSize?: ((nextSize: number, allowedSizes: number[]) => number) | null;
  updatePaletteModeActionVisibility?: (() => void) | null;
  updatePaletteActionButtonsAvailability?: (() => void) | null;
  updateRegenerateButtonsAvailability?: (() => void) | null;
  getEffectiveColorPaletteType?: ((size: number) => string) | null;
  selectedColorPaletteType?: string;
  buildColorModePaletteForSettings?: ((
    targetCount: number,
    settings: unknown,
    options?: Record<string, unknown>
  ) => string[]) | null;
  getCurrentPaletteAdjustmentSnapshot: () => unknown;
  getPaletteBaseColorSnapshot?: (() => unknown) | null;
  colorPaletteVariantIndex: number;
  commitGeneratedPalette?: ((palette: string[], options?: Record<string, unknown>) => void) | null;
  withPaletteLoadingOverlay?: (<T>(task: () => Promise<T> | T) => Promise<T>) | null;
};

type ApplyPaletteSizeChangeResult = {
  nextColorPaletteVariantIndex: number;
};

type SetTemperatureSelectionArgs = {
  nextSelection?: Partial<PaletteGeneratorTemperatureSelection> | null;
};

type ToggleTemperatureSelectionArgs = {
  type: "warm" | "cool";
  temperature: PaletteGeneratorTemperatureSelection;
};

function removeColorsFromPaletteEnd(args: {
  count: number;
  getColorCards: () => Element[] | NodeListOf<Element>;
  refreshDeleteButtonsVisibility: () => void;
  syncCurrentPaletteFromDom: () => void;
  capturePaletteAdjustmentBase: (colors?: string[]) => void;
  getCurrentPaletteHexValues: () => string[];
}) {
  if (!Number.isFinite(args.count) || args.count <= 0) {
    return false;
  }

  const cards = Array.from(args.getColorCards());
  if (cards.length === 0) {
    return false;
  }

  cards.slice(-args.count).forEach((card) => {
    card.remove();
  });

  args.refreshDeleteButtonsVisibility();
  args.syncCurrentPaletteFromDom();
  args.capturePaletteAdjustmentBase(args.getCurrentPaletteHexValues());
  return true;
}

function addColorsToPaletteEnd(args: {
  count: number;
  getCurrentPaletteHexValues: () => string[];
  getAddedColorForCurrentMode: (existingColors: Set<string>) => AddedColorResult;
  createColorCard: (color: string) => Element | null | undefined;
  syncCurrentPaletteFromDom: () => void;
  capturePaletteAdjustmentBase: (colors?: string[]) => void;
}) {
  if (!Number.isFinite(args.count) || args.count <= 0) {
    return false;
  }

  let hasChanged = false;

  for (let index = 0; index < args.count; index += 1) {
    const existingColors = new Set(args.getCurrentPaletteHexValues());
    const { color, isFallbackWhite } = args.getAddedColorForCurrentMode(existingColors);

    if (!color) {
      break;
    }

    const card = args.createColorCard(color);
    if (!card) {
      break;
    }

    if (card instanceof HTMLElement) {
      card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
    }

    hasChanged = true;
  }

  if (!hasChanged) {
    return false;
  }

  args.syncCurrentPaletteFromDom();
  args.capturePaletteAdjustmentBase(args.getCurrentPaletteHexValues());
  return true;
}

async function applyPaletteSizeChange(
  args: ApplyPaletteSizeChangeArgs
): Promise<ApplyPaletteSizeChangeResult> {
  let nextColorPaletteVariantIndex = Number.isFinite(args.colorPaletteVariantIndex)
    ? Number(args.colorPaletteVariantIndex)
    : 0;

  if (args.paletteBaseMode === "color") {
    const allowedSizes = typeof args.getAllowedPaletteSizesForCurrentMode === "function"
      ? args.getAllowedPaletteSizesForCurrentMode()
      : [];
    const resolvedSize =
      typeof args.getNearestAllowedPaletteSize === "function"
        ? args.getNearestAllowedPaletteSize(args.nextSize, allowedSizes)
        : args.nextSize;
    const previousPalette = Array.isArray(args.currentPalette) ? [...args.currentPalette] : [];

    if (resolvedSize !== args.paletteSize) {
      args.setPaletteSize(resolvedSize);
    }

    args.updatePaletteModeActionVisibility?.();
    args.updatePaletteActionButtonsAvailability?.();
    args.updateRegenerateButtonsAvailability?.();

    const applyRecalculatedColorPalette = () => {
      const effectiveType = typeof args.getEffectiveColorPaletteType === "function"
        ? args.getEffectiveColorPaletteType(resolvedSize)
        : String(args.selectedColorPaletteType || "");
      const nextPalette =
        typeof args.buildColorModePaletteForSettings === "function"
          ? args.buildColorModePaletteForSettings(
              resolvedSize,
              args.getCurrentPaletteAdjustmentSnapshot(),
              {
                baseColor:
                  typeof args.getPaletteBaseColorSnapshot === "function"
                    ? args.getPaletteBaseColorSnapshot()
                    : null,
                effectiveType,
                variantIndex:
                  effectiveType === "monochromatic" || effectiveType === "complementary"
                    ? 0
                    : nextColorPaletteVariantIndex,
              }
            )
          : [];

      if (!Array.isArray(nextPalette) || nextPalette.length !== resolvedSize) {
        return;
      }

      if (effectiveType === "monochromatic" || effectiveType === "complementary") {
        nextColorPaletteVariantIndex = 0;
      }

      args.commitGeneratedPalette?.(nextPalette, {
        effectiveType,
        previousPalette,
      });
    };

    if (typeof args.withPaletteLoadingOverlay === "function") {
      await args.withPaletteLoadingOverlay(async () => {
        applyRecalculatedColorPalette();
      });
    } else {
      applyRecalculatedColorPalette();
    }

    return {
      nextColorPaletteVariantIndex,
    };
  }

  if (args.paletteBaseMode === "image" && args.uploadedImageDataUrl) {
    await args.syncImagePaletteFromSource();
    return {
      nextColorPaletteVariantIndex,
    };
  }

  const currentCount = Array.from(args.getColorCards()).length;
  const difference = args.nextSize - currentCount;

  if (difference === 0) {
    return {
      nextColorPaletteVariantIndex,
    };
  }

  if (currentCount === 0) {
    if (args.paletteBaseMode === "image" && args.uploadedImageDataUrl) {
      await args.syncImagePaletteFromSource();
    }

    return {
      nextColorPaletteVariantIndex,
    };
  }

  const hasChanged =
    difference < 0
      ? removeColorsFromPaletteEnd({
          count: Math.abs(difference),
          getColorCards: args.getColorCards,
          refreshDeleteButtonsVisibility: args.refreshDeleteButtonsVisibility,
          syncCurrentPaletteFromDom: args.syncCurrentPaletteFromDom,
          capturePaletteAdjustmentBase: args.capturePaletteAdjustmentBase,
          getCurrentPaletteHexValues: args.getCurrentPaletteHexValues,
        })
      : addColorsToPaletteEnd({
          count: difference,
          getCurrentPaletteHexValues: args.getCurrentPaletteHexValues,
          getAddedColorForCurrentMode: args.getAddedColorForCurrentMode,
          createColorCard: args.createColorCard,
          syncCurrentPaletteFromDom: args.syncCurrentPaletteFromDom,
          capturePaletteAdjustmentBase: args.capturePaletteAdjustmentBase,
        });

  if (hasChanged) {
    args.saveHistory(args.getCurrentPaletteHexValues());
  }

  return {
    nextColorPaletteVariantIndex,
  };
}

function setTemperatureSelection(args: SetTemperatureSelectionArgs) {
  const warmSelected = !!args.nextSelection?.warm;
  const coolSelected = !!args.nextSelection?.cool;

  if (!warmSelected && !coolSelected) {
    return {
      warm: true,
      cool: false,
    };
  }

  return {
    warm: warmSelected,
    cool: coolSelected,
  };
}

function toggleTemperatureSelection(args: ToggleTemperatureSelectionArgs) {
  const nextSelection = {
    warm: !!args.temperature.warm,
    cool: !!args.temperature.cool,
  };

  nextSelection[args.type] = !nextSelection[args.type];

  if (!nextSelection.warm && !nextSelection.cool) {
    nextSelection[args.type] = true;
  }

  return setTemperatureSelection({
    nextSelection,
  });
}

export const PaletteGeneratorControlsRuntime = {
  applyPaletteSizeChange,
  setTemperatureSelection,
  toggleTemperatureSelection,
};

window.PaletteGeneratorControlsRuntime = PaletteGeneratorControlsRuntime;

export default PaletteGeneratorControlsRuntime;
