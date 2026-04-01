import AppRegistry from "../../shared/services/registry";
import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import initializePaletteGeneratorState from "./state";
import initializePaletteGeneratorCore from "./core";
import initializePaletteGeneratorControls from "./controls";
import initializePaletteGeneratorHistory from "./history";
import initializePaletteGeneratorCardHelpers from "./card-helpers";
import initializePaletteGeneratorCards from "./cards";
import initializePaletteGeneratorColorMode from "./color-mode";
import initializePaletteGeneratorTemperature from "./temperature";
import initializePaletteGeneratorImageAnalysis from "./image-analysis";
import initializePaletteGeneratorImagePalette from "./image-palette";
import initializePaletteGeneratorImageUi from "./image-ui";
import initializePaletteGeneratorCardNames from "./card-names";

type PaletteGeneratorRuntimeWindow = Window &
  typeof globalThis & {
    setPaletteSize?: (size: number) => void;
    setTemperatureSelection?: (selection: Record<string, boolean>) => void;
    generatePalette?: () => Promise<unknown> | unknown;
    renderAdjustedPalette?: (colors: string[], options?: Record<string, unknown>) => unknown;
    capturePaletteAdjustmentBase?: (
      colors: string[],
      settings?: Record<string, unknown>
    ) => void;
    syncCurrentPaletteFromDom?: () => void;
    saveHistory?: (colors: string[], metadata?: Record<string, unknown>) => void;
    updateAddColorButtonState?: () => void;
    setupSurpriseButton?: () => void;
    syncColorModeBaseControls?: () => void;
    setSelectedPaletteBaseColor?: (
      value: unknown,
      options?: Record<string, unknown>
    ) => boolean;
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
const SHARED_PALETTE_ALERT_DURATION_MS = 4000;
const SHARED_PALETTE_ALERT_EXIT_MS = 260;
const SHARED_PALETTE_ALERT_ID = "sharedPaletteLoadSnackbar";

function getPaletteGeneratorRuntimeWindow(): PaletteGeneratorRuntimeWindow {
  return window as PaletteGeneratorRuntimeWindow;
}

function getPaletteGeneratorStoreState() {
  return getPaletteGeneratorRuntimeWindow().PaletteGeneratorStore?.getState?.() || null;
}

function getSharedPaletteFromLocation() {
  const searchParams = new URLSearchParams(window.location.search);
  const targetView = String(searchParams.get("view") || "").trim();
  const rawPalette = String(searchParams.get("palette") || "").trim();

  if (!rawPalette) {
    return [];
  }

  if (targetView && targetView !== "palette_generator") {
    return [];
  }

  return rawPalette
    .split(",")
    .map((value) => AppColorUtils.normalizeHexColor(value))
    .filter((hex) => AppColorUtils.isValidHexColor(hex));
}

function getSharedPaletteLoadedAlertElement() {
  let alertElement = document.getElementById(SHARED_PALETTE_ALERT_ID) as
    | (HTMLElement & {
        __codexHideTimeout?: ReturnType<typeof setTimeout> | null;
        __codexHideCommitTimeout?: ReturnType<typeof setTimeout> | null;
      })
    | null;

  if (alertElement) {
    return alertElement;
  }

  alertElement = document.createElement("div") as HTMLElement & {
    __codexHideTimeout?: ReturnType<typeof setTimeout> | null;
    __codexHideCommitTimeout?: ReturnType<typeof setTimeout> | null;
  };
  alertElement.id = SHARED_PALETTE_ALERT_ID;
  alertElement.className = "app-top-snackbar";
  alertElement.setAttribute("role", "status");
  alertElement.setAttribute("aria-live", "polite");
  alertElement.hidden = true;
  alertElement.innerHTML = '<h4 class="app-top-snackbar-title">Paleta cargada desde URL</h4>';
  document.body.appendChild(alertElement);

  return alertElement;
}

function showSharedPaletteLoadedAlert(runtimeWindow: PaletteGeneratorRuntimeWindow) {
  const alertElement = getSharedPaletteLoadedAlertElement();

  if (!alertElement) {
    return;
  }

  if (alertElement.__codexHideTimeout) {
    clearTimeout(alertElement.__codexHideTimeout);
    alertElement.__codexHideTimeout = null;
  }
  if (alertElement.__codexHideCommitTimeout) {
    clearTimeout(alertElement.__codexHideCommitTimeout);
    alertElement.__codexHideCommitTimeout = null;
  }

  alertElement.hidden = false;
  alertElement.classList.remove("is-visible");
  void alertElement.offsetWidth;

  requestAnimationFrame(() => {
    alertElement.classList.add("is-visible");
  });

  alertElement.__codexHideTimeout = setTimeout(() => {
    alertElement.classList.remove("is-visible");
    alertElement.__codexHideTimeout = null;
    alertElement.__codexHideCommitTimeout = setTimeout(() => {
      alertElement.hidden = true;
      alertElement.__codexHideCommitTimeout = null;
    }, SHARED_PALETTE_ALERT_EXIT_MS);
  }, SHARED_PALETTE_ALERT_DURATION_MS);
}

export function initializePaletteGeneratorModules() {
  initializePaletteGeneratorState();
  initializePaletteGeneratorCore();
  initializePaletteGeneratorCardHelpers();
  initializePaletteGeneratorCards();
  initializePaletteGeneratorTemperature();
  initializePaletteGeneratorImageAnalysis();
  initializePaletteGeneratorImagePalette();
  initializePaletteGeneratorCardNames();
  initializePaletteGeneratorColorMode();
  initializePaletteGeneratorImageUi();
  initializePaletteGeneratorControls();
  initializePaletteGeneratorHistory();
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
      const sharedPalette = getSharedPaletteFromLocation();

      runtimeWindow.setPaletteSize(
        sharedPalette.length > 0 ? sharedPalette.length : initialPaletteSize
      );
      runtimeWindow.setTemperatureSelection(initialTemperature);
      if (typeof runtimeWindow.syncColorModeBaseControls === "function") {
        runtimeWindow.syncColorModeBaseControls();
      }

      if (
        sharedPalette.length > 0 &&
        typeof runtimeWindow.renderAdjustedPalette === "function" &&
        typeof runtimeWindow.capturePaletteAdjustmentBase === "function" &&
        typeof runtimeWindow.syncCurrentPaletteFromDom === "function"
      ) {
        runtimeWindow.setSelectedPaletteBaseColor?.(sharedPalette[0], {
          syncTextInput: true,
          generate: false,
          publish: false,
        });
        runtimeWindow.renderAdjustedPalette(sharedPalette, { previewOnly: true });
        runtimeWindow.capturePaletteAdjustmentBase(sharedPalette);
        runtimeWindow.syncCurrentPaletteFromDom();
        runtimeWindow.saveHistory?.(sharedPalette);
        showSharedPaletteLoadedAlert(runtimeWindow);
      } else {
        void runtimeWindow.generatePalette();
      }

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
