import type { ImagePaletteVariantProfile, InspiredVariantProfile } from "./image-types";

export const IMAGE_PALETTE_VARIANT_PROFILES: ImagePaletteVariantProfile[] = [
  { hueShift: 0, saturationShift: 0, lightnessShift: 0, stagger: [0, 0, 0, 0] },
  { hueShift: 4, saturationShift: -6, lightnessShift: 8, stagger: [0, 6, -4, 10] },
  { hueShift: -5, saturationShift: 8, lightnessShift: -6, stagger: [0, -8, 6, -12] },
  { hueShift: 10, saturationShift: -10, lightnessShift: 4, stagger: [0, 10, -6, 14] },
  { hueShift: -12, saturationShift: 6, lightnessShift: 10, stagger: [0, -10, 8, -6] },
  { hueShift: 16, saturationShift: -4, lightnessShift: -10, stagger: [0, 12, -10, 6] },
];

export const IMAGE_INSPIRATION_VARIANT_PROFILES: InspiredVariantProfile[] = [
  { hueShift: 10, saturationShift: 10, lightnessShift: 8, accentHueShift: 22, accentBoost: 18, neutralLift: 8 },
  { hueShift: -14, saturationShift: 6, lightnessShift: -6, accentHueShift: -24, accentBoost: 20, neutralLift: 3 },
  { hueShift: 18, saturationShift: -8, lightnessShift: 10, accentHueShift: 28, accentBoost: 16, neutralLift: 10 },
  { hueShift: -20, saturationShift: 12, lightnessShift: 4, accentHueShift: -26, accentBoost: 22, neutralLift: 4 },
  { hueShift: 8, saturationShift: -6, lightnessShift: -10, accentHueShift: 18, accentBoost: 14, neutralLift: -2 },
  { hueShift: 24, saturationShift: 4, lightnessShift: -4, accentHueShift: 34, accentBoost: 24, neutralLift: 6 },
  { hueShift: -26, saturationShift: -2, lightnessShift: 12, accentHueShift: -32, accentBoost: 18, neutralLift: 11 },
];
