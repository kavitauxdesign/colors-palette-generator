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

export const PaletteGeneratorImageUiRuntime = {
  normalizePaletteBaseMode,
  getFirstPaletteHexForColorBaseAdoption,
  getPaletteBaseModeTransitionPlan,
  isAcceptedPaletteImageFile,
  createUploadedBaseImage,
  getNextImageVariantState,
};

window.PaletteGeneratorImageUiRuntime = PaletteGeneratorImageUiRuntime;

export default PaletteGeneratorImageUiRuntime;
