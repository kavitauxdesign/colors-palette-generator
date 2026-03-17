// Update range controls UI
const controlsHslToHex = window.AppColorUtils?.hslToHex;
const controlsNormalizeHexColor = window.AppColorUtils?.normalizeHexColor;
const controlsHexToRgb = window.AppColorUtils?.hexToRgb;
const controlsHexToHsl = window.AppColorUtils?.hexToHsl;
if (
  typeof controlsHslToHex !== "function" ||
  typeof controlsNormalizeHexColor !== "function" ||
  typeof controlsHexToRgb !== "function" ||
  typeof controlsHexToHsl !== "function"
) {
  throw new Error("AppColorUtils helpers are required before script-controls.js loads.");
}

let saturationAttentionTimeout = null;
let isPaletteImageDropzoneVisible = true;
let isReplaceImagePending = false;
let isPaletteAdjustPanelOpen = false;
const imagePanelTransitionMs = 320;
const allowedPaletteImageTypes = new Set(["image/jpeg", "image/png", "image/svg+xml"]);
const allowedPaletteImageExtensions = [".jpg", ".jpeg", ".png", ".svg"];

function updateUploadedImageAnalysisCache(cachePatch) {
  if (!uploadedBaseImage) {
    return;
  }

  uploadedBaseImage.analysisCache = {
    ...(uploadedBaseImage.analysisCache || {}),
    ...cachePatch,
  };
}

function updateRangeControl(input, valueLabel, lowIcon, highIcon) {
  if (!input) {
    return;
  }

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);

  // Update slider fill based on current value
  const percent = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--value", percent + "%");
  if (valueLabel) {
    valueLabel.textContent = `${Math.round(percent)}%`;
  }

  // Grow left icon when slider goes left
  let lowScale = 0;
  if (lowIcon && percent < 50) {
    lowScale = ((50 - percent) / 40) * 30;
  }

  // Grow right icon when slider goes right
  let highScale = 0;
  if (percent > 50) {
    highScale = ((percent - 50) / 40) * 30;
  }

  if (lowIcon) {
    lowIcon.style.transform = `scale(${1 + lowScale / 100})`;
    lowIcon.style.opacity = `${Math.max(0.5, 1 - (percent / 100) * 0.4)}`;
  }
  if (highIcon) {
    highIcon.style.transform = `scale(${1 + highScale / 100})`;
    highIcon.style.opacity = `${Math.max(0.5, 0.5 + (percent / 100) * 0.4)}`;
  }
}

const updateBrightnessProgress = () =>
  updateRangeControl(
    brightnessInput,
    brightnessValueLabel,
    darkBrightnessIcon,
    lightBrightnessIcon
  );

const updateSaturationProgress = () =>
  updateRangeControl(
    saturationInput,
    saturationValueLabel,
    lowSaturationIcon,
    highSaturationIcon
  );

