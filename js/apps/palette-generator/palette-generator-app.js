// Public API for the palette generator mini-app.
(function initializePaletteGeneratorAppRegistration() {
  let hasInitialized = false;

  function initialize() {
    if (hasInitialized) {
      return;
    }

    if (
      typeof setPaletteSize !== "function" ||
      typeof setTemperatureSelection !== "function" ||
      typeof generatePalette !== "function" ||
      typeof updateAddColorButtonState !== "function"
    ) {
      console.error("Palette generator initialization failed: required startup functions are missing.");
      return;
    }

    hasInitialized = true;

    if (typeof setupSurpriseButton === "function") {
      setupSurpriseButton();
    }

    setPaletteSize(paletteSize);
    setTemperatureSelection(temperature);
    void generatePalette();
    updateAddColorButtonState();
  }

  const paletteGeneratorApp = {
    initialize,
    getState() {
      return {
        palette: [...currentPalette],
        paletteSize,
        baseMode: paletteBaseMode,
        temperature: { ...temperature },
      };
    },
  };

  window.PaletteGeneratorApp = paletteGeneratorApp;
  window.AppRegistry?.register("palette-generator", paletteGeneratorApp);
})();
