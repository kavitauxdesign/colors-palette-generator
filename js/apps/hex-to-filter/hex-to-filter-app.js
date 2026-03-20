// HEX to Filter mini-app controller.
(function initializeHexToFilterModule() {
  const hexToFilterCore = window.HexToFilterCore || {};
  const Color = hexToFilterCore.Color;
  const Solver = hexToFilterCore.Solver;
  const rgbStringToHex = hexToFilterCore.rgbStringToHex;
  const normalizeHexInputValue = hexToFilterCore.normalizeHexInputValue;
  const getLossMessage = hexToFilterCore.getLossMessage;
  const DEFAULT_TARGET_COLORS = [
    "#9EBB89",
    "#6EC5CE",
    "#E7AA6E",
    "#B1BDCD",
    "#6BBDB6",
    "#B88965",
    "#DCC9B3",
    "#A8AA98",
    "#6B8F71",
    "#29A9CA",
    "#B86346",
    "#5BAB9C",
  ];

  let isHexToFilterInitialized = false;
  let applyExternalTargetColor = () => false;

  function createParserElement() {
    const parserElement = document.createElement("div");
    parserElement.style.position = "absolute";
    parserElement.style.opacity = "0";
    parserElement.style.pointerEvents = "none";
    parserElement.style.inset = "-9999px auto auto -9999px";
    document.body.appendChild(parserElement);
    return parserElement;
  }

  function resolveHexToFilterElements(root) {
    const elements = {
      textInput: root.querySelector(".target"),
      copyButton: root.querySelector(".filter-copy-btn"),
      swatchButton: root.querySelector(".target-color-swatch"),
      swatchFill: root.querySelector(".target-color-swatch-fill"),
      colorPicker: root.querySelector(".filter-target-picker"),
      feedback: root.querySelector(".filter-tool-feedback"),
      filterCodeOutput: root.querySelector(".filter-code-output"),
      lossDetail: root.querySelector(".lossDetail"),
      filterPreviewPixel: root.querySelector(".filterPixel"),
      filterPreviewImage: root.querySelector(".filter-source-icon-after"),
    };

    elements.copyTooltip = elements.copyButton?.querySelector(".tooltip") ?? null;

    if (
      !elements.textInput ||
      !elements.swatchButton ||
      !elements.swatchFill ||
      !elements.colorPicker ||
      !elements.feedback ||
      !elements.filterCodeOutput ||
      !elements.lossDetail ||
      !elements.filterPreviewPixel ||
      !elements.filterPreviewImage
    ) {
      return null;
    }

    return elements;
  }

  function pickRandomDefaultTargetColor() {
    const randomIndex = Math.floor(Math.random() * DEFAULT_TARGET_COLORS.length);
    return DEFAULT_TARGET_COLORS[randomIndex];
  }

  async function fallbackCopyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
  }

  function initializeHexToFilterApp() {
    if (isHexToFilterInitialized) {
      return;
    }

    if (
      typeof Color !== "function" ||
      typeof Solver !== "function" ||
      typeof rgbStringToHex !== "function" ||
      typeof normalizeHexInputValue !== "function" ||
      typeof getLossMessage !== "function"
    ) {
      console.error("HEX to Filter initialization failed: core helpers are missing.");
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

    isHexToFilterInitialized = true;

    const parserElement = createParserElement();
    const copyToClipboard = window.AppClipboard?.writeText || fallbackCopyText;
    const copyTooltipDefaultText =
      elements.copyTooltip?.textContent ?? "Copiar CSS a portapapeles";

    let autoSolveTimeoutId = null;
    let copyFeedbackTimeoutId = null;
    let currentResultColorCss = "";

    function normalizeCssColor(value) {
      const normalizedInputValue = normalizeHexInputValue(value);
      if (!normalizedInputValue) {
        return null;
      }

      parserElement.style.color = "";
      parserElement.style.color = normalizedInputValue;

      if (!parserElement.style.color) {
        return null;
      }

      const computedColor = window.getComputedStyle(parserElement).color;
      const hexColor = rgbStringToHex(computedColor);
      if (!hexColor) {
        return null;
      }

      const rgbMatch = computedColor.match(/rgba?\(([^)]+)\)/i);
      if (!rgbMatch) {
        return null;
      }

      const rgbChannels = rgbMatch[1]
        .split(",")
        .slice(0, 3)
        .map((channel) => Number.parseFloat(channel.trim()));

      if (
        rgbChannels.length !== 3 ||
        rgbChannels.some((channel) => !Number.isFinite(channel))
      ) {
        return null;
      }

      return {
        hex: hexColor,
        css: computedColor,
        rgb: rgbChannels,
        inputValue: normalizedInputValue,
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

    function applyTargetColor(color, options = {}) {
      elements.swatchFill.style.backgroundColor = color.css;
      elements.colorPicker.value = color.hex;

      if (options.publish !== false) {
        window.AppSharedColors?.setActiveColor(color.hex, {
          source: options.source || "hex-to-filter",
        });
      }
    }

    function getReadableTooltipTextToken(colorCss) {
      const normalizedColor = normalizeCssColor(colorCss);
      if (!normalizedColor) {
        return "var(--on-accent)";
      }

      const [r, g, b] = normalizedColor.rgb;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 140 ? "var(--primary)" : "var(--on-accent)";
    }

    function setCopyFeedback() {
      if (!elements.copyButton || !elements.copyTooltip) {
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
      clearTimeout(copyFeedbackTimeoutId);
      copyFeedbackTimeoutId = window.setTimeout(() => {
        elements.copyTooltip.textContent = copyTooltipDefaultText;
        elements.copyTooltip.classList.remove("is-copied-feedback");
        elements.copyButton.classList.remove("show-feedback");
        elements.copyTooltip.style.removeProperty("--tooltip-feedback-bg");
        elements.copyTooltip.style.removeProperty("--tooltip-feedback-fg");
      }, 1400);
    }

    function updateResult(result) {
      currentResultColorCss = result.colorCss;
      elements.filterCodeOutput.textContent = result.css;
      elements.lossDetail.textContent =
        `Loss: ${result.loss.toFixed(1)}. ${getLossMessage(result.loss)}`;
      elements.filterPreviewPixel.style.backgroundColor = result.colorCss;
      elements.filterPreviewImage.style.filter = result.filterValue;
    }

    function computeBestFilter(options = {}) {
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
        normalizedColor.rgb[2],
      );
      const solver = new Solver(targetColor);
      const result = solver.solve();
      updateResult(result);
      return result;
    }

    function setTargetColor(nextColorValue, options = {}) {
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
      window.clearTimeout(autoSolveTimeoutId);
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

    elements.copyButton?.addEventListener("click", async () => {
      try {
        await copyToClipboard(elements.filterCodeOutput.textContent.trim());
        setCopyFeedback();
      } catch (error) {
        // Ignore clipboard errors silently to avoid disrupting the workflow.
      }
    });

    const initialTargetColor = pickRandomDefaultTargetColor();
    elements.textInput.value = initialTargetColor;
    elements.colorPicker.value = initialTargetColor;

    const initialColor =
      normalizeCssColor(elements.textInput.value) || normalizeCssColor("#00A4D6");
    if (initialColor) {
      computeBestFilter({
        normalizedColor: initialColor,
        publish: false,
      });
    }

    window.AppSharedColors?.subscribe?.(({ type, state, metadata }) => {
      if (type !== "activeColor" || !state?.activeColor) {
        return;
      }

      if (metadata?.source === "hex-to-filter") {
        return;
      }

      setTargetColor(state.activeColor, {
        publish: false,
      });
    });
  }

  const hexToFilterApp = {
    initialize: initializeHexToFilterApp,
    setTargetColor(nextColorValue) {
      if (!isHexToFilterInitialized) {
        initializeHexToFilterApp();
      }

      return applyExternalTargetColor(nextColorValue, {
        source: "hex-to-filter",
      });
    },
  };

  window.HexToFilterApp = hexToFilterApp;
  window.AppRegistry?.register("hex-to-filter", hexToFilterApp);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeHexToFilterApp, { once: true });
  } else {
    initializeHexToFilterApp();
  }
})();
