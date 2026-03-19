// Shared color math helpers
// Keep pure conversion logic in one place to avoid duplication
(function initAppColorUtils() {
  const { HEX_6_REGEX } = window.AppConstants || {
    HEX_6_REGEX: /^#[0-9A-F]{6}$/,
  };

  function normalizeHexColor(color) {
    return String(color ?? "").trim().toUpperCase();
  }

  function isValidHexColor(hex) {
    return HEX_6_REGEX.test(normalizeHexColor(hex));
  }

  function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex).replace("#", "");
    const value =
      normalized.length === 3
        ? normalized
            .split("")
            .map((char) => char + char)
            .join("")
        : normalized;

    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function hslToHex(h, s, l) {
    const sat = s / 100;
    const light = l / 100;

    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = light - c / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
    } else if (120 <= h && h < 180) {
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    return `#${[red, green, blue]
      .map((channel) => channel.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()}`;
  }

  function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = delta / (1 - Math.abs(2 * l - 1));

      if (max === rNorm) {
        h = 60 * (((gNorm - bNorm) / delta) % 6);
      } else if (max === gNorm) {
        h = 60 * ((bNorm - rNorm) / delta + 2);
      } else {
        h = 60 * ((rNorm - gNorm) / delta + 4);
      }
    }

    if (h < 0) {
      h += 360;
    }

    return {
      h,
      s: s * 100,
      l: l * 100,
    };
  }

  window.AppColorUtils = {
    normalizeHexColor,
    isValidHexColor,
    hexToRgb,
    hslToHex,
    hexToHsl,
  };
})();