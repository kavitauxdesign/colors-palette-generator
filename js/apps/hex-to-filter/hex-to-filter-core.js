// HEX to Filter core: solver and color parsing helpers shared by the mini-app controller.

(function initializeHexToFilterCore() {
  class Color {
    constructor(r, g, b) {
      this.set(r, g, b);
    }

    set(r, g, b) {
      this.r = this.clamp(r);
      this.g = this.clamp(g);
      this.b = this.clamp(b);
    }

    copyFrom(color) {
      this.set(color.r, color.g, color.b);
      return this;
    }

    toCssRgb() {
      return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
    }

    hueRotate(angle = 0) {
      const radians = angle / 180 * Math.PI;
      const sin = Math.sin(radians);
      const cos = Math.cos(radians);

      this.multiply([
        0.213 + cos * 0.787 - sin * 0.213,
        0.715 - cos * 0.715 - sin * 0.715,
        0.072 - cos * 0.072 + sin * 0.928,
        0.213 - cos * 0.213 + sin * 0.143,
        0.715 + cos * 0.285 + sin * 0.140,
        0.072 - cos * 0.072 - sin * 0.283,
        0.213 - cos * 0.213 - sin * 0.787,
        0.715 - cos * 0.715 + sin * 0.715,
        0.072 + cos * 0.928 + sin * 0.072,
      ]);
    }

    grayscale(value = 1) {
      this.multiply([
        0.2126 + 0.7874 * (1 - value),
        0.7152 - 0.7152 * (1 - value),
        0.0722 - 0.0722 * (1 - value),
        0.2126 - 0.2126 * (1 - value),
        0.7152 + 0.2848 * (1 - value),
        0.0722 - 0.0722 * (1 - value),
        0.2126 - 0.2126 * (1 - value),
        0.7152 - 0.7152 * (1 - value),
        0.0722 + 0.9278 * (1 - value),
      ]);
    }

    sepia(value = 1) {
      this.multiply([
        0.393 + 0.607 * (1 - value),
        0.769 - 0.769 * (1 - value),
        0.189 - 0.189 * (1 - value),
        0.349 - 0.349 * (1 - value),
        0.686 + 0.314 * (1 - value),
        0.168 - 0.168 * (1 - value),
        0.272 - 0.272 * (1 - value),
        0.534 - 0.534 * (1 - value),
        0.131 + 0.869 * (1 - value),
      ]);
    }

    saturate(value = 1) {
      this.multiply([
        0.213 + 0.787 * value,
        0.715 - 0.715 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 + 0.285 * value,
        0.072 - 0.072 * value,
        0.213 - 0.213 * value,
        0.715 - 0.715 * value,
        0.072 + 0.928 * value,
      ]);
    }

    brightness(value = 1) {
      this.linear(value);
    }

    contrast(value = 1) {
      this.linear(value, -(0.5 * value) + 0.5);
    }

    linear(slope = 1, intercept = 0) {
      this.r = this.clamp(this.r * slope + intercept * 255);
      this.g = this.clamp(this.g * slope + intercept * 255);
      this.b = this.clamp(this.b * slope + intercept * 255);
    }

    invert(value = 1) {
      this.r = this.clamp((value + this.r / 255 * (1 - 2 * value)) * 255);
      this.g = this.clamp((value + this.g / 255 * (1 - 2 * value)) * 255);
      this.b = this.clamp((value + this.b / 255 * (1 - 2 * value)) * 255);
    }

    multiply(matrix) {
      const nextR = this.clamp(this.r * matrix[0] + this.g * matrix[1] + this.b * matrix[2]);
      const nextG = this.clamp(this.r * matrix[3] + this.g * matrix[4] + this.b * matrix[5]);
      const nextB = this.clamp(this.r * matrix[6] + this.g * matrix[7] + this.b * matrix[8]);

      this.r = nextR;
      this.g = nextG;
      this.b = nextB;
    }

    hsl() {
      const r = this.r / 255;
      const g = this.g / 255;
      const b = this.b / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
          case r:
            h = (g - b) / delta + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / delta + 2;
            break;
          default:
            h = (r - g) / delta + 4;
            break;
        }

        h /= 6;
      }

      return {
        h: h * 100,
        s: s * 100,
        l: l * 100,
      };
    }

    clamp(value) {
      return Math.max(0, Math.min(255, value));
    }
  }

  class Solver {
    constructor(target) {
      this.target = target;
      this.targetHsl = target.hsl();
      this.reusedColor = new Color(0, 0, 0);
    }

    solve() {
      const wideResult = this.solveWide();
      const bestNarrow = this.solveNarrow(wideResult);
      const bestAdaptive = this.solveAdaptive(bestNarrow);
      const filteredColor = this.colorFromFilters(bestAdaptive.values);

      return {
        values: bestAdaptive.values,
        loss: bestAdaptive.loss,
        filterValue: this.filterValue(bestAdaptive.values),
        css: this.css(bestAdaptive.values),
        colorCss: filteredColor.toCssRgb(),
      };
    }

    solveWide() {
      const A = 5;
      const c = 15;
      const a = [60, 180, 18000, 600, 1.2, 1.2];
      const initial = [50, 20, 3750, 50, 100, 100];
      let best = { loss: Number.POSITIVE_INFINITY, values: initial };

      for (let attempt = 0; attempt < 7 && best.loss > 2.5; attempt++) {
        const result = this.spsa(A, a, c, initial.slice(), 1200);
        if (result.loss < best.loss) {
          best = result;
        }
      }

      return best;
    }

    solveNarrow(seed) {
      let best = { ...seed, values: seed.values.slice() };

      for (let attempt = 0; attempt < 4; attempt++) {
        const A = best.loss;
        const c = 2;
        const A1 = A + 1;
        const a = [0.25 * A1, 0.25 * A1, A1, 0.25 * A1, 0.2 * A1, 0.2 * A1];
        const result = this.spsa(A, a, c, best.values.slice(), 600);

        if (result.loss < best.loss) {
          best = result;
        }

        if (best.loss < 0.8) {
          break;
        }
      }

      return best;
    }

    solveAdaptive(seed) {
      let best = { ...seed, values: seed.values.slice() };

      if (best.loss <= 6) {
        return best;
      }

      const extraAttempts = best.loss > 12 ? 3 : 2;
      const extraIterations = best.loss > 12 ? 900 : 700;

      for (let attempt = 0; attempt < extraAttempts; attempt++) {
        const A = best.loss + 1;
        const c = 1.5;
        const a = [0.22 * A, 0.22 * A, 0.95 * A, 0.22 * A, 0.18 * A, 0.18 * A];
        const result = this.spsa(A, a, c, best.values.slice(), extraIterations);

        if (result.loss < best.loss) {
          best = result;
        }

        if (best.loss < 3) {
          break;
        }
      }

      return best;
    }

    spsa(A, a, c, values, iterations) {
      const alpha = 1;
      const gamma = 1 / 6;
      let bestLoss = Number.POSITIVE_INFINITY;
      let bestValues = values.slice();
      const deltas = new Array(6);
      const highArgs = new Array(6);
      const lowArgs = new Array(6);

      for (let k = 0; k < iterations; k++) {
        const ck = c / Math.pow(k + 1, gamma);

        for (let index = 0; index < 6; index++) {
          deltas[index] = Math.random() > 0.5 ? 1 : -1;
          highArgs[index] = values[index] + ck * deltas[index];
          lowArgs[index] = values[index] - ck * deltas[index];
        }

        const lossDiff = this.loss(highArgs) - this.loss(lowArgs);

        for (let index = 0; index < 6; index++) {
          const gradient = lossDiff / (2 * ck) * deltas[index];
          const ak = a[index] / Math.pow(A + k + 1, alpha);
          values[index] = this.fix(values[index] - ak * gradient, index);
        }

        const loss = this.loss(values);
        if (loss < bestLoss) {
          bestLoss = loss;
          bestValues = values.slice();
        }
      }

      return { values: bestValues, loss: bestLoss };
    }

    fix(value, index) {
      let max = 100;

      if (index === 2) {
        max = 7500;
      } else if (index === 4 || index === 5) {
        max = 200;
      }

      if (index === 3) {
        if (value > max) {
          return value % max;
        }
        if (value < 0) {
          return max + value % max;
        }
        return value;
      }

      return Math.max(0, Math.min(max, value));
    }

    loss(filters) {
      const color = this.colorFromFilters(filters);
      const colorHsl = color.hsl();

      return (
        Math.abs(color.r - this.target.r) +
        Math.abs(color.g - this.target.g) +
        Math.abs(color.b - this.target.b) +
        Math.abs(colorHsl.h - this.targetHsl.h) +
        Math.abs(colorHsl.s - this.targetHsl.s) +
        Math.abs(colorHsl.l - this.targetHsl.l)
      );
    }

    colorFromFilters(filters) {
      const color = this.reusedColor;
      color.set(0, 0, 0);

      color.invert(filters[0] / 100);
      color.sepia(filters[1] / 100);
      color.saturate(filters[2] / 100);
      color.hueRotate(filters[3] * 3.6);
      color.brightness(filters[4] / 100);
      color.contrast(filters[5] / 100);

      return color;
    }

    filterValue(filters) {
      return [
        `invert(${Math.round(filters[0])}%)`,
        `sepia(${Math.round(filters[1])}%)`,
        `saturate(${Math.round(filters[2])}%)`,
        `hue-rotate(${Math.round(filters[3] * 3.6)}deg)`,
        `brightness(${Math.round(filters[4])}%)`,
        `contrast(${Math.round(filters[5])}%)`,
      ].join(" ");
    }

    css(filters) {
      return `filter: ${this.filterValue(filters)};`;
    }
  }

  function rgbStringToHex(rgbString) {
    const match = rgbString.match(/rgba?\(([^)]+)\)/i);
    if (!match) {
      return null;
    }

    const channels = match[1]
      .split(",")
      .slice(0, 3)
      .map((value) => Number.parseFloat(value.trim()));

    if (channels.length !== 3 || channels.some((channel) => !Number.isFinite(channel))) {
      return null;
    }

    return `#${channels
      .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  }

  function normalizeHexInputValue(value) {
    const rawValue = String(value ?? "").trim();
    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(rawValue)) {
      return rawValue.startsWith("#")
        ? rawValue.toUpperCase()
        : `#${rawValue.toUpperCase()}`;
    }

    return rawValue;
  }

  function getLossMessage(loss) {
    if (loss < 1) {
      return "Resultado excelente.";
    }
    if (loss < 4) {
      return "Resultado muy cercano al color objetivo.";
    }
    if (loss < 10) {
      return "Resultado bueno, con una ligera desviacion.";
    }
    return "Resultado util, pero algo alejado del color objetivo.";
  }

  window.HexToFilterCore = {
    Color,
    Solver,
    rgbStringToHex,
    normalizeHexInputValue,
    getLossMessage,
  };
})();
