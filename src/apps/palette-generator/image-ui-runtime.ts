import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import type {
  MonochromaticGenerationMode,
  PaletteBaseMode,
  PaletteGeneratorUploadedImage,
} from "./types";

type PaletteBaseModeTransitionArgs = {
  currentMode: PaletteBaseMode;
  nextMode: unknown;
  uploadedImageDataUrl?: string | null;
  adoptedBaseColor?: string | null;
};

type VariantStateArgs = {
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  resetVariant?: unknown;
  advanceVariant?: unknown;
};

type OverlayTask = <T>(task: () => Promise<T>) => Promise<T>;

type RefreshImageDerivedControlsArgs = {
  paletteBaseMode: PaletteBaseMode;
  uploadedImageDataUrl?: string | null;
  getImageColorClusters: () => Promise<unknown[]>;
  setPaletteImageExtractionFeedback: (isVisible: boolean) => void;
  revealPaletteImageDropzoneForRetry: () => void;
  updatePaletteSizeButtonsAvailability: (availableImageColors?: number | null) => void;
  updatePaletteActionButtonsAvailability: (availableImageColors?: number | null) => void;
  updateRegenerateButtonsAvailability?: (() => void) | null;
  updateAddColorButtonState?: (() => void) | null;
  withPaletteLoadingOverlay?: OverlayTask | null;
};

type SyncImagePaletteFromSourceArgs = {
  paletteBaseMode: PaletteBaseMode;
  uploadedImageDataUrl?: string | null;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  options?: Record<string, unknown>;
  clearRecentInspiredPalettes: () => void;
  syncVariantState: (nextState: {
    imagePaletteVariantIndex: number;
    imageInspirationVariantIndex: number;
  }) => void;
  refreshImageDerivedControls: () => Promise<unknown>;
  isExtractionFeedbackVisible: () => boolean;
  generatePalette: () => Promise<unknown> | unknown;
  withPaletteLoadingOverlay?: OverlayTask | null;
};

type PaletteImageFileLoadState = {
  uploadedBaseImage: PaletteGeneratorUploadedImage;
  isReplaceImagePending: boolean;
  isPaletteImageDropzoneVisible: boolean;
  nextBaseMode: PaletteBaseMode;
  shouldResetVariant: boolean;
};

const ALLOWED_PALETTE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const ALLOWED_PALETTE_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg", ".webp"];

function normalizePaletteBaseMode(value: unknown): PaletteBaseMode {
  if (value === "image") {
    return "image";
  }

  if (value === "temperature") {
    return "temperature";
  }

  return "color";
}

function getFirstPaletteHexForColorBaseAdoption(
  currentPalette: unknown[] = [],
  firstCardHex: unknown = ""
) {
  const paletteCandidate =
    Array.isArray(currentPalette) && currentPalette.length > 0
      ? AppColorUtils.normalizeHexColor(currentPalette[0])
      : "";

  if (AppColorUtils.isValidHexColor(paletteCandidate)) {
    return paletteCandidate;
  }

  const firstEntryHex = AppColorUtils.normalizeHexColor(firstCardHex || "");
  if (AppColorUtils.isValidHexColor(firstEntryHex)) {
    return firstEntryHex;
  }

  return null;
}

function getPaletteBaseModeTransitionPlan(args: PaletteBaseModeTransitionArgs) {
  const nextMode = normalizePaletteBaseMode(args.nextMode);
  const previousMode = args.currentMode;
  const isMovingFromImageToColor = previousMode === "image" && nextMode === "color";

  return {
    nextMode,
    shouldClearImageExtractionFeedback: nextMode !== "image",
    shouldClearLeakedColorModeFixedPins: previousMode === "color" && nextMode !== "color",
    shouldRefreshImageDerivedControls: nextMode === "image" && !!args.uploadedImageDataUrl,
    colorModeAdoption: {
      shouldSyncColorModeControls: nextMode === "color",
      shouldClearUnavailablePinnedCards: nextMode === "color",
      shouldRefreshMonochromaticPalette: isMovingFromImageToColor,
      adoptedBaseColor: isMovingFromImageToColor ? args.adoptedBaseColor || null : null,
      nextColorPaletteType: isMovingFromImageToColor ? "monochromatic" : null,
      nextMonochromaticGenerationMode: isMovingFromImageToColor
        ? (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode)
        : null,
      resetColorVariantIndex: isMovingFromImageToColor,
    },
  };
}

