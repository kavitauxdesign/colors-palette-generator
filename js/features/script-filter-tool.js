// HEX to Filter UI foundation
(function () {
  const root = document.getElementById("hex_to_code");
  if (!root) {
    return;
  }

  const textInput = root.querySelector(".target");
  const calculateButton = root.querySelector(".execute");
  const swatchButton = root.querySelector(".target-color-swatch");
  const swatchFill = root.querySelector(".target-color-swatch-fill");
  const colorPicker = root.querySelector(".filter-target-picker");
  const feedback = root.querySelector(".filter-tool-feedback");
  const realPixel = root.querySelector(".realPixel");

  if (!textInput || !calculateButton || !swatchButton || !swatchFill || !colorPicker || !feedback) {
    return;
  }

  const parserElement = document.createElement("div");
  parserElement.style.position = "absolute";
  parserElement.style.opacity = "0";
  parserElement.style.pointerEvents = "none";
  parserElement.style.inset = "-9999px auto auto -9999px";
  document.body.appendChild(parserElement);

  function rgbStringToHex(rgbString) {
    const match = rgbString.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const channels = match[1]
      .split(",")
      .slice(0, 3)
      .map((value) => Number.parseFloat(value.trim()));

    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
      return null;
    }

    return `#${channels
      .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  }

  function normalizeCssColor(value) {
    const rawValue = String(value ?? "").trim();
    if (!rawValue) {
      return null;
    }

    parserElement.style.color = "";
    parserElement.style.color = rawValue;

    if (!parserElement.style.color) {
      return null;
    }

    const computedColor = window.getComputedStyle(parserElement).color;
    const hexColor = rgbStringToHex(computedColor);
    if (!hexColor) {
      return null;
    }

    return {
      hex: hexColor,
      css: computedColor,
    };
  }

  function applyTargetColor(color) {
    swatchFill.style.backgroundColor = color.css;
    colorPicker.value = color.hex;

    if (realPixel) {
      realPixel.style.backgroundColor = color.css;
    }
  }

  function clearValidationState() {
    textInput.classList.remove("is-invalid");
    feedback.textContent = "";
  }

  function syncFromTextInput() {
    const normalizedColor = normalizeCssColor(textInput.value);
    if (!normalizedColor) {
      return null;
    }

    applyTargetColor(normalizedColor);
    clearValidationState();
    return normalizedColor;
  }

  textInput.addEventListener("input", () => {
    syncFromTextInput();
  });

  swatchButton.addEventListener("click", () => {
    if (typeof colorPicker.showPicker === "function") {
      colorPicker.showPicker();
      return;
    }

    colorPicker.click();
  });

  colorPicker.addEventListener("input", () => {
    textInput.value = colorPicker.value.toUpperCase();
    syncFromTextInput();
  });

  calculateButton.addEventListener("click", () => {
    const normalizedColor = syncFromTextInput();
    if (normalizedColor) {
      return;
    }

    textInput.classList.add("is-invalid");
    feedback.textContent = "No se ha detectado un color valido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.";
  });

  const initialColor = normalizeCssColor(textInput.value) || normalizeCssColor("#00A4D6");
  if (initialColor) {
    applyTargetColor(initialColor);
  }
})();
