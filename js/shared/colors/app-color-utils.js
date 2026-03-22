// Shared color math helpers
// Keep Color.js-backed conversion logic in one place to avoid duplication
(function initAppColorUtils() {
  const { HEX_6_REGEX } = window.AppConstants || {
    HEX_6_REGEX: /^#[0-9A-F]{6}$/,
  };
  const ColorConstructor = window.Color;

  if (typeof ColorConstructor !== "function") {
    throw new Error("Color.js global is required before AppColorUtils loads.");
  }

  function normalizeHexColor(color) {
    return String(color ?? "").trim().toUpperCase();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeHueDegrees(value, fallbackHue = 0) {
    const resolvedHue = Number.isFinite(Number(value))
      ? Number(value)
      : Number(fallbackHue);

    if (!Number.isFinite(resolvedHue)) {
      return 0;
    }

    return ((resolvedHue % 360) + 360) % 360;
  }

  function createColor(color) {
    if (color instanceof ColorConstructor) {
      return color;
    }

    if (
      color &&
      typeof color === "object" &&
      Number.isFinite(color.r) &&
      Number.isFinite(color.g) &&
      Number.isFinite(color.b)
    ) {
      try {
        return new ColorConstructor("srgb", [
          clamp(color.r / 255, 0, 1),
          clamp(color.g / 255, 0, 1),
          clamp(color.b / 255, 0, 1),
        ]);
      } catch (error) {
        return null;
      }
    }

    if (
      color &&
      typeof color === "object" &&
      Number.isFinite(color.h) &&
      Number.isFinite(color.s) &&
      Number.isFinite(color.l)
    ) {
      try {
        return new ColorConstructor("hsl", [
          ((color.h % 360) + 360) % 360,
          clamp(color.s, 0, 100),
          clamp(color.l, 0, 100),
        ]);
      } catch (error) {
        return null;
      }
    }

    if (color && typeof color === "object" && typeof color.hex === "string") {
      return createColor(color.hex);
    }

    if (color && typeof color === "object" && color.space && Array.isArray(color.coords)) {
      try {
        return new ColorConstructor(color);
      } catch (error) {
        return null;
      }
    }

    const normalizedColor = String(color ?? "").trim();
    if (!normalizedColor) {
      return null;
    }

    try {
      return new ColorConstructor(normalizedColor);
    } catch (error) {
      return null;
    }
  }

  function colorToHex(color) {
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

  function isValidHexColor(hex) {
    const normalizedHex = normalizeHexColor(hex);

    return HEX_6_REGEX.test(normalizedHex) && colorToHex(normalizedHex) === normalizedHex;
  }

  function parseCssColor(color) {
    const inputValue = String(color ?? "").trim();
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
    const [red = 0, green = 0, blue = 0] = srgbColor.coords;
    const [hue = 0, saturation = 0, lightness = 0] = hslColor.coords;
    const [oklchLightness = 0, oklchChroma = 0, oklchHue = NaN] = oklchColor.coords;

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
        h: ((hue % 360) + 360) % 360,
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

  function hexToRgb(hex) {
    if (
      hex &&
      typeof hex === "object" &&
      Number.isFinite(hex.r) &&
      Number.isFinite(hex.g) &&
      Number.isFinite(hex.b)
    ) {
      return {
        r: Math.round(clamp(hex.r, 0, 255)),
        g: Math.round(clamp(hex.g, 0, 255)),
        b: Math.round(clamp(hex.b, 0, 255)),
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

  function rgbToHex(color) {
    if (
      color &&
      typeof color === "object" &&
      Number.isFinite(color.r) &&
      Number.isFinite(color.g) &&
      Number.isFinite(color.b)
    ) {
      return normalizeHexColor(
        `#${[color.r, color.g, color.b]
          .map((channel) =>
            clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0")
          )
          .join("")}`
      );
    }

    return colorToHex(color);
  }

  function hslToHex(h, s, l) {
    return colorToHex(
      new ColorConstructor("hsl", [
        ((Number(h) % 360) + 360) % 360,
        clamp(Number(s), 0, 100),
        clamp(Number(l), 0, 100),
      ])
    );
  }

  function hexToHsl(hex) {
    const parsedColor = createColor(hex)?.to("hsl");
    const [hue = 0, saturation = 0, lightness = 0] = parsedColor?.coords || [];

    return {
      h: ((hue % 360) + 360) % 360,
      s: clamp(saturation, 0, 100),
      l: clamp(lightness, 0, 100),
    };
  }

  function colorToOklch(color, options = {}) {
    const parsedColor = createColor(color);
    if (!parsedColor) {
      return null;
    }

    const maxChroma = Number.isFinite(options.maxChroma) ? options.maxChroma : 0.4;
    const fallbackHue = Number.isFinite(options.fallbackHue)
      ? options.fallbackHue
      : createColor(color)?.to("hsl")?.coords?.[0] || 0;

    try {
      const oklchColor = parsedColor.to("oklch");
      const [lightness = 0, chroma = 0, hue = NaN] = oklchColor.coords || [];

      return {
        l: clamp(lightness, 0, 1),
        c: clamp(chroma, 0, maxChroma),
        h: normalizeHueDegrees(hue, fallbackHue),
      };
    } catch (error) {
      return null;
    }
  }

  function hexToOklch(hex, options = {}) {
    return colorToOklch(hex, options);
  }

  function oklchToHex(lightness, chroma, hue, options = {}) {
    const minLightness = Number.isFinite(options.minLightness) ? options.minLightness : 0;
    const maxLightness = Number.isFinite(options.maxLightness) ? options.maxLightness : 1;
    const maxChroma = Number.isFinite(options.maxChroma) ? options.maxChroma : 0.4;
    const outputSpace = options.outputSpace || "srgb";
    const gamutMethod = options.gamutMethod || "oklch.c";

    let color = null;

    try {
      color = new ColorConstructor("oklch", [
        clamp(Number(lightness), minLightness, maxLightness),
        clamp(Number(chroma), 0, maxChroma),
        normalizeHueDegrees(hue, options.fallbackHue),
      ]);
    } catch (error) {
      return null;
    }

    if (typeof color.toGamut === "function") {
      try {
        color = color.toGamut({
          space: outputSpace,
          method: gamutMethod,
        });
      } catch (error) {
        return null;
      }
    }

    return colorToHex(color);
  }

  function getRelativeLuminance(color) {
    const parsedColor = createColor(color);
    return parsedColor ? parsedColor.luminance : 0;
  }

  function getPerceivedLightness(color) {
    const oklch = colorToOklch(color);
    if (oklch) {
      return oklch.l;
    }

    const { r, g, b } = hexToRgb(color);
    return ((r * 299) + (g * 587) + (b * 114)) / 2550;
  }

  function getRgbDistance(colorA, colorB) {
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    const dr = rgbA.r - rgbB.r;
    const dg = rgbA.g - rgbB.g;
    const db = rgbA.b - rgbB.b;

    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function getColorDistance(colorA, colorB, options = {}) {
    const method = String(options.method || "deltae76").toLowerCase();

    if (method === "rgb") {
      return getRgbDistance(colorA, colorB);
    }

    const parsedColorA = createColor(colorA);
    const parsedColorB = createColor(colorB);
    if (!parsedColorA || !parsedColorB) {
      return Infinity;
    }

    if (method === "deltae2000" || method === "2000") {
      return parsedColorA.deltaE(parsedColorB, "2000");
    }

    return parsedColorA.deltaE(parsedColorB, "76");
  }

  function getContrastRatio(colorA, colorB) {
    const parsedColorA = createColor(colorA);
    const parsedColorB = createColor(colorB);

    if (!parsedColorA || !parsedColorB) {
      return 1;
    }

    return parsedColorA.contrast(parsedColorB, "WCAG21");
  }

  function getReadableTextColor(backgroundColor, options = {}) {
    const lightColor = options.lightColor || "#FFFFFF";
    const darkColor = options.darkColor || "#000000";
    const lightContrast = getContrastRatio(lightColor, backgroundColor);
    const darkContrast = getContrastRatio(darkColor, backgroundColor);

    return lightContrast >= darkContrast ? lightColor : darkColor;
  }

  function mixHexColors(baseColor, mixColor, mixAmount, options = {}) {
    const parsedBaseColor = createColor(baseColor);
    const parsedMixColor = createColor(mixColor);
    if (!parsedBaseColor || !parsedMixColor) {
      return null;
    }

    const range = parsedBaseColor.range(parsedMixColor, {
      space: options.space || "srgb",
      outputSpace: "srgb",
    });

    return colorToHex(range(clamp(Number(mixAmount), 0, 1)));
  }

  function getHexColorSteps(startColor, endColor, stepCount, options = {}) {
    const parsedStartColor = createColor(startColor);
    const parsedEndColor = createColor(endColor);
    const resolvedStepCount = Math.max(2, Math.round(Number(stepCount) || 0));

    if (!parsedStartColor || !parsedEndColor) {
      return [];
    }

    return parsedStartColor
      .steps(parsedEndColor, {
        space: options.space || "oklch",
        outputSpace: options.outputSpace || "srgb",
        steps: resolvedStepCount,
      })
      .map((color) => colorToHex(color))
      .filter(Boolean);
  }

  window.AppColorUtils = {
    Color: ColorConstructor,
    createColor,
    parseCssColor,
    colorToHex,
    normalizeHexColor,
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
})();
