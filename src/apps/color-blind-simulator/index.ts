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
  severityInput: HTMLInputElement;
  severityValue: HTMLElement;
  severityPill: HTMLElement;
  viewport: HTMLElement;
  modeCopy: HTMLElement;
  modeLabel: HTMLElement;
  activeTypePill: HTMLElement;
  activeTypeDescription: HTMLElement;
  resultCopy: HTMLElement;
  previewImages: HTMLImageElement[];
  simulatedPreviewImages: HTMLImageElement[];
  typeButtons: HTMLButtonElement[];
  modeButtons: HTMLButtonElement[];
};

type VisionTypeDescriptor = {
  pill: string;
  description: string;
  resultCopy: string;
};

const VISION_TYPE_COPY: Record<VisionType, VisionTypeDescriptor> = {
  normal: {
    pill: "Visión normal",
    description:
      "La referencia ya está lista. Aquí aparecerá el resultado procesado cuando conectemos la simulación por píxel.",
    resultCopy:
      "El canvas procesado aparecerá aquí en cuanto conectemos la simulación seleccionada.",
  },
  protanopia: {
    pill: "Protanopia",
    description:
      "La escena queda preparada para comparar la referencia con una simulación de ausencia de sensibilidad al rojo.",
    resultCopy:
      "El panel de salida mostrará la imagen simulada para protanopia en cuanto conectemos el procesamiento.",
  },
  deuteranopia: {
    pill: "Deuteranopia",
    description:
      "La vista se ajusta para una futura comparación con la simulación de ausencia de sensibilidad al verde.",
    resultCopy:
      "El panel de salida mostrará la versión simulada para deuteranopia cuando conectemos el canvas.",
  },
  tritanopia: {
    pill: "Tritanopia",
    description:
      "La interfaz ya deja listo el espacio para una simulación con ausencia de sensibilidad al azul.",
    resultCopy:
      "El panel de salida mostrará la versión simulada para tritanopia cuando el motor esté conectado.",
  },
  protanomaly: {
    pill: "Protanomalía",
    description:
      "La UI ya contempla una simulación de reducción parcial de sensibilidad al rojo.",
    resultCopy:
      "El canvas de salida reflejará la versión preparada para protanomalía en la siguiente iteración.",
  },
  deuteranomaly: {
    pill: "Deuteranomalía",
    description:
      "La pantalla queda lista para conectar una simulación con menor sensibilidad al verde.",
    resultCopy:
      "El canvas de salida reflejará la versión preparada para deuteranomalía en la siguiente iteración.",
  },
  tritanomaly: {
    pill: "Tritanomalía",
    description:
      "La estructura ya soporta una futura simulación con sensibilidad reducida al azul.",
    resultCopy:
      "El canvas de salida reflejará la versión preparada para tritanomalía en la siguiente iteración.",
  },
  achromatopsia: {
    pill: "Acromatopsia",
    description:
      "La interfaz ya reserva el espacio para una simulación sin percepción cromática.",
    resultCopy:
      "El panel de salida mostrará la escena sin componente cromática cuando conectemos el procesamiento.",
  },
  "blue-cone-monochromacy": {
    pill: "Monocromatismo azul",
    description:
      "La comparativa queda preparada para una futura simulación de monocromatismo de conos azules.",
    resultCopy:
      "El panel de salida mostrará la variante preparada para monocromatismo azul cuando activemos el motor.",
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
  simulated: {
    label: "Vista simulada",
    copy: "La pantalla ya reserva el modo de salida aunque todavía no pintemos el resultado final sobre canvas.",
  },
  split: {
    label: "Vista dividida",
    copy: "El visor arranca en modo dividido para marcar el espacio de la simulación.",
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
  const severityInput = root.querySelector("#colorBlindSimulatorSeverity") as HTMLInputElement | null;
  const severityValue = root.querySelector("#colorBlindSimulatorSeverityValue") as HTMLElement | null;
  const severityPill = root.querySelector("#colorBlindSimulatorSeverityPill") as HTMLElement | null;
  const viewport = root.querySelector("#colorBlindSimulatorViewport") as HTMLElement | null;
  const modeCopy = root.querySelector("#colorBlindSimulatorModeCopy") as HTMLElement | null;
  const modeLabel = root.querySelector("#colorBlindSimulatorActiveModeLabel") as HTMLElement | null;
  const activeTypePill = root.querySelector("#colorBlindSimulatorActiveTypePill") as HTMLElement | null;
  const activeTypeDescription = root.querySelector(
    "#colorBlindSimulatorActiveTypeDescription"
  ) as HTMLElement | null;
  const resultCopy = root.querySelector("#colorBlindSimulatorResultCopy") as HTMLElement | null;

  if (
    !fileInput ||
    !dropzonePanel ||
    !previewPanel ||
    !previewImage ||
    !imageName ||
    !replaceButton ||
    !resetButton ||
    !severityInput ||
    !severityValue ||
    !severityPill ||
    !viewport ||
    !modeCopy ||
    !modeLabel ||
    !activeTypePill ||
    !activeTypeDescription ||
    !resultCopy
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
    severityInput,
    severityValue,
    severityPill,
    viewport,
    modeCopy,
    modeLabel,
    activeTypePill,
    activeTypeDescription,
    resultCopy,
    previewImages: Array.from(root.querySelectorAll("[data-preview-image]")) as HTMLImageElement[],
    simulatedPreviewImages: Array.from(
      root.querySelectorAll("[data-simulated-preview-image]")
    ) as HTMLImageElement[],
    typeButtons: Array.from(
      root.querySelectorAll(".color-blind-sim-type-btn[data-vision-type]")
    ) as HTMLButtonElement[],
    modeButtons: Array.from(
      root.querySelectorAll(".color-blind-sim-mode-btn[data-preview-mode]")
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
  let activeSeverity = Number(elements.severityInput.value) || 100;

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
    elements.resultCopy.textContent = descriptor.resultCopy;
  }

  function applyPreviewMode(nextPreviewMode: PreviewMode) {
    activePreviewMode = nextPreviewMode;
    const copy = PREVIEW_MODE_COPY[nextPreviewMode];

    elements.modeButtons.forEach((button) => {
      const isActive = button.dataset.previewMode === nextPreviewMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    elements.viewport.dataset.previewMode = nextPreviewMode;
    elements.modeLabel.textContent = copy.label;
    elements.modeCopy.textContent = copy.copy;
  }

  function applySeverity(nextSeverity: number) {
    activeSeverity = Math.max(0, Math.min(100, Math.round(nextSeverity)));
    elements.severityInput.value = String(activeSeverity);
    elements.severityValue.textContent = `${activeSeverity}%`;
    elements.severityPill.textContent = `Severidad ${activeSeverity}%`;
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

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextPreviewMode = button.dataset.previewMode as PreviewMode | undefined;
      if (!nextPreviewMode || !(nextPreviewMode in PREVIEW_MODE_COPY)) {
        return;
      }

      applyPreviewMode(nextPreviewMode);
    });
  });

  elements.severityInput.addEventListener("input", () => {
    applySeverity(Number(elements.severityInput.value));
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
  applySeverity(activeSeverity);
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
