import APP_CONSTANTS from "../../shared/constants";
import AppClipboard from "../../shared/services/clipboard";
import AppColorUtils from "../../shared/color/color-utils";
import AppSharedColors from "../../shared/services/shared-colors";
import AppRegistry from "../../shared/services/registry";
import {
  Color,
  Solver,
  getLossMessage,
  normalizeHexInputValue,
} from "./core";

let isHexToFilterInitialized = false;
let applyExternalTargetColor: (
  nextColorValue: string,
  options?: { publish?: boolean; source?: string }
) => boolean = () => false;

function resolveHexToFilterElements(root: HTMLElement) {
  const textInput = root.querySelector(".target") as HTMLInputElement | null;
  const copyButton = root.querySelector(".filter-copy-btn") as HTMLButtonElement | null;
  const swatchButton = root.querySelector(".target-color-swatch") as HTMLButtonElement | null;
  const swatchFill = root.querySelector(".target-color-swatch-fill") as HTMLElement | null;
  const colorPicker = root.querySelector(".filter-target-picker") as HTMLInputElement | null;
  const feedback = root.querySelector(".filter-tool-feedback") as HTMLElement | null;
  const filterCodeOutput = root.querySelector(".filter-code-output") as HTMLElement | null;
  const lossDetail = root.querySelector(".lossDetail") as HTMLElement | null;
  const filterPreviewPixel = root.querySelector(".filterPixel") as HTMLElement | null;
  const filterPreviewImage = root.querySelector(".filter-source-icon-after") as HTMLElement | null;

  if (
    !textInput ||
    !copyButton ||
    !swatchButton ||
    !swatchFill ||
    !colorPicker ||
    !feedback ||
    !filterCodeOutput ||
    !lossDetail ||
    !filterPreviewPixel ||
    !filterPreviewImage
  ) {
    return null;
  }

  return {
    textInput,
    copyButton,
    swatchButton,
    swatchFill,
    colorPicker,
    feedback,
    filterCodeOutput,
    lossDetail,
    filterPreviewPixel,
    filterPreviewImage,
    copyTooltip: copyButton.querySelector(".tooltip") as HTMLElement | null,
  };
}

