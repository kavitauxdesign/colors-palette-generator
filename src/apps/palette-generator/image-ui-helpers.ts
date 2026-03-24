import type { ColorPaletteType, PaletteBaseMode } from "./types";

type ActionVisibilityArgs = {
  paletteBaseMode: PaletteBaseMode;
  selectedColorPaletteType?: ColorPaletteType | string;
  isMonochromaticColorScale?: boolean;
  hasImageSource?: boolean;
};

type PaletteButtonState = {
  disabled: boolean;
  tooltip: string;
};

type InspirationButtonState = PaletteButtonState & {
  hidden: boolean;
};

type PaletteRegenerateButtonStateArgs = {
  paletteBaseMode: PaletteBaseMode;
  mutableSlotCount: number;
  hasValidSelectedPaletteBaseColor: boolean;
  isMonochromaticColorScale: boolean;
  hasImageSource: boolean;
  availableImageColors: number;
};

type PaletteSurpriseButtonStateArgs = {
  paletteBaseMode: PaletteBaseMode;
  mutableSlotCount: number;
  hasImageSource: boolean;
  availableImageColors: number;
};

type PaletteInspirationButtonStateArgs = {
  paletteBaseMode: PaletteBaseMode;
  mutableSlotCount: number;
  hasImageSource: boolean;
  availableImageColors: number;
  paletteSize: number;
};

type PaletteSizeButtonStateArgs = {
  paletteBaseMode: PaletteBaseMode;
  buttonSize: number;
  allowedColorModeSizes: number[];
  hasImageSource: boolean;
  availableImageColors: number;
};

type PaletteActionButtonsAvailabilityArgs = {
  paletteBaseMode: PaletteBaseMode;
  mutableSlotCount: number;
  hasValidSelectedPaletteBaseColor: boolean;
  isMonochromaticColorScale: boolean;
  hasImageSource: boolean;
  availableImageColors: number;
  paletteSize: number;
};

function getPaletteModeActionVisibility(args: ActionVisibilityArgs) {
  const isImageMode = args.paletteBaseMode === "image";
  const isColorMode = args.paletteBaseMode === "color";
  const isHiddenRegenerateColorMode =
    isColorMode &&
    ["complementary", "analogous", "triad", "tetrad"].includes(
      String(args.selectedColorPaletteType || "")
    );
  const isMonochromaticColorScale = !!args.isMonochromaticColorScale;
  const hasImageSource = !!args.hasImageSource;

  return {
    generationButtonsHidden: isImageMode,
    regenerateHidden: isColorMode
      ? isMonochromaticColorScale || isHiddenRegenerateColorMode
      : (isImageMode && !hasImageSource),
    surpriseHidden: isColorMode || (isImageMode && !hasImageSource),
    inspirationHidden: !(isImageMode && hasImageSource),
    intensityHidden: isMonochromaticColorScale,
  };
}

function getPaletteRegenerateButtonState(
  args: PaletteRegenerateButtonStateArgs
): PaletteButtonState {
  if (args.paletteBaseMode === "color") {
    if (args.isMonochromaticColorScale) {
      return {
        disabled: true,
        tooltip: "Ajusta el color base o Brillo/Saturación",
      };
    }

    const disabled = args.mutableSlotCount <= 0 || !args.hasValidSelectedPaletteBaseColor;
    return {
      disabled,
      tooltip: !args.hasValidSelectedPaletteBaseColor
        ? "Introduce un color base válido"
        : args.mutableSlotCount <= 0
          ? "Todos los colores están fijados"
          : "Generar paleta",
    };
  }

  if (args.paletteBaseMode !== "image") {
    return {
      disabled: args.mutableSlotCount <= 0,
      tooltip:
        args.mutableSlotCount <= 0
          ? "Todos los colores están fijados"
          : "Regenerar paleta",
    };
  }

  if (!args.hasImageSource) {
    return {
      disabled: true,
      tooltip: "Sube una imagen para regenerar la paleta",
    };
  }

  const hasLimitedExtractedColors = args.availableImageColors <= Math.max(args.mutableSlotCount, 0);
  const disabled = args.mutableSlotCount <= 0 || hasLimitedExtractedColors;

  return {
    disabled,
    tooltip:
      args.mutableSlotCount <= 0
        ? "Todos los colores están fijados"
        : hasLimitedExtractedColors
          ? "No hay suficiente variedad de colores en la imagen de referencia"
          : "Regenerar paleta",
  };
}