function isAcceptedPaletteImageFile(file: unknown) {
  if (!(file instanceof File)) {
    return false;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return (
    ALLOWED_PALETTE_IMAGE_TYPES.has(file.type) ||
    ALLOWED_PALETTE_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  );
}

function createUploadedBaseImage(file: File, dataUrl: unknown): PaletteGeneratorUploadedImage {
  return {
    name: file.name,
    type: file.type,
    dataUrl: String(dataUrl || ""),
    analysisCache: null,
  };
}

function createPaletteImageFileLoadState(file: File, dataUrl: unknown): PaletteImageFileLoadState {
  return {
    uploadedBaseImage: createUploadedBaseImage(file, dataUrl),
    isReplaceImagePending: false,
    isPaletteImageDropzoneVisible: false,
    nextBaseMode: "image",
    shouldResetVariant: true,
  };
}

function getNextImageVariantState(args: VariantStateArgs) {
  if (args.resetVariant) {
    return {
      imagePaletteVariantIndex: 0,
      imageInspirationVariantIndex: 0,
      shouldClearRecentInspiredPalettes: true,
    };
  }

  if (args.advanceVariant) {
    return {
      imagePaletteVariantIndex: args.imagePaletteVariantIndex + 1,
      imageInspirationVariantIndex: args.imageInspirationVariantIndex,
      shouldClearRecentInspiredPalettes: false,
    };
  }

  return {
    imagePaletteVariantIndex: args.imagePaletteVariantIndex,
    imageInspirationVariantIndex: args.imageInspirationVariantIndex,
    shouldClearRecentInspiredPalettes: false,
  };
}

async function refreshImageDerivedControls(args: RefreshImageDerivedControlsArgs) {
  const runRefresh = async () => {
    if (args.paletteBaseMode !== "image" || !args.uploadedImageDataUrl) {
      args.setPaletteImageExtractionFeedback(false);
      args.updatePaletteSizeButtonsAvailability();
      args.updatePaletteActionButtonsAvailability();

      if (typeof args.updateRegenerateButtonsAvailability === "function") {
        args.updateRegenerateButtonsAvailability();
      }
      if (typeof args.updateAddColorButtonState === "function") {
        args.updateAddColorButtonState();
      }

      return {
        clusterCount: 0,
        hasExtractedColors: false,
      };
    }

    const clusters = await args.getImageColorClusters();
    const clusterCount = Array.isArray(clusters) ? clusters.length : 0;
    const hasExtractedColors = clusterCount > 0;

    args.setPaletteImageExtractionFeedback(!hasExtractedColors);
    if (!hasExtractedColors) {
      args.revealPaletteImageDropzoneForRetry();
    }

    args.updatePaletteSizeButtonsAvailability(clusterCount);
    args.updatePaletteActionButtonsAvailability(clusterCount);

    if (typeof args.updateRegenerateButtonsAvailability === "function") {
      args.updateRegenerateButtonsAvailability();
    }
    if (typeof args.updateAddColorButtonState === "function") {
      args.updateAddColorButtonState();
    }

    return {
      clusterCount,
      hasExtractedColors,
    };
  };

  if (typeof args.withPaletteLoadingOverlay === "function") {
    return args.withPaletteLoadingOverlay(runRefresh);
  }

  return runRefresh();
}

async function syncImagePaletteFromSource(args: SyncImagePaletteFromSourceArgs) {
  const runSync = async () => {
    if (args.paletteBaseMode !== "image" || !args.uploadedImageDataUrl) {
      return;
    }

    const nextVariantState = getNextImageVariantState({
      imagePaletteVariantIndex: args.imagePaletteVariantIndex,
      imageInspirationVariantIndex: args.imageInspirationVariantIndex,
      resetVariant: args.options?.resetVariant,
      advanceVariant: args.options?.advanceVariant,
    });

    args.syncVariantState({
      imagePaletteVariantIndex: nextVariantState.imagePaletteVariantIndex,
      imageInspirationVariantIndex: nextVariantState.imageInspirationVariantIndex,
    });

    if (nextVariantState.shouldClearRecentInspiredPalettes) {
      args.clearRecentInspiredPalettes();
    }

    await args.refreshImageDerivedControls();
    if (args.isExtractionFeedbackVisible()) {
      return;
    }

    await args.generatePalette();
  };

  if (typeof args.withPaletteLoadingOverlay === "function") {
    return args.withPaletteLoadingOverlay(runSync);
  }

  return runSync();
}

export const PaletteGeneratorImageUiRuntime = {
  normalizePaletteBaseMode,
  getFirstPaletteHexForColorBaseAdoption,
  getPaletteBaseModeTransitionPlan,
  isAcceptedPaletteImageFile,
  createUploadedBaseImage,
  createPaletteImageFileLoadState,
  getNextImageVariantState,
  refreshImageDerivedControls,
  syncImagePaletteFromSource,
};

window.PaletteGeneratorImageUiRuntime = PaletteGeneratorImageUiRuntime;

export default PaletteGeneratorImageUiRuntime;
