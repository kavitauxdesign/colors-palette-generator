// Palette generator color mode: color parsing, harmony rules and generation.

const COLOR_MODE_PALETTE_SIZES = Object.freeze({
  automatic: [2, 3, 4, 6, 9],
  monochromatic: [6, 9, 12],
  complementary: [2, 6],
  analogous: [3],
  triad: [3],
  tetrad: [4],
});
const MONOCHROMATIC_GENERATION_MODES = new Set(["automatic", "shades", "tints"]);
const ANALOGOUS_SEPARATION_DEGREES = Object.freeze({
  soft: 15,
  medium: 30,
  intense: 60,
});
const COMPLEMENTARY_VARIANT_PROFILES = Object.freeze([
  { complementLightnessOffset: 0, complementChromaScale: 1, tintStrength: 0.66, shadeStrength: 0.58 },
  { complementLightnessOffset: 0.02, complementChromaScale: 0.94, tintStrength: 0.72, shadeStrength: 0.54 },
  { complementLightnessOffset: -0.02, complementChromaScale: 1.06, tintStrength: 0.62, shadeStrength: 0.62 },
]);
const TRIAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [120, -120], lightnessBiases: [-0.014, 0.014], chromaScales: [0.98, 0.92] },
  { offsets: [114, -114], lightnessBiases: [-0.01, 0.01], chromaScales: [0.94, 0.96] },
  { offsets: [126, -126], lightnessBiases: [-0.018, 0.018], chromaScales: [1, 0.9] },
]);
const TETRAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [90, 180, 270], lightnessBiases: [-0.012, 0, -0.006], chromaScales: [0.92, 0.88, 0.94] },
  { offsets: [84, 180, 276], lightnessBiases: [-0.008, 0.004, -0.012], chromaScales: [0.94, 0.9, 0.9] },
  { offsets: [96, 180, 264], lightnessBiases: [-0.016, -0.002, -0.004], chromaScales: [0.9, 0.86, 0.96] },
]);

let colorModeParserElement = null;
let colorPaletteVariantIndex = 0;

function normalizeMonochromaticGenerationMode(mode) {
  return MONOCHROMATIC_GENERATION_MODES.has(mode)
    ? mode
    : DEFAULT_MONOCHROMATIC_GENERATION_MODE;
}

function normalizeAnalogousSeparationMode(mode) {
  return Object.prototype.hasOwnProperty.call(ANALOGOUS_SEPARATION_DEGREES, mode)
    ? mode
    : DEFAULT_ANALOGOUS_SEPARATION_MODE;
}

function shouldShowMonochromaticModeControl() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "monochromatic";
}

function shouldShowAnalogousSeparationControl() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "analogous";
}

function syncMonochromaticModeControlState() {
  const resolvedMode = normalizeMonochromaticGenerationMode(
    selectedMonochromaticGenerationMode
  );
  selectedMonochromaticGenerationMode = resolvedMode;

  if (monochromaticModeSelect) {
    monochromaticModeSelect.value = resolvedMode;
  }

  if (monochromaticModeControl) {
    monochromaticModeControl.hidden = !shouldShowMonochromaticModeControl();
  }
}

function syncAnalogousSeparationControlState() {
  const resolvedMode = normalizeAnalogousSeparationMode(
    selectedAnalogousSeparationMode
  );
  selectedAnalogousSeparationMode = resolvedMode;

  if (analogousSeparationSelect) {
    analogousSeparationSelect.value = resolvedMode;
  }

  if (analogousSeparationControl) {
    analogousSeparationControl.hidden = !shouldShowAnalogousSeparationControl();
  }
}

function ensureColorModeParserElement() {
  if (colorModeParserElement) {
    return colorModeParserElement;
  }

  const parserElement = document.createElement("div");
  parserElement.style.position = "absolute";
  parserElement.style.opacity = "0";
  parserElement.style.pointerEvents = "none";
  parserElement.style.inset = "-9999px auto auto -9999px";
  document.body.appendChild(parserElement);
  colorModeParserElement = parserElement;
  return colorModeParserElement;
}

function normalizePaletteBaseColorInput(value) {
  return String(value ?? "").trim();
}

function normalizePaletteBaseCssColor(value) {
  if (typeof window.AppColorUtils?.parseCssColor === "function") {
    return window.AppColorUtils.parseCssColor(value);
  }

  const normalizedInputValue = normalizePaletteBaseColorInput(value);
  if (!normalizedInputValue) {
    return null;
  }

  const parserElement = ensureColorModeParserElement();
  parserElement.style.color = "";
  parserElement.style.color = normalizedInputValue;

  if (!parserElement.style.color) {
    return null;
  }

  const computedColor = window.getComputedStyle(parserElement).color;
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

  const hex = controlsNormalizeHexColor(
    `#${rgbChannels
      .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
      .join("")}`
  );

  return {
    inputValue: normalizedInputValue,
    css: computedColor,
    hex,
    rgb: rgbChannels,
    hsl: controlsHexToHsl(hex),
    oklch: window.AppColorUtils?.hexToOklch?.(hex) || null,
  };
}

function setPaletteBaseColorFeedback(message = "", isInvalid = false) {
  if (paletteColorInputFeedback) {
    paletteColorInputFeedback.textContent = message;
  }

  if (paletteColorTextInput) {
    paletteColorTextInput.classList.toggle("is-invalid", !!isInvalid);
  }
}

function applyPaletteBaseColorInputState(parsedColor, options = {}) {
  if (!parsedColor) {
    setPaletteBaseColorFeedback(
      "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
      true
    );
    return false;
  }

  selectedPaletteBaseColor = parsedColor.hex;

  if (paletteColorTextInput && options.syncTextInput !== false) {
    paletteColorTextInput.value = parsedColor.inputValue;
  }

  if (paletteColorPicker) {
    paletteColorPicker.value = parsedColor.hex;
  }

  if (paletteColorSwatchFill) {
    paletteColorSwatchFill.style.backgroundColor = parsedColor.css;
  }

  setPaletteBaseColorFeedback("");
  syncSelectedPaletteBaseColorCard();
  return true;
}

