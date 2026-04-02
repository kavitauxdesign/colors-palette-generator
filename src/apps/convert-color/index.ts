import APP_CONSTANTS from "../../shared/constants";
import getAppColorNames from "../../shared/color/color-names";
import AppColorUtils from "../../shared/color/color-utils";
import AppClipboard from "../../shared/services/clipboard";
import AppRegistry from "../../shared/services/registry";
import AppSharedColors from "../../shared/services/shared-colors";

type ConvertColorFormat =
  | "hex"
  | "hsl"
  | "rgb"
  | "hwb"
  | "hsv"
  | "ncol"
  | "oklch"
  | "oklab"
  | "lab"
  | "lch"
  | "cmyk";

type ConvertColorSnapshot = {
  hex: string;
  values: Record<ConvertColorFormat, string>;
};

type ConvertColorElements = {
  sidebarCard: HTMLElement;
  swatchButton: HTMLButtonElement;
  swatchFill: HTMLElement;
  swatchLabel: HTMLElement;
  colorPicker: HTMLInputElement;
  insertButton: HTMLButtonElement;
  feedback: HTMLElement;
  inputs: HTMLInputElement[];
  copyButtons: HTMLButtonElement[];
  inputByFormat: Record<ConvertColorFormat, HTMLInputElement>;
};

const CONVERT_COLOR_FORMATS: ConvertColorFormat[] = [
  "hex",
  "hsl",
  "rgb",
  "hwb",
  "hsv",
  "ncol",
  "oklch",
  "oklab",
  "lab",
  "lch",
  "cmyk",
];

const FORMAT_EXAMPLES: Record<ConvertColorFormat, string> = {
  hex: "#A1B2C3 o red",
  hsl: "hsl(220 100% 63%)",
  rgb: "rgb(64 128 255)",
  hwb: "hwb(220deg 10% 15%)",
  hsv: "hsv(220deg 75% 100%)",
  ncol: "G13.4, 53.7%, 26.7%",
  oklch: "oklch(72% 0.14 244.5)",
  oklab: "0.72, -0.03, -0.12",
  lab: "lab(72.7% -17.1 22)",
  lch: "lch(72.7% 27.9 127.8)",
  cmyk: "75%, 50%, 0%, 0%",
};

let isConvertColorInitialized = false;
let applyExternalColorValue: (
  nextColorValue: string,
  options?: { publish?: boolean; source?: string }
) => boolean = () => false;