function getCurrentPaletteAdjustmentSnapshot() {
  return {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
}

function capturePaletteAdjustmentBase(colors = currentPalette, settings = getCurrentPaletteAdjustmentSnapshot()) {
  const validColors = Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => /^#[0-9A-F]{6}$/.test(hex))
    : [];

  paletteAdjustmentBase = [...validColors];
  paletteAdjustmentBaseSettings = {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : DEFAULT_SATURATION,
  };
}

function getPaletteAdjustmentDeltas() {
  return {
    brightnessDelta:
      getCurrentBrightnessValue() - paletteAdjustmentBaseSettings.brightness,
    saturationDelta:
      getCurrentSaturationValue() - paletteAdjustmentBaseSettings.saturation,
  };
}

function getAdjustedPaletteColor(hex, variantIndex = 0) {
  const hsl = controlsHexToHsl(hex);
  const { brightnessDelta, saturationDelta } = getPaletteAdjustmentDeltas();
  const lightnessVariants = [0, -4, 4, -8, 8, -12, 12, -16, 16];
  const hueVariants = [0, 2, -2, 4, -4];
  const lightnessOffset = lightnessVariants[variantIndex % lightnessVariants.length];
  const hueOffset =
    hueVariants[Math.floor(variantIndex / lightnessVariants.length) % hueVariants.length];

  return controlsNormalizeHexColor(
    controlsHslToHex(
      (hsl.h + hueOffset + 360) % 360,
      clampControlValue(hsl.s + saturationDelta, 0, 100),
      clampControlValue(hsl.l + brightnessDelta * 0.45 + lightnessOffset, 0, 100)
    )
  );
}

function buildAdjustedPaletteFromBase(colors = paletteAdjustmentBase) {
  const adjustedPalette = [];
  const usedColors = new Set();

  colors.forEach((color, colorIndex) => {
    for (let variantIndex = 0; variantIndex < 28; variantIndex++) {
      const candidate = getAdjustedPaletteColor(color, variantIndex + colorIndex * 2);
      if (usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      adjustedPalette.push(candidate);
      return;
    }
  });

  return adjustedPalette;
}

function renderAdjustedPalette(colors) {
  const cards = Array.from(getColorCards());

  if (cards.length !== colors.length) {
    getColorCards().forEach((card) => card.remove());
    colors.forEach((color) => {
      createColorCard(color);
    });
  } else {
    cards.forEach((card, index) => {
      setCardColor(card, colors[index]);
    });
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();
  syncCurrentPaletteFromDom();
}

function applyCurrentPaletteAdjustments() {
  if (!Array.isArray(paletteAdjustmentBase) || paletteAdjustmentBase.length === 0) {
    return;
  }

  renderAdjustedPalette(buildAdjustedPaletteFromBase());
}

function setPaletteAdjustPanelOpen(shouldOpen) {
  if (!paletteAdjustPanel || !paletteAdjustBtn) {
    return;
  }

  isPaletteAdjustPanelOpen = !!shouldOpen;
  paletteAdjustPanel.classList.toggle("is-open", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.classList.toggle("is-active", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.setAttribute("aria-expanded", isPaletteAdjustPanelOpen ? "true" : "false");
  paletteAdjustPanel.setAttribute("aria-hidden", isPaletteAdjustPanelOpen ? "false" : "true");
  updatePaletteStickyState();
}

function ensurePaletteAdjustPanelVisible() {
  if (!isPaletteAdjustPanelOpen) {
    setPaletteAdjustPanelOpen(true);
  }
}

function updatePaletteStickyState() {
  if (!controlsPanel || !paletteSection) {
    return;
  }

  const isDesktopLayout = window.innerWidth > 680;
  const controlsHeight = controlsPanel.scrollHeight;
  const paletteHeight = paletteSection.scrollHeight;
  const shouldStick = isDesktopLayout && paletteHeight > 0 && paletteHeight < controlsHeight;

  paletteSection.classList.toggle("is-sticky", shouldStick);
}

function isTemperatureLockedBySaturation() {
  return (
    getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD &&
    getCurrentBrightnessValue() <= LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS
  );
}

function renderTemperatureButtonState(button, isActive) {
  if (!button) {
    return;
  }

  const isLocked = isTemperatureLockedBySaturation();
  button.classList.toggle("active", !isLocked && isActive);
  button.classList.toggle("is-saturation-locked", isLocked);
  button.setAttribute("aria-disabled", isLocked ? "true" : "false");
}

function syncTemperatureControlsState() {
  renderTemperatureButtonState(warmBtn, temperature.warm);
  renderTemperatureButtonState(coolBtn, temperature.cool);
}

function animateSaturationControlAttention() {
  if (!saturationControlGroup) {
    return;
  }

  ensurePaletteAdjustPanelVisible();
  saturationControlGroup.classList.remove("needs-attention");
  void saturationControlGroup.offsetWidth;
  saturationControlGroup.classList.add("needs-attention");

  if (saturationAttentionTimeout) {
    clearTimeout(saturationAttentionTimeout);
  }

  saturationAttentionTimeout = setTimeout(() => {
    saturationControlGroup.classList.remove("needs-attention");
    saturationAttentionTimeout = null;
  }, 420);
}

if (brightnessInput) {
  brightnessInput.addEventListener("input", () => {
    updateBrightnessProgress();
    syncTemperatureControlsState();
    applyCurrentPaletteAdjustments();
  });
  brightnessInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateBrightnessProgress();
  syncTemperatureControlsState();
}

if (saturationInput) {
  saturationInput.addEventListener("input", () => {
    updateSaturationProgress();
    syncTemperatureControlsState();
    applyCurrentPaletteAdjustments();
  });
  saturationInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateSaturationProgress();
  syncTemperatureControlsState();
}

if (paletteAdjustBtn) {
  paletteAdjustBtn.addEventListener("click", () => {
    setPaletteAdjustPanelOpen(!isPaletteAdjustPanelOpen);
  });
}

// PALETTE BASE

function setPaletteBaseMode(nextMode) {
  paletteBaseMode = nextMode === "image" ? "image" : "temperature";

  if (paletteBaseModeSelect) {
    paletteBaseModeSelect.value = paletteBaseMode;
  }

  if (temperatureBasePanel) {
    const showTemperaturePanel = paletteBaseMode === "temperature";
    temperatureBasePanel.classList.toggle("active", showTemperaturePanel);
    temperatureBasePanel.hidden = !showTemperaturePanel;
  }

  if (imageBasePanel) {
    const showImagePanel = paletteBaseMode === "image";
    imageBasePanel.classList.toggle("active", showImagePanel);
    imageBasePanel.hidden = !showImagePanel;
  }

  updatePaletteStickyState();
  updatePaletteSizeButtonsAvailability();

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }

  if (paletteBaseMode === "image" && uploadedBaseImage?.dataUrl) {
    void refreshImageDerivedControls();
  }
}

function isAcceptedPaletteImageFile(file) {
  if (!(file instanceof File)) {
    return false;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return (
    allowedPaletteImageTypes.has(file.type) ||
    allowedPaletteImageExtensions.some((extension) => normalizedName.endsWith(extension))
  );
}

function renderPaletteImagePreview() {
  if (
    !paletteImagePreview ||
    !paletteImagePreviewImg ||
    !paletteImageName ||
    !paletteImageDropzonePanel ||
    !paletteImageReplaceBtn
  ) {
    return;
  }

  const hasPreview = !!uploadedBaseImage?.dataUrl;
  if (!hasPreview) {
    isPaletteImageDropzoneVisible = true;
  }

  setAnimatedImagePanelVisibility(
    paletteImageDropzonePanel,
    !hasPreview || isPaletteImageDropzoneVisible
  );
  setAnimatedImagePanelVisibility(paletteImagePreview, hasPreview);
  paletteImageReplaceBtn.disabled = !hasPreview || isReplaceImagePending;
  paletteImageReplaceBtn.setAttribute(
    "aria-disabled",
    !hasPreview || isReplaceImagePending ? "true" : "false"
  );

  if (!hasPreview) {
    paletteImagePreviewImg.removeAttribute("src");
    paletteImageName.textContent = "";
    return;
  }

  paletteImagePreviewImg.src = uploadedBaseImage.dataUrl;
  paletteImageName.textContent = uploadedBaseImage.name;
}

function setAnimatedImagePanelVisibility(element, shouldShow) {
  if (!element) {
    return;
  }

  if (element.__hideTimeout) {
    clearTimeout(element.__hideTimeout);
    element.__hideTimeout = null;
  }

  if (shouldShow) {
    if (element.hidden) {
      element.hidden = false;
      element.classList.add("is-collapsed");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove("is-collapsed");
        });
      });
      return;
    }

    element.classList.remove("is-collapsed");
    return;
  }

  if (element.hidden) {
    return;
  }

  element.classList.add("is-collapsed");
  element.__hideTimeout = setTimeout(() => {
    element.hidden = true;
    element.__hideTimeout = null;
  }, imagePanelTransitionMs);
}

function openPaletteImageDropzone() {
  if (!paletteImageDropzonePanel) {
    return;
  }

  isReplaceImagePending = true;
  isPaletteImageDropzoneVisible = true;
  renderPaletteImagePreview();

  paletteImageDropzonePanel.classList.remove("is-sliding-in");
  void paletteImageDropzonePanel.offsetWidth;
  paletteImageDropzonePanel.classList.add("is-sliding-in");
}

function handlePaletteImageFile(file) {
  if (!isAcceptedPaletteImageFile(file)) {
    alert("Solo se permiten imágenes JPG, PNG o SVG.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    uploadedBaseImage = {
      name: file.name,
      type: file.type,
      dataUrl: String(reader.result || ""),
      analysisCache: null,
    };
    isReplaceImagePending = false;
    isPaletteImageDropzoneVisible = false;
    setPaletteBaseMode("image");
    renderPaletteImagePreview();
    void refreshImageDerivedControls();
  });
  reader.readAsDataURL(file);
}