function syncSelectedPaletteBaseColorCard() {
  if (
    paletteBaseMode !== "color" ||
    currentPalette.length === 0 ||
    typeof getColorCards !== "function" ||
    typeof setCardColor !== "function" ||
    typeof syncCurrentPaletteFromDom !== "function"
  ) {
    return;
  }

  const cards = Array.from(getColorCards());
  const baseCardIndex =
    typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(cards.length)
      : 0;
  const baseCard = cards[baseCardIndex];
  if (!baseCard) {
    return;
  }

  setCardColor(baseCard, selectedPaletteBaseColor);
  if (typeof setCardPinnedState === "function") {
    setCardPinnedState(baseCard, true);
  }
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  syncCurrentPaletteFromDom();
}

function getPaletteBaseColorSnapshot() {
  return normalizePaletteBaseCssColor(paletteColorTextInput?.value || selectedPaletteBaseColor);
}

function hasValidSelectedPaletteBaseColor() {
  return !!getPaletteBaseColorSnapshot();
}

function getAllowedPaletteSizesForType(type) {
  return COLOR_MODE_PALETTE_SIZES[type] || COLOR_MODE_PALETTE_SIZES.automatic;
}

function getDefaultPaletteSizeForType(type) {
  if (type === "monochromatic") {
    return 9;
  }

  const allowedSizes = getAllowedPaletteSizesForType(type);
  return allowedSizes[0];
}

function resolveAutomaticColorPaletteType(targetCount = paletteSize) {
  if (targetCount === 2) {
    return "complementary";
  }

  if (targetCount === 3) {
    return "triad";
  }

  if (targetCount === 4) {
    return "tetrad";
  }

  if (targetCount === 6) {
    return "analogous";
  }

  const baseColor = getPaletteBaseColorSnapshot();
  const referenceSaturation = Number.isFinite(baseColor?.hsl?.s)
    ? baseColor.hsl.s
    : getCurrentSaturationValue();

  return referenceSaturation <= 42 ? "monochromatic" : "analogous";
}

function getEffectiveColorPaletteType(targetCount = paletteSize) {
  if (selectedColorPaletteType !== "automatic") {
    return selectedColorPaletteType;
  }

  return resolveAutomaticColorPaletteType(targetCount);
}

function isColorModeMonochromaticScaleActive(targetCount = paletteSize) {
  return (
    paletteBaseMode === "color" &&
    getEffectiveColorPaletteType(targetCount) === "monochromatic"
  );
}

function getAllowedPaletteSizesForCurrentMode() {
  if (paletteBaseMode !== "color") {
    return [3, 6, 9];
  }

  return getAllowedPaletteSizesForType(selectedColorPaletteType);
}

function getNearestAllowedPaletteSize(nextSize, allowedSizes = getAllowedPaletteSizesForCurrentMode()) {
  if (allowedSizes.includes(nextSize)) {
    return nextSize;
  }

  return [...allowedSizes]
    .sort((left, right) => {
      const leftDistance = Math.abs(left - nextSize);
      const rightDistance = Math.abs(right - nextSize);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left - right;
    })[0];
}

function resolvePaletteSizeForType(type, nextSize) {
  const allowedSizes = getAllowedPaletteSizesForType(type);

  if (allowedSizes.includes(nextSize)) {
    return nextSize;
  }

  const defaultSize = getDefaultPaletteSizeForType(type);
  if (allowedSizes.includes(defaultSize)) {
    return defaultSize;
  }

  return getNearestAllowedPaletteSize(nextSize, allowedSizes);
}

function syncPaletteTypeOptionStates() {
  if (!(paletteTypeOptions instanceof HTMLSelectElement)) {
    return;
  }

  paletteTypeOptions.value = selectedColorPaletteType;

  const resolvedType = getEffectiveColorPaletteType();
  resolvedAutomaticColorPaletteType = resolvedType;

  if (paletteTypeResolvedLabel) {
    const shouldShowResolvedType = selectedColorPaletteType === "automatic";
    paletteTypeResolvedLabel.hidden = !shouldShowResolvedType;
    paletteTypeResolvedLabel.textContent = shouldShowResolvedType
      ? `Resultado automático: ${getPaletteTypeDisplayLabel(resolvedType)}`
      : "";
  }
}

function getPaletteTypeDisplayLabel(type) {
  switch (type) {
    case "monochromatic":
      return "Monocromática";
    case "complementary":
      return "Complementaria";
    case "analogous":
      return "Análoga";
    case "triad":
      return "Triada";
    case "tetrad":
      return "Tétrada";
    default:
      return "Automática";
  }
}

function syncColorModeBaseControls() {
  const parsedColor = normalizePaletteBaseCssColor(selectedPaletteBaseColor);
  if (parsedColor) {
    applyPaletteBaseColorInputState(parsedColor, {
      syncTextInput: true,
    });
  }

  syncPaletteTypeOptionStates();
  syncMonochromaticModeControlState();
  syncAnalogousSeparationControlState();
}

function setSelectedColorPaletteType(nextType, options = {}) {
  selectedColorPaletteType = COLOR_MODE_PALETTE_SIZES[nextType]
    ? nextType
    : DEFAULT_COLOR_PALETTE_TYPE;
  syncPaletteTypeOptionStates();
  syncMonochromaticModeControlState();
  syncAnalogousSeparationControlState();

  if (typeof clearUnavailablePinnedCards === "function") {
    clearUnavailablePinnedCards();
  }

  const allowedSizes = getAllowedPaletteSizesForCurrentMode();
  const nextSize = selectedColorPaletteType === "monochromatic"
    ? resolvePaletteSizeForType(selectedColorPaletteType, paletteSize)
    : getNearestAllowedPaletteSize(paletteSize, allowedSizes);
  const didSizeChange = nextSize !== paletteSize;
  setPaletteSize(nextSize);

  if (typeof updatePaletteSizeButtonsAvailability === "function") {
    updatePaletteSizeButtonsAvailability();
  }

  if (typeof updatePaletteModeActionVisibility === "function") {
    updatePaletteModeActionVisibility();
  }

  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }

  if (options.generate !== false && paletteBaseMode === "color") {
    if (didSizeChange) {
      void generatePalette();
      return;
    }

    if (currentPalette.length > 0) {
      void generatePalette();
    }
  }
}

