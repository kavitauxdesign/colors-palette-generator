// Shared color state that mini-apps can read from or publish to.
(function initializeAppSharedColors() {
  const {
    normalizeHexColor,
    isValidHexColor,
  } = window.AppColorUtils || {};

  if (typeof normalizeHexColor !== "function" || typeof isValidHexColor !== "function") {
    throw new Error("AppColorUtils helpers are required before AppSharedColors loads.");
  }

  const appConstants = window.AppConstants || {};
  const defaultTargetColors = Array.isArray(appConstants.DEFAULT_TARGET_COLORS)
    ? appConstants.DEFAULT_TARGET_COLORS
        .map((color) => normalizeHexColor(color))
        .filter((hex) => isValidHexColor(hex))
    : [];
  const fallbackDefaultColor = normalizeHexColor(appConstants.DEFAULT_COLOR_BASE || "");
  const sharedDefaultActiveColor = defaultTargetColors.length > 0
    ? defaultTargetColors[Math.floor(Math.random() * defaultTargetColors.length)]
    : (isValidHexColor(fallbackDefaultColor) ? fallbackDefaultColor : null);

  let sharedState = {
    palette: [],
    activeColor: sharedDefaultActiveColor,
    lastSource: null,
  };

  function buildSnapshot() {
    return {
      palette: [...sharedState.palette],
      activeColor: sharedState.activeColor,
      lastSource: sharedState.lastSource,
    };
  }

  function emitChange(changeType, metadata = {}) {
    window.AppEventBus?.emit("shared-colors:changed", {
      type: changeType,
      state: buildSnapshot(),
      metadata,
    });
  }

  function normalizePalette(colors) {
    return Array.isArray(colors)
      ? colors
          .map((color) => normalizeHexColor(color))
          .filter((hex) => isValidHexColor(hex))
      : [];
  }

  function setPalette(colors, metadata = {}) {
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
      lastSource: metadata.source || sharedState.lastSource,
    };

    emitChange("palette", metadata);
    return buildSnapshot();
  }

  function setActiveColor(color, metadata = {}) {
    const normalizedColor = normalizeHexColor(color);
    const nextActiveColor = isValidHexColor(normalizedColor) ? normalizedColor : null;

    if (nextActiveColor === sharedState.activeColor) {
      return buildSnapshot();
    }

    sharedState = {
      ...sharedState,
      activeColor: nextActiveColor,
      lastSource: metadata.source || sharedState.lastSource,
    };

    emitChange("activeColor", metadata);
    return buildSnapshot();
  }

  function subscribe(listener) {
    return window.AppEventBus?.on("shared-colors:changed", listener) || (() => {});
  }

  window.AppSharedColors = {
    getState: buildSnapshot,
    getDefaultActiveColor() {
      return sharedDefaultActiveColor;
    },
    setPalette,
    setActiveColor,
    subscribe,
  };
})();
