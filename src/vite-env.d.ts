/// <reference types="vite/client" />

declare module "*?raw" {
  const content: string;
  export default content;
}

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
    HexToFilterCore?: any;
    HexToFilterApp?: any;
    PaletteGeneratorApp?: any;
    PaletteGeneratorStore?: any;
    PaletteGeneratorCoreHelpers?: any;
    PaletteGeneratorTemperatureHelpers?: any;
    PaletteGeneratorImageAnalysisHelpers?: any;
    PaletteGeneratorImageAnalysisStateful?: any;
    PaletteGeneratorImagePaletteHelpers?: any;
    PaletteGeneratorImagePaletteStateful?: any;
    AppAssetUrls?: any;
    Color?: any;
    copyTextToClipboard?: (text: string) => Promise<void>;
  }
}

export {};
