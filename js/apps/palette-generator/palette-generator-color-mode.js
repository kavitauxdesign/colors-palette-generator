// Palette generator color mode: color parsing, harmony rules and generation.

const COLOR_MODE_PALETTE_SIZES = Object.freeze({
  automatic: [2, 3, 4, 6, 9],
  monochromatic: [2, 3, 4, 6, 9],
  complementary: [2, 3, 6, 9],
  analogous: [2, 3, 6, 9],
  triad: [3, 6, 9],
  tetrad: [4],
});

let colorModeParserElement = null;
let colorPaletteVariantIndex = 0;

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
  return true;
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

function syncPaletteTypeOptionStates() {
  if (!paletteTypeOptions) {
    return;
  }

  const radios = Array.from(paletteTypeOptions.querySelectorAll('input[name="paletteType"]'));
  radios.forEach((radio) => {
    const option = radio.closest(".palette-type-option");
    const isActive = radio.value === selectedColorPaletteType;
    radio.checked = isActive;
    option?.classList.toggle("is-active", isActive);
  });

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
}

function setSelectedColorPaletteType(nextType, options = {}) {
  selectedColorPaletteType = COLOR_MODE_PALETTE_SIZES[nextType]
    ? nextType
    : DEFAULT_COLOR_PALETTE_TYPE;
  syncPaletteTypeOptionStates();

  const allowedSizes = getAllowedPaletteSizesForCurrentMode();
  const nextSize = getNearestAllowedPaletteSize(paletteSize, allowedSizes);
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
  const rgb = controlsHexToRgb(hex);
  return ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 2550;
}

function getMonochromaticScaleDirection(baseColor) {
  const baseLightness = Number.isFinite(baseColor?.hsl?.l)
    ? baseColor.hsl.l
    : 50;
  const perceivedLightness = typeof baseColor?.hex === "string"
    ? getMonochromaticScalePerceivedLightness(baseColor.hex)
    : baseLightness;
  const resolvedLightness = blendControlValue(baseLightness, perceivedLightness, 0.6);

  return resolvedLightness < 54 ? "light" : "dark";
}

function getMonochromaticScaleTarget(baseHsl, settings, direction) {
  const brightnessBias = (settings.brightness - 50) / 50;

  if (direction === "light") {
    return {
      lightness: clampControlValue(95 + brightnessBias * 1.8, 92, 98),
      saturation: clampControlValue(5 + settings.saturation * 0.08, 4, 16),
    };
  }

  return {
    lightness: clampControlValue(6 + brightnessBias * 1.4, 4, 10),
    saturation: clampControlValue(
      Math.max(10, baseHsl.s * 0.34) + (settings.saturation - 50) * 0.08,
      8,
      34
    ),
  };
}

function getMonochromaticScaleProgress(stepIndex, stepCount) {
  const progress = clampControlValue(stepIndex / Math.max(stepCount, 1), 0, 1);
  return progress * progress * (3 - (2 * progress));
}

function createMonochromaticScaleColor(
  baseHsl,
  stepIndex,
  stepCount,
  settings,
  direction,
  target,
  usedColors
) {
  const progress = getMonochromaticScaleProgress(stepIndex, stepCount);
  const baseSaturation = clampControlValue(
    blendControlValue(baseHsl.s, settings.saturation, 0.22),
    4,
    96
  );
  const lightness = blendControlValue(baseHsl.l, target.lightness, progress);
  const saturationProgress = direction === "light"
    ? Math.pow(progress, 0.9)
    : Math.pow(progress, 1.05);
  const midScaleSaturationLift = direction === "dark"
    ? Math.sin(progress * Math.PI) * Math.min(6, baseSaturation * 0.08)
    : 0;
  const saturation = clampControlValue(
    blendControlValue(baseSaturation, target.saturation, saturationProgress) + midScaleSaturationLift,
    4,
    96
  );
  const adjustments = [
    { lightness: 0, saturation: 0 },
    direction === "light"
      ? { lightness: 1, saturation: -1 }
      : { lightness: -1, saturation: 1 },
    direction === "light"
      ? { lightness: 2, saturation: -2 }
      : { lightness: -2, saturation: 2 },
    direction === "light"
      ? { lightness: -1, saturation: -2 }
      : { lightness: 1, saturation: 2 },
    direction === "light"
      ? { lightness: 3, saturation: -3 }
      : { lightness: -3, saturation: 3 },
  ];

  for (const adjustment of adjustments) {
    const candidate = controlsNormalizeHexColor(
      controlsHslToHex(
        baseHsl.h,
        clampControlValue(saturation + adjustment.saturation, 4, 96),
        direction === "light"
          ? clampControlValue(lightness + adjustment.lightness, baseHsl.l, target.lightness)
          : clampControlValue(lightness + adjustment.lightness, target.lightness, baseHsl.l)
      )
    );

    if (usedColors.has(candidate) || isDisallowedColor(candidate)) {
      continue;
    }

    return candidate;
  }

  return null;
}

// Monochromatic palettes stay on the same hue and extend from the base color toward tints or shades.
function buildMonochromaticColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const baseHsl = parsedBaseColor.hsl;
  const palette = [baseHex];
  const usedColors = new Set([baseHex]);
  const totalScaleSteps = Math.max(0, targetCount - 1);
  const direction = getMonochromaticScaleDirection(parsedBaseColor);
  const target = getMonochromaticScaleTarget(baseHsl, resolvedSettings, direction);

  for (let stepIndex = 1; stepIndex <= totalScaleSteps; stepIndex += 1) {
    const nextColor = createMonochromaticScaleColor(
      baseHsl,
      stepIndex,
      totalScaleSteps,
      resolvedSettings,
      direction,
      target,
      usedColors
    );

    if (!nextColor) {
      break;
    }

    usedColors.add(nextColor);
    palette.push(nextColor);
  }

  return palette;
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
  const nextSize = getNearestAllowedPaletteSize(paletteSize, allowedSizes);

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

      applyPaletteBaseColorInputState(parsedColor, {
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

  if (paletteTypeOptions) {
    paletteTypeOptions.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== "paletteType") {
        return;
      }

      setSelectedColorPaletteType(target.value);
    });
  }
}

initializeColorModeControls();