if (paletteBaseModeSelect) {
  paletteBaseModeSelect.addEventListener("change", () => {
    setPaletteBaseMode(paletteBaseModeSelect.value);
  });
}

if (paletteImageInput) {
  paletteImageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
    paletteImageInput.value = "";
  });
}

if (paletteImageReplaceBtn) {
  paletteImageReplaceBtn.addEventListener("click", () => {
    openPaletteImageDropzone();
  });
}

if (paletteImageDropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.remove("is-dragover");
    });
  });

  paletteImageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
  });
}

setPaletteBaseMode(paletteBaseMode);
renderPaletteImagePreview();

if (controlsPanel && paletteSection) {
  updatePaletteStickyState();

  if (typeof ResizeObserver === "function") {
    const stickyObserver = new ResizeObserver(() => {
      updatePaletteStickyState();
    });

    stickyObserver.observe(controlsPanel);
    stickyObserver.observe(paletteSection);
    stickyObserver.observe(paletteContainer);
  }

  window.addEventListener("resize", updatePaletteStickyState, { passive: true });
}

function rgbToHex(color) {
  return `#${[color.r, color.g, color.b]
    .map((channel) =>
      clampControlValue(Math.round(channel), 0, 255).toString(16).padStart(2, "0")
    )
    .join("")
    .toUpperCase()}`;
}

