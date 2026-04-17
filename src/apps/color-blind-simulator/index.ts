import AppRegistry from "../../shared/services/registry";

type VisionType =
  | "normal"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "protanomaly"
  | "deuteranomaly"
  | "tritanomaly"
  | "achromatopsia"
  | "blue-cone-monochromacy";

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
  modeLabel: HTMLElement;
  splitToggleButton: HTMLButtonElement;
  activeTypePill: HTMLElement;
  activeTypeDescription: HTMLElement;
  previewImages: HTMLImageElement[];
  simulatedPreviewImages: HTMLImageElement[];
  typeButtons: HTMLButtonElement[];
};

type VisionTypeDescriptor = {
  pill: string;
  description: string;
};

const VISION_TYPE_COPY: Record<VisionType, VisionTypeDescriptor> = {
  normal: {
    pill: "Visión normal",
    description:
      "La referencia ya está lista. Aquí aparecerá el resultado procesado cuando conectemos la simulación por píxel.",
  },
  protanopia: {
    pill: "Protanopia",
    description:
      "La escena queda preparada para comparar la referencia con una simulación de ausencia de sensibilidad al rojo.",
  },
  deuteranopia: {
    pill: "Deuteranopia",
    description:
      "La vista se ajusta para una futura comparación con la simulación de ausencia de sensibilidad al verde.",
  },
  tritanopia: {
    pill: "Tritanopia",
    description:
      "La interfaz ya deja listo el espacio para una simulación con ausencia de sensibilidad al azul.",
  },
  protanomaly: {
    pill: "Protanomalía",
    description:
      "La UI ya contempla una simulación de reducción parcial de sensibilidad al rojo.",
  },
  deuteranomaly: {
    pill: "Deuteranomalía",
    description:
      "La pantalla queda lista para conectar una simulación con menor sensibilidad al verde.",
  },
  tritanomaly: {
    pill: "Tritanomalía",
    description:
      "La estructura ya soporta una futura simulación con sensibilidad reducida al azul.",
  },
  achromatopsia: {
    pill: "Acromatopsia",
    description:
      "La interfaz ya reserva el espacio para una simulación sin percepción cromática.",
  },
  "blue-cone-monochromacy": {
    pill: "Monocromatismo azul",
    description:
      "La comparativa queda preparada para una futura simulación de monocromatismo de conos azules.",
  },
};

const PREVIEW_MODE_COPY: Record<
  PreviewMode,
  {
    label: string;
    copy: string;
  }
> = {
  original: {
    label: "Vista original",
    copy: "El visor muestra la referencia limpia para revisar encuadre, escala y composición antes del procesamiento.",
  },
  split: {
    label: "Vista dividida",
    copy: "",
  },
  simulated: {
    label: "Vista simulada",
    copy: "",
  },
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
  const modeLabel = root.querySelector("#colorBlindSimulatorActiveModeLabel") as HTMLElement | null;
  const splitToggleButton = root.querySelector(
    "#colorBlindSimulatorSplitToggle"
  ) as HTMLButtonElement | null;
  const activeTypePill = root.querySelector("#colorBlindSimulatorActiveTypePill") as HTMLElement | null;
  const activeTypeDescription = root.querySelector(
    "#colorBlindSimulatorActiveTypeDescription"
  ) as HTMLElement | null;

  if (
    !fileInput ||
    !dropzonePanel ||
    !previewPanel ||
    !previewImage ||
    !imageName ||
    !replaceButton ||
    !resetButton ||
    !viewport ||
    !modeLabel ||
    !splitToggleButton ||
    !activeTypePill ||
    !activeTypeDescription
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
    modeLabel,
    splitToggleButton,
    activeTypePill,
    activeTypeDescription,
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
    "assets/lightsaber.png";
  let activePreviewUrl: string | null = null;
  let activeVisionType: VisionType = "normal";
  let activePreviewMode: PreviewMode = "split";

  function revokeActivePreviewUrl() {
    if (!activePreviewUrl || !activePreviewUrl.startsWith("blob:")) {
      return;
    }

    URL.revokeObjectURL(activePreviewUrl);
    activePreviewUrl = null;
  }

  function updatePreviewImages(src: string) {
    elements.previewImage.src = src;

    elements.previewImages.forEach((image) => {
      image.src = src;
    });

    elements.simulatedPreviewImages.forEach((image) => {
      image.src = src;
    });
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
    elements.activeTypeDescription.textContent = descriptor.description;
  }

  function applyPreviewMode(nextPreviewMode: PreviewMode) {
    activePreviewMode = nextPreviewMode;
    const copy = PREVIEW_MODE_COPY[nextPreviewMode];
    const isSplitActive = nextPreviewMode === "split";

    elements.viewport.dataset.previewMode = nextPreviewMode;
    elements.modeLabel.textContent = copy.label;
    elements.splitToggleButton.classList.toggle("is-active", isSplitActive);
    elements.splitToggleButton.setAttribute("aria-pressed", isSplitActive ? "true" : "false");
  }

  function restoreDefaultImage() {
    revokeActivePreviewUrl();
    updatePreviewImages(defaultPreviewSrc);
    elements.fileInput.value = "";
    setImageStepState({
      hasPreview: true,
      imageName: "Imagen por defecto",
    });
  }

  function loadSelectedFile(file: File) {
    revokeActivePreviewUrl();
    activePreviewUrl = URL.createObjectURL(file);
    updatePreviewImages(activePreviewUrl);
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