function getPaletteSurpriseButtonState(
  args: PaletteSurpriseButtonStateArgs
): PaletteButtonState {
  if (args.paletteBaseMode === "color") {
    return {
      disabled: true,
      tooltip: "Modo no disponible en Color",
    };
  }

  if (args.paletteBaseMode !== "image") {
    return {
      disabled: args.mutableSlotCount <= 0,
      tooltip:
        args.mutableSlotCount <= 0
          ? "Todos los colores están fijados"
          : "Generar una variante más libre sin cambiar la cantidad de colores",
    };
  }

  const hasExtractedColors =
    args.hasImageSource && args.availableImageColors > 0 && args.mutableSlotCount > 0;

  return {
    disabled: !hasExtractedColors,
    tooltip: hasExtractedColors
      ? "Generar una variante libre basada en la imagen original"
      : args.mutableSlotCount <= 0
        ? "Todos los colores están fijados"
        : "Sube una imagen válida para sorprender la paleta",
  };
}

function hasInsufficientFreeSlotsForImageInspiration(mutableSlotCount: number, paletteSize: number) {
  return mutableSlotCount < 2 || mutableSlotCount < Math.ceil(paletteSize / 2);
}

function getPaletteInspirationButtonState(
  args: PaletteInspirationButtonStateArgs
): InspirationButtonState {
  if (args.paletteBaseMode !== "image") {
    return {
      hidden: true,
      disabled: true,
      tooltip: "Modo inspiración disponible solo en Imagen",
    };
  }

  const requiresMoreFreeSlotsForInspiration = hasInsufficientFreeSlotsForImageInspiration(
    args.mutableSlotCount,
    args.paletteSize
  );
  const hasExtractedColors =
    args.hasImageSource &&
    args.availableImageColors > 0 &&
    args.mutableSlotCount > 0 &&
    !requiresMoreFreeSlotsForInspiration;

  return {
    hidden: !args.hasImageSource,
    disabled: !hasExtractedColors,
    tooltip: hasExtractedColors
      ? "Generar una paleta inspirada en la imagen"
      : args.mutableSlotCount <= 0
        ? "Todos los colores están fijados"
        : requiresMoreFreeSlotsForInspiration
          ? "Desfija más colores para usar Inspiración en toda la paleta"
          : "Sube una imagen válida para activar el modo inspiración",
  };
}

function getPaletteSizeButtonState(args: PaletteSizeButtonStateArgs) {
  const shouldDisableByImage =
    args.paletteBaseMode === "image" &&
    args.hasImageSource &&
    Number.isFinite(args.buttonSize) &&
    args.buttonSize > args.availableImageColors;
  const hidden =
    args.paletteBaseMode === "color"
      ? Number.isFinite(args.buttonSize) && !args.allowedColorModeSizes.includes(args.buttonSize)
      : args.buttonSize === 2 || args.buttonSize === 4;
  const shouldDisableByColorMode =
    args.paletteBaseMode === "color" &&
    Number.isFinite(args.buttonSize) &&
    !args.allowedColorModeSizes.includes(args.buttonSize);

  return {
    hidden,
    disabled: shouldDisableByImage || shouldDisableByColorMode,
  };
}

function getPaletteActionButtonsAvailabilityState(
  args: PaletteActionButtonsAvailabilityArgs
) {
  return {
    regenerate: getPaletteRegenerateButtonState({
      paletteBaseMode: args.paletteBaseMode,
      mutableSlotCount: args.mutableSlotCount,
      hasValidSelectedPaletteBaseColor: args.hasValidSelectedPaletteBaseColor,
      isMonochromaticColorScale: args.isMonochromaticColorScale,
      hasImageSource: args.hasImageSource,
      availableImageColors: args.availableImageColors,
    }),
    surprise: getPaletteSurpriseButtonState({
      paletteBaseMode: args.paletteBaseMode,
      mutableSlotCount: args.mutableSlotCount,
      hasImageSource: args.hasImageSource,
      availableImageColors: args.availableImageColors,
    }),
    inspiration: getPaletteInspirationButtonState({
      paletteBaseMode: args.paletteBaseMode,
      mutableSlotCount: args.mutableSlotCount,
      hasImageSource: args.hasImageSource,
      availableImageColors: args.availableImageColors,
      paletteSize: args.paletteSize,
    }),
  };
}

export const PaletteGeneratorImageUiHelpers = {
  getPaletteModeActionVisibility,
  getPaletteRegenerateButtonState,
  getPaletteSurpriseButtonState,
  hasInsufficientFreeSlotsForImageInspiration,
  getPaletteInspirationButtonState,
  getPaletteSizeButtonState,
  getPaletteActionButtonsAvailabilityState,
};

window.PaletteGeneratorImageUiHelpers = PaletteGeneratorImageUiHelpers;

export default PaletteGeneratorImageUiHelpers;