function setSelectedPaletteBaseColor(nextValue, options = {}) {
  const parsedColor = normalizePaletteBaseCssColor(nextValue);
  const wasApplied = applyPaletteBaseColorInputState(parsedColor, {
    syncTextInput: options.syncTextInput !== false,
  });

  if (!wasApplied) {
    if (typeof updatePaletteModeActionVisibility === "function") {
      updatePaletteModeActionVisibility();
    }
    if (typeof updatePaletteActionButtonsAvailability === "function") {
      updatePaletteActionButtonsAvailability();
    }
    return false;
  }

  if (options.publish !== false) {
    window.AppSharedColors?.setActiveColor(selectedPaletteBaseColor, {
      source: "palette-generator",
      action: "color-base-update",
    });
  }

  if (options.generate !== false && paletteBaseMode === "color" && currentPalette.length > 0) {
    void generatePalette();
  }

  if (typeof updatePaletteModeActionVisibility === "function") {
    updatePaletteModeActionVisibility();
  }

  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }

  return true;
}

function setSelectedMonochromaticGenerationMode(nextMode, options = {}) {
  selectedMonochromaticGenerationMode = normalizeMonochromaticGenerationMode(nextMode);
  syncMonochromaticModeControlState();

  if (
    options.generate !== false &&
    paletteBaseMode === "color" &&
    selectedColorPaletteType === "monochromatic" &&
    currentPalette.length > 0
  ) {
    void generatePalette();
  }
}

function setSelectedAnalogousSeparationMode(nextMode, options = {}) {
  selectedAnalogousSeparationMode = normalizeAnalogousSeparationMode(nextMode);
  syncAnalogousSeparationControlState();

  if (
    options.generate !== false &&
    paletteBaseMode === "color" &&
    selectedColorPaletteType === "analogous" &&
    currentPalette.length > 0
  ) {
    void generatePalette();
  }
}

function getColorModeAnchorOffsets(type, targetCount, variantIndex) {
  const direction = variantIndex % 2 === 0 ? 1 : -1;

  switch (type) {
    case "monochromatic":
      return [0];
    case "complementary":
      return [0, 180];
    case "analogous":
      if (targetCount <= 2) {
        return [0, 26 * direction];
      }
      return [0, 22 * direction, -22 * direction, 42 * direction, -42 * direction];
    case "triad":
      return [0, 120, 240];
    case "tetrad":
      return [0, 90, 180, 270];
    default:
      return [0];
  }
}

function getColorModeVariantOffsets(index, variantIndex) {
  const lightnessOffsets = [0, 14, -12, 22, -20, 8, -8, 28, -26];
  const saturationOffsets = [0, -10, 12, -16, 18, -6, 6, -14, 10];
  const rotation = Math.abs(variantIndex) % lightnessOffsets.length;
  const pointer = (index + rotation) % lightnessOffsets.length;

  return {
    lightnessOffset: lightnessOffsets[pointer],
    saturationOffset: saturationOffsets[pointer],
  };
}

function getColorModeSaturationInfluence(saturation, options = {}) {
  const ratio = clampControlValue((Number(saturation) || 0) / 100, 0, 1);
  const knee = Number.isFinite(options.knee) ? options.knee : 0.2;
  const protectedFloor = Number.isFinite(options.protectedFloor)
    ? options.protectedFloor
    : 0.2;
  const upperGamma = Number.isFinite(options.upperGamma) ? options.upperGamma : 0.78;
  const lowerGamma = Number.isFinite(options.lowerGamma) ? options.lowerGamma : 1.85;

  if (ratio <= 0) {
    return 0;
  }

  if (ratio >= 1) {
    return 1;
  }

  if (ratio > knee) {
    const normalizedUpperRatio = (ratio - knee) / (1 - knee);
    return protectedFloor + (1 - protectedFloor) * (normalizedUpperRatio ** upperGamma);
  }

  return protectedFloor * ((ratio / knee) ** lowerGamma);
}

function getColorModeTargetChroma(saturation, options = {}) {
  const minimumChroma = Number.isFinite(options.minChroma) ? options.minChroma : 0.0015;
  const maximumChroma = Number.isFinite(options.maxChroma) ? options.maxChroma : 0.24;
  const saturationInfluence = getColorModeSaturationInfluence(saturation, options);

  return minimumChroma + (maximumChroma - minimumChroma) * saturationInfluence;
}

function createColorModeCandidateColor(baseColor, hueOffset, index, variantIndex, settings) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const targetSaturation = Number.isFinite(settings?.saturation)
    ? settings.saturation
    : getCurrentSaturationValue();
  const targetBrightness = Number.isFinite(settings?.brightness)
    ? settings.brightness
    : getCurrentBrightnessValue();
  const { lightnessOffset, saturationOffset } = getColorModeVariantOffsets(index, variantIndex);
  const centerLightness = mapBrightnessValueToOklchLightness(targetBrightness, {
    minLightness: 0.2,
    maxLightness: 0.92,
  });
  const targetChroma = getColorModeTargetChroma(targetSaturation, {
    minChroma: 0.0015,
    maxChroma: 0.24,
  });
  const chroma = clampControlValue(
    blendControlValue(Math.max(baseOklch.chroma, 0.012), targetChroma, 0.78) +
      saturationOffset * 0.0014,
    0.001,
    0.26
  );
  const lightness = clampControlValue(
    blendControlValue(baseOklch.lightness, centerLightness, 0.72) + lightnessOffset / 100,
    0.16,
    0.94
  );
  const hue = baseOklch.hue + hueOffset;

  return createColorModeOklchHex(lightness, chroma, hue);
}

function getMonochromaticScalePerceivedLightness(hex) {
  return typeof window.AppColorUtils?.getPerceivedLightness === "function"
    ? window.AppColorUtils.getPerceivedLightness(hex)
    : controlsHexToHsl(hex).l;
}

