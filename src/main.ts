import "./shared/constants";
import "./shared/services/event-bus";
import "./shared/services/registry";
import "./shared/services/clipboard";
import "./shared/color/color-names";
import "./shared/color/color-utils";
import "./shared/services/shared-colors";
import "./shared/assets/app-asset-urls";
import "./apps/palette-generator/store";
import "./apps/palette-generator/selectors";
import "./apps/palette-generator/actions";
import "./apps/palette-generator/state-runtime";
import "./apps/palette-generator/history-runtime";
import "./apps/palette-generator/controls-runtime";
import "./apps/palette-generator/core-helpers";
import "./apps/palette-generator/core-runtime";
import "./apps/palette-generator/core";
import "./apps/palette-generator/cards-runtime";
import "./apps/palette-generator/color-mode-helpers";
import "./apps/palette-generator/color-mode-runtime";
import "./apps/palette-generator/temperature-helpers";
import "./apps/palette-generator/temperature";
import "./apps/palette-generator/card-helpers";
import "./apps/palette-generator/cards";
import "./apps/palette-generator/image-analysis-helpers";
import "./apps/palette-generator/image-analysis-stateful";
import "./apps/palette-generator/image-palette-helpers";
import "./apps/palette-generator/image-palette-stateful";
import "./apps/palette-generator/image-palette-runtime";
import "./apps/palette-generator/image-ui-helpers";
import "./apps/palette-generator/image-ui-runtime";

import setupAppDom from "./shared/dom/app-dom";
import initializeAppShell from "./app/shell";
import initializeRegisteredApps from "./app/bootstrap";
import registerHexToFilterApp from "./apps/hex-to-filter";
import registerPaletteGeneratorApp, {
  initializePaletteGeneratorModules,
} from "./apps/palette-generator";

function updateFooterYear() {
  const APP_BASE_YEAR = 2026;
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

async function bootstrap() {
  setupAppDom();
  initializeAppShell();
  registerHexToFilterApp();
  registerPaletteGeneratorApp();
  initializePaletteGeneratorModules();
  initializeRegisteredApps();
}

function startApp() {
  updateFooterYear();
  void bootstrap();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}