function getRgbDistanceBetween(colorA, colorB) {
  const dr = colorA.r - colorB.r;
  const dg = colorA.g - colorB.g;
  const db = colorA.b - colorB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for palette extraction."));
    image.src = dataUrl;
  });
}

async function getUploadedImageSamplePoints() {
  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  if (Array.isArray(uploadedBaseImage.analysisCache?.points)) {
    return uploadedBaseImage.analysisCache.points;
  }

  const image = await loadImageElement(uploadedBaseImage.dataUrl);
  const maxDimension = 56;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  );
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const quantizedColors = new Map();

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 40) {
      continue;
    }

    const r = Math.round(imageData[index] / 16) * 16;
    const g = Math.round(imageData[index + 1] / 16) * 16;
    const b = Math.round(imageData[index + 2] / 16) * 16;
    const key = `${r}-${g}-${b}`;
    const existingPoint = quantizedColors.get(key);

    if (existingPoint) {
      existingPoint.weight += 1;
      continue;
    }

    quantizedColors.set(key, {
      r,
      g,
      b,
      weight: 1,
    });
  }

  const points = Array.from(quantizedColors.values());
  updateUploadedImageAnalysisCache({
    points,
    width,
    height,
  });
  return points;
}

function getWeightedRandomPoint(points, weightResolver) {
  const totalWeight = points.reduce((sum, point) => sum + weightResolver(point), 0);
  if (totalWeight <= 0) {
    return points[Math.floor(Math.random() * points.length)];
  }

  let threshold = Math.random() * totalWeight;
  for (const point of points) {
    threshold -= weightResolver(point);
    if (threshold <= 0) {
      return point;
    }
  }

  return points[points.length - 1];
}

function initializeImageClusterCenters(points, clusterCount) {
  const centers = [];
  centers.push({ ...getWeightedRandomPoint(points, (point) => point.weight) });

  while (centers.length < clusterCount) {
    const nextPoint = getWeightedRandomPoint(points, (point) => {
      const nearestDistance = Math.min(
        ...centers.map((center) => {
          const distance = getRgbDistanceBetween(point, center);
          return distance * distance;
        })
      );
      return point.weight * Math.max(nearestDistance, 1);
    });

    centers.push({ ...nextPoint });
  }

  return centers;
}