type ColorNameReference = {
  name: string;
  hex: string;
  color: ReturnType<typeof AppColorUtils.createColor>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals = 3) {
  const resolvedDecimals = Math.max(0, Number(decimals) || 0);
  const factor = 10 ** resolvedDecimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function formatNumber(value: number, decimals = 3) {
  const roundedValue = roundTo(value, decimals);
  return String(roundedValue).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
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

function getNumericTokens(value: string) {
  return String(value ?? "").match(/[-+]?(?:\d+\.?\d*|\.\d+)%?/g) || [];
}

function parseTokenValue(token: string) {
  const rawValue = parseFloat(token);
  if (!Number.isFinite(rawValue)) {
    return null;
  }

  return {
    raw: rawValue,
    isPercent: token.includes("%"),
  };
}

function normalizeHexCandidate(value: string) {
  const trimmedValue = String(value ?? "").trim();
  if (!trimmedValue) {
    return "";
  }

  if (/^#?[0-9a-f]{3}$/i.test(trimmedValue) || /^#?[0-9a-f]{6}$/i.test(trimmedValue)) {
    return trimmedValue.startsWith("#") ? trimmedValue : `#${trimmedValue}`;
  }

  return trimmedValue;
}

function toSrgbSafeColor(color: any) {
  if (!color || typeof color !== "object") {
    return null;
  }

  if (typeof color.toGamut === "function") {
    try {
      return color.toGamut({
        space: "srgb",
        method: "oklch.c",
      });
    } catch (error) {
      return color;
    }
  }

  return color;
}

function rgbToCmyk(rgb: { r: number; g: number; b: number }) {
  const red = clamp(rgb.r, 0, 255) / 255;
  const green = clamp(rgb.g, 0, 255) / 255;
  const blue = clamp(rgb.b, 0, 255) / 255;
  const key = 1 - Math.max(red, green, blue);

  if (key >= 1) {
    return {
      c: 0,
      m: 0,
      y: 0,
      k: 1,
    };
  }

  return {
    c: clamp((1 - red - key) / (1 - key), 0, 1),
    m: clamp((1 - green - key) / (1 - key), 0, 1),
    y: clamp((1 - blue - key) / (1 - key), 0, 1),
    k: clamp(key, 0, 1),
  };
}

function cmykToRgb(cmyk: { c: number; m: number; y: number; k: number }) {
  return {
    r: Math.round(255 * (1 - clamp(cmyk.c, 0, 1)) * (1 - clamp(cmyk.k, 0, 1))),
    g: Math.round(255 * (1 - clamp(cmyk.m, 0, 1)) * (1 - clamp(cmyk.k, 0, 1))),
    b: Math.round(255 * (1 - clamp(cmyk.y, 0, 1)) * (1 - clamp(cmyk.k, 0, 1))),
  };
}

function formatRgbValue(rgb: { r: number; g: number; b: number }) {
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

function formatHslValue(hsl: { h: number; s: number; l: number }) {
  return `${formatNumber(hsl.h, 1)}, ${formatNumber(hsl.s, 1)}%, ${formatNumber(hsl.l, 1)}%`;
}

function formatOklchValue(oklch: { l: number; c: number; h: number }) {
  return `${formatNumber(oklch.l, 4)}, ${formatNumber(oklch.c, 4)}, ${formatNumber(oklch.h, 2)}`;
}

function formatOklabValue(oklab: { l: number; a: number; b: number }) {
  return `${formatNumber(oklab.l, 4)}, ${formatNumber(oklab.a, 4)}, ${formatNumber(oklab.b, 4)}`;
}

function formatCmykValue(cmyk: { c: number; m: number; y: number; k: number }) {
  return `${formatNumber(cmyk.c * 100, 1)}%, ${formatNumber(cmyk.m * 100, 1)}%, ${formatNumber(cmyk.y * 100, 1)}%, ${formatNumber(cmyk.k * 100, 1)}%`;
}

function formatCssOklchValue(oklch: { l: number; c: number; h: number }) {
  return `oklch(${formatNumber(oklch.l * 100, 1)}% ${formatNumber(oklch.c, 4)} ${formatNumber(oklch.h, 2)})`;
}

function formatCssRgbValue(rgb: { r: number; g: number; b: number }) {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function formatCssHslValue(hsl: { h: number; s: number; l: number }) {
  return `hsl(${formatNumber(hsl.h, 1)}deg ${formatNumber(hsl.s, 1)}% ${formatNumber(hsl.l, 1)}%)`;
}

function formatCssHwbValue(hwb: { h: number; w: number; b: number }) {
  return `hwb(${formatNumber(hwb.h, 1)}deg ${formatNumber(hwb.w, 1)}% ${formatNumber(hwb.b, 1)}%)`;
}

function formatHsvValue(hsv: { h: number; s: number; v: number }) {
  return `hsv(${formatNumber(hsv.h, 1)}deg ${formatNumber(hsv.s, 1)}% ${formatNumber(hsv.v, 1)}%)`;
}

function formatCssLabValue(lab: { l: number; a: number; b: number }) {
  return `lab(${formatNumber(lab.l, 1)}% ${formatNumber(lab.a, 3)} ${formatNumber(lab.b, 3)})`;
}

function formatCssLchValue(lch: { l: number; c: number; h: number }) {
  return `lch(${formatNumber(lch.l, 1)}% ${formatNumber(lch.c, 3)} ${formatNumber(lch.h, 2)})`;
}

function formatNcolValue(ncol: { ncol: string; w: number; b: number }) {
  return `${ncol.ncol}, ${formatNumber(ncol.w, 1)}%, ${formatNumber(ncol.b, 1)}%`;
}

function normalizePercentInput(
  entry: { raw: number; isPercent: boolean },
  options: { allowFraction?: boolean } = {}
) {
  const allowFraction = options.allowFraction !== false;

  if (entry.isPercent) {
    return clamp(entry.raw, 0, 100);
  }

  if (allowFraction && Math.abs(entry.raw) <= 1) {
    return clamp(entry.raw * 100, 0, 100);
  }

  return clamp(entry.raw, 0, 100);
}

function hueToNcol(hue: number) {
  const baseLetters = ["R", "Y", "G", "C", "B", "M"];
  const normalizedHue = normalizeHueDegrees(hue);
  const segmentIndex = Math.floor(normalizedHue / 60) % baseLetters.length;
  const segmentOffset = ((normalizedHue % 60) / 60) * 100;

  return `${baseLetters[segmentIndex]}${formatNumber(segmentOffset, 1)}`;
}

function parseNcolHue(value: string) {
  const match = String(value ?? "")
    .trim()
    .match(/^([RYGCBM])\s*(-?(?:\d+\.?\d*|\.\d+))$/i);

  if (!match) {
    return null;
  }

  const [, letter, amountValue] = match;
  const baseLetters = ["R", "Y", "G", "C", "B", "M"];
  const baseIndex = baseLetters.indexOf(letter.toUpperCase());
  if (baseIndex < 0) {
    return null;
  }

  const amount = Number(amountValue);
  if (!Number.isFinite(amount)) {
    return null;
  }

  return normalizeHueDegrees(baseIndex * 60 + (amount / 100) * 60);
}

function getColorNameReferences(): ColorNameReference[] {
  return getAppColorNames().map((entry) => ({
    ...entry,
    color: AppColorUtils.createColor(entry.hex),
  }));
}

function getNearestColorName(hex: string, references: ColorNameReference[]) {
  const normalizedHex = AppColorUtils.normalizeHexColor(hex);
  if (normalizedHex === "#FFFFFF") {
    return "Pure white";
  }

  let closestName = "Unknown";
  let minDistance = Infinity;

  references.forEach((entry) => {
    if (!entry.color) {
      return;
    }

    const distance = AppColorUtils.getColorDistance(normalizedHex, entry.color, {
      method: "deltae2000",
    });

    if (distance < minDistance) {
      minDistance = distance;
      closestName = entry.name;
    }
  });

  return closestName;
}

function buildSnapshot(colorInput: unknown): ConvertColorSnapshot | null {
  const parsedColor = toSrgbSafeColor(AppColorUtils.createColor(colorInput));
  const hex = AppColorUtils.colorToHex(parsedColor);
  if (!parsedColor || !hex) {
    return null;
  }

  const rgb = AppColorUtils.hexToRgb(hex);
  const hsl = AppColorUtils.hexToHsl(hex);
  const hwbColor = parsedColor.to("hwb");
  const hsvColor = parsedColor.to("hsv");
  const oklchColor = parsedColor.to("oklch");
  const oklabColor = parsedColor.to("oklab");
  const labColor = parsedColor.to("lab");
  const lchColor = parsedColor.to("lch");
  const [hwbHue = 0, whiteness = 0, blackness = 0] = hwbColor.coords || [];
  const [hsvHue = 0, saturationValue = 0, value = 0] = hsvColor.coords || [];
  const [oklchLightness = 0, oklchChroma = 0, rawOklchHue = Number.NaN] = oklchColor.coords || [];
  const [oklabLightness = 0, oklabA = 0, oklabB = 0] = oklabColor.coords || [];
  const [labLightness = 0, labA = 0, labB = 0] = labColor.coords || [];
  const [lchLightness = 0, lchChroma = 0, rawLchHue = Number.NaN] = lchColor.coords || [];
  const resolvedOklchHue = normalizeHueDegrees(rawOklchHue, hsl.h);
  const resolvedLchHue = normalizeHueDegrees(rawLchHue, hsl.h);
  const cmyk = rgbToCmyk(rgb);
  const ncol = hueToNcol(hwbHue);

  return {
    hex,
    values: {
      hex,
      rgb: formatCssRgbValue(rgb),
      hsl: formatCssHslValue(hsl),
      hwb: formatCssHwbValue({
        h: hwbHue,
        w: whiteness,
        b: blackness,
      }),
      hsv: formatHsvValue({
        h: hsvHue,
        s: saturationValue,
        v: value,
      }),
      ncol: formatNcolValue({
        ncol,
        w: whiteness,
        b: blackness,
      }),
      oklch: formatCssOklchValue({
        l: clamp(oklchLightness, 0, 1),
        c: Math.max(0, oklchChroma),
        h: resolvedOklchHue,
      }),
      oklab: formatOklabValue({
        l: oklabLightness,
        a: oklabA,
        b: oklabB,
      }),
      lab: formatCssLabValue({
        l: labLightness,
        a: labA,
        b: labB,
      }),
      lch: formatCssLchValue({
        l: lchLightness,
        c: lchChroma,
        h: resolvedLchHue,
      }),
      cmyk: formatCmykValue(cmyk),
    },
  };
}

function parseGenericColor(value: string) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    return null;
  }

  return buildSnapshot(normalizedValue);
}

function parseRgbField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const channelValues = tokens.slice(0, 3).map((token) => parseTokenValue(token));
  if (channelValues.some((entry) => !entry)) {
    return null;
  }

  const [red, green, blue] = channelValues as Array<{ raw: number; isPercent: boolean }>;
  return buildSnapshot(
    {
      r: red.isPercent ? (red.raw / 100) * 255 : red.raw,
      g: green.isPercent ? (green.raw / 100) * 255 : green.raw,
      b: blue.isPercent ? (blue.raw / 100) * 255 : blue.raw,
    }
  );
}

function parseHwbField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const hueToken = parseTokenValue(tokens[0]);
  const whitenessToken = parseTokenValue(tokens[1]);
  const blacknessToken = parseTokenValue(tokens[2]);
  if (!hueToken || !whitenessToken || !blacknessToken) {
    return null;
  }

  return buildSnapshot({
    space: "hwb",
    coords: [
      normalizeHueDegrees(hueToken.raw),
      normalizePercentInput(whitenessToken),
      normalizePercentInput(blacknessToken),
    ],
  });
}

