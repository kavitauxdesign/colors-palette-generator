import APP_CONSTANTS from "../constants";
import { emit, on } from "./event-bus";
import AppColorUtils from "../color/color-utils";

const { normalizeHexColor, isValidHexColor } = AppColorUtils;

const defaultTargetColors = Array.isArray(APP_CONSTANTS.DEFAULT_TARGET_COLORS)
  ? APP_CONSTANTS.DEFAULT_TARGET_COLORS
      .map((color) => normalizeHexColor(color))
      .filter((hex) => isValidHexColor(hex))
  : [];

const fallbackDefaultColor = normalizeHexColor(APP_CONSTANTS.DEFAULT_COLOR_BASE || "");

const sharedDefaultActiveColor =
  defaultTargetColors.length > 0
    ? defaultTargetColors[Math.floor(Math.random() * defaultTargetColors.length)]
    : (isValidHexColor(fallbackDefaultColor) ? fallbackDefaultColor : null);

let sharedState = {
  palette: [] as string[],
  activeColor: sharedDefaultActiveColor,
  lastSource: null as string | null,
};

function buildSnapshot() {
  return {
    palette: [...sharedState.palette],
    activeColor: sharedState.activeColor,
    lastSource: sharedState.lastSource,
  };
}

function emitChange(changeType: string, metadata: Record<string, unknown> = {}) {
  emit("shared-colors:changed", {
    type: changeType,
    state: buildSnapshot(),
    metadata,
  });
}

function normalizePalette(colors: unknown) {
  return Array.isArray(colors)
    ? colors
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];
}

function setPalette(colors: unknown, metadata: Record<string, unknown> = {}) {
  const normalizedPalette = normalizePalette(colors);
  const didChange =
    normalizedPalette.length !== sharedState.palette.length ||
    normalizedPalette.some((color, index) => color !== sharedState.palette[index]);

  if (!didChange) {
    return buildSnapshot();
  }

  sharedState = {
    ...sharedState,
    palette: normalizedPalette,
    lastSource: String(metadata.source || sharedState.lastSource || ""),
  };

  emitChange("palette", metadata);
  return buildSnapshot();
}

function setActiveColor(color: unknown, metadata: Record<string, unknown> = {}) {
  const normalizedColor = normalizeHexColor(color);
  const nextActiveColor = isValidHexColor(normalizedColor) ? normalizedColor : null;

  if (nextActiveColor === sharedState.activeColor) {
    return buildSnapshot();
  }

  sharedState = {
    ...sharedState,
    activeColor: nextActiveColor,
    lastSource: String(metadata.source || sharedState.lastSource || ""),
  };

  emitChange("activeColor", metadata);
  return buildSnapshot();
}

function subscribe(listener: (detail?: Record<string, unknown>) => void) {
  return on("shared-colors:changed", listener);
}

export const AppSharedColors = {
  getState: buildSnapshot,
  getDefaultActiveColor() {
    return sharedDefaultActiveColor;
  },
  setPalette,
  setActiveColor,
  subscribe,
};

window.AppSharedColors = AppSharedColors;

export default AppSharedColors;
