import APP_CONSTANTS from "../../shared/constants";
import PaletteGeneratorImageAnalysisHelpers, {
  type ImagePaletteCluster,
  type ImageSamplePoint,
} from "./image-analysis-helpers";

type UploadedImageLike = {
  dataUrl?: string | null;
  analysisCache?: {
    points?: ImageSamplePoint[];
    deduplicatedClusters?: ImagePaletteCluster[];
  } | null;
};

type ImageAnalysisCachePatch = {
  points?: ImageSamplePoint[];
  width?: number;
  height?: number;
  deduplicatedClusters?: ImagePaletteCluster[];
};

type ImageAnalysisStatefulOptions = {
  uploadedBaseImage?: UploadedImageLike | null;
  updateUploadedImageAnalysisCache?: ((cachePatch: ImageAnalysisCachePatch) => void) | null;
  maxDimension?: unknown;
  maxPaletteColors?: unknown;
  isDisallowedColor?: ((hex: string) => boolean) | null;
};

const {
  clusterImageColors,
  cleanImageClusterDuplicates,
} = PaletteGeneratorImageAnalysisHelpers;

function loadImageElement(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for palette extraction."));
    image.src = dataUrl;
  });
}

async function getUploadedImageSamplePoints(options: ImageAnalysisStatefulOptions = {}) {
  const uploadedBaseImage = options.uploadedBaseImage;
  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  if (Array.isArray(uploadedBaseImage.analysisCache?.points)) {
    return uploadedBaseImage.analysisCache.points;
  }

  const image = await loadImageElement(uploadedBaseImage.dataUrl);
  const maxDimension = Number.isFinite(options.maxDimension)
    ? Math.max(1, Number(options.maxDimension))
    : 56;
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
  const quantizedColors = new Map<string, ImageSamplePoint>();

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
  if (typeof options.updateUploadedImageAnalysisCache === "function") {
    options.updateUploadedImageAnalysisCache({
      points,
      width,
      height,
    });
  }

  return points;
}

function getCachedImageColorClusters(uploadedBaseImage?: UploadedImageLike | null) {
  return Array.isArray(uploadedBaseImage?.analysisCache?.deduplicatedClusters)
    ? uploadedBaseImage.analysisCache.deduplicatedClusters
    : [];
}

async function getImageColorClusters(options: ImageAnalysisStatefulOptions = {}) {
  const uploadedBaseImage = options.uploadedBaseImage;
  const cachedClusters = getCachedImageColorClusters(uploadedBaseImage);
  if (cachedClusters.length > 0) {
    return cachedClusters;
  }

  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  const points = await getUploadedImageSamplePoints(options);
  if (points.length === 0) {
    return [];
  }

  const clusterCount = Math.min(
    Math.max(
      Number.isFinite(options.maxPaletteColors)
        ? Number(options.maxPaletteColors)
        : APP_CONSTANTS.MAX_PALETTE_COLORS,
      12
    ),
    points.length
  );
  const clusters = cleanImageClusterDuplicates(clusterImageColors(points, clusterCount), {
    isDisallowedColor: options.isDisallowedColor,
  });

  if (typeof options.updateUploadedImageAnalysisCache === "function") {
    options.updateUploadedImageAnalysisCache({
      deduplicatedClusters: clusters,
    });
  }

  return clusters;
}

export const PaletteGeneratorImageAnalysisStateful = {
  loadImageElement,
  getUploadedImageSamplePoints,
  getCachedImageColorClusters,
  getImageColorClusters,
};

window.PaletteGeneratorImageAnalysisStateful = PaletteGeneratorImageAnalysisStateful;

export default PaletteGeneratorImageAnalysisStateful;