function parseHsvField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const hueToken = parseTokenValue(tokens[0]);
  const saturationToken = parseTokenValue(tokens[1]);
  const valueToken = parseTokenValue(tokens[2]);
  if (!hueToken || !saturationToken || !valueToken) {
    return null;
  }

  return buildSnapshot({
    space: "hsv",
    coords: [
      normalizeHueDegrees(hueToken.raw),
      normalizePercentInput(saturationToken),
      normalizePercentInput(valueToken),
    ],
  });
}

function parseHslField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const hueToken = parseTokenValue(tokens[0]);
  const saturationToken = parseTokenValue(tokens[1]);
  const lightnessToken = parseTokenValue(tokens[2]);
  if (!hueToken || !saturationToken || !lightnessToken) {
    return null;
  }

  return buildSnapshot(
    {
      space: "hsl",
      coords: [
        normalizeHueDegrees(hueToken.raw),
        clamp(saturationToken.raw, 0, 100),
        clamp(lightnessToken.raw, 0, 100),
      ],
    }
  );
}

function parseNcolField(value: string) {
  const parts = String(value ?? "")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);

  if (parts.length < 3) {
    return null;
  }

  const hue = parseNcolHue(parts[0]);
  const whitenessToken = parseTokenValue(parts[1]);
  const blacknessToken = parseTokenValue(parts[2]);
  if (!Number.isFinite(hue) || !whitenessToken || !blacknessToken) {
    return null;
  }

  return buildSnapshot({
    space: "hwb",
    coords: [
      hue,
      normalizePercentInput(whitenessToken),
      normalizePercentInput(blacknessToken),
    ],
  });
}

