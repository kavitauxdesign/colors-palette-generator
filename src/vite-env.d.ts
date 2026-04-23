/// <reference types="vite/client" />

declare global {
  interface Window {
    AppConstants?: any;
    AppDom?: any;
    AppRegistry?: any;
    AppEventBus?: any;
    AppClipboard?: any;
    AppSharedColors?: any;
    AppColorUtils?: any;
    AppColorNames?: any;
    AppShell?: any;
    ColorBlindSimulatorApp?: any;
    ConvertColorApp?: any;
    HexToFilterCore?: any;
    HexToFilterApp?: any;
    PaletteGeneratorApp?: any;
    PaletteGeneratorLegacyGlobals?: any;
    PaletteGeneratorStore?: any;
    PaletteGeneratorStateSelectors?: any;
    PaletteGeneratorStateActions?: any;
    PaletteGeneratorStateRuntime?: any;
    PaletteGeneratorHistoryRuntime?: any;
    PaletteGeneratorControlsRuntime?: any;
    PaletteGeneratorCoreHelpers?: any;
    PaletteGeneratorCoreRuntime?: any;
    PaletteGeneratorCardsRuntime?: any;
    PaletteGeneratorColorModeHelpers?: any;
    PaletteGeneratorColorModeRuntime?: any;
    PaletteGeneratorTemperatureHelpers?: any;
    PaletteGeneratorImageAnalysisHelpers?: any;
    PaletteGeneratorImageAnalysisStateful?: any;
    PaletteGeneratorImagePaletteHelpers?: any;
    PaletteGeneratorImagePaletteStateful?: any;
    PaletteGeneratorImagePaletteRuntime?: any;
    PaletteGeneratorImageUiHelpers?: any;
    PaletteGeneratorImageUiRuntime?: any;
    AppAssetUrls?: any;
    Color?: any;
    copyTextToClipboard?: (text: string) => Promise<void>;
  }
}

export {};
