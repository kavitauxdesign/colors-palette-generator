// Palette generator color mode: color parsing, harmony rules and generation.

const COLOR_MODE_PALETTE_SIZES = Object.freeze({
  automatic: [2, 3, 4, 6, 9],
  monochromatic: [6, 9, 12],
  complementary: [2, 6],
  analogous: [2, 3, 6, 9],
  triad: [3, 6, 9],
  tetrad: [4],
});
const MONOCHROMATIC_GENERATION_MODES = new Set(["automatic", "shades", "tints"]);
const COMPLEMENTARY_VARIANT_PROFILES = Object.freeze([
  { complementLightnessOffset: 0, complementChromaScale: 1, tintStrength: 0.66, shadeStrength: 0.58 },
  { complementLightnessOffset: 0.02, complementChromaScale: 0.94, tintStrength: 0.72, shadeStrength: 0.54 },
  { complementLightnessOffset: -0.02, complementChromaScale: 1.06, tintStrength: 0.62, shadeStrength: 0.62 },
]);

let colorModeParserElement = null;
let colorPaletteVariantIndex = 0;

function normalizeMonochromaticGenerationMode(mode) {
  return MONOCHROMATIC_GENERATION_MODES.has(mode)
    ? mode
    : DEFAULT_MONOCHROMATIC_GENERATION_MODE;
}

function shouldShowMonochromaticModeControl() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "monochromatic";
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
}