function parseOklchField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const lightnessToken = parseTokenValue(tokens[0]);
  const chromaToken = parseTokenValue(tokens[1]);
  const hueToken = parseTokenValue(tokens[2]);
  if (!lightnessToken || !chromaToken || !hueToken) {
    return null;
  }

  const lightness =
    lightnessToken.isPercent || lightnessToken.raw > 1
      ? lightnessToken.raw / 100
      : lightnessToken.raw;

  return buildSnapshot(
    {
      space: "oklch",
      coords: [
        clamp(lightness, 0, 1),
        Math.max(0, chromaToken.raw),
        normalizeHueDegrees(hueToken.raw),
      ],
    }
  );
}

function parseOklabField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const lightnessToken = parseTokenValue(tokens[0]);
  const aToken = parseTokenValue(tokens[1]);
  const bToken = parseTokenValue(tokens[2]);
  if (!lightnessToken || !aToken || !bToken) {
    return null;
  }

  const lightness =
    lightnessToken.isPercent || lightnessToken.raw > 1
      ? lightnessToken.raw / 100
      : lightnessToken.raw;

  return buildSnapshot(
    {
      space: "oklab",
      coords: [clamp(lightness, 0, 1), aToken.raw, bToken.raw],
    }
  );
}

function parseLabField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const lightnessToken = parseTokenValue(tokens[0]);
  const aToken = parseTokenValue(tokens[1]);
  const bToken = parseTokenValue(tokens[2]);
  if (!lightnessToken || !aToken || !bToken) {
    return null;
  }

  const lightness = normalizePercentInput(lightnessToken);

  return buildSnapshot({
    space: "lab",
    coords: [lightness, aToken.raw, bToken.raw],
  });
}