function resolveAutomaticMonochromaticScaleDirection(baseColor) {
  const baseLightness = Number.isFinite(baseColor?.oklch?.l)
    ? baseColor.oklch.l
    : Number.isFinite(baseColor?.hsl?.l)
      ? baseColor.hsl.l / 100
      : 0.5;
  const perceivedLightness = typeof baseColor?.hex === "string"
    ? getMonochromaticScalePerceivedLightness(baseColor.hex)
    : baseLightness;
  const resolvedLightness = blendControlValue(baseLightness, perceivedLightness, 0.68);

  return resolvedLightness >= 0.72 ? "dark" : "light";
}

function getMonochromaticScaleDirection(baseColor) {
  const mode = normalizeMonochromaticGenerationMode(selectedMonochromaticGenerationMode);

  if (mode === "shades") {
    return "dark";
  }

  if (mode === "tints") {
    return "light";
  }

  return resolveAutomaticMonochromaticScaleDirection(baseColor);
}

function getMonochromaticBaseOklch(baseColor) {
  const color = baseColor?.color || window.AppColorUtils?.createColor?.(baseColor?.hex);
  if (!color) {
    return null;
  }

  const [lightness = 0, chroma = 0, hue = 0] = color.to("oklch").coords || [];
  return {
    lightness: clampControlValue(lightness, 0, 1),
    chroma: clampControlValue(chroma, 0, 0.4),
    hue: Number.isFinite(hue) ? hue : 0,
  };
}

function getMonochromaticScaleTarget(baseColor, settings, direction) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  if (direction === "light") {
    const maximumLightness = clampControlValue(0.992 - (1 - brightnessRatio) * 0.008, 0.965, 0.995);
    const lightnessRoom = Math.max(0.2, maximumLightness - baseOklch.lightness);
    const targetLightness = clampControlValue(
      baseOklch.lightness + lightnessRoom * (0.86 + brightnessRatio * 0.1),
      Math.min(maximumLightness, baseOklch.lightness + 0.22),
      maximumLightness
    );
    const chromaScale = 0.05 + saturationInfluence * 0.22;

    return {
      lightness: targetLightness,
      chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.001, 0.085),
      hue: baseOklch.hue,
    };
  }

  const minimumLightness = clampControlValue(0.1 + (1 - brightnessRatio) * 0.035, 0.085, 0.16);
  const darknessRoom = Math.max(0.16, baseOklch.lightness - minimumLightness);
  const targetLightness = clampControlValue(
    baseOklch.lightness - darknessRoom * (0.72 + (1 - brightnessRatio) * 0.08),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.18)
  );
  const chromaScale = 0.22 + saturationInfluence * 0.64;

  return {
    lightness: targetLightness,
    chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.003, 0.22),
    hue: baseOklch.hue,
  };
}

function createMonochromaticScaleTargetHex(baseColor, settings, direction) {
  const target = getMonochromaticScaleTarget(baseColor, settings, direction);
  if (!target) {
    return null;
  }

  return window.AppColorUtils?.oklchToHex?.(
    target.lightness,
    target.chroma,
    target.hue,
    {
      minLightness: 0.085,
      maxLightness: 0.995,
      maxChroma: 0.28,
    }
  ) || null;
}

function createColorModeOklchHex(lightness, chroma, hue) {
  return window.AppColorUtils?.oklchToHex?.(
    clampControlValue(lightness, 0, 1),
    clampControlValue(chroma, 0, 0.4),
    hue,
    {
      minLightness: 0.08,
      maxLightness: 0.97,
      maxChroma: 0.28,
    }
  ) || null;
}

function getComplementaryVariantProfile(variantIndex = 0) {
  const profiles = COMPLEMENTARY_VARIANT_PROFILES;
  return profiles[Math.abs(variantIndex) % profiles.length] || profiles[0];
}

function buildComplementaryHueColor(baseColor, settings, variantIndex = 0) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const profile = getComplementaryVariantProfile(variantIndex);
  const lightness = clampControlValue(
    baseOklch.lightness + profile.complementLightnessOffset,
    0.22,
    0.9
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.038) * profile.complementChromaScale,
    0.03,
    0.24
  );

  return createColorModeOklchHex(lightness, chroma, baseOklch.hue + 180);
}

function createComplementaryScaleTargetHex(baseColor, settings, direction) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation, {
    protectedFloor: 0.22,
  });
  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const targetCenterLightness = mapBrightnessValueToOklchLightness(settings.brightness, {
    minLightness: 0.22,
    maxLightness: 0.93,
    gamma: 0.86,
  });

  if (direction === "light") {
    const maximumLightness = clampControlValue(0.94 + brightnessRatio * 0.04, 0.88, 0.985);
    const lightnessRoom = Math.max(0.1, maximumLightness - baseOklch.lightness);
    const lightnessPull = clampControlValue(0.42 + brightnessRatio * 0.34, 0.42, 0.78);
    const targetLightness = clampControlValue(
      blendControlValue(
        baseOklch.lightness + lightnessRoom * lightnessPull,
        Math.max(baseOklch.lightness + 0.07, targetCenterLightness + 0.08),
        0.4
      ),
      Math.min(maximumLightness, baseOklch.lightness + 0.1 + brightnessRatio * 0.08),
      maximumLightness
    );
    const chromaScale = 0.002 + saturationInfluence * 0.86;
    const minimumChroma = 0.0002 + saturationInfluence * 0.0016;
    const maximumChroma = 0.004 + saturationInfluence * 0.094;

    return createColorModeOklchHex(
      targetLightness,
      clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
      baseOklch.hue
    );
  }

  const minimumLightness = clampControlValue(0.3 - brightnessRatio * 0.04, 0.24, 0.32);
  const darknessRoom = Math.max(0.1, baseOklch.lightness - minimumLightness);
  const darknessPull = clampControlValue(0.18 + (1 - brightnessRatio) * 0.2, 0.16, 0.4);
  const targetLightness = clampControlValue(
    blendControlValue(
      baseOklch.lightness - darknessRoom * darknessPull,
      Math.min(baseOklch.lightness - 0.05, targetCenterLightness - 0.08),
      0.28
    ),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.06)
  );
  const chromaScale = 0.004 + saturationInfluence * 0.98;
  const minimumChroma = 0.00025 + saturationInfluence * 0.0018;
  const maximumChroma = 0.005 + saturationInfluence * 0.112;

  return createColorModeOklchHex(
    targetLightness,
    clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
    baseOklch.hue
  );
}

