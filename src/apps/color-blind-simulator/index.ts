import AppRegistry from "../../shared/services/registry";

type VisionType =
  | "normal"
  | "achromatopsia"
  | "protanopia"
  | "deuteranomaly";

type PreviewMode = "original" | "simulated" | "split";

type ColorBlindSimulatorElements = {
  root: HTMLElement;
  fileInput: HTMLInputElement;
  dropzonePanel: HTMLElement;
  previewPanel: HTMLElement;
  previewImage: HTMLImageElement;
  imageName: HTMLElement;
  replaceButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  viewport: HTMLElement;
  simulatedCanvas: HTMLCanvasElement;
  modeLabel: HTMLElement;
  defaultCaption: HTMLElement;
  splitToggleButton: HTMLButtonElement;
  splitToggleDivider: SVGPathElement;
  splitToggleTooltip: HTMLElement;
  activeTypePill: HTMLElement;
  previewImages: HTMLImageElement[];
  simulatedPreviewImages: HTMLImageElement[];
  typeButtons: HTMLButtonElement[];
};

type VisionTypeDescriptor = {
  pill: string;
};

type ColorVisionMatrix = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const VISION_TYPE_COPY: Record<VisionType, VisionTypeDescriptor> = {
  normal: {
    pill: "Visión normal",
  },
  achromatopsia: {
    pill: "Acromatopsia",
  },
  protanopia: {
    pill: "Protanopia",
  },
  deuteranomaly: {
    pill: "Deuteranomalía",
  },
};

const PREVIEW_PANEL_TITLE = "Vista previa";
const DEFAULT_PREVIEW_SRC = "assets/peter-olexa-unsplash.jpg";
const SPLIT_TOGGLE_COPY = {
  active: "Visión dividida activa",
  inactive: "Visión dividida inactiva",
} as const;

const IDENTITY_COLOR_VISION_MATRIX: ColorVisionMatrix = [
  1,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  1,
];

const DEUTERANOPIA_COLOR_VISION_MATRIX: ColorVisionMatrix = [
  0.367322,
  0.860646,
  -0.227968,
  0.280085,
  0.672501,
  0.047413,
  -0.01182,
  0.04294,
  0.968881,
];

const PROTANOPIA_COLOR_VISION_MATRIX: ColorVisionMatrix = [
  0.152286,
  1.052583,
  -0.204868,
  0.114503,
  0.786281,
  0.099216,
  -0.003882,
  -0.048116,
  1.051998,
];

const REDUCED_VISION_STRENGTH = 0.65;

function createReducedColorVisionMatrix(matrix: ColorVisionMatrix): ColorVisionMatrix {
  const mixCoefficient = (index: number) =>
    IDENTITY_COLOR_VISION_MATRIX[index] +
    (matrix[index] - IDENTITY_COLOR_VISION_MATRIX[index]) * REDUCED_VISION_STRENGTH;

  return [
    mixCoefficient(0),
    mixCoefficient(1),
    mixCoefficient(2),
    mixCoefficient(3),
    mixCoefficient(4),
    mixCoefficient(5),
    mixCoefficient(6),
    mixCoefficient(7),
    mixCoefficient(8),
  ];
}

const COLOR_VISION_MATRICES: Partial<Record<VisionType, ColorVisionMatrix>> = {
  deuteranomaly: createReducedColorVisionMatrix(DEUTERANOPIA_COLOR_VISION_MATRIX),
  protanopia: PROTANOPIA_COLOR_VISION_MATRIX,
};

const ACCEPTED_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
const ACCEPTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
]);

let isColorBlindSimulatorInitialized = false;

function isAcceptedImageFile(file: File | null) {
  if (!(file instanceof File)) {
    return false;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return (
    ACCEPTED_FILE_TYPES.has(file.type) ||
    ACCEPTED_FILE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  );
}

function applyAchromatopsia(imageData: ImageData) {
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = Math.round(
      data[index] * 0.2126 + data[index + 1] * 0.7152 + data[index + 2] * 0.0722
    );

    data[index] = luminance;
    data[index + 1] = luminance;
    data[index + 2] = luminance;
  }
}

function clampColorChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function resolveElements(root: HTMLElement): ColorBlindSimulatorElements | null {
  const fileInput = root.querySelector("#colorBlindSimulatorImageInput") as HTMLInputElement | null;
  const dropzonePanel = root.querySelector(
    "#colorBlindSimulatorImageDropzonePanel"
  ) as HTMLElement | null;
  const previewPanel = root.querySelector(
    "#colorBlindSimulatorImagePreview"
  ) as HTMLElement | null;
  const previewImage = root.querySelector(
    "#colorBlindSimulatorPreviewImg"
  ) as HTMLImageElement | null;
  const imageName = root.querySelector("#colorBlindSimulatorImageName") as HTMLElement | null;
  const replaceButton = root.querySelector(
    "#colorBlindSimulatorReplaceBtn"
  ) as HTMLButtonElement | null;
  const resetButton = root.querySelector("#colorBlindSimulatorResetBtn") as HTMLButtonElement | null;
  const viewport = root.querySelector("#colorBlindSimulatorViewport") as HTMLElement | null;
  const simulatedCanvas = root.querySelector(
    "#colorBlindSimulatorCanvas"
  ) as HTMLCanvasElement | null;
  const modeLabel = root.querySelector("#colorBlindSimulatorActiveModeLabel") as HTMLElement | null;
  const defaultCaption = root.querySelector("#colorBlindSimulatorDefaultCaption") as HTMLElement | null;
  const splitToggleButton = root.querySelector(
    "#colorBlindSimulatorSplitToggle"
  ) as HTMLButtonElement | null;
  const splitToggleDivider = splitToggleButton?.querySelector(
    "#colorBlindSimulatorSplitToggleDivider"
  ) as SVGPathElement | null;
  const splitToggleTooltip = splitToggleButton?.querySelector(".tooltip") as HTMLElement | null;
  const activeTypePill = root.querySelector("#colorBlindSimulatorActiveTypePill") as HTMLElement | null;

  if (
    !fileInput ||
    !dropzonePanel ||
    !previewPanel ||
    !previewImage ||
    !imageName ||
    !replaceButton ||
    !resetButton ||
    !viewport ||
    !simulatedCanvas ||
    !modeLabel ||
    !defaultCaption ||
    !splitToggleButton ||
    !splitToggleDivider ||
    !splitToggleTooltip ||
    !activeTypePill
  ) {
    return null;
  }

  return {
    root,
    fileInput,
    dropzonePanel,
    previewPanel,
    previewImage,
    imageName,
    replaceButton,
    resetButton,
    viewport,
    simulatedCanvas,
    modeLabel,
    defaultCaption,
    splitToggleButton,
    splitToggleDivider,
    splitToggleTooltip,
    activeTypePill,
    previewImages: Array.from(root.querySelectorAll("[data-preview-image]")) as HTMLImageElement[],
    simulatedPreviewImages: Array.from(
      root.querySelectorAll("[data-simulated-preview-image]")
    ) as HTMLImageElement[],
    typeButtons: Array.from(
      root.querySelectorAll(".color-blind-sim-type-btn[data-vision-type]")
    ) as HTMLButtonElement[],
  };
}

