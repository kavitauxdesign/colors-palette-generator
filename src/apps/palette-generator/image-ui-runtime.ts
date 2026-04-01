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
  paletteSize: number;
  imagePaletteVariantIndex: number;
  imageInspirationVariantIndex: number;
  options?: Record<string, unknown>;
  clearRecentInspiredPalettes: () => void;
  setPaletteSize?: ((size: number) => void) | null;
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

type PaletteImagePreviewStateArgs = {
  uploadedImageDataUrl?: string | null;
  isPaletteImageDropzoneVisible: boolean;
  isReplaceImagePending: boolean;
};

type PaletteCardEntryLike = {
  card: unknown;
  index: number;
  hex: string;
  pinned?: boolean;
};

type RegeneratePinnedPaletteSlotsArgs = {
  paletteBaseMode: PaletteBaseMode;
  imagePaletteVariantProfileCount: number;
  getCurrentPaletteCardEntries: () => PaletteCardEntryLike[];
  getRegeneratedColorForCard: (
    card: unknown,
    existingColors: Set<string>,
    options?: Record<string, unknown>
  ) => string | null;
  setCardColor: (card: unknown, color: string) => void;
  persistCurrentPaletteSnapshot: () => void;
};

type ClearLeakedColorModeFixedPinsArgs = {
  cards?: Element[];
  setCardPinnedState?: ((card: Element, isPinned: boolean) => void) | null;
};

type ResetPaletteBeforeColorModeRegenerationArgs = {
  cards?: Element[];
  refreshDeleteButtonsVisibility?: (() => void) | null;
  syncCurrentPaletteFromDom?: (() => void) | null;
  syncPaletteGeneratorStoreCurrentPalette?: ((colors: string[], metadata?: Record<string, unknown>) => void) | null;
  capturePaletteAdjustmentBase?: ((colors: string[]) => void) | null;
};

const ALLOWED_PALETTE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);
const ALLOWED_PALETTE_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
const NON_COLOR_MODE_SIZE_OPTIONS = [3, 6, 9, 12];

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
  const firstEntryHex = AppColorUtils.normalizeHexColor(firstCardHex || "");
  if (AppColorUtils.isValidHexColor(firstEntryHex)) {
    return firstEntryHex;
  }

  const paletteCandidate =
    Array.isArray(currentPalette) && currentPalette.length > 0
      ? AppColorUtils.normalizeHexColor(currentPalette[0])
      : "";

  if (AppColorUtils.isValidHexColor(paletteCandidate)) {
    return paletteCandidate;
  }

  return null;
}