function buildAnalogousRoleColor(baseColor, settings, directionSign, degreeOffset) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const lightnessOffset = directionSign < 0
    ? 0.016 - (1 - brightnessRatio) * 0.006
    : -0.016 + brightnessRatio * 0.006;
  const chromaScale = directionSign < 0
    ? 0.28 + saturationInfluence * 0.82
    : 0.24 + saturationInfluence * 0.86;

  return createColorModeOklchHex(
    clampControlValue(baseOklch.lightness + lightnessOffset, 0.22, 0.9),
    clampControlValue(Math.max(baseOklch.chroma, 0.02) * chromaScale, 0.0015, 0.22),
    baseOklch.hue + degreeOffset * directionSign
  );
}

function buildAnalogousColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const separationMode = normalizeAnalogousSeparationMode(selectedAnalogousSeparationMode);
  const separationDegrees = ANALOGOUS_SEPARATION_DEGREES[separationMode];
  const attemptOffsets = [0, 6, 10, 14];
  let leftHex = null;
  let rightHex = null;

  for (const extraOffset of attemptOffsets) {
    const nextDegrees = separationDegrees + extraOffset;
    const candidateLeft = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      -1,
      nextDegrees
    );
    const candidateRight = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      1,
      nextDegrees
    );

    if (
      candidateLeft &&
      candidateRight &&
      candidateLeft !== baseHex &&
      candidateRight !== baseHex &&
      candidateLeft !== candidateRight &&
      !isDisallowedColor(candidateLeft) &&
      !isDisallowedColor(candidateRight)
    ) {
      leftHex = controlsNormalizeHexColor(candidateLeft);
      rightHex = controlsNormalizeHexColor(candidateRight);
      break;
    }
  }

  if (!leftHex || !rightHex) {
    return [baseHex];
  }

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (targetCount === 2) {
    return [baseHex, rightHex];
  }

  return [leftHex, baseHex, rightHex];
}

function getTriadVariantProfile(variantIndex = 0) {
  return TRIAD_VARIANT_PROFILES[Math.abs(variantIndex) % TRIAD_VARIANT_PROFILES.length] ||
    TRIAD_VARIANT_PROFILES[0];
}

function getTetradVariantProfile(variantIndex = 0) {
  return TETRAD_VARIANT_PROFILES[Math.abs(variantIndex) % TETRAD_VARIANT_PROFILES.length] ||
    TETRAD_VARIANT_PROFILES[0];
}

function buildBalancedHarmonyRoleColor(baseColor, settings, hueOffset, lightnessBias = 0, chromaScale = 1) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessBias = clampControlValue(
    (settings.brightness - DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const balancedLightness = blendControlValue(
    baseOklch.lightness,
    0.56 + brightnessBias * 0.08,
    0.42
  );
  const lightness = clampControlValue(
    balancedLightness + lightnessBias,
    0.34,
    0.76
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.02) * (0.18 + saturationInfluence * 0.92) * chromaScale,
    0.0015,
    0.18
  );

  return createColorModeOklchHex(
    lightness,
    chroma,
    baseOklch.hue + hueOffset
  );
}

function buildTriadColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;
  const variantProfiles = [
    getTriadVariantProfile(variantIndex),
    ...TRIAD_VARIANT_PROFILES.filter((profile) => profile !== getTriadVariantProfile(variantIndex)),
  ];

  for (const profile of variantProfiles) {
    const [leftOffset, rightOffset] = profile.offsets;
    const leftHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      leftOffset,
      profile.lightnessBiases[0],
      profile.chromaScales[0]
    );
    const rightHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      rightOffset,
      profile.lightnessBiases[1],
      profile.chromaScales[1]
    );

    if (
      !leftHex ||
      !rightHex ||
      leftHex === baseHex ||
      rightHex === baseHex ||
      leftHex === rightHex ||
      isDisallowedColor(leftHex) ||
      isDisallowedColor(rightHex)
    ) {
      continue;
    }

    const sideDistance = window.AppColorUtils?.getColorDistance?.(leftHex, rightHex, {
      method: "deltae2000",
    });
    const leftDistanceFromBase = window.AppColorUtils?.getColorDistance?.(leftHex, baseHex, {
      method: "deltae2000",
    });
    const rightDistanceFromBase = window.AppColorUtils?.getColorDistance?.(rightHex, baseHex, {
      method: "deltae2000",
    });

    if (
      sideDistance >= 10 &&
      leftDistanceFromBase >= 8 &&
      rightDistanceFromBase >= 8
    ) {
      return [leftHex, baseHex, rightHex];
    }
  }

  return [baseHex];
}

function buildTetradColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;
  const variantProfiles = [
    getTetradVariantProfile(variantIndex),
    ...TETRAD_VARIANT_PROFILES.filter((profile) => profile !== getTetradVariantProfile(variantIndex)),
  ];

  for (const profile of variantProfiles) {
    const roleHexes = profile.offsets.map((offset, index) =>
      buildBalancedHarmonyRoleColor(
        parsedBaseColor,
        resolvedSettings,
        offset,
        profile.lightnessBiases[index],
        profile.chromaScales[index]
      )
    );

    if (
      roleHexes.some((hex) => !hex || hex === baseHex || isDisallowedColor(hex)) ||
      new Set(roleHexes).size !== roleHexes.length
    ) {
      continue;
    }

    const palette = [baseHex, ...roleHexes];
    const hasEnoughDistance = palette.every((color, colorIndex) => {
      return palette.every((otherColor, otherIndex) => {
        if (otherIndex <= colorIndex) {
          return true;
        }

        const minimumDistance =
          colorIndex === 0 || otherIndex === 0
            ? 8
            : 10;
        const distance = window.AppColorUtils?.getColorDistance?.(color, otherColor, {
          method: "deltae2000",
        });

        return distance >= minimumDistance;
      });
    });

    if (hasEnoughDistance) {
      return palette.slice(0, targetCount);
    }
  }

  return [baseHex];
}

