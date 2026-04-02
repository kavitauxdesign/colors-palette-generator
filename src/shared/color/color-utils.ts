import Color from "colorjs.io";

import APP_CONSTANTS from "../constants";

export interface ParsedCssColor {
  color: InstanceType<typeof Color>;
  inputValue: string;
  css: string;
  hex: string;
  rgb: [number, number, number];
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  oklch: {
    l: number;
    c: number;
    h: number;
  };
}

function normalizeHexColor(color: unknown) {
  return String(color ?? "").trim().toUpperCase();
}

function normalizeHexInputValue(value: unknown) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) {
    return "";
  }

  const hexCandidate = rawValue.replace(/^#+/, "");
  if (/^[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hexCandidate)) {
    return `#${hexCandidate.toUpperCase()}`;
  }

  return rawValue;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHueDegrees(value: unknown, fallbackHue = 0) {
  const resolvedHue = Number.isFinite(Number(value))
    ? Number(value)
    : Number(fallbackHue);

  if (!Number.isFinite(resolvedHue)) {
    return 0;
  }

  return ((resolvedHue % 360) + 360) % 360;
}

function createColor(color: unknown): InstanceType<typeof Color> | null {
  if (color instanceof Color) {
    return color;
  }

  if (
    color &&
    typeof color === "object" &&
    Number.isFinite((color as { r?: number }).r) &&
    Number.isFinite((color as { g?: number }).g) &&
    Number.isFinite((color as { b?: number }).b)
  ) {
    try {
      return new Color("srgb", [
        clamp(((color as { r: number }).r || 0) / 255, 0, 1),
        clamp(((color as { g: number }).g || 0) / 255, 0, 1),
        clamp(((color as { b: number }).b || 0) / 255, 0, 1),
      ]);
    } catch (error) {
      return null;
    }
  }

  if (
    color &&
    typeof color === "object" &&
    Number.isFinite((color as { h?: number }).h) &&
    Number.isFinite((color as { s?: number }).s) &&
    Number.isFinite((color as { l?: number }).l)
  ) {
    try {
      return new Color("hsl", [
        normalizeHueDegrees((color as { h: number }).h),
        clamp((color as { s: number }).s, 0, 100),
        clamp((color as { l: number }).l, 0, 100),
      ]);
    } catch (error) {
      return null;
    }
  }

  if (color && typeof color === "object" && typeof (color as { hex?: string }).hex === "string") {
    return createColor((color as { hex: string }).hex);
  }

  if (
    color &&
    typeof color === "object" &&
    typeof (color as { space?: unknown }).space !== "undefined" &&
    Array.isArray((color as { coords?: unknown[] }).coords)
  ) {
    try {
      return new Color(color as any);
    } catch (error) {
      return null;
    }
  }

  const normalizedColor = normalizeHexInputValue(color);
  if (!normalizedColor) {
    return null;
  }

  try {
    return new Color(normalizedColor);
  } catch (error) {
    return null;
  }
}

function colorToHex(color: unknown) {
  const parsedColor = createColor(color);
  if (!parsedColor) {
    return null;
  }

  try {
    return normalizeHexColor(
      parsedColor
        .to("srgb")
        .toString({
          format: "hex",
          alpha: false,
          collapse: false,
        })
    );
  } catch (error) {
    return null;
  }
}

function isValidHexColor(hex: unknown) {
  const normalizedHex = normalizeHexColor(hex);

  return APP_CONSTANTS.HEX_6_REGEX.test(normalizedHex) && colorToHex(normalizedHex) === normalizedHex;
}

function parseCssColor(color: unknown): ParsedCssColor | null {
  const inputValue = normalizeHexInputValue(color);
  if (!inputValue) {
    return null;
  }

  const parsedColor = createColor(inputValue);
  const hex = colorToHex(parsedColor);
  if (!parsedColor || !hex) {
    return null;
  }

  const srgbColor = parsedColor.to("srgb");
  const hslColor = parsedColor.to("hsl");
  const oklchColor = parsedColor.to("oklch");
  const [red = 0, green = 0, blue = 0] = srgbColor.coords || [];
  const [hue = 0, saturation = 0, lightness = 0] = hslColor.coords || [];
  const [oklchLightness = 0, oklchChroma = 0, oklchHue = Number.NaN] = oklchColor.coords || [];

  return {
    color: parsedColor,
    inputValue,
    css: hex,
    hex,
    rgb: [
      Math.round(clamp(red, 0, 1) * 255),
      Math.round(clamp(green, 0, 1) * 255),
      Math.round(clamp(blue, 0, 1) * 255),
    ],
    hsl: {
      h: normalizeHueDegrees(hue),
      s: clamp(saturation, 0, 100),
      l: clamp(lightness, 0, 100),
    },
    oklch: {
      l: clamp(oklchLightness, 0, 1),
      c: clamp(oklchChroma, 0, 0.4),
      h: normalizeHueDegrees(oklchHue, hue),
    },
  };
}

function hexToRgb(hex: unknown) {
  if (
    hex &&
    typeof hex === "object" &&
    Number.isFinite((hex as { r?: number }).r) &&
    Number.isFinite((hex as { g?: number }).g) &&
    Number.isFinite((hex as { b?: number }).b)
  ) {
    return {
      r: Math.round(clamp((hex as { r: number }).r, 0, 255)),
      g: Math.round(clamp((hex as { g: number }).g, 0, 255)),
      b: Math.round(clamp((hex as { b: number }).b, 0, 255)),
    };
  }

  const parsedColor = createColor(hex)?.to("srgb");
  const [red = 0, green = 0, blue = 0] = parsedColor?.coords || [];

  return {
    r: Math.round(clamp(red, 0, 1) * 255),
    g: Math.round(clamp(green, 0, 1) * 255),
    b: Math.round(clamp(blue, 0, 1) * 255),
  };
}

function rgbToHex(color: unknown) {
  if (
    color &&
    typeof color === "object" &&
    Number.isFinite((color as { r?: number }).r) &&
    Number.isFinite((color as { g?: number }).g) &&
    Number.isFinite((color as { b?: number }).b)
  ) {
    return normalizeHexColor(
      `#${[(color as { r: number }).r, (color as { g: number }).g, (color as { b: number }).b]
        .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
        .join("")}`
    );
  }

  return colorToHex(color);
}

function hslToHex(h: number, s: number, l: number) {
  return colorToHex(
    new Color("hsl", [
      normalizeHueDegrees(h),
      clamp(Number(s), 0, 100),
      clamp(Number(l), 0, 100),
    ])
  );
}

function hexToHsl(hex: unknown) {
  const parsedColor = createColor(hex)?.to("hsl");
  const [hue = 0, saturation = 0, lightness = 0] = parsedColor?.coords || [];

  return {
    h: normalizeHueDegrees(hue),
    s: clamp(saturation, 0, 100),
    l: clamp(lightness, 0, 100),
  };
}

function colorToOklch(color: unknown, options: { maxChroma?: number; fallbackHue?: number } = {}) {
  const parsedColor = createColor(color);
  if (!parsedColor) {
    return null;
  }

  const maxChroma = Number.isFinite(options.maxChroma) ? Number(options.maxChroma) : 0.4;
  const fallbackHue = Number.isFinite(options.fallbackHue)
    ? Number(options.fallbackHue)
    : createColor(color)?.to("hsl")?.coords?.[0] || 0;

  try {
    const oklchColor = parsedColor.to("oklch");
    const [lightness = 0, chroma = 0, hue = Number.NaN] = oklchColor.coords || [];

    return {
      l: clamp(lightness, 0, 1),
      c: clamp(chroma, 0, maxChroma),
      h: normalizeHueDegrees(hue, fallbackHue),
    };
  } catch (error) {
    return null;
  }
}

function hexToOklch(hex: unknown, options: { maxChroma?: number; fallbackHue?: number } = {}) {
  return colorToOklch(hex, options);
}

function oklchToHex(
  lightness: number,
  chroma: number,
  hue: number,
  options: {
    minLightness?: number;
    maxLightness?: number;
    maxChroma?: number;
    outputSpace?: string;
    gamutMethod?: string;
    fallbackHue?: number;
  } = {}
) {
  const minLightness = Number.isFinite(options.minLightness) ? Number(options.minLightness) : 0;
  const maxLightness = Number.isFinite(options.maxLightness) ? Number(options.maxLightness) : 1;
  const maxChroma = Number.isFinite(options.maxChroma) ? Number(options.maxChroma) : 0.4;
  const outputSpace = options.outputSpace || "srgb";
  const gamutMethod = options.gamutMethod || "oklch.c";

  let color: InstanceType<typeof Color> | null = null;

  try {
    color = new Color("oklch", [
      clamp(Number(lightness), minLightness, maxLightness),
      clamp(Number(chroma), 0, maxChroma),
      normalizeHueDegrees(hue, options.fallbackHue),
    ]);
  } catch (error) {
    return null;
  }

  if (typeof (color as any).toGamut === "function") {
    try {
      color = (color as any).toGamut({
        space: outputSpace,
        method: gamutMethod,
      });
    } catch (error) {
      return null;
    }
  }

  return colorToHex(color);
}

function getRelativeLuminance(color: unknown) {
  const parsedColor = createColor(color);
  return parsedColor ? (parsedColor as any).luminance : 0;
}

function getPerceivedLightness(color: unknown) {
  const oklch = colorToOklch(color);
  if (oklch) {
    return oklch.l;
  }

  const { r, g, b } = hexToRgb(color);
  return ((r * 299) + (g * 587) + (b * 114)) / 2550;
}

function getRgbDistance(colorA: unknown, colorB: unknown) {
  const rgbA = hexToRgb(colorA);
  const rgbB = hexToRgb(colorB);
  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function getColorDistance(
  colorA: unknown,
  colorB: unknown,
  options: { method?: string } = {}
) {
  const method = String(options.method || "deltae76").toLowerCase();

  if (method === "rgb") {
    return getRgbDistance(colorA, colorB);
  }

  const parsedColorA = createColor(colorA);
  const parsedColorB = createColor(colorB);
  if (!parsedColorA || !parsedColorB) {
    return Number.POSITIVE_INFINITY;
  }

  if (method === "deltae2000" || method === "2000") {
    return (parsedColorA as any).deltaE(parsedColorB, "2000");
  }

  return (parsedColorA as any).deltaE(parsedColorB, "76");
}

function getContrastRatio(colorA: unknown, colorB: unknown) {
  const parsedColorA = createColor(colorA);
  const parsedColorB = createColor(colorB);

  if (!parsedColorA || !parsedColorB) {
    return 1;
  }

  return (parsedColorA as any).contrast(parsedColorB, "WCAG21");
}

function getReadableTextColor(
  backgroundColor: unknown,
  options: { lightColor?: string; darkColor?: string } = {}
) {
  const lightColor = options.lightColor || "#FFFFFF";
  const darkColor = options.darkColor || "#000000";
  const lightContrast = getContrastRatio(lightColor, backgroundColor);
  const darkContrast = getContrastRatio(darkColor, backgroundColor);

  return lightContrast >= darkContrast ? lightColor : darkColor;
}

function mixHexColors(
  baseColor: unknown,
  mixColor: unknown,
  mixAmount: number,
  options: { space?: string } = {}
) {
  const parsedBaseColor = createColor(baseColor);
  const parsedMixColor = createColor(mixColor);
  if (!parsedBaseColor || !parsedMixColor) {
    return null;
  }

  const range = (parsedBaseColor as any).range(parsedMixColor, {
    space: options.space || "srgb",
    outputSpace: "srgb",
  });

  return colorToHex(range(clamp(Number(mixAmount), 0, 1)));
}

function getHexColorSteps(
  startColor: unknown,
  endColor: unknown,
  stepCount: number,
  options: { space?: string; outputSpace?: string } = {}
) {
  const parsedStartColor = createColor(startColor);
  const parsedEndColor = createColor(endColor);
  const resolvedStepCount = Math.max(2, Math.round(Number(stepCount) || 0));

  if (!parsedStartColor || !parsedEndColor) {
    return [];
  }

  return (parsedStartColor as any)
    .steps(parsedEndColor, {
      space: options.space || "oklch",
      outputSpace: options.outputSpace || "srgb",
      steps: resolvedStepCount,
    })
    .map((color: unknown) => colorToHex(color))
    .filter(Boolean);
}

export const AppColorUtils = {
  Color,
  createColor,
  parseCssColor,
  colorToHex,
  normalizeHexColor,
  normalizeHexInputValue,
  isValidHexColor,
  hexToRgb,
  rgbToHex,
  hslToHex,
  hexToHsl,
  colorToOklch,
  hexToOklch,
  oklchToHex,
  getRelativeLuminance,
  getPerceivedLightness,
  getRgbDistance,
  getColorDistance,
  getContrastRatio,
  getReadableTextColor,
  mixHexColors,
  getHexColorSteps,
};

window.Color = Color;
window.AppColorUtils = AppColorUtils;

export default AppColorUtils;