function parseLchField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 3) {
    return null;
  }

  const lightnessToken = parseTokenValue(tokens[0]);
  const chromaToken = parseTokenValue(tokens[1]);
  const hueToken = parseTokenValue(tokens[2]);
  if (!lightnessToken || !chromaToken || !hueToken) {
    return null;
  }

  const lightness = normalizePercentInput(lightnessToken);

  return buildSnapshot({
    space: "lch",
    coords: [lightness, Math.max(0, chromaToken.raw), normalizeHueDegrees(hueToken.raw)],
  });
}

function parseCmykField(value: string) {
  const tokens = getNumericTokens(value);
  if (tokens.length < 4) {
    return null;
  }

  const channelValues = tokens.slice(0, 4).map((token) => parseTokenValue(token));
  if (channelValues.some((entry) => !entry)) {
    return null;
  }

  const [cyan, magenta, yellow, key] = channelValues as Array<{
    raw: number;
    isPercent: boolean;
  }>;
  const toFraction = (entry: { raw: number; isPercent: boolean }) =>
    clamp(entry.isPercent || entry.raw > 1 ? entry.raw / 100 : entry.raw, 0, 1);

  return buildSnapshot(
    cmykToRgb({
      c: toFraction(cyan),
      m: toFraction(magenta),
      y: toFraction(yellow),
      k: toFraction(key),
    })
  );
}

function parseColorFromFormat(format: ConvertColorFormat, value: string) {
  const trimmedValue = String(value ?? "").trim();
  if (!trimmedValue) {
    return null;
  }

  const genericSnapshot = parseGenericColor(
    format === "hex" ? normalizeHexCandidate(trimmedValue) : trimmedValue
  );
  if (genericSnapshot) {
    return genericSnapshot;
  }

  switch (format) {
    case "rgb":
      return parseRgbField(trimmedValue);
    case "hwb":
      return parseHwbField(trimmedValue);
    case "hsv":
      return parseHsvField(trimmedValue);
    case "hsl":
      return parseHslField(trimmedValue);
    case "ncol":
      return parseNcolField(trimmedValue);
    case "oklch":
      return parseOklchField(trimmedValue);
    case "oklab":
      return parseOklabField(trimmedValue);
    case "lab":
      return parseLabField(trimmedValue);
    case "lch":
      return parseLchField(trimmedValue);
    case "cmyk":
      return parseCmykField(trimmedValue);
    default:
      return null;
  }
}

