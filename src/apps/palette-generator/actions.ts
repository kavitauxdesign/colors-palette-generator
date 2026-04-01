import type {
  PaletteGeneratorAdjustments,
  PaletteGeneratorHistoryEntry,
  PaletteGeneratorStoreApi,
} from "./types";

import PaletteGeneratorStateSelectors, {
  type PaletteGeneratorLegacyRuntimeState,
  type PaletteGeneratorLegacySyncRuntimeState,
} from "./selectors";

type Metadata = Record<string, unknown>;
type AdjustmentContext = {
  brightnessInputValue?: number | null;
  saturationInputValue?: number | null;
  fallbackAdjustments?: Partial<PaletteGeneratorAdjustments> | null;
};
type Getter<T> = (() => T) | null | undefined;
type LegacyStoreBindingsArgs = {
  store: PaletteGeneratorStoreApi | null | undefined;
  getDominantToggleChecked?: Getter<boolean>;
  getSharedActiveColor?: Getter<string | null>;
  getBrightnessInputValue?: Getter<number | null>;
  getSaturationInputValue?: Getter<number | null>;
};

function resolveGetterValue<T>(getter: Getter<T>, fallback: T) {
  if (typeof getter !== "function") {
    return fallback;
  }

  const value = getter();
  return typeof value === "undefined" ? fallback : value;
}

function syncLegacyState(
  store: PaletteGeneratorStoreApi | null | undefined,
  partial: Record<string, unknown> = {},
  metadata: Metadata = {}
) {
  if (!store?.syncFromLegacy) {
    return null;
  }

  return store.syncFromLegacy(partial, metadata);
}

function syncLegacyAdjustments(
  store: PaletteGeneratorStoreApi | null | undefined,
  settings: Partial<PaletteGeneratorAdjustments> = {},
  context: AdjustmentContext = {},
  metadata: Metadata = {}
) {
  return syncLegacyState(
    store,
    {
      adjustments: PaletteGeneratorStateSelectors.getLegacyAdjustmentValues({
        settings,
        brightnessInputValue: context.brightnessInputValue,
        saturationInputValue: context.saturationInputValue,
        fallbackAdjustments: context.fallbackAdjustments,
      }),
    },
    metadata
  );
}

function syncLegacyCurrentPalette(
  store: PaletteGeneratorStoreApi | null | undefined,
  colors: string[] = [],
  metadata: Metadata = {}
) {
  return syncLegacyState(
    store,
    {
      currentPalette: Array.isArray(colors) ? [...colors] : [],
    },
    metadata
  );
}

function syncLegacyHistory(
  store: PaletteGeneratorStoreApi | null | undefined,
  history: PaletteGeneratorHistoryEntry[] = [],
  historyIndex = -1,
  metadata: Metadata = {}
) {
  return syncLegacyState(
    store,
    {
      paletteHistory: history,
      paletteHistoryIndex: historyIndex,
    },
    metadata
  );
}

function syncLegacyColorVariantIndex(
  store: PaletteGeneratorStoreApi | null | undefined,
  variantIndex = 0,
  metadata: Metadata = {}
) {
  return syncLegacyState(
    store,
    {
      colorPaletteVariantIndex: Number.isFinite(variantIndex) ? Number(variantIndex) : 0,
    },
    metadata
  );
}

function createLegacyStoreBindings(args: LegacyStoreBindingsArgs) {
  const store = args.store;

  function getLegacyRuntimeStateFromStore() {
    return PaletteGeneratorStateSelectors.getLegacyRuntimeState({
      storeState: store?.getState?.() || null,
      dominantToggleChecked: resolveGetterValue(args.getDominantToggleChecked, false),
      sharedActiveColor: resolveGetterValue(args.getSharedActiveColor, null),
    });
  }

  function getAdjustmentValues(
    settings: Partial<PaletteGeneratorAdjustments> = {},
    fallbackAdjustments: Partial<PaletteGeneratorAdjustments> | null | undefined = null
  ) {
    return PaletteGeneratorStateSelectors.getLegacyAdjustmentValues({
      settings,
      brightnessInputValue: resolveGetterValue(args.getBrightnessInputValue, null),
      saturationInputValue: resolveGetterValue(args.getSaturationInputValue, null),
      fallbackAdjustments,
    });
  }

  function syncState(partial: Record<string, unknown> = {}, metadata: Metadata = {}) {
    return syncLegacyState(store, partial, metadata);
  }

  function syncAdjustments(
    settings: Partial<PaletteGeneratorAdjustments> = {},
    fallbackAdjustments: Partial<PaletteGeneratorAdjustments> | null | undefined = null,
    metadata: Metadata = {}
  ) {
    return syncLegacyAdjustments(
      store,
      settings,
      {
        brightnessInputValue: resolveGetterValue(args.getBrightnessInputValue, null),
        saturationInputValue: resolveGetterValue(args.getSaturationInputValue, null),
        fallbackAdjustments,
      },
      metadata
    );
  }

  function syncCurrentPalette(colors: string[] = [], metadata: Metadata = {}) {
    return syncLegacyCurrentPalette(store, colors, metadata);
  }

  function syncHistory(
    history: PaletteGeneratorHistoryEntry[] = [],
    historyIndex = -1,
    metadata: Metadata = {}
  ) {
    return syncLegacyHistory(store, history, historyIndex, metadata);
  }

  function syncColorVariantIndex(variantIndex = 0, metadata: Metadata = {}) {
    return syncLegacyColorVariantIndex(store, variantIndex, metadata);
  }

  function syncWithLegacyRuntime(
    runtimeState: PaletteGeneratorLegacySyncRuntimeState,
    fallbackAdjustments: Partial<PaletteGeneratorAdjustments> | null | undefined = null,
    partial: Record<string, unknown> = {},
    metadata: Metadata = {}
  ) {
    const nextState = PaletteGeneratorStateSelectors.buildLegacyStoreSyncPayload({
      runtimeState,
      adjustments: getAdjustmentValues({}, fallbackAdjustments),
      partial,
    });

    return syncState(nextState, metadata);
  }

  function subscribeToStore(
    listener?: (
      state: PaletteGeneratorLegacyRuntimeState,
      metadata?: Metadata
    ) => void
  ) {
    if (typeof listener !== "function" || !store?.subscribe) {
      return () => {};
    }

    return store.subscribe((state, metadata = {}) => {
      listener(
        PaletteGeneratorStateSelectors.getLegacyRuntimeState({
          storeState: state,
          dominantToggleChecked: resolveGetterValue(args.getDominantToggleChecked, false),
          sharedActiveColor: resolveGetterValue(args.getSharedActiveColor, null),
        }),
        metadata
      );
    });
  }

  return {
    initialRuntimeState: getLegacyRuntimeStateFromStore(),
    getAdjustmentValues,
    syncState,
    syncAdjustments,
    syncCurrentPalette,
    syncHistory,
    syncColorVariantIndex,
    syncWithLegacyRuntime,
    subscribeToStore,
  };
}

export const PaletteGeneratorStateActions = {
  syncLegacyState,
  syncLegacyAdjustments,
  syncLegacyCurrentPalette,
  syncLegacyHistory,
  syncLegacyColorVariantIndex,
  createLegacyStoreBindings,
};

window.PaletteGeneratorStateActions = PaletteGeneratorStateActions;

export default PaletteGeneratorStateActions;