function initializeColorBlindSimulatorApp() {
  if (isColorBlindSimulatorInitialized) {
    return;
  }

  const root = document.getElementById("colorBlindSimulatorApp");
  if (!root) {
    return;
  }

  const elements = resolveElements(root);
  if (!elements) {
    return;
  }

  isColorBlindSimulatorInitialized = true;

  const defaultPreviewSrc =
    elements.previewImages.find((image) => !!image.getAttribute("src"))?.getAttribute("src") ||
    DEFAULT_PREVIEW_SRC;
  let activePreviewUrl: string | null = null;
  let activeVisionType: VisionType = "normal";
  let activePreviewMode: PreviewMode = "simulated";

  function revokeActivePreviewUrl() {
    if (!activePreviewUrl || !activePreviewUrl.startsWith("blob:")) {
      return;
    }

    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = null;
  }

  function applyColorVisionMatrix(imageData: ImageData, matrix: ColorVisionMatrix) {
    const { data } = imageData;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      data[index] = clampColorChannel(red * matrix[0] + green * matrix[1] + blue * matrix[2]);
      data[index + 1] = clampColorChannel(red * matrix[3] + green * matrix[4] + blue * matrix[5]);
      data[index + 2] = clampColorChannel(red * matrix[6] + green * matrix[7] + blue * matrix[8]);
    }
  }

  function updateDefaultCaptionVisibility(isDefaultImage: boolean) {
    elements.defaultCaption.hidden = !isDefaultImage;
  }

  function syncPreviewAspectRatio() {
    const image = elements.previewImages[0];
    if (!image) {
      return;
    }

    const applyNativeRatio = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        return;
      }

      elements.viewport.style.setProperty(
        "--color-blind-sim-preview-ratio",
        `${image.naturalWidth} / ${image.naturalHeight}`
      );
    };

    if (image.complete) {
      applyNativeRatio();
      return;
    }

    image.addEventListener("load", applyNativeRatio, { once: true });
  }

  function renderSimulatedPreview() {
    const image = elements.previewImages[0];
    const canvas = elements.simulatedCanvas;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!image || !context) {
      return;
    }

    if (!image.complete || !image.naturalWidth || !image.naturalHeight) {
      image.addEventListener("load", renderSimulatedPreview, { once: true });
      return;
    }

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const colorVisionMatrix = COLOR_VISION_MATRICES[activeVisionType];
    if (activeVisionType !== "achromatopsia" && !colorVisionMatrix) {
      return;
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    if (activeVisionType === "achromatopsia") {
      applyAchromatopsia(imageData);
    } else if (colorVisionMatrix) {
      applyColorVisionMatrix(imageData, colorVisionMatrix);
    }
    context.putImageData(imageData, 0, 0);
  }

  function updatePreviewImages(src: string, options: { isDefaultImage: boolean }) {
    elements.previewImage.src = src;

    elements.previewImages.forEach((image) => {
      image.src = src;
    });

    elements.simulatedPreviewImages.forEach((image) => {
      image.src = src;
    });

    updateDefaultCaptionVisibility(options.isDefaultImage);
    syncPreviewAspectRatio();
    renderSimulatedPreview();
  }

  function setImageStepState(state: { hasPreview: boolean; imageName?: string | null }) {
    elements.dropzonePanel.hidden = state.hasPreview;
    elements.previewPanel.hidden = !state.hasPreview;

    if (typeof state.imageName === "string") {
      elements.imageName.textContent = state.imageName;
    }
  }

  function applyVisionType(nextVisionType: VisionType) {
    activeVisionType = nextVisionType;
    const descriptor = VISION_TYPE_COPY[nextVisionType];

    elements.typeButtons.forEach((button) => {
      const isActive = button.dataset.visionType === nextVisionType;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    elements.activeTypePill.textContent = descriptor.pill;
    renderSimulatedPreview();
  }

  function applyPreviewMode(nextPreviewMode: PreviewMode) {
    activePreviewMode = nextPreviewMode;
    const isSplitActive = nextPreviewMode === "split";
    const splitToggleText = isSplitActive ? SPLIT_TOGGLE_COPY.active : SPLIT_TOGGLE_COPY.inactive;

    elements.viewport.dataset.previewMode = nextPreviewMode;
    elements.modeLabel.textContent = PREVIEW_PANEL_TITLE;
    elements.splitToggleButton.classList.toggle("is-active", isSplitActive);
    elements.splitToggleButton.dataset.state = isSplitActive ? "active" : "inactive";
    elements.splitToggleButton.setAttribute("aria-pressed", isSplitActive ? "true" : "false");
    elements.splitToggleButton.setAttribute("aria-label", splitToggleText);
    elements.splitToggleButton.title = splitToggleText;
    elements.splitToggleDivider.toggleAttribute("hidden", !isSplitActive);
    elements.splitToggleTooltip.textContent = splitToggleText;
  }

  function restoreDefaultImage() {
    revokeActivePreviewUrl();
    updatePreviewImages(defaultPreviewSrc, { isDefaultImage: true });
    elements.fileInput.value = "";
    setImageStepState({
      hasPreview: true,
      imageName: "Imagen por defecto",
    });
  }

  function loadSelectedFile(file: File) {
    revokeActivePreviewUrl();
    activePreviewUrl = URL.createObjectURL(file);
    updatePreviewImages(activePreviewUrl, { isDefaultImage: false });
    setImageStepState({
      hasPreview: true,
      imageName: file.name,
    });
  }

  elements.typeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextVisionType = button.dataset.visionType as VisionType | undefined;
      if (!nextVisionType || !(nextVisionType in VISION_TYPE_COPY)) {
        return;
      }

      applyVisionType(nextVisionType);
    });
  });

  elements.splitToggleButton.addEventListener("click", () => {
    applyPreviewMode(activePreviewMode === "split" ? "simulated" : "split");
  });

  elements.replaceButton.addEventListener("click", () => {
    if (typeof elements.fileInput.showPicker === "function") {
      elements.fileInput.showPicker();
      return;
    }

    elements.fileInput.click();
  });

  elements.resetButton.addEventListener("click", () => {
    restoreDefaultImage();
  });

  elements.fileInput.addEventListener("change", () => {
    const file = elements.fileInput.files?.[0] || null;
    if (!file) {
      return;
    }

    if (!isAcceptedImageFile(file)) {
      elements.fileInput.value = "";
      return;
    }

    loadSelectedFile(file);
  });

  window.addEventListener(
    "beforeunload",
    () => {
      revokeActivePreviewUrl();
    },
    { once: true }
  );

  applyVisionType(activeVisionType);
  applyPreviewMode(activePreviewMode);
  updateDefaultCaptionVisibility(true);
  syncPreviewAspectRatio();
  renderSimulatedPreview();
  setImageStepState({
    hasPreview: false,
  });
}

export function registerColorBlindSimulatorApp() {
  const colorBlindSimulatorApp = {
    initialize: initializeColorBlindSimulatorApp,
  };

  window.ColorBlindSimulatorApp = colorBlindSimulatorApp;
  AppRegistry.register("color-blind-simulator", colorBlindSimulatorApp);
  return colorBlindSimulatorApp;
}

export default registerColorBlindSimulatorApp;