function parseColorFromAnySupportedFormat(value: string) {
  const trimmedValue = String(value ?? "").trim();
  if (!trimmedValue) {
    return null;
  }

  const genericSnapshot = parseGenericColor(normalizeHexCandidate(trimmedValue));
  if (genericSnapshot) {
    return genericSnapshot;
  }

  if (parseNcolHue(trimmedValue.split(/[\s,]+/)[0] || "")) {
    return parseNcolField(trimmedValue);
  }

  const tokens = getNumericTokens(trimmedValue);
  if (tokens.length === 4) {
    return parseCmykField(trimmedValue);
  }

  if (tokens.length !== 3) {
    return null;
  }

  const parsedTokens = tokens
    .map((token) => parseTokenValue(token))
    .filter(Boolean) as Array<NonNullable<ReturnType<typeof parseTokenValue>>>;

  if (parsedTokens.length !== 3) {
    return null;
  }

  const [firstToken, secondToken, thirdToken] = parsedTokens;

  if (secondToken.isPercent && thirdToken.isPercent) {
    return parseHslField(trimmedValue);
  }

  if (
    Math.abs(firstToken.raw) <= 1 &&
    Math.abs(secondToken.raw) <= 1 &&
    Math.abs(thirdToken.raw) <= 1
  ) {
    return parseOklabField(trimmedValue);
  }

  if (
    Math.abs(firstToken.raw) <= 1 &&
    secondToken.raw >= 0 &&
    Math.abs(secondToken.raw) <= 1 &&
    Math.abs(thirdToken.raw) > 1
  ) {
    return parseOklchField(trimmedValue);
  }

  return parseRgbField(trimmedValue);
}

function resolveConvertColorElements(root: HTMLElement): ConvertColorElements | null {
  const sidebarCard = root.querySelector(".convert-color-sidebar-card") as HTMLElement | null;
  const swatchButton = root.querySelector(".convert-color-swatch") as HTMLButtonElement | null;
  const swatchFill = root.querySelector(".convert-color-swatch-fill") as HTMLElement | null;
  const swatchLabel = root.querySelector(".convert-color-swatch-label") as HTMLElement | null;
  const colorPicker = root.querySelector(".convert-color-picker") as HTMLInputElement | null;
  const insertButton = root.querySelector(".convert-color-insert-btn") as HTMLButtonElement | null;
  const feedback = root.querySelector(".convert-color-feedback") as HTMLElement | null;
  const inputs = Array.from(
    root.querySelectorAll(".convert-color-field-input")
  ) as HTMLInputElement[];
  const copyButtons = Array.from(
    root.querySelectorAll(".convert-color-copy-btn")
  ) as HTMLButtonElement[];

  if (
    !sidebarCard ||
    !swatchButton ||
    !swatchFill ||
    !swatchLabel ||
    !colorPicker ||
    !insertButton ||
    !feedback ||
    inputs.length === 0 ||
    copyButtons.length === 0
  ) {
    return null;
  }

  const inputByFormat = {} as Record<ConvertColorFormat, HTMLInputElement>;
  inputs.forEach((input) => {
    const format = String(input.dataset.format || "") as ConvertColorFormat;
    if (CONVERT_COLOR_FORMATS.includes(format)) {
      inputByFormat[format] = input;
    }
  });

  if (CONVERT_COLOR_FORMATS.some((format) => !inputByFormat[format])) {
    return null;
  }

  return {
    sidebarCard,
    swatchButton,
    swatchFill,
    swatchLabel,
    colorPicker,
    insertButton,
    feedback,
    inputs,
    copyButtons,
    inputByFormat,
  };
}