function initializeHexToFilterApp() {
  if (isHexToFilterInitialized) {
    return;
  }

  const root = document.getElementById("hex_to_code");
  if (!root) {
    return;
  }

  const elements = resolveHexToFilterElements(root);
  if (!elements) {
    return;
  }

  const DEFAULT_TARGET_COLORS = Array.isArray(APP_CONSTANTS.DEFAULT_TARGET_COLORS)
    ? APP_CONSTANTS.DEFAULT_TARGET_COLORS
    : ["#9EBB89"];

  const DEFAULT_TARGET_COLOR =
    AppSharedColors.getDefaultActiveColor?.() ||
    AppSharedColors.getState?.().activeColor ||
    APP_CONSTANTS.DEFAULT_COLOR_BASE ||
    DEFAULT_TARGET_COLORS[0];

  isHexToFilterInitialized = true;
  const copyTooltipDefaultText =
    elements.copyTooltip?.textContent ?? "Copiar CSS a portapapeles";

  let autoSolveTimeoutId: number | null = null;
  let copyFeedbackTimeoutId: number | null = null;
  let currentResultColorCss = "";

  function normalizeCssColor(value: string) {
    const normalizedInputValue = normalizeHexInputValue(value);
    if (!normalizedInputValue) {
      return null;
    }

    const parsedColor = AppColorUtils.parseCssColor(normalizedInputValue);
    if (!parsedColor) {
      return null;
    }

    return {
      hex: parsedColor.hex,
      css: parsedColor.css,
      rgb: parsedColor.rgb,
      inputValue: parsedColor.inputValue,
    };
  }

  function clearValidationState() {
    elements.textInput.classList.remove("is-invalid");
    elements.feedback.textContent = "";
  }

  function showInvalidColorMessage() {
    elements.textInput.classList.add("is-invalid");
    elements.feedback.textContent =
      "No se ha detectado un color valido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.";
  }

  function applyTargetColor(
    color: { hex: string; css: string },
    options: { publish?: boolean; source?: string } = {}
  ) {
    elements.swatchFill.style.backgroundColor = color.css;
    elements.colorPicker.value = color.hex;

    if (options.publish !== false) {
      AppSharedColors.setActiveColor(color.hex, {
        source: options.source || "hex-to-filter",
      });
    }
  }

  function getReadableTooltipTextToken(colorCss: string) {
    const normalizedColor = normalizeCssColor(colorCss);
    if (!normalizedColor) {
      return "var(--on-accent)";
    }

    const readableTextColor = AppColorUtils.getReadableTextColor(normalizedColor.hex);
    return readableTextColor === "#000000" ? "var(--primary)" : "var(--on-accent)";
  }

  function setCopyFeedback() {
    if (!elements.copyTooltip) {
      return;
    }

    const feedbackBg =
      currentResultColorCss ||
      elements.filterPreviewPixel.style.backgroundColor ||
      "var(--accent)";
    const feedbackTextColor = getReadableTooltipTextToken(feedbackBg);

    elements.copyTooltip.style.setProperty("--tooltip-feedback-bg", feedbackBg);
    elements.copyTooltip.style.setProperty("--tooltip-feedback-fg", feedbackTextColor);
    elements.copyTooltip.textContent = "¡Copiado!";
    elements.copyTooltip.classList.add("is-copied-feedback");
    elements.copyButton.classList.add("show-feedback");
    if (copyFeedbackTimeoutId) {
      window.clearTimeout(copyFeedbackTimeoutId);
    }
    copyFeedbackTimeoutId = window.setTimeout(() => {
      if (!elements.copyTooltip) {
        return;
      }

      elements.copyTooltip.textContent = copyTooltipDefaultText;
      elements.copyTooltip.classList.remove("is-copied-feedback");
      elements.copyButton.classList.remove("show-feedback");
      elements.copyTooltip.style.removeProperty("--tooltip-feedback-bg");
      elements.copyTooltip.style.removeProperty("--tooltip-feedback-fg");
    }, 1400);
  }

  function updateResult(result: ReturnType<Solver["solve"]>) {
    currentResultColorCss = result.colorCss;
    elements.filterCodeOutput.textContent = result.css;
    elements.lossDetail.textContent =
      `Loss: ${result.loss.toFixed(1)}. ${getLossMessage(result.loss)}`;
    elements.filterPreviewPixel.style.backgroundColor = result.colorCss;
    elements.filterPreviewImage.style.filter = result.filterValue;
  }

  function computeBestFilter(
    options: {
      normalizedColor?: {
        hex: string;
        css: string;
        rgb: [number, number, number];
        inputValue: string;
      };
      publish?: boolean;
      source?: string;
    } = {}
  ) {
    const normalizedColor =
      options.normalizedColor || normalizeCssColor(elements.textInput.value);
    if (!normalizedColor) {
      showInvalidColorMessage();
      return null;
    }

    if (elements.textInput.value !== normalizedColor.inputValue) {
      elements.textInput.value = normalizedColor.inputValue;
    }

    clearValidationState();
    applyTargetColor(normalizedColor, options);

    const targetColor = new Color(
      normalizedColor.rgb[0],
      normalizedColor.rgb[1],
      normalizedColor.rgb[2]
    );
    const solver = new Solver(targetColor);
    const result = solver.solve();
    updateResult(result);
    return result;
  }

  function setTargetColor(
    nextColorValue: string,
    options: { publish?: boolean; source?: string } = {}
  ) {
    const normalizedColor = normalizeCssColor(nextColorValue);
    if (!normalizedColor) {
      return false;
    }

    elements.textInput.value = normalizedColor.inputValue;
    return !!computeBestFilter({
      normalizedColor,
      publish: options.publish,
      source: options.source,
    });
  }

  function scheduleAutoSolve() {
    if (autoSolveTimeoutId) {
      window.clearTimeout(autoSolveTimeoutId);
    }

    autoSolveTimeoutId = window.setTimeout(() => {
      const normalizedColor = normalizeCssColor(elements.textInput.value);
      if (!normalizedColor) {
        return;
      }

      computeBestFilter({ normalizedColor });
    }, 220);
  }

  applyExternalTargetColor = setTargetColor;

  elements.textInput.addEventListener("input", () => {
    const normalizedColor = normalizeCssColor(elements.textInput.value);
    if (!normalizedColor) {
      return;
    }

    if (elements.textInput.value !== normalizedColor.inputValue) {
      elements.textInput.value = normalizedColor.inputValue;
    }

    clearValidationState();
    applyTargetColor(normalizedColor, {
      publish: false,
    });
    scheduleAutoSolve();
  });

  elements.textInput.addEventListener("blur", () => {
    const normalizedInputValue = normalizeHexInputValue(elements.textInput.value);
    if (normalizedInputValue && elements.textInput.value !== normalizedInputValue) {
      elements.textInput.value = normalizedInputValue;
    }
  });

  elements.textInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      computeBestFilter();
    }
  });

  elements.swatchButton.addEventListener("click", () => {
    if (typeof elements.colorPicker.showPicker === "function") {
      elements.colorPicker.showPicker();
      return;
    }

    elements.colorPicker.click();
  });

  elements.colorPicker.addEventListener("input", () => {
    const nextColorValue = elements.colorPicker.value.toUpperCase();
    setTargetColor(nextColorValue, {
      source: "hex-to-filter",
    });
  });

  elements.copyButton.addEventListener("click", async () => {
    try {
      await AppClipboard.writeText(elements.filterCodeOutput.textContent?.trim() || "");
      setCopyFeedback();
    } catch (error) {
      // Ignore clipboard errors to avoid disrupting the workflow.
    }
  });

  elements.textInput.value = DEFAULT_TARGET_COLOR;
  elements.colorPicker.value = DEFAULT_TARGET_COLOR;

  const initialColor =
    normalizeCssColor(elements.textInput.value) || normalizeCssColor(DEFAULT_TARGET_COLOR);
  if (initialColor) {
    computeBestFilter({
      normalizedColor: initialColor,
      publish: false,
    });
  }

  AppSharedColors.subscribe?.((detail: any = {}) => {
    const { type, state, metadata } = detail;

    if (type !== "activeColor" || !state?.activeColor) {
      return;
    }

    if (metadata?.source === "hex-to-filter") {
      return;
    }

    setTargetColor(String(state.activeColor), {
      publish: false,
    });
  });
}

export function registerHexToFilterApp() {
  const hexToFilterApp = {
    initialize: initializeHexToFilterApp,
    setTargetColor(nextColorValue: string) {
      if (!isHexToFilterInitialized) {
        initializeHexToFilterApp();
      }

      return applyExternalTargetColor(nextColorValue, {
        source: "hex-to-filter",
      });
    },
  };

  window.HexToFilterApp = hexToFilterApp;
  AppRegistry.register("hex-to-filter", hexToFilterApp);
  return hexToFilterApp;
}

export default registerHexToFilterApp;
