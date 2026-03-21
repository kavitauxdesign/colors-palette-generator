// App initializer.
// Keeps HTML lean by loading the legacy script graph in a single place.
(function initializeApp() {
  const APP_BASE_YEAR = 2026;
  const SCRIPT_GROUPS = {
    core: [
      "js/app/app-constants.js",
      "js/shared/services/app-registry.js",
      "js/shared/services/app-event-bus.js",
      "js/shared/colors/app-color-utils.js",
      "js/shared/services/clipboard-service.js",
      "js/shared/services/app-shared-colors.js",
      "js/shared/colors/color-names.js",
      "js/app/app-dom.js",
      "js/app/app-shell.js",
    ],
    paletteGenerator: [
      "js/apps/palette-generator/palette-generator-state.js",
      "js/apps/palette-generator/palette-generator-core.js",
      "js/apps/palette-generator/palette-generator-image-analysis.js",
      "js/apps/palette-generator/palette-generator-image-palette.js",
      "js/apps/palette-generator/palette-generator-temperature.js",
      "js/apps/palette-generator/palette-generator-color-mode.js",
      "js/apps/palette-generator/palette-generator-image-ui.js",
      "js/apps/palette-generator/palette-generator-controls.js",
      "js/apps/palette-generator/palette-generator-card-helpers.js",
      "js/apps/palette-generator/palette-generator-card-names.js",
      "js/apps/palette-generator/palette-generator-cards.js",
      "js/apps/palette-generator/palette-generator-history.js",
      "js/apps/palette-generator/palette-generator-app.js",
    ],
    hexToFilter: [
      "js/apps/hex-to-filter/hex-to-filter-core.js",
      "js/apps/hex-to-filter/hex-to-filter-app.js",
    ],
    bootstrap: [
      "js/app/app-bootstrap.js",
    ],
  };

  const scriptQueue = Object.values(SCRIPT_GROUPS).flat();

  function updateFooterYear() {
    const yearSpan = document.getElementById("footerYear");

    if (!yearSpan) {
      return;
    }

    const currentYear = new Date().getFullYear();
    yearSpan.textContent =
      currentYear === APP_BASE_YEAR
        ? String(APP_BASE_YEAR)
        : `${APP_BASE_YEAR}\u2013${currentYear}`;
  }

  function loadScript(source) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-app-script="${source}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = source;
      script.async = false;
      script.dataset.appScript = source;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error(`Unable to load script: ${source}`)),
        { once: true },
      );
      document.body.appendChild(script);
    });
  }

  async function loadScriptsSequentially() {
    for (const source of scriptQueue) {
      await loadScript(source);
    }
  }

  updateFooterYear();
  loadScriptsSequentially().catch((error) => {
    console.error("[app-init]", error);
    document.documentElement.dataset.appInitFailed = "true";
  });
})();
