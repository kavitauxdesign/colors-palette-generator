import AppColorUtils from "../../shared/color/color-utils";

export class Color {
  r: number;
  g: number;
  b: number;

  constructor(r: number, g: number, b: number) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.set(r, g, b);
  }

  set(r: number, g: number, b: number) {
    this.r = this.clamp(r);
    this.g = this.clamp(g);
    this.b = this.clamp(b);
  }

  copyFrom(color: Color) {
    this.set(color.r, color.g, color.b);
    return this;
  }

  toCssRgb() {
    return `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
  }

  hueRotate(angle = 0) {
    const radians = (angle / 180) * Math.PI;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);

    this.multiply([
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
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
    this.r = this.clamp((value + (this.r / 255) * (1 - 2 * value)) * 255);
    this.g = this.clamp((value + (this.g / 255) * (1 - 2 * value)) * 255);
    this.b = this.clamp((value + (this.b / 255) * (1 - 2 * value)) * 255);
  }

  multiply(matrix: number[]) {
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

  clamp(value: number) {
    return Math.max(0, Math.min(255, value));
  }
}

interface SolverResult {
  values: number[];
  loss: number;
}

interface SolvedFilterResult {
  values: number[];
  loss: number;
  filterValue: string;
  css: string;
  colorCss: string;
}

export class Solver {
  target: Color;
  targetHsl: { h: number; s: number; l: number };
  reusedColor: Color;

  constructor(target: Color) {
    this.target = target;
    this.targetHsl = target.hsl();
    this.reusedColor = new Color(0, 0, 0);
  }

  solve(): SolvedFilterResult {
    const wideCandidates = this.solveWideCandidates();
    let best = this.createResult([50, 20, 3750, 50, 100, 100]);
    const refinedCandidates: SolverResult[] = [];

    wideCandidates.forEach((candidate) => {
      best = this.pickBetterResult(best, candidate);

      const narrowResult = this.solveNarrow(candidate);
      refinedCandidates.push(narrowResult);
      best = this.pickBetterResult(best, narrowResult);

      const adaptiveResult = this.solveAdaptive(narrowResult);
      refinedCandidates.push(adaptiveResult);
      best = this.pickBetterResult(best, adaptiveResult);
    });

    const polishingSeeds = this.pickTopCandidates(
      [best, ...wideCandidates, ...refinedCandidates],
      4
    );

    polishingSeeds.forEach((candidate) => {
      best = this.pickBetterResult(best, this.solvePolish(candidate));
    });

    const filteredColor = this.colorFromFilters(best.values);

    return {
      values: best.values,
      loss: best.loss,
      filterValue: this.filterValue(best.values),
      css: this.css(best.values),
      colorCss: filteredColor.toCssRgb(),
    };
  }

  solveWideCandidates(): SolverResult[] {
    const A = 5;
    const c = 15;
    const a = [60, 180, 18000, 600, 1.2, 1.2];
    const candidates: SolverResult[] = [];
    const searchSeeds = this.createWideSearchSeeds();

    for (let attempt = 0; attempt < searchSeeds.length; attempt += 1) {
      const result = this.spsa(A, a, c, searchSeeds[attempt].slice(), 1200);
      this.rememberCandidate(candidates, result, 4);

      if (attempt >= 7 && candidates[0]?.loss < 1.2) {
        break;
      }
    }

    return candidates.length > 0
      ? candidates
      : [this.createResult([50, 20, 3750, 50, 100, 100])];
  }

  solveNarrow(seed: SolverResult): SolverResult {
    let best = { ...seed, values: seed.values.slice() };

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

  solveAdaptive(seed: SolverResult): SolverResult {
    let best = { ...seed, values: seed.values.slice() };

    if (best.loss <= 6) {
      return best;
    }

    const extraAttempts = best.loss > 12 ? 3 : 2;
    const extraIterations = best.loss > 12 ? 900 : 700;

    for (let attempt = 0; attempt < extraAttempts; attempt += 1) {
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

  solvePolish(seed: SolverResult): SolverResult {
    let best = { ...seed, values: seed.values.slice() };
    const attempts = best.loss > 8 ? 5 : 3;
    const iterations = best.loss > 8 ? 900 : 550;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const A = Math.max(0.5, best.loss * 0.75 + 0.5);
      const c = best.loss > 6 ? 1.2 : 0.8;
      const a = [0.18 * A, 0.18 * A, 0.75 * A, 0.18 * A, 0.14 * A, 0.14 * A];
      const seedValues =
        attempt === 0
          ? best.values.slice()
          : this.jitterValues(best.values, best.loss > 10 ? 1 : 0.55);
      const result = this.spsa(A, a, c, seedValues, iterations);

      if (result.loss < best.loss) {
        best = result;
      }

      if (best.loss < 0.5) {
        break;
      }
    }

    return best;
  }

  spsa(A: number, a: number[], c: number, values: number[], iterations: number): SolverResult {
    const alpha = 1;
    const gamma = 1 / 6;
    let bestLoss = Number.POSITIVE_INFINITY;
    let bestValues = values.slice();
    const deltas = new Array(6).fill(0);
    const highArgs = new Array(6).fill(0);
    const lowArgs = new Array(6).fill(0);

    for (let k = 0; k < iterations; k += 1) {
      const ck = c / Math.pow(k + 1, gamma);

      for (let index = 0; index < 6; index += 1) {
        deltas[index] = Math.random() > 0.5 ? 1 : -1;
        highArgs[index] = values[index] + ck * deltas[index];
        lowArgs[index] = values[index] - ck * deltas[index];
      }

      const lossDiff = this.loss(highArgs) - this.loss(lowArgs);

      for (let index = 0; index < 6; index += 1) {
        const gradient = (lossDiff / (2 * ck)) * deltas[index];
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

  createWideSearchSeeds() {
    const targetSeed = [
      45,
      35,
      1200 + (this.targetHsl.s / 100) * 5200,
      this.targetHsl.h,
      70 + (this.targetHsl.l / 100) * 70,
      135 - (this.targetHsl.l / 100) * 45,
    ];
    const curatedSeeds = [
      [50, 20, 3750, 50, 100, 100],
      targetSeed,
      [35, 15, 2200, targetSeed[3], 90, 110],
      [60, 45, 5400, targetSeed[3], 112, 88],
      [25, 65, 6800, targetSeed[3], 125, 82],
      [70, 10, 1500, targetSeed[3], 82, 118],
    ];
    const randomSeeds: number[][] = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const baseSeed = curatedSeeds[attempt % curatedSeeds.length];
      randomSeeds.push(this.jitterValues(baseSeed, attempt < 3 ? 0.85 : 1.25));
    }

    return [...curatedSeeds, ...randomSeeds].map((seed) =>
      seed.map((value, index) => this.fix(value, index))
    );
  }

  jitterValues(values: number[], magnitude = 1) {
    const offsets = [24, 28, 1600, 18, 30, 30];

    return values.map((value, index) => {
      const jitter =
        (Math.random() * 2 - 1) *
        offsets[index] *
        magnitude *
        (index === 3 ? 1.6 : 1);
      return this.fix(value + jitter, index);
    });
  }

  createResult(values: number[]): SolverResult {
    const safeValues = values.map((value, index) => this.fix(value, index));
    return {
      values: safeValues,
      loss: this.loss(safeValues),
    };
  }

  pickBetterResult(currentBest: SolverResult, candidate: SolverResult) {
    return candidate.loss < currentBest.loss
      ? { values: candidate.values.slice(), loss: candidate.loss }
      : currentBest;
  }

  rememberCandidate(candidates: SolverResult[], candidate: SolverResult, limit: number) {
    const nextCandidate = { values: candidate.values.slice(), loss: candidate.loss };
    const nextSignature = this.getResultSignature(nextCandidate.values);
    const existingIndex = candidates.findIndex(
      (entry) => this.getResultSignature(entry.values) === nextSignature
    );

    if (existingIndex >= 0) {
      if (nextCandidate.loss < candidates[existingIndex].loss) {
        candidates[existingIndex] = nextCandidate;
      }
    } else {
      candidates.push(nextCandidate);
    }

    candidates.sort((left, right) => left.loss - right.loss);
    if (candidates.length > limit) {
      candidates.length = limit;
    }
  }

  pickTopCandidates(candidates: SolverResult[], limit: number) {
    const nextCandidates: SolverResult[] = [];
    candidates.forEach((candidate) => {
      this.rememberCandidate(nextCandidates, candidate, limit);
    });
    return nextCandidates;
  }

  getResultSignature(values: number[]) {
    return values
      .map((value, index) => {
        if (index === 3) {
          return String(Math.round(value * 2) / 2);
        }
        return String(Math.round(value));
      })
      .join("|");
  }

  fix(value: number, index: number) {
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

  loss(filters: number[]) {
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

  colorFromFilters(filters: number[]) {
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

  filterValue(filters: number[]) {
    return [
      `invert(${Math.round(filters[0])}%)`,
      `sepia(${Math.round(filters[1])}%)`,
      `saturate(${Math.round(filters[2])}%)`,
      `hue-rotate(${Math.round(filters[3] * 3.6)}deg)`,
      `brightness(${Math.round(filters[4])}%)`,
      `contrast(${Math.round(filters[5])}%)`,
    ].join(" ");
  }

  css(filters: number[]) {
    return `filter: ${this.filterValue(filters)};`;
  }
}

export function normalizeHexInputValue(value: unknown) {
  return AppColorUtils.normalizeHexInputValue(value);
}

export function getLossMessage(loss: number) {
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

export const HexToFilterCore = {
  Color,
  Solver,
  normalizeHexInputValue,
  getLossMessage,
};

window.HexToFilterCore = HexToFilterCore;

export default HexToFilterCore;