function buildComplementaryScaleVariant(baseHex, direction, settings, ratio, existingColors = new Set()) {
  const parsedColor = normalizePaletteBaseCssColor(baseHex);
  if (!parsedColor) {
    return null;
  }

  const targetHex = createComplementaryScaleTargetHex(parsedColor, settings, direction);
  if (!targetHex || targetHex === baseHex) {
    return null;
  }

  const steps = buildMonochromaticScaleCandidates(baseHex, targetHex, 8).slice(1);
  if (steps.length === 0) {
    return null;
  }

  const idealIndex = Math.max(
    0,
    Math.min(steps.length - 1, Math.round((steps.length - 1) * clampControlValue(ratio, 0.35, 0.9)))
  );
  const candidateIndexes = [
    ...steps.slice(idealIndex).map((_, index) => idealIndex + index),
    ...steps.slice(0, idealIndex).map((_, index) => idealIndex - index - 1),
  ];

  function resolveComplementaryScaleCandidate(candidateIndex) {
    let resolvedIndex = candidateIndex;
    let candidate = controlsNormalizeHexColor(steps[resolvedIndex]);

    while (
      resolvedIndex > 0 &&
      (candidate === "#FFFFFF" || candidate === "#000000")
    ) {
      resolvedIndex -= 1;
      candidate = controlsNormalizeHexColor(steps[resolvedIndex]);
    }

    return candidate;
  }

  for (const candidateIndex of candidateIndexes) {
    const candidate = resolveComplementaryScaleCandidate(candidateIndex);
    if (
      !candidate ||
      candidate === baseHex ||
      existingColors.has(candidate) ||
      isDisallowedColor(candidate)
    ) {
      continue;
    }

    const isDistinctEnough = [...existingColors].every((existingColor) => {
      const deltaE = window.AppColorUtils?.getColorDistance?.(candidate, existingColor, {
        method: "deltae2000",
      });
      return deltaE >= 8;
    });

    if (isDistinctEnough) {
      return candidate;
    }
  }

  const fallbackCandidate = resolveComplementaryScaleCandidate(steps.length - 1);
  if (
    fallbackCandidate &&
    fallbackCandidate !== baseHex &&
    !existingColors.has(fallbackCandidate) &&
    !isDisallowedColor(fallbackCandidate)
  ) {
    return fallbackCandidate;
  }

  return null;
}

function buildComplementaryColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const profile = getComplementaryVariantProfile(variantIndex);
  const brightnessBias = clampControlValue(
    (resolvedSettings.brightness - DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationLoss = Math.pow(
    clampControlValue((DEFAULT_SATURATION - resolvedSettings.saturation) / 100, 0, 1),
    0.9
  );
  const tintRatio = targetCount >= 6
    ? clampControlValue(
        profile.tintStrength - 0.34 + brightnessBias * 0.08 - saturationLoss * 0.08,
        0.18,
        0.5
      )
    : profile.tintStrength;
  const shadeRatio = clampControlValue(
    profile.shadeStrength - 0.22 - brightnessBias * 0.08 + saturationLoss * 0.06,
    0.24,
    0.54
  );
  const baseHex = parsedBaseColor.hex;
  const complementHex = buildComplementaryHueColor(
    parsedBaseColor,
    resolvedSettings,
    variantIndex
  );

  if (!complementHex || complementHex === baseHex) {
    return [baseHex];
  }

  if (targetCount <= 2) {
    return [baseHex, complementHex];
  }

  const palette = [];
  const usedColors = new Set();
  const baseTint = buildComplementaryScaleVariant(
    baseHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors
  );
  if (baseTint) {
    palette.push(baseTint);
    usedColors.add(baseTint);
  }

  palette.push(baseHex);
  usedColors.add(baseHex);

  const baseShade = buildComplementaryScaleVariant(
    baseHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors
  );
  if (baseShade) {
    palette.push(baseShade);
    usedColors.add(baseShade);
  }

  const complementTint = buildComplementaryScaleVariant(
    complementHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors
  );
  if (complementTint) {
    palette.push(complementTint);
    usedColors.add(complementTint);
  }

  if (!usedColors.has(complementHex)) {
    palette.push(complementHex);
    usedColors.add(complementHex);
  }

  const complementShade = buildComplementaryScaleVariant(
    complementHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors
  );
  if (complementShade) {
    palette.push(complementShade);
    usedColors.add(complementShade);
  }

  return palette.slice(0, targetCount);
}

function getMonochromaticColorOklchLightness(hex) {
  const color = window.AppColorUtils?.createColor?.(hex);
  const [lightness = 0] = color?.to("oklch")?.coords || [];
  return clampControlValue(lightness, 0, 1);
}

function buildMonochromaticScaleCandidates(baseHex, targetHex, stepCount) {
  if (typeof window.AppColorUtils?.getHexColorSteps !== "function") {
    return [];
  }

  return window.AppColorUtils.getHexColorSteps(baseHex, targetHex, stepCount, {
    space: "oklch",
    outputSpace: "srgb",
  });
}

function filterDistinctMonochromaticScaleColors(baseHex, colors, desiredCount, targetCount) {
  const palette = [];
  const usedColors = new Set([baseHex]);
  const strictMinimumDistance = targetCount >= 12 ? 1.9 : targetCount >= 9 ? 2.5 : 3.8;
  const relaxedMinimumDistance = targetCount >= 12 ? 1.2 : targetCount >= 9 ? 1.6 : 2.4;
  const strictMinimumLightnessGap = targetCount >= 12 ? 0.008 : targetCount >= 9 ? 0.012 : 0.02;
  const relaxedMinimumLightnessGap = targetCount >= 12 ? 0.005 : targetCount >= 9 ? 0.008 : 0.014;

  [true, false].forEach((useStrictThresholds) => {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = controlsNormalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColor(normalizedColor)
      ) {
        return;
      }

      const candidateLightness = getMonochromaticColorOklchLightness(normalizedColor);
      const minimumDistance = useStrictThresholds
        ? strictMinimumDistance
        : relaxedMinimumDistance;
      const minimumLightnessGap = useStrictThresholds
        ? strictMinimumLightnessGap
        : relaxedMinimumLightnessGap;
      const hasEnoughSeparation = palette.every((existingColor) => {
        const deltaE = window.AppColorUtils?.getColorDistance?.(normalizedColor, existingColor, {
          method: "deltae2000",
        });
        const lightnessGap = Math.abs(
          candidateLightness - getMonochromaticColorOklchLightness(existingColor)
        );

        return deltaE >= minimumDistance && lightnessGap >= minimumLightnessGap;
      });

      if (!hasEnoughSeparation) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  });

  if (palette.length < desiredCount * 2) {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = controlsNormalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColor(normalizedColor)
      ) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  }

  return palette;
}

