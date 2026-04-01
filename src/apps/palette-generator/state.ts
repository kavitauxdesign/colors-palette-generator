let hasInitializedPaletteGeneratorState = false;

function getPaletteGeneratorStateWindow() {
  return window as any;
}

function cloneArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? [...value] : [];
}

function cloneObject<T extends Record<string, unknown>>(value: T | null | undefined) {
  return value && typeof value === "object" ? { ...value } : null;
}

export function initializePaletteGeneratorState() {
  if (hasInitializedPaletteGeneratorState) {
    return;
  }

  const runtimeWindow = getPaletteGeneratorStateWindow();
  const dom = runtimeWindow.AppDom || {};
  const constants = runtimeWindow.AppConstants || {};
  const stateActions = runtimeWindow.PaletteGeneratorStateActions || {};
  const stateRuntime = runtimeWindow.PaletteGeneratorStateRuntime || {};

  if (typeof stateActions.createLegacyStoreBindings !== "function") {
    throw new Error(
      "PaletteGeneratorStateActions.createLegacyStoreBindings is required before state.ts initializes."
    );
  }

  if (
    typeof stateRuntime.normalizeLegacyRuntimeState !== "function" ||
    typeof stateRuntime.buildLegacySyncRuntimeState !== "function"
  ) {
    throw new Error(
      "PaletteGeneratorStateRuntime is required before state.ts initializes."
    );
  }

  Object.assign(runtimeWindow, dom, constants);

  const legacyGlobals = runtimeWindow.PaletteGeneratorLegacyGlobals || {};
  runtimeWindow.PaletteGeneratorLegacyGlobals = legacyGlobals;

  const bindings =
    stateActions.createLegacyStoreBindings({
      store: runtimeWindow.PaletteGeneratorStore || null,
      getDominantToggleChecked: () =>
        dom.paletteImageDominantToggle
          ? !dom.paletteImageDominantToggle.checked
          : false,
      getSharedActiveColor: () =>
        runtimeWindow.AppSharedColors?.getDefaultActiveColor?.() ||
        runtimeWindow.AppSharedColors?.getState?.().activeColor ||
        constants.DEFAULT_COLOR_BASE,
      getBrightnessInputValue: () =>
        dom.brightnessInput ? Number(dom.brightnessInput.value) : null,
      getSaturationInputValue: () =>
        dom.saturationInput ? Number(dom.saturationInput.value) : null,
    }) || null;

  const runtimeState = {
    paletteSize: Number(constants.DEFAULT_PALETTE_SIZE) || 0,
    paletteHistory: [] as any[],
    paletteHistoryIndex: -1,
    paletteBaseMode: constants.DEFAULT_PALETTE_BASE_MODE,
    uploadedBaseImage: null as any,
    prioritizeImageDominantColors: dom.paletteImageDominantToggle
      ? !dom.paletteImageDominantToggle.checked
      : false,
    imagePaletteVariantIndex: 0,
    imageInspirationVariantIndex: 0,
    recentInspiredPalettes: [] as string[][],
    selectedPaletteBaseColor: constants.DEFAULT_COLOR_BASE,
    selectedColorPaletteType: constants.DEFAULT_COLOR_PALETTE_TYPE,
    selectedMonochromaticGenerationMode:
      constants.DEFAULT_MONOCHROMATIC_GENERATION_MODE,
    selectedAnalogousSeparationMode: constants.DEFAULT_ANALOGOUS_SEPARATION_MODE,
    resolvedAutomaticColorPaletteType: "triad",
    temperature: {
      warm: !!constants.DEFAULT_TEMPERATURE?.warm,
      cool: !!constants.DEFAULT_TEMPERATURE?.cool,
    },
    currentPalette: [] as string[],
    paletteAdjustmentBase: [] as string[],
    paletteAdjustmentBaseSettings: {
      brightness: constants.DEFAULT_BRIGHTNESS,
      saturation: constants.DEFAULT_SATURATION,
    },
  };

  function defineMirroredProperty(name: string, getter: () => unknown, setter: (value: any) => void) {
    Object.defineProperty(legacyGlobals, name, {
      get: getter,
      set: setter,
      configurable: true,
    });

    Object.defineProperty(runtimeWindow, name, {
      get: getter,
      set: setter,
      configurable: true,
    });
  }

  defineMirroredProperty("paletteSize", () => runtimeState.paletteSize, (value) => {
    runtimeState.paletteSize = Number.isFinite(value) ? Number(value) : constants.DEFAULT_PALETTE_SIZE;
  });
  defineMirroredProperty("paletteHistory", () => runtimeState.paletteHistory, (value) => {
    runtimeState.paletteHistory = cloneArray(value);
  });
  defineMirroredProperty(
    "paletteHistoryIndex",
    () => runtimeState.paletteHistoryIndex,
    (value) => {
      runtimeState.paletteHistoryIndex = Number.isFinite(value) ? Number(value) : -1;
    }
  );
  defineMirroredProperty("paletteBaseMode", () => runtimeState.paletteBaseMode, (value) => {
    runtimeState.paletteBaseMode = value;
  });
  defineMirroredProperty(
    "uploadedBaseImage",
    () => runtimeState.uploadedBaseImage,
    (value) => {
      runtimeState.uploadedBaseImage = value;
    }
  );
  defineMirroredProperty(
    "prioritizeImageDominantColors",
    () => runtimeState.prioritizeImageDominantColors,
    (value) => {
      runtimeState.prioritizeImageDominantColors = !!value;
    }
  );
  defineMirroredProperty(
    "imagePaletteVariantIndex",
    () => runtimeState.imagePaletteVariantIndex,
    (value) => {
      runtimeState.imagePaletteVariantIndex = Number.isFinite(value) ? Number(value) : 0;
    }
  );
  defineMirroredProperty(
    "imageInspirationVariantIndex",
    () => runtimeState.imageInspirationVariantIndex,
    (value) => {
      runtimeState.imageInspirationVariantIndex = Number.isFinite(value)
        ? Number(value)
        : 0;
    }
  );
  defineMirroredProperty(
    "recentInspiredPalettes",
    () => runtimeState.recentInspiredPalettes,
    (value) => {
      runtimeState.recentInspiredPalettes = Array.isArray(value)
        ? value.map((palette) => cloneArray(palette))
        : [];
    }
  );
  defineMirroredProperty(
    "selectedPaletteBaseColor",
    () => runtimeState.selectedPaletteBaseColor,
    (value) => {
      runtimeState.selectedPaletteBaseColor = value;
    }
  );
  defineMirroredProperty(
    "selectedColorPaletteType",
    () => runtimeState.selectedColorPaletteType,
    (value) => {
      runtimeState.selectedColorPaletteType = value;
    }
  );
  defineMirroredProperty(
    "selectedMonochromaticGenerationMode",
    () => runtimeState.selectedMonochromaticGenerationMode,
    (value) => {
      runtimeState.selectedMonochromaticGenerationMode = value;
    }
  );
  defineMirroredProperty(
    "selectedAnalogousSeparationMode",
    () => runtimeState.selectedAnalogousSeparationMode,
    (value) => {
      runtimeState.selectedAnalogousSeparationMode = value;
    }
  );
  defineMirroredProperty(
    "resolvedAutomaticColorPaletteType",
    () => runtimeState.resolvedAutomaticColorPaletteType,
    (value) => {
      runtimeState.resolvedAutomaticColorPaletteType = value;
    }
  );
  defineMirroredProperty("temperature", () => runtimeState.temperature, (value) => {
    runtimeState.temperature =
      value && typeof value === "object"
        ? {
            warm: !!value.warm,
            cool: !!value.cool,
          }
        : {
            warm: !!constants.DEFAULT_TEMPERATURE?.warm,
            cool: !!constants.DEFAULT_TEMPERATURE?.cool,
          };
  });
  defineMirroredProperty("currentPalette", () => runtimeState.currentPalette, (value) => {
    runtimeState.currentPalette = cloneArray(value);
  });
  defineMirroredProperty(
    "paletteAdjustmentBase",
    () => runtimeState.paletteAdjustmentBase,
    (value) => {
      runtimeState.paletteAdjustmentBase = cloneArray(value);
    }
  );
  defineMirroredProperty(
    "paletteAdjustmentBaseSettings",
    () => runtimeState.paletteAdjustmentBaseSettings,
    (value) => {
      runtimeState.paletteAdjustmentBaseSettings =
        cloneObject(value) || {
          brightness: constants.DEFAULT_BRIGHTNESS,
          saturation: constants.DEFAULT_SATURATION,
        };
    }
  );

  function applyPaletteGeneratorLegacyRuntimeState(
    nextState: Record<string, unknown> | null = null,
    options: Record<string, unknown> = {}
  ) {
    const normalizedState = stateRuntime.normalizeLegacyRuntimeState({
      nextState,
      prioritizeImageDominantColorsFallback: dom.paletteImageDominantToggle
        ? !dom.paletteImageDominantToggle.checked
        : false,
    });

    runtimeState.paletteSize = normalizedState.paletteSize;
    runtimeState.paletteHistory = cloneArray(normalizedState.paletteHistory);
    runtimeState.paletteHistoryIndex = normalizedState.paletteHistoryIndex;
    runtimeState.paletteBaseMode = normalizedState.paletteBaseMode;
    runtimeState.uploadedBaseImage = normalizedState.uploadedBaseImage;
    runtimeState.prioritizeImageDominantColors =
      normalizedState.prioritizeImageDominantColors;
    runtimeState.imagePaletteVariantIndex = normalizedState.imagePaletteVariantIndex;
    runtimeState.imageInspirationVariantIndex =
      normalizedState.imageInspirationVariantIndex;
    runtimeState.selectedPaletteBaseColor = normalizedState.selectedPaletteBaseColor;
    runtimeState.selectedColorPaletteType = normalizedState.selectedColorPaletteType;
    runtimeState.selectedMonochromaticGenerationMode =
      normalizedState.selectedMonochromaticGenerationMode;
    runtimeState.selectedAnalogousSeparationMode =
      normalizedState.selectedAnalogousSeparationMode;
    runtimeState.resolvedAutomaticColorPaletteType =
      normalizedState.resolvedAutomaticColorPaletteType;
    runtimeState.temperature = normalizedState.temperature;
    runtimeState.currentPalette = cloneArray(normalizedState.currentPalette);

    if (options.syncAdjustmentBaseSettings) {
      runtimeState.paletteAdjustmentBaseSettings = {
        ...normalizedState.paletteAdjustmentBaseSettings,
      };
    }
  }

  function getPaletteGeneratorStoreAdjustmentValues(settings: Record<string, unknown> = {}) {
    return (
      bindings?.getAdjustmentValues?.(
        settings,
        runtimeState.paletteAdjustmentBaseSettings
      ) || {
        brightness: constants.DEFAULT_BRIGHTNESS,
        saturation: constants.DEFAULT_SATURATION,
      }
    );
  }

  function syncPaletteGeneratorStoreState(
    partial: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {}
  ) {
    return bindings?.syncState?.(partial, metadata) || null;
  }

  function syncPaletteGeneratorStoreAdjustments(
    settings: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {}
  ) {
    return (
      bindings?.syncAdjustments?.(
        settings,
        runtimeState.paletteAdjustmentBaseSettings,
        metadata
      ) || null
    );
  }

  function syncPaletteGeneratorStoreCurrentPalette(
    colors = runtimeState.currentPalette,
    metadata: Record<string, unknown> = {}
  ) {
    return (
      bindings?.syncCurrentPalette?.(
        Array.isArray(colors) ? [...colors] : [],
        metadata
      ) || null
    );
  }

  function syncPaletteGeneratorStoreHistoryState(metadata: Record<string, unknown> = {}) {
    return (
      bindings?.syncHistory?.(
        runtimeState.paletteHistory,
        runtimeState.paletteHistoryIndex,
        metadata
      ) || null
    );
  }

  function syncPaletteGeneratorStoreColorVariantIndex(
    variantIndex = 0,
    metadata: Record<string, unknown> = {}
  ) {
    return bindings?.syncColorVariantIndex?.(variantIndex, metadata) || null;
  }

  function syncPaletteGeneratorStoreWithLegacyState(
    partial: Record<string, unknown> = {},
    metadata: Record<string, unknown> = {}
  ) {
    return (
      bindings?.syncWithLegacyRuntime?.(
        stateRuntime.buildLegacySyncRuntimeState({
          paletteSize: runtimeState.paletteSize,
          paletteHistory: runtimeState.paletteHistory,
          paletteHistoryIndex: runtimeState.paletteHistoryIndex,
          paletteBaseMode: runtimeState.paletteBaseMode,
          uploadedBaseImage: runtimeState.uploadedBaseImage,
          prioritizeImageDominantColors: runtimeState.prioritizeImageDominantColors,
          imagePaletteVariantIndex: runtimeState.imagePaletteVariantIndex,
          imageInspirationVariantIndex: runtimeState.imageInspirationVariantIndex,
          selectedPaletteBaseColor: runtimeState.selectedPaletteBaseColor,
          selectedColorPaletteType: runtimeState.selectedColorPaletteType,
          selectedMonochromaticGenerationMode:
            runtimeState.selectedMonochromaticGenerationMode,
          selectedAnalogousSeparationMode:
            runtimeState.selectedAnalogousSeparationMode,
          resolvedAutomaticColorPaletteType:
            runtimeState.resolvedAutomaticColorPaletteType,
          temperature: runtimeState.temperature,
          currentPalette: runtimeState.currentPalette,
          colorPaletteVariantIndex:
            typeof runtimeWindow.colorPaletteVariantIndex !== "undefined"
              ? runtimeWindow.colorPaletteVariantIndex
              : undefined,
        }),
        runtimeState.paletteAdjustmentBaseSettings,
        partial,
        metadata
      ) || null
    );
  }

  runtimeWindow.applyPaletteGeneratorLegacyRuntimeState =
    applyPaletteGeneratorLegacyRuntimeState;
  runtimeWindow.getPaletteGeneratorStoreAdjustmentValues =
    getPaletteGeneratorStoreAdjustmentValues;
  runtimeWindow.syncPaletteGeneratorStoreState = syncPaletteGeneratorStoreState;
  runtimeWindow.syncPaletteGeneratorStoreAdjustments =
    syncPaletteGeneratorStoreAdjustments;
  runtimeWindow.syncPaletteGeneratorStoreCurrentPalette =
    syncPaletteGeneratorStoreCurrentPalette;
  runtimeWindow.syncPaletteGeneratorStoreHistoryState =
    syncPaletteGeneratorStoreHistoryState;
  runtimeWindow.syncPaletteGeneratorStoreColorVariantIndex =
    syncPaletteGeneratorStoreColorVariantIndex;
  runtimeWindow.syncPaletteGeneratorStoreWithLegacyState =
    syncPaletteGeneratorStoreWithLegacyState;

  applyPaletteGeneratorLegacyRuntimeState(bindings?.initialRuntimeState || null, {
    syncAdjustmentBaseSettings: true,
  });

  bindings?.subscribeToStore?.((nextState: Record<string, unknown>) => {
    applyPaletteGeneratorLegacyRuntimeState(nextState);
  });

  syncPaletteGeneratorStoreWithLegacyState();

  hasInitializedPaletteGeneratorState = true;
}

export default initializePaletteGeneratorState;