function getPaletteBaseModeTransitionPlan(args: PaletteBaseModeTransitionArgs) {
  const nextMode = normalizePaletteBaseMode(args.nextMode);
  const previousMode = args.currentMode;
  const isMovingFromImageToColor = previousMode === "image" && nextMode === "color";
  const isMovingFromNonColorToColor = previousMode !== "color" && nextMode === "color";
  const isMovingFromNonImageToImage = previousMode !== "image" && nextMode === "image";

  return {
    nextMode,
    shouldClearImageExtractionFeedback: nextMode !== "image",
    shouldClearLeakedColorModeFixedPins: previousMode === "color" && nextMode !== "color",
    shouldRefreshImageDerivedControls: nextMode === "image" && !!args.uploadedImageDataUrl,
    shouldRefreshImagePaletteFromSource: isMovingFromNonImageToImage && !!args.uploadedImageDataUrl,
    colorModeAdoption: {
      shouldSyncColorModeControls: nextMode === "color",
      shouldClearUnavailablePinnedCards: nextMode === "color",
      shouldRefreshMonochromaticPalette: isMovingFromNonColorToColor,
      adoptedBaseColor: isMovingFromNonColorToColor ? args.adoptedBaseColor || null : null,
      nextColorPaletteType: isMovingFromNonColorToColor ? "monochromatic" : null,
      nextMonochromaticGenerationMode: isMovingFromNonColorToColor
        ? (APP_CONSTANTS.DEFAULT_MONOCHROMATIC_GENERATION_MODE as MonochromaticGenerationMode)
        : null,
      resetColorVariantIndex: isMovingFromNonColorToColor,
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

function isRevocablePaletteImageUrl(value: unknown) {
  return typeof value === "string" && value.startsWith("blob:");
}

function revokeUploadedBaseImageUrl(image?: PaletteGeneratorUploadedImage | null) {
  const dataUrl = String(image?.dataUrl || "").trim();
  if (!isRevocablePaletteImageUrl(dataUrl)) {
    return;
  }

  try {
    URL.revokeObjectURL(dataUrl);
  } catch (error) {
    // Ignore revocation failures so they never interrupt image-mode interactions.
  }
}

function createUploadedBaseImage(file: File, dataUrl?: unknown): PaletteGeneratorUploadedImage {
  const resolvedDataUrl =
    typeof dataUrl === "string" && dataUrl.trim()
      ? dataUrl.trim()
      : URL.createObjectURL(file);

  return {
    name: file.name,
    type: file.type,
    dataUrl: resolvedDataUrl,
    byteSize: Number.isFinite(file.size) ? Number(file.size) : null,
    isObjectUrl: isRevocablePaletteImageUrl(resolvedDataUrl),
    analysisCache: null,
  };
}

function createPaletteImageFileLoadState(
  file: File,
  dataUrl?: unknown
): PaletteImageFileLoadState {
  return {
    uploadedBaseImage: createUploadedBaseImage(file, dataUrl),
    isReplaceImagePending: false,
    isPaletteImageDropzoneVisible: false,
    nextBaseMode: "image",
    shouldResetVariant: true,
  };
}

function getPaletteImagePreviewState(args: PaletteImagePreviewStateArgs) {
  const hasPreview = !!args.uploadedImageDataUrl;

  return {
    hasPreview,
    shouldShowDropzonePanel: !hasPreview || args.isPaletteImageDropzoneVisible,
    shouldShowPreviewPanel: hasPreview,
    replaceButtonDisabled: !hasPreview || args.isReplaceImagePending,
  };
}

function getOpenPaletteImageDropzoneState() {
  return {
    isReplaceImagePending: true,
    isPaletteImageDropzoneVisible: true,
  };
}

function getPaletteBasePanelVisibilityState(paletteBaseMode: PaletteBaseMode) {
  return {
    showColorPanel: paletteBaseMode === "color",
    showTemperaturePanel: paletteBaseMode === "temperature",
    showImagePanel: paletteBaseMode === "image",
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

function resolveImagePaletteSize(currentSize: number, availableImageColors: number) {
  const safeCurrentSize = Number.isFinite(currentSize) ? Math.max(0, Number(currentSize)) : 0;
  const safeAvailableColors = Number.isFinite(availableImageColors)
    ? Math.max(0, Number(availableImageColors))
    : 0;

  if (safeAvailableColors <= 0) {
    return safeCurrentSize;
  }

  const allowedSizes = NON_COLOR_MODE_SIZE_OPTIONS.filter(
    (size) => size <= safeAvailableColors
  );

  if (allowedSizes.includes(safeCurrentSize)) {
    return safeCurrentSize;
  }

  if (allowedSizes.length > 0) {
    return allowedSizes[allowedSizes.length - 1];
  }

  return Math.min(safeCurrentSize || safeAvailableColors, safeAvailableColors);
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

    const refreshResult = await args.refreshImageDerivedControls();
    if (args.isExtractionFeedbackVisible()) {
      return;
    }

    const clusterCount = Number.isFinite(
      (refreshResult as { clusterCount?: unknown } | null)?.clusterCount
    )
      ? Number((refreshResult as { clusterCount: number }).clusterCount)
      : 0;
    const resolvedPaletteSize = resolveImagePaletteSize(args.paletteSize, clusterCount);

    if (
      typeof args.setPaletteSize === "function" &&
      Number.isFinite(resolvedPaletteSize) &&
      resolvedPaletteSize > 0 &&
      resolvedPaletteSize !== args.paletteSize
    ) {
      args.setPaletteSize(resolvedPaletteSize);
    }

    await args.generatePalette();
  };

  if (typeof args.withPaletteLoadingOverlay === "function") {
    return args.withPaletteLoadingOverlay(runSync);
  }

  return runSync();
}

function regeneratePinnedPaletteSlots(args: RegeneratePinnedPaletteSlotsArgs) {
  const cardEntries = args.getCurrentPaletteCardEntries();
  const mutableEntries = cardEntries.filter((entry) => !entry.pinned);

  if (mutableEntries.length === 0) {
    return false;
  }

  const nextColors = cardEntries.map((entry) => AppColorUtils.normalizeHexColor(entry.hex));
  let hasChanged = false;
  const usesVariantAwareRegeneration =
    args.paletteBaseMode === "image" || args.paletteBaseMode === "color";
  const maxAttempts = usesVariantAwareRegeneration
    ? Math.max(6, args.imagePaletteVariantProfileCount * 2)
    : 1;

  mutableEntries.forEach((entry) => {
    let candidate: string | null = null;
    const excludedColors = new Set([AppColorUtils.normalizeHexColor(entry.hex)]);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      candidate = args.getRegeneratedColorForCard(entry.card, new Set(nextColors), {
        excludedColors,
        variantSeedOffset:
          usesVariantAwareRegeneration
            ? attempt * Math.max(1, args.imagePaletteVariantProfileCount)
            : 0,
        maxVariantSweeps:
          usesVariantAwareRegeneration
            ? Math.max(12, args.imagePaletteVariantProfileCount * 6)
            : undefined,
      });

      if (candidate && candidate !== entry.hex && !excludedColors.has(candidate)) {
        break;
      }

      if (candidate) {
        excludedColors.add(AppColorUtils.normalizeHexColor(candidate));
      }
    }

    if (!candidate || candidate === entry.hex) {
      return;
    }

    args.setCardColor(entry.card, candidate);
    nextColors[entry.index] = AppColorUtils.normalizeHexColor(candidate);
    hasChanged = true;
  });

  if (hasChanged) {
    args.persistCurrentPaletteSnapshot();
  }

  return hasChanged;
}

function clearLeakedColorModeFixedPins(args: ClearLeakedColorModeFixedPinsArgs) {
  const cards = Array.isArray(args.cards) ? args.cards : [];

  cards.forEach((card) => {
    const htmlCard = card as HTMLElement;
    htmlCard.dataset.readonlyFixedPin = "false";
    htmlCard.classList.remove("is-base-color", "is-complementary-color");

    const colorBaseIndicator = htmlCard.querySelector(".color-base-indicator") as HTMLElement | null;
    if (colorBaseIndicator) {
      colorBaseIndicator.hidden = true;
    }

    const complementaryIndicator = htmlCard.querySelector(
      ".color-complementary-indicator"
    ) as HTMLElement | null;
    if (complementaryIndicator) {
      complementaryIndicator.hidden = true;
    }

    if (typeof args.setCardPinnedState === "function") {
      args.setCardPinnedState(htmlCard, false);
    }
  });
}

function resetPaletteBeforeColorModeRegeneration(
  args: ResetPaletteBeforeColorModeRegenerationArgs
) {
  const cards = Array.isArray(args.cards) ? args.cards : [];
  if (cards.length === 0) {
    return false;
  }

  cards.forEach((card) => card.remove());

  if (typeof args.refreshDeleteButtonsVisibility === "function") {
    args.refreshDeleteButtonsVisibility();
  }

  if (typeof args.syncCurrentPaletteFromDom === "function") {
    args.syncCurrentPaletteFromDom();
  } else if (typeof args.syncPaletteGeneratorStoreCurrentPalette === "function") {
    args.syncPaletteGeneratorStoreCurrentPalette([], {
      scope: "current-palette-reset",
    });
  }

  if (typeof args.capturePaletteAdjustmentBase === "function") {
    args.capturePaletteAdjustmentBase([]);
  }

  return true;
}

export const PaletteGeneratorImageUiRuntime = {
  normalizePaletteBaseMode,
  getFirstPaletteHexForColorBaseAdoption,
  getPaletteBaseModeTransitionPlan,
  getPaletteBasePanelVisibilityState,
  isAcceptedPaletteImageFile,
  createUploadedBaseImage,
  revokeUploadedBaseImageUrl,
  createPaletteImageFileLoadState,
  getPaletteImagePreviewState,
  getOpenPaletteImageDropzoneState,
  getNextImageVariantState,
  refreshImageDerivedControls,
  syncImagePaletteFromSource,
  regeneratePinnedPaletteSlots,
  clearLeakedColorModeFixedPins,
  resetPaletteBeforeColorModeRegeneration,
};

window.PaletteGeneratorImageUiRuntime = PaletteGeneratorImageUiRuntime;

export default PaletteGeneratorImageUiRuntime;