function setSelectedColorPaletteType(nextType, options = {}) {
  selectedColorPaletteType = COLOR_MODE_PALETTE_SIZES[nextType]
    ? nextType
    : DEFAULT_COLOR_PALETTE_TYPE;
  syncPaletteTypeOptionStates();
  syncMonochromaticModeControlState();

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

function createColorModeCandidateColor(baseHsl, hueOffset, index, variantIndex, settings) {
  const targetSaturation = Number.isFinite(settings?.saturation)
    ? settings.saturation
    : getCurrentSaturationValue();
  const targetBrightness = Number.isFinite(settings?.brightness)
    ? settings.brightness
    : getCurrentBrightnessValue();
  const { lightnessOffset, saturationOffset } = getColorModeVariantOffsets(index, variantIndex);
  const centerLightness = 10 + (targetBrightness / 100) * 80;
  const saturation = clampControlValue(
    blendControlValue(baseHsl.s, targetSaturation, 0.78) + saturationOffset,
    0,
    100
  );
  const lightness = clampControlValue(
    blendControlValue(baseHsl.l, centerLightness, 0.72) + lightnessOffset,
    10,
    90
  );
  const hue = (baseHsl.h + hueOffset + 360) % 360;

  return controlsNormalizeHexColor(
    controlsHslToHex(hue, saturation, lightness)
  );
}

function getMonochromaticScalePerceivedLightness(hex) {
  return typeof window.AppColorUtils?.getPerceivedLightness === "function"
    ? window.AppColorUtils.getPerceivedLightness(hex)
    : controlsHexToHsl(hex).l;
}

function resolveAutomaticMonochromaticScaleDirection(baseColor) {
  const baseLightness = Number.isFinite(baseColor?.hsl?.l)
    ? baseColor.hsl.l
    : 50;
  const perceivedLightness = typeof baseColor?.hex === "string"
    ? getMonochromaticScalePerceivedLightness(baseColor.hex)
    : baseLightness;
  const resolvedLightness = blendControlValue(baseLightness, perceivedLightness, 0.68);

  return resolvedLightness >= 72 ? "dark" : "light";
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
  if (direction === "light") {
    const maximumLightness = clampControlValue(0.992 - (1 - brightnessRatio) * 0.008, 0.965, 0.995);
    const lightnessRoom = Math.max(0.2, maximumLightness - baseOklch.lightness);
    const targetLightness = clampControlValue(
      baseOklch.lightness + lightnessRoom * (0.86 + brightnessRatio * 0.1),
      Math.min(maximumLightness, baseOklch.lightness + 0.22),
      maximumLightness
    );
    const chromaScale = 0.16 + clampControlValue(settings.saturation / 100, 0, 1) * 0.12;

    return {
      lightness: targetLightness,
      chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.008, 0.1),
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
  const chromaScale = 0.6 + clampControlValue(settings.saturation / 100, 0, 1) * 0.26;

  return {
    lightness: targetLightness,
    chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.02, 0.24),
    hue: baseOklch.hue,
  };
}

function createMonochromaticScaleTargetHex(baseColor, settings, direction) {
  const target = getMonochromaticScaleTarget(baseColor, settings, direction);
  const ColorConstructor = window.AppColorUtils?.Color;

  if (!target || typeof ColorConstructor !== "function") {
    return null;
  }

  let targetColor = new ColorConstructor("oklch", [
    target.lightness,
    target.chroma,
    target.hue,
  ]);

  if (typeof targetColor.toGamut === "function") {
    targetColor = targetColor.toGamut({
      space: "srgb",
      method: "oklch.c",
    });
  }

  return window.AppColorUtils?.colorToHex?.(targetColor) || null;
}

function createColorModeOklchHex(lightness, chroma, hue) {
  const ColorConstructor = window.AppColorUtils?.Color;
  if (typeof ColorConstructor !== "function") {
    return null;
  }

  let color = new ColorConstructor("oklch", [
    clampControlValue(lightness, 0, 1),
    clampControlValue(chroma, 0, 0.4),
    ((Number(hue) % 360) + 360) % 360,
  ]);

  if (typeof color.toGamut === "function") {
    color = color.toGamut({
      space: "srgb",
      method: "oklch.c",
    });
  }

  return window.AppColorUtils?.colorToHex?.(color) || null;
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
  const saturationRatio = clampControlValue(settings.saturation / 100, 0, 1);
  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const lightness = clampControlValue(
    baseOklch.lightness + profile.complementLightnessOffset + (brightnessRatio - 0.5) * 0.04,
    0.2,
    0.88
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.038) * (0.84 + saturationRatio * 0.18) * profile.complementChromaScale,
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

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationRatio = clampControlValue(settings.saturation / 100, 0, 1);

  if (direction === "light") {
    const maximumLightness = clampControlValue(0.91 + brightnessRatio * 0.03, 0.88, 0.94);
    const lightnessRoom = Math.max(0.1, maximumLightness - baseOklch.lightness);
    const targetLightness = clampControlValue(
      baseOklch.lightness + lightnessRoom * (0.58 + brightnessRatio * 0.08),
      Math.min(maximumLightness, baseOklch.lightness + 0.14),
      maximumLightness
    );
    const chromaScale = 0.42 + saturationRatio * 0.12;

    return createColorModeOklchHex(
      targetLightness,
      clampControlValue(baseOklch.chroma * chromaScale, 0.012, 0.12),
      baseOklch.hue
    );
  }

  const minimumLightness = clampControlValue(0.18 + (1 - brightnessRatio) * 0.03, 0.16, 0.26);
  const darknessRoom = Math.max(0.1, baseOklch.lightness - minimumLightness);
  const targetLightness = clampControlValue(
    baseOklch.lightness - darknessRoom * (0.54 + (1 - brightnessRatio) * 0.08),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.14)
  );
  const chromaScale = 0.74 + saturationRatio * 0.16;

  return createColorModeOklchHex(
    targetLightness,
    clampControlValue(baseOklch.chroma * chromaScale, 0.02, 0.2),
    baseOklch.hue
  );
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
  const tintRatio = targetCount >= 6
    ? clampControlValue(profile.tintStrength - 0.18, 0.38, 0.58)
    : profile.tintStrength;
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
    profile.shadeStrength,
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
    profile.shadeStrength,
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

function orderColorModePaletteByHarmony(colors, baseHex) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length <= 2 || typeof orderPaletteHexColorsByHarmony !== "function") {
    return normalizedColors;
  }

  const harmonyOrderedColors = orderPaletteHexColorsByHarmony(normalizedColors);
  const baseIndex = harmonyOrderedColors.indexOf(baseHex);

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
  const baseHsl = parsedBaseColor.hsl;

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
        baseHsl,
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

  return orderColorModePaletteByHarmony(palette, baseHex);
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
}

initializeColorModeControls();