function initializeConvertColorApp() {
  if (isConvertColorInitialized) {
    return;
  }

  const root = document.getElementById("convert_color_tool");
  if (!root) {
    return;
  }

  const elements = resolveConvertColorElements(root);
  if (!elements) {
    return;
  }

  const defaultColor =
    AppSharedColors.getState?.().activeColor ||
    AppSharedColors.getDefaultActiveColor?.() ||
    APP_CONSTANTS.DEFAULT_COLOR_BASE ||
    "#9EBB89";
  const colorNameReferences = getColorNameReferences();

  let currentSnapshot = buildSnapshot(defaultColor) || buildSnapshot("#9EBB89");
  let copyFeedbackTimeoutIds = new WeakMap<HTMLButtonElement, number>();
  let lastKnownClipboardText = "";

  if (!currentSnapshot) {
    return;
  }

  isConvertColorInitialized = true;

  function clearValidationState() {
    elements.feedback.textContent = "";
    elements.inputs.forEach((input) => {
      input.classList.remove("is-invalid");
      input.setAttribute("aria-invalid", "false");
    });
  }

  function showCopyFeedback(button: HTMLButtonElement) {
    showActionFeedback(button, {
      defaultText: "Copiar",
      successText: "¡Copiado!",
      timeoutStore: copyFeedbackTimeoutIds,
    });
  }

  function showActionFeedback(
    button: HTMLButtonElement,
    {
      defaultText,
      successText,
      timeoutStore,
    }: {
      defaultText: string;
      successText: string;
      timeoutStore: WeakMap<HTMLButtonElement, number>;
    }
  ) {
    const tooltip = button.querySelector(".tooltip") as HTMLElement | null;
    if (!tooltip) {
      return;
    }

    const previousTimeoutId = timeoutStore.get(button);
    if (previousTimeoutId) {
      window.clearTimeout(previousTimeoutId);
    }

    const feedbackBg = currentSnapshot.hex;
    const feedbackTextColor =
      AppColorUtils.getReadableTextColor(feedbackBg) === "#000000"
        ? "var(--primary)"
        : "var(--on-accent)";

    tooltip.style.setProperty("--tooltip-feedback-bg", feedbackBg);
    tooltip.style.setProperty("--tooltip-feedback-fg", feedbackTextColor);
    tooltip.textContent = successText;
    tooltip.classList.add("is-copied-feedback");
    button.classList.add("show-feedback");

    const timeoutId = window.setTimeout(() => {
      tooltip.textContent = defaultText;
      tooltip.classList.remove("is-copied-feedback");
      button.classList.remove("show-feedback");
      tooltip.style.removeProperty("--tooltip-feedback-bg");
      tooltip.style.removeProperty("--tooltip-feedback-fg");
      timeoutStore.delete(button);
    }, 1400);

    timeoutStore.set(button, timeoutId);
  }

  function setInsertButtonAvailability(hasClipboardText: boolean) {
    elements.insertButton.disabled = !hasClipboardText;
  }

  async function refreshClipboardAvailability() {
    const clipboardText = String((await AppClipboard.readText()) || "");
    lastKnownClipboardText = clipboardText;
    setInsertButtonAvailability(clipboardText.trim().length > 0);
    return clipboardText;
  }

  function showInvalidMessage(
    format: ConvertColorFormat,
    activeInput: HTMLInputElement
  ) {
    elements.inputs.forEach((input) => {
      const isActiveInput = input === activeInput;
      input.classList.toggle("is-invalid", isActiveInput);
      input.setAttribute("aria-invalid", String(isActiveInput));
    });

    elements.feedback.textContent =
      `Todavía no he podido leer ese valor. Prueba con ${FORMAT_EXAMPLES[format]}.`;
  }

  function showClipboardInvalidMessage() {
    clearValidationState();
    elements.feedback.textContent =
      "Todavía no he podido leer ese color del portapapeles. Prueba con #A1B2C3, rgb(...), hsl(...) u oklch(...).";
  }

  function applySnapshot(
    snapshot: ConvertColorSnapshot,
    options: {
      publish?: boolean;
      source?: string;
      preserveActiveFieldValue?: boolean;
      activeInput?: HTMLInputElement | null;
    } = {}
  ) {
    currentSnapshot = snapshot;
    elements.swatchFill.style.backgroundColor = snapshot.hex;
    elements.swatchLabel.textContent = getNearestColorName(snapshot.hex, colorNameReferences);
    elements.colorPicker.value = snapshot.hex;

    CONVERT_COLOR_FORMATS.forEach((format) => {
      const input = elements.inputByFormat[format];
      const shouldPreserveValue =
        options.preserveActiveFieldValue && options.activeInput === input;

      if (!shouldPreserveValue && input.value !== snapshot.values[format]) {
        input.value = snapshot.values[format];
      }
    });

    clearValidationState();

    if (options.publish !== false) {
      AppSharedColors.setActiveColor(snapshot.hex, {
        source: options.source || "convert-color",
      });
    }
  }

  function applyFieldValue(
    format: ConvertColorFormat,
    value: string,
    options: {
      publish?: boolean;
      source?: string;
      preserveActiveFieldValue?: boolean;
      activeInput?: HTMLInputElement | null;
    } = {}
  ) {
    const snapshot = parseColorFromFormat(format, value);
    if (!snapshot) {
      if (options.activeInput) {
        showInvalidMessage(format, options.activeInput);
      }
      return false;
    }

    applySnapshot(snapshot, options);
    return true;
  }

  function setColorValue(
    nextColorValue: string,
    options: { publish?: boolean; source?: string } = {}
  ) {
    return applyFieldValue("hex", nextColorValue, options);
  }

  applyExternalColorValue = setColorValue;

  elements.inputs.forEach((input) => {
    const format = String(input.dataset.format || "") as ConvertColorFormat;
    if (!CONVERT_COLOR_FORMATS.includes(format)) {
      return;
    }

    input.addEventListener("input", () => {
      if (!input.value.trim()) {
        clearValidationState();
        return;
      }

      applyFieldValue(format, input.value, {
        publish: false,
        preserveActiveFieldValue: true,
        activeInput: input,
      });
    });

    input.addEventListener("blur", () => {
      if (!input.value.trim()) {
        applySnapshot(currentSnapshot, {
          publish: false,
        });
        return;
      }

      const didApply = applyFieldValue(format, input.value, {
        publish: true,
        source: "convert-color",
      });

      if (!didApply) {
        showInvalidMessage(format, input);
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      const didApply = applyFieldValue(format, input.value, {
        publish: true,
        source: "convert-color",
      });

      if (!didApply) {
        showInvalidMessage(format, input);
        return;
      }

      input.blur();
    });
  });

  elements.copyButtons.forEach((button) => {
    const format = String(button.dataset.format || "") as ConvertColorFormat;
    if (!CONVERT_COLOR_FORMATS.includes(format)) {
      return;
    }

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const input = elements.inputByFormat[format];
      const valueToCopy = String(input?.value || "").trim();
      if (!valueToCopy) {
        return;
      }

      try {
        await AppClipboard.writeText(valueToCopy);
        showCopyFeedback(button);
      } catch (error) {
        // Ignore clipboard errors to avoid interrupting the flow.
      }
    });
  });

  elements.sidebarCard.addEventListener("mouseenter", () => {
    void refreshClipboardAvailability();
  });

  elements.sidebarCard.addEventListener("focusin", () => {
    void refreshClipboardAvailability();
  });

  elements.insertButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const clipboardText = String((await AppClipboard.readText()) || lastKnownClipboardText || "").trim();
    lastKnownClipboardText = clipboardText;
    setInsertButtonAvailability(clipboardText.length > 0);

    if (!clipboardText) {
      return;
    }

    const snapshot = parseColorFromAnySupportedFormat(clipboardText);
    if (!snapshot) {
      showClipboardInvalidMessage();
      return;
    }

    applySnapshot(snapshot, {
      publish: true,
      source: "convert-color",
    });
  });

  elements.swatchButton.addEventListener("click", () => {
    if (typeof elements.colorPicker.showPicker === "function") {
      elements.colorPicker.showPicker();
      return;
    }

    elements.colorPicker.click();
  });

  elements.colorPicker.addEventListener("input", () => {
    setColorValue(elements.colorPicker.value.toUpperCase(), {
      publish: true,
      source: "convert-color",
    });
  });

  window.addEventListener("focus", () => {
    void refreshClipboardAvailability();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      void refreshClipboardAvailability();
    }
  });

  applySnapshot(currentSnapshot, {
    publish: false,
  });
  void refreshClipboardAvailability();
}

export function registerConvertColorApp() {
  const convertColorApp = {
    initialize: initializeConvertColorApp,
    setColor(nextColorValue: string) {
      if (!isConvertColorInitialized) {
        initializeConvertColorApp();
      }

      return applyExternalColorValue(nextColorValue, {
        source: "convert-color",
      });
    },
  };

  window.ConvertColorApp = convertColorApp;
  AppRegistry.register("convert-color", convertColorApp);
  return convertColorApp;
}

export default registerConvertColorApp;
