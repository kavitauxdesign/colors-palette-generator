import APP_CONSTANTS from "../../shared/constants";
import AppColorUtils from "../../shared/color/color-utils";
import AppRegistry from "../../shared/services/registry";
import AppSharedColors from "../../shared/services/shared-colors";

type ConvertColorFormat =
  | "hex"
  | "hsl"
  | "rgb"
  | "oklch"
  | "oklab"
  | "css-oklch"
  | "css-color"
  | "cmyk";

type CssColorFunctionPreference = "rgb" | "hsl";

type ConvertColorSnapshot = {
  hex: string;
  values: Record<ConvertColorFormat, string>;
};

type ConvertColorElements = {
  swatchButton: HTMLButtonElement;
  swatchFill: HTMLElement;
  colorPicker: HTMLInputElement;
  feedback: HTMLElement;
  inputs: HTMLInputElement[];
  inputByFormat: Record<ConvertColorFormat, HTMLInputElement>;
};

const CONVERT_COLOR_FORMATS: ConvertColorFormat[] = [
  "hex",
  "hsl",
  "rgb",
  "oklch",
  "oklab",
  "css-oklch",
  "css-color",
  "cmyk",
];

const FORMAT_EXAMPLES: Record<ConvertColorFormat, string> = {
  hex: "#A1B2C3 o red",
  hsl: "210, 68%, 52%",
  rgb: "64, 128, 255",
  oklch: "0.72, 0.14, 244.5",
  oklab: "0.72, -0.03, -0.12",
  "css-oklch": "oklch(72% 0.14 244.5)",
  "css-color": "rgb(64 128 255) o hsl(220 100% 63%)",
  cmyk: "75%, 50%, 0%, 0%",
};

let isConvertColorInitialized = false;
let applyExternalColorValue: (
  nextColorValue: string,
  options?: { publish?: boolean; source?: string }
) => boolean = () => false;

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

function buildSnapshot(
  colorInput: unknown,
  cssFunctionPreference: CssColorFunctionPreference
): ConvertColorSnapshot | null {
  const parsedColor = toSrgbSafeColor(AppColorUtils.createColor(colorInput));
  const hex = AppColorUtils.colorToHex(parsedColor);
  if (!parsedColor || !hex) {
    return null;
  }

  const rgb = AppColorUtils.hexToRgb(hex);
  const hsl = AppColorUtils.hexToHsl(hex);
  const oklchColor = parsedColor.to("oklch");
  const oklabColor = parsedColor.to("oklab");
  const [oklchLightness = 0, oklchChroma = 0, rawOklchHue = Number.NaN] = oklchColor.coords || [];
  const [oklabLightness = 0, oklabA = 0, oklabB = 0] = oklabColor.coords || [];
  const resolvedOklchHue = normalizeHueDegrees(rawOklchHue, hsl.h);
  const cmyk = rgbToCmyk(rgb);

  return {
    hex,
    values: {
      hex,
      rgb: formatRgbValue(rgb),
      hsl: formatHslValue(hsl),
      oklch: formatOklchValue({
        l: clamp(oklchLightness, 0, 1),
        c: Math.max(0, oklchChroma),
        h: resolvedOklchHue,
      }),
      oklab: formatOklabValue({
        l: oklabLightness,
        a: oklabA,
        b: oklabB,
      }),
      "css-oklch": formatCssOklchValue({
        l: clamp(oklchLightness, 0, 1),
        c: Math.max(0, oklchChroma),
        h: resolvedOklchHue,
      }),
      "css-color":
        cssFunctionPreference === "hsl" ? formatCssHslValue(hsl) : formatCssRgbValue(rgb),
      cmyk: formatCmykValue(cmyk),
    },
  };
}

function parseGenericColor(value: string, cssFunctionPreference: CssColorFunctionPreference) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) {
    return null;
  }

  return buildSnapshot(normalizedValue, cssFunctionPreference);
}

