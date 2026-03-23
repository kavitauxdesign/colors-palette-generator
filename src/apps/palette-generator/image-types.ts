export type ImageColorOklch = {
  l?: number;
  c?: number;
  h?: number;
};

export type ImageColorHsl = {
  h?: number;
  s?: number;
  l?: number;
};

export type ImageSamplePoint = {
  r: number;
  g: number;
  b: number;
  weight: number;
};

export type ImagePaletteVariantProfile = {
  hueShift?: number;
  saturationShift?: number;
  lightnessShift?: number;
  stagger?: number[];
};

export type InspiredVariantProfile = {
  hueShift: number;
  saturationShift: number;
  lightnessShift: number;
  accentHueShift: number;
  accentBoost: number;
  neutralLift: number;
};

export type ImagePaletteCluster = ImageSamplePoint & {
  hex?: string;
  hsl?: ImageColorHsl | null;
  oklch?: ImageColorOklch | null;
  relevance?: number;
};

export type ImagePaletteAtmosphere = {
  averageSaturation: number;
  averageLightness: number;
  averageHue: number;
  maxWeight?: number;
  maxSaturation?: number;
  lightnessSpread: number;
  warmthBias: number;
};

export type UploadedImageAnalysisCache = {
  points?: ImageSamplePoint[];
  width?: number;
  height?: number;
  deduplicatedClusters?: ImagePaletteCluster[];
};

export type UploadedImageLike = {
  dataUrl?: string | null;
  analysisCache?: UploadedImageAnalysisCache | null;
};