function clusterImageColors(points, clusterCount) {
  const safeClusterCount = Math.max(1, Math.min(clusterCount, points.length));
  let centers = initializeImageClusterCenters(points, safeClusterCount);

  for (let iteration = 0; iteration < 8; iteration++) {
    const buckets = Array.from({ length: safeClusterCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    points.forEach((point) => {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      centers.forEach((center, index) => {
        const distance = getRgbDistanceBetween(point, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const bucket = buckets[nearestIndex];
      bucket.r += point.r * point.weight;
      bucket.g += point.g * point.weight;
      bucket.b += point.b * point.weight;
      bucket.weight += point.weight;
    });

    centers = centers.map((center, index) => {
      const bucket = buckets[index];
      if (!bucket.weight) {
        return { ...getWeightedRandomPoint(points, (point) => point.weight) };
      }

      return {
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
      };
    });
  }

  const clusters = centers.map((center) => ({
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    weight: 0,
  }));

  points.forEach((point) => {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    clusters.forEach((cluster, index) => {
      const distance = getRgbDistanceBetween(point, cluster);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    clusters[nearestIndex].weight += point.weight;
  });

  return clusters
    .filter((cluster) => cluster.weight > 0)
    .sort((clusterA, clusterB) => clusterB.weight - clusterA.weight);
}

function cleanImageClusterDuplicates(clusters) {
  const deduplicatedClusters = [];

  clusters.forEach((cluster) => {
    const hex = controlsNormalizeHexColor(rgbToHex(cluster));
    if (isDisallowedColor(hex)) {
      return;
    }

    const isNearExistingCluster = deduplicatedClusters.some(
      (existingCluster) => getRgbDistanceBetween(existingCluster, cluster) < 26
    );
    if (isNearExistingCluster) {
      return;
    }

    const hsl = controlsHexToHsl(hex);
    deduplicatedClusters.push({
      ...cluster,
      hex,
      hsl,
      relevance:
        cluster.weight *
        (1 + hsl.s / 220) *
        (0.92 + Math.abs(hsl.l - 50) / 180),
    });
  });

  return deduplicatedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function selectRelevantImageClusters(clusters, targetCount) {
  const pool = [...clusters];
  const selectedClusters = [];

  while (pool.length > 0 && selectedClusters.length < Math.min(targetCount, pool.length)) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((cluster, index) => {
      const nearestDistance = selectedClusters.length
        ? Math.min(
            ...selectedClusters.map((selectedCluster) =>
              getRgbDistanceBetween(selectedCluster, cluster)
            )
          )
        : 72;
      const diversityBoost = selectedClusters.length
        ? 0.7 + Math.min(nearestDistance / 120, 0.9)
        : 1;
      const randomBoost = 0.88 + Math.random() * 0.26;
      const score = cluster.relevance * diversityBoost * randomBoost;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selectedClusters.push(pool.splice(bestIndex, 1)[0]);
  }

  return selectedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function expandImagePalette(selectedClusters, targetCount) {
  const palette = selectedClusters.map((cluster) => cluster.hex);
  const usedColors = new Set(palette);
  const lightnessOffsets = [-18, 18, -10, 10, -28, 28, -36, 36];
  let variantIndex = 0;

  while (palette.length < targetCount && selectedClusters.length > 0) {
    const cluster = selectedClusters[variantIndex % selectedClusters.length];
    const offset = lightnessOffsets[
      Math.floor(variantIndex / selectedClusters.length) % lightnessOffsets.length
    ];
    const variantHex = controlsNormalizeHexColor(
      controlsHslToHex(
        cluster.hsl.h,
        clampControlValue(cluster.hsl.s + (offset > 0 ? -6 : 8), 4, 100),
        clampControlValue(cluster.hsl.l + offset, 8, 92)
      )
    );

    if (!usedColors.has(variantHex) && !isDisallowedColor(variantHex)) {
      usedColors.add(variantHex);
      palette.push(variantHex);
    }

    variantIndex += 1;
    if (variantIndex > selectedClusters.length * lightnessOffsets.length * 2) {
      break;
    }
  }

  return palette.slice(0, targetCount);
}

function getCachedImageColorClusters() {
  return Array.isArray(uploadedBaseImage?.analysisCache?.deduplicatedClusters)
    ? uploadedBaseImage.analysisCache.deduplicatedClusters
    : [];
}

async function getImageColorClusters() {
  const cachedClusters = getCachedImageColorClusters();
  if (cachedClusters.length > 0) {
    return cachedClusters;
  }

  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  const points = await getUploadedImageSamplePoints();
  if (points.length === 0) {
    return [];
  }

  const clusterCount = Math.min(Math.max(MAX_PALETTE_COLORS, 12), points.length);
  const clusters = cleanImageClusterDuplicates(clusterImageColors(points, clusterCount));

  updateUploadedImageAnalysisCache({
    deduplicatedClusters: clusters,
  });

  return clusters;
}

function updatePaletteSizeButtonsAvailability(availableImageColors = null) {
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;

  sizeButtons.forEach((button) => {
    const buttonSize = parseInt(button.dataset.size);
    const shouldDisable =
      paletteBaseMode === "image" &&
      !!uploadedBaseImage?.dataUrl &&
      Number.isFinite(buttonSize) &&
      buttonSize > availableCount;

    button.classList.toggle("is-disabled", shouldDisable);
    button.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
  });
}

async function refreshImageDerivedControls() {
  if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
    updatePaletteSizeButtonsAvailability();

    if (typeof updateRegenerateButtonsAvailability === "function") {
      updateRegenerateButtonsAvailability();
    }
    if (typeof updateAddColorButtonState === "function") {
      updateAddColorButtonState();
    }
    return;
  }

  const clusters = await getImageColorClusters();
  updatePaletteSizeButtonsAvailability(clusters.length);

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }
}

function getImageBasedCandidateColor(existingColors = new Set(), adjacentBaseNames = []) {
  const imageClusters = getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  let bestCandidate = null;
  let bestConflictCount = Infinity;

  imageClusters.forEach((cluster, clusterIndex) => {
    const candidate = getAdjustedPaletteColor(cluster.hex, clusterIndex);

    if (existingColors.has(candidate)) {
      return;
    }

    const candidateBaseName = typeof getNearestColorName === "function"
      ? getNearestColorName(candidate)
      : "";
    const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
      return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
    }, 0);

    if (conflictCount === 0) {
      bestCandidate = candidate;
      bestConflictCount = 0;
      return;
    }

    if (conflictCount < bestConflictCount) {
      bestCandidate = candidate;
      bestConflictCount = conflictCount;
    }
  });

  return bestCandidate;
}

function getImageRegenerationColorForCard(card, existingColors = new Set()) {
  const adjacentBaseNames = typeof getAdjacentBaseColorNames === "function"
    ? getAdjacentBaseColorNames(card)
    : [];

  return getImageBasedCandidateColor(existingColors, adjacentBaseNames);
}

async function buildImageBasedPalette(targetCount) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para generar una paleta desde ella.");
    return [];
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return [];
  }

  const selectedClusters = selectRelevantImageClusters(clusters, targetCount);
  return selectedClusters.length > 0
    ? selectedClusters.map((cluster) => cluster.hex)
    : [];
}

// SIZE SELECTOR

function setPaletteSize(size) {
  paletteSize = size;
  sizeButtons.forEach((button) => {
    button.classList.toggle("active", parseInt(button.dataset.size) === size);
  });
}

function handlePaletteSizeButtonClick(button) {
  if (button?.classList.contains("is-disabled")) {
    return;
  }

  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  setPaletteSize(parseInt(button.dataset.size));
}

sizeButtons.forEach((button) => {
  button.onclick = () => {
    handlePaletteSizeButtonClick(button);
  };
  button.addEventListener("mouseleave", () => {
    button.classList.remove("suppress-hover");
  });
});

// TEMPERATURE

function setTemperatureSelection(nextSelection) {
  const warmSelected = !!nextSelection.warm;
  const coolSelected = !!nextSelection.cool;

  // Keep at least one temperature active
  if (!warmSelected && !coolSelected) {
    temperature = { warm: true, cool: false };
  } else {
    temperature = { warm: warmSelected, cool: coolSelected };
  }

  syncTemperatureControlsState();
}

function toggleTemperature(type) {
  if (isTemperatureLockedBySaturation()) {
    animateSaturationControlAttention();
    return;
  }

  const nextSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  nextSelection[type] = !nextSelection[type];

  // If both become off, turn back the clicked one
  if (!nextSelection.warm && !nextSelection.cool) {
    nextSelection[type] = true;
  }

  setTemperatureSelection(nextSelection);
}

function handleTemperatureButtonClick(type, button) {
  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  toggleTemperature(type);
}

if (warmBtn) {
  warmBtn.onclick = () => handleTemperatureButtonClick("warm", warmBtn);
  warmBtn.addEventListener("mouseleave", () => {
    warmBtn.classList.remove("suppress-hover");
  });
}

if (coolBtn) {
  coolBtn.onclick = () => handleTemperatureButtonClick("cool", coolBtn);
  coolBtn.addEventListener("mouseleave", () => {
    coolBtn.classList.remove("suppress-hover");
  });
}

// RESET

if (resetPaletteBtn) {
  resetPaletteBtn.onclick = () => {
    // Reload page to reset app state
    window.location.reload();
  };
}

// GENERATE

if (generateBtn) {
  generateBtn.onclick = () => {
    void generatePalette();
  };
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.onclick = () => {
    if (paletteBaseMode === "image") {
      void generatePalette();
      return;
    }

    // Pick random controls, then generate one palette
    const randomSize = [3, 6, 9, 12][Math.floor(Math.random() * 4)];
    setPaletteSize(randomSize);

    const randomTemperatureSelection = [
      { warm: true, cool: false },
      { warm: false, cool: true },
      { warm: true, cool: true },
    ][Math.floor(Math.random() * 3)];
    setTemperatureSelection(randomTemperatureSelection);

    if (brightnessInput) {
      // Keep the slider visual range at 0-100, but map the real lightness to 10-90.
      const randomBrightness = 10 + Math.random() * 80;
      brightnessInput.value = ((randomBrightness - 10) / 80) * 100;
      updateBrightnessProgress();
    }

    if (saturationInput) {
      saturationInput.value = Math.round((Math.random() * 100) / 5) * 5;
      updateSaturationProgress();
      syncTemperatureControlsState();
    }

    void generatePalette();
  };
}

function clampControlValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentBrightnessValue() {
  const sliderValue = brightnessInput
    ? parseFloat(brightnessInput.value)
    : DEFAULT_BRIGHTNESS;

  return Number.isFinite(sliderValue) ? sliderValue : DEFAULT_BRIGHTNESS;
}

function getCurrentSaturationValue() {
  const saturationValue = saturationInput
    ? parseFloat(saturationInput.value)
    : DEFAULT_SATURATION;

  return Number.isFinite(saturationValue) ? saturationValue : DEFAULT_SATURATION;
}

function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}

function getTemperatureBasedHue() {
  const useWarmPalette =
    temperature.warm && (!temperature.cool || Math.random() < 0.5);

  if (useWarmPalette) {
    return Math.random() < 0.2
      ? 300 + Math.random() * 60
      : Math.random() * 60;
  }

  return 120 + Math.random() * 180;
}

function buildAlternativeMonochromePalette(targetCount) {
  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = 10 + (getCurrentBrightnessValue() / 100) * 80;
  const monochromeSaturation = clampControlValue(
    getCurrentSaturationValue(),
    0,
    LOW_SATURATION_FALLBACK_THRESHOLD
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 8, 36, 72);

  let minLightness = clampControlValue(centerLightness - spread / 2, 10, 90);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 10, 90);

  if (maxLightness - minLightness < 24) {
    minLightness = 10;
    maxLightness = 90;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -6, 6, -12, 12, -18, 18];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const candidate = controlsNormalizeHexColor(
        controlsHslToHex(
          baseHue,
          monochromeSaturation,
          clampControlValue(baseLightness + adjustment, 10, 90)
        )
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

async function generatePalette() {
  let nextPalette = [];
  let usedAlternativePalette = false;

  if (paletteBaseMode === "image") {
    try {
      nextPalette = await buildImageBasedPalette(paletteSize);
    } catch (error) {
      console.error(error);
      alert("No se pudo generar una paleta desde esta imagen.");
      return;
    }

    if (nextPalette.length === 0) {
      return;
    }
  } else {
    const usedColors = new Set();
    const maxRetriesPerColor = 12;

    for (let i = 0; i < paletteSize; i++) {
      let color = null;
      let retries = 0;

      // Retry silently before giving up on this slot
      while (!color && retries < maxRetriesPerColor) {
        color = getUniqueGeneratedColor(usedColors);
        retries++;
      }

      if (!color) {
        // Stop generation quietly if uniqueness constraints cannot be satisfied
        break;
      }

      usedColors.add(color);
      nextPalette.push(color);
    }

    if (nextPalette.length < paletteSize && shouldUseAlternativePalette()) {
      const alternativePalette = buildAlternativeMonochromePalette(paletteSize);

      if (alternativePalette.length === paletteSize) {
        nextPalette = alternativePalette;
        usedAlternativePalette = true;
      }
    }
  }

  // Remove only color cards and keep the add card
  getColorCards().forEach((card) => card.remove());

  capturePaletteAdjustmentBase(nextPalette);
  currentPalette = buildAdjustedPaletteFromBase();
  currentPalette.forEach((color) => {
    createColorCard(color);
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  saveHistory(currentPalette, { isAlternative: usedAlternativePalette });
}

// GENERATE COLOR

function generateColor() {
  let h = getTemperatureBasedHue();

  let s = getCurrentSaturationValue();

  // Keep the slider at 0-100, but avoid real lightness extremes with a 10-90 range.
  let sliderValue = getCurrentBrightnessValue();
  let l = 10 + (sliderValue / 100) * 80;

  return controlsHslToHex(h, s, l);
}
