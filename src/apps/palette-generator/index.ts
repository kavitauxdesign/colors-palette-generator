import AppRegistry from "../../shared/services/registry";
import APP_CONSTANTS from "../../shared/constants";
import loadLegacyScripts from "../../legacy/load-legacy-scripts";
import paletteGeneratorLegacyScripts from "../../legacy/palette-generator-scripts";

type PaletteGeneratorRuntimeWindow = Window &
  typeof globalThis & {
    setPaletteSize?: (size: number) => void;
    setTemperatureSelection?: (selection: Record<string, boolean>) => void;
    generatePalette?: () => Promise<unknown> | unknown;
    updateAddColorButtonState?: () => void;
    setupSurpriseButton?: () => void;
    syncColorModeBaseControls?: () => void;
    currentPalette?: string[];
    paletteSize?: number;
    paletteBaseMode?: string;
    selectedPaletteBaseColor?: string;
    selectedColorPaletteType?: string;
    selectedMonochromaticGenerationMode?: string;
    selectedAnalogousSeparationMode?: string;
    temperature?: Record<string, boolean>;
    PaletteGeneratorApp?: Record<string, unknown>;
    PaletteGeneratorStore?: {
      getState?: () => Record<string, unknown> | null | undefined;
    };
  };

let hasPaletteGeneratorAppInitialized = false;

function getPaletteGeneratorRuntimeWindow(): PaletteGeneratorRuntimeWindow {
  return window as PaletteGeneratorRuntimeWindow;
}

function getPaletteGeneratorStoreState() {
  return getPaletteGeneratorRuntimeWindow().PaletteGeneratorStore?.getState?.() || null;
}

export function loadPaletteGeneratorLegacyScripts() {
  loadLegacyScripts(paletteGeneratorLegacyScripts);
}

export function registerPaletteGeneratorApp() {
  const runtimeWindow = getPaletteGeneratorRuntimeWindow();
  if (runtimeWindow.PaletteGeneratorApp) {
    return runtimeWindow.PaletteGeneratorApp;
  }

  const paletteGeneratorApp = {
    initialize() {
      if (hasPaletteGeneratorAppInitialized) {
        return;
      }

      if (
        typeof runtimeWindow.setPaletteSize !== "function" ||
        typeof runtimeWindow.setTemperatureSelection !== "function" ||
        typeof runtimeWindow.generatePalette !== "function" ||
        typeof runtimeWindow.updateAddColorButtonState !== "function"
      ) {
        console.error(
          "Palette generator initialization failed: required startup functions are missing."
        );
        return;
      }

      hasPaletteGeneratorAppInitialized = true;

      if (typeof runtimeWindow.setupSurpriseButton === "function") {
        runtimeWindow.setupSurpriseButton();
      }

      const storeState = getPaletteGeneratorStoreState();
      const initialPaletteSize = Number.isFinite(storeState?.paletteSize)
        ? Number(storeState?.paletteSize)
        : APP_CONSTANTS.DEFAULT_PALETTE_SIZE;
      const initialTemperature =
        storeState?.temperature && typeof storeState.temperature === "object"
          ? storeState.temperature
          : APP_CONSTANTS.DEFAULT_TEMPERATURE;

      runtimeWindow.setPaletteSize(initialPaletteSize);
      runtimeWindow.setTemperatureSelection(initialTemperature);
      if (typeof runtimeWindow.syncColorModeBaseControls === "function") {
        runtimeWindow.syncColorModeBaseControls();
      }
      void runtimeWindow.generatePalette();
      runtimeWindow.updateAddColorButtonState();
    },

    getState() {
      const storeState = getPaletteGeneratorStoreState();
      return {
        palette: Array.isArray(storeState?.currentPalette)
          ? [...(storeState.currentPalette as string[])]
          : [],
        paletteSize: storeState?.paletteSize,
        baseMode: storeState?.paletteBaseMode,
        baseColor: storeState?.selectedPaletteBaseColor,
        colorPaletteType: storeState?.selectedColorPaletteType,
        monochromaticGenerationMode: storeState?.selectedMonochromaticGenerationMode,
        analogousSeparationMode: storeState?.selectedAnalogousSeparationMode,
        temperature:
          storeState?.temperature && typeof storeState.temperature === "object"
            ? { ...(storeState.temperature as Record<string, boolean>) }
            : { ...APP_CONSTANTS.DEFAULT_TEMPERATURE },
      };
    },
  };

  runtimeWindow.PaletteGeneratorApp = paletteGeneratorApp;
  AppRegistry.register("palette-generator", paletteGeneratorApp);
  return paletteGeneratorApp;
}

export default registerPaletteGeneratorApp;