function selectMonochromaticScaleStops(colors, desiredCount, direction) {
  if (colors.length <= desiredCount) {
    return [...colors];
  }

  const selectedIndexes = new Set();
  const maxIndex = colors.length - 1;
  const distributionGamma = direction === "dark" ? 1.32 : 1;

  for (let slotIndex = 1; slotIndex <= desiredCount; slotIndex += 1) {
    const normalizedPosition = slotIndex / desiredCount;
    const idealIndex = Math.round((normalizedPosition ** distributionGamma) * maxIndex);
    let resolvedIndex = idealIndex;
    let searchOffset = 0;

    while (selectedIndexes.has(resolvedIndex) && searchOffset <= maxIndex) {
      searchOffset += 1;
      const forwardIndex = idealIndex + searchOffset;
      const backwardIndex = idealIndex - searchOffset;

      if (forwardIndex <= maxIndex && !selectedIndexes.has(forwardIndex)) {
        resolvedIndex = forwardIndex;
        break;
      }

      if (backwardIndex >= 0 && !selectedIndexes.has(backwardIndex)) {
        resolvedIndex = backwardIndex;
        break;
      }
    }

    selectedIndexes.add(resolvedIndex);
  }

  return [...selectedIndexes]
    .sort((left, right) => left - right)
    .map((index) => colors[index])
    .filter(Boolean);
}

function orderMonochromaticScaleColors(baseHex, colors, direction) {
  const baseLightness = getMonochromaticColorOklchLightness(baseHex);

  return [...colors].sort((leftColor, rightColor) => {
    const leftLightness = getMonochromaticColorOklchLightness(leftColor);
    const rightLightness = getMonochromaticColorOklchLightness(rightColor);
    const leftDistanceFromBase = Math.abs(leftLightness - baseLightness);
    const rightDistanceFromBase = Math.abs(rightLightness - baseLightness);

    if (leftDistanceFromBase !== rightDistanceFromBase) {
      return leftDistanceFromBase - rightDistanceFromBase;
    }

    return direction === "dark"
      ? rightLightness - leftLightness
      : leftLightness - rightLightness;
  });
}

// Monochromatic palettes stay on one side of the scale and keep the base color fixed in the first slot.
function buildMonochromaticColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const direction = getMonochromaticScaleDirection(parsedBaseColor);
  const targetHex = createMonochromaticScaleTargetHex(
    parsedBaseColor,
    resolvedSettings,
    direction
  );

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (!targetHex || targetHex === baseHex) {
    return [baseHex];
  }

  const desiredCount = targetCount - 1;
  const stepCounts = [
    desiredCount * 2 + 4,
    desiredCount * 4 + 6,
    desiredCount * 6 + 8,
  ];
  let scaleColors = [];

  stepCounts.some((stepCount) => {
    const candidates = buildMonochromaticScaleCandidates(
      baseHex,
      targetHex,
      stepCount
    ).slice(1);
    const distinctColors = filterDistinctMonochromaticScaleColors(
      baseHex,
      candidates,
      desiredCount,
      targetCount
    );
    const sampledColors = selectMonochromaticScaleStops(
      distinctColors,
      desiredCount,
      direction
    );

    if (sampledColors.length > scaleColors.length) {
      scaleColors = sampledColors;
    }

    return sampledColors.length >= desiredCount;
  });

  return [baseHex, ...orderMonochromaticScaleColors(baseHex, scaleColors, direction)];
}

function orderColorModePaletteByHarmony(colors, baseHex, options = {}) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length <= 2 || typeof orderPaletteHexColorsByHarmony !== "function") {
    return normalizedColors;
  }

  const harmonyOrderedColors = orderPaletteHexColorsByHarmony(normalizedColors);
  const baseIndex = harmonyOrderedColors.indexOf(baseHex);
  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(normalizedColors.length);

  if (effectiveType === "triad" && harmonyOrderedColors.length === 3 && baseIndex !== -1) {
    const sideColors = harmonyOrderedColors.filter((color) => color !== baseHex);
    if (sideColors.length === 2) {
      return [sideColors[0], baseHex, sideColors[1]];
    }
  }

  if (baseIndex <= 0) {
    return harmonyOrderedColors;
  }

  return [
    ...harmonyOrderedColors.slice(baseIndex),
    ...harmonyOrderedColors.slice(0, baseIndex),
  ];
}