function parseRgbField(value: string, cssFunctionPreference: CssColorFunctionPreference) {
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
    },
    cssFunctionPreference
  );
}

function parseHslField(value: string, cssFunctionPreference: CssColorFunctionPreference) {
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
    },
    cssFunctionPreference
  );
}

function parseOklchField(value: string, cssFunctionPreference: CssColorFunctionPreference) {
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
    },
    cssFunctionPreference
  );
}

function parseOklabField(value: string, cssFunctionPreference: CssColorFunctionPreference) {
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
    },
    cssFunctionPreference
  );
}

function parseCmykField(value: string, cssFunctionPreference: CssColorFunctionPreference) {
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
    }),
    cssFunctionPreference
  );
}

function parseColorFromFormat(
  format: ConvertColorFormat,
  value: string,
  cssFunctionPreference: CssColorFunctionPreference
) {
  const trimmedValue = String(value ?? "").trim();
  if (!trimmedValue) {
    return null;
  }

  const genericSnapshot = parseGenericColor(
    format === "hex" ? normalizeHexCandidate(trimmedValue) : trimmedValue,
    cssFunctionPreference
  );
  if (genericSnapshot) {
    return genericSnapshot;
  }

  switch (format) {
    case "rgb":
      return parseRgbField(trimmedValue, cssFunctionPreference);
    case "hsl":
      return parseHslField(trimmedValue, cssFunctionPreference);
    case "oklch":
    case "css-oklch":
      return parseOklchField(trimmedValue, cssFunctionPreference);
    case "oklab":
      return parseOklabField(trimmedValue, cssFunctionPreference);
    case "cmyk":
      return parseCmykField(trimmedValue, cssFunctionPreference);
    default:
      return null;
  }
}

function resolveCssFunctionPreference(value: string, fallback: CssColorFunctionPreference) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalizedValue.startsWith("hsl")) {
    return "hsl";
  }

  if (normalizedValue.startsWith("rgb")) {
    return "rgb";
  }

  return fallback;
}

function resolveConvertColorElements(root: HTMLElement): ConvertColorElements | null {
  const swatchButton = root.querySelector(".convert-color-swatch") as HTMLButtonElement | null;
  const swatchFill = root.querySelector(".convert-color-swatch-fill") as HTMLElement | null;
  const colorPicker = root.querySelector(".convert-color-picker") as HTMLInputElement | null;
  const feedback = root.querySelector(".convert-color-feedback") as HTMLElement | null;
  const inputs = Array.from(
    root.querySelectorAll(".convert-color-field-input")
  ) as HTMLInputElement[];

  if (!swatchButton || !swatchFill || !colorPicker || !feedback || inputs.length === 0) {
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
    swatchButton,
    swatchFill,
    colorPicker,
    feedback,
    inputs,
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

  let cssFunctionPreference: CssColorFunctionPreference = "rgb";
  let currentSnapshot =
    buildSnapshot(defaultColor, cssFunctionPreference) ||
    buildSnapshot("#9EBB89", cssFunctionPreference);

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
    const nextCssFunctionPreference =
      format === "css-color"
        ? resolveCssFunctionPreference(value, cssFunctionPreference)
        : cssFunctionPreference;

    const snapshot = parseColorFromFormat(format, value, nextCssFunctionPreference);
    if (!snapshot) {
      if (options.activeInput) {
        showInvalidMessage(format, options.activeInput);
      }
      return false;
    }

    cssFunctionPreference = nextCssFunctionPreference;
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

  applySnapshot(currentSnapshot, {
    publish: false,
  });

  AppSharedColors.subscribe?.((detail: any = {}) => {
    const { type, state, metadata } = detail;

    if (type !== "activeColor" || !state?.activeColor) {
      return;
    }

    if (metadata?.source === "convert-color") {
      return;
    }

    setColorValue(String(state.activeColor), {
      publish: false,
      source: "shared-colors",
    });
  });
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