function buildColorModePaletteForSettings(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(targetCount);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;

  if (effectiveType === "monochromatic") {
    return buildMonochromaticColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "complementary") {
    return buildComplementaryColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "analogous" && selectedColorPaletteType === "analogous") {
    return buildAnalogousColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "triad") {
    return buildTriadColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "tetrad") {
    return buildTetradColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  const palette = [baseHex];
  const usedColors = new Set([baseHex]);
  const anchorOffsets = getColorModeAnchorOffsets(effectiveType, targetCount, variantIndex);
  const maxAttemptsPerColor = 12;

  for (let index = 1; index < targetCount; index += 1) {
    let nextColor = null;

    for (let attempt = 0; attempt < maxAttemptsPerColor; attempt += 1) {
      const anchorOffset = anchorOffsets[(index + attempt - 1) % anchorOffsets.length];
      const hueOffset = anchorOffset + (attempt > 0 ? (attempt % 2 === 0 ? attempt * 2 : -attempt * 2) : 0);
      const candidate = createColorModeCandidateColor(
        parsedBaseColor,
        hueOffset,
        index + attempt,
        variantIndex + attempt,
        settings
      );

      if (usedColors.has(candidate) || isDisallowedColor(candidate)) {
        continue;
      }

      nextColor = candidate;
      break;
    }

    if (!nextColor) {
      break;
    }

    usedColors.add(nextColor);
    palette.push(nextColor);
  }

  return orderColorModePaletteByHarmony(palette, baseHex, {
    effectiveType,
  });
}

function createColorModePaletteCandidate(settings, options = {}) {
  const attemptCount = Number.isFinite(options.attemptCount)
    ? Math.max(1, options.attemptCount)
    : Math.max(18, paletteSize * 6);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  const baseColor = options.baseColor || getPaletteBaseColorSnapshot();
  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(paletteSize);

  if (effectiveType === "monochromatic") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "complementary") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "triad") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "tetrad") {
    let bestCandidate = null;

    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const variantForAttempt = colorPaletteVariantIndex + 1 + attempt;
      const palette = buildColorModePaletteForSettings(
        paletteSize,
        settings,
        {
          baseColor,
          effectiveType,
          variantIndex: variantForAttempt,
        }
      );

      if (palette.length !== paletteSize) {
        continue;
      }

      const comparablePalette = getComparableMergedPaletteSlice(palette, pinnedEntries);
      const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
        comparablePalette,
        referencePalette
      );
      const candidate = {
        palette,
        effectiveType,
        variantIndex: variantForAttempt,
        samePositionCount: positionalSimilarityMetrics.samePositionCount,
        isTooSimilar: arePalettesTooSimilar(comparablePalette, referencePalette),
        score: scorePaletteHarmony(palette),
      };

      if (
        !bestCandidate ||
        isBetterPaletteFallbackCandidate(candidate, bestCandidate)
      ) {
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  let bestDistinctCandidate = null;
  let bestFallbackCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const variantIndex = colorPaletteVariantIndex + 1 + attempt;
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex,
      }
    );

    if (palette.length !== paletteSize) {
      continue;
    }

    const comparablePalette = getComparableMergedPaletteSlice(palette, pinnedEntries);
    const similarityMetrics = getPaletteSimilarityMetrics(comparablePalette, referencePalette);
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      comparablePalette,
      referencePalette
    );
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(comparablePalette.length, 1);
    const candidate = {
      palette,
      effectiveType,
      variantIndex,
      samePositionCount: positionalSimilarityMetrics.samePositionCount,
      isTooSimilar: arePalettesTooSimilar(comparablePalette, referencePalette),
      score: scorePaletteHarmony(palette) - similarityPenalty * 0.8,
    };

    if (isBetterPaletteFallbackCandidate(candidate, bestFallbackCandidate)) {
      bestFallbackCandidate = candidate;
    }

    if (
      candidate.samePositionCount === 0 &&
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

function getColorModeRegenerationColorForCard(card, existingColors = new Set()) {
  if (isColorModeMonochromaticScaleActive()) {
    return null;
  }

  const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
  const currentHex = normalizeHexColor(
    card?.querySelector(".color-label")?.textContent?.trim() || ""
  );

  if (!Number.isFinite(cardIndex) || cardIndex <= 0) {
    return null;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = createColorModePaletteCandidate(getCurrentPaletteAdjustmentSnapshot(), {
      referencePalette: currentPalette,
      attemptCount: 1,
      effectiveType: getEffectiveColorPaletteType(),
    });

    if (!candidate?.palette?.[cardIndex]) {
      continue;
    }

    const nextColor = candidate.palette[cardIndex];
    if (
      nextColor &&
      nextColor !== currentHex &&
      !existingColors.has(nextColor)
    ) {
      colorPaletteVariantIndex = candidate.variantIndex;
      return nextColor;
    }
  }

  return null;
}

function syncColorModeSizeSelection() {
  const allowedSizes = getAllowedPaletteSizesForCurrentMode();
  const nextSize = selectedColorPaletteType === "monochromatic"
    ? resolvePaletteSizeForType(selectedColorPaletteType, paletteSize)
    : getNearestAllowedPaletteSize(paletteSize, allowedSizes);

  if (nextSize !== paletteSize) {
    setPaletteSize(nextSize);
  }

  if (typeof updatePaletteSizeButtonsAvailability === "function") {
    updatePaletteSizeButtonsAvailability();
  }
}

function initializeColorModeControls() {
  syncColorModeBaseControls();
  syncColorModeSizeSelection();

  if (paletteColorSwatchBtn && paletteColorPicker) {
    paletteColorSwatchBtn.addEventListener("click", () => {
      if (typeof paletteColorPicker.showPicker === "function") {
        paletteColorPicker.showPicker();
        return;
      }

      paletteColorPicker.click();
    });
  }

  if (paletteColorPicker) {
    paletteColorPicker.addEventListener("input", () => {
      setSelectedPaletteBaseColor(paletteColorPicker.value, {
        syncTextInput: true,
      });
    });
  }

  if (paletteColorTextInput) {
    paletteColorTextInput.addEventListener("input", () => {
      const parsedColor = normalizePaletteBaseCssColor(paletteColorTextInput.value);
      if (!parsedColor) {
        setPaletteBaseColorFeedback(
          "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
          true
        );
        if (typeof updatePaletteActionButtonsAvailability === "function") {
          updatePaletteActionButtonsAvailability();
        }
        return;
      }

      setSelectedPaletteBaseColor(parsedColor.inputValue, {
        syncTextInput: false,
      });
      if (typeof updatePaletteActionButtonsAvailability === "function") {
        updatePaletteActionButtonsAvailability();
      }
    });

    paletteColorTextInput.addEventListener("change", () => {
      setSelectedPaletteBaseColor(paletteColorTextInput.value, {
        syncTextInput: true,
      });
    });
  }

  if (paletteTypeOptions instanceof HTMLSelectElement) {
    paletteTypeOptions.addEventListener("change", () => {
      setSelectedColorPaletteType(paletteTypeOptions.value);
    });
  }

  if (monochromaticModeSelect) {
    monochromaticModeSelect.addEventListener("change", () => {
      setSelectedMonochromaticGenerationMode(monochromaticModeSelect.value);
    });
  }

  if (analogousSeparationSelect) {
    analogousSeparationSelect.addEventListener("change", () => {
      setSelectedAnalogousSeparationMode(analogousSeparationSelect.value);
    });
  }
}

initializeColorModeControls();
