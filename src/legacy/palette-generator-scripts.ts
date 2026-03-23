import colorNamesScript from "../../js/shared/colors/color-names.js?raw";
import paletteGeneratorStateScript from "../../js/apps/palette-generator/palette-generator-state.js?raw";
import paletteGeneratorCoreScript from "../../js/apps/palette-generator/palette-generator-core.js?raw";
import paletteGeneratorTemperatureScript from "../../js/apps/palette-generator/palette-generator-temperature.js?raw";
import paletteGeneratorColorModeScript from "../../js/apps/palette-generator/palette-generator-color-mode.js?raw";
import paletteGeneratorImageUiScript from "../../js/apps/palette-generator/palette-generator-image-ui.js?raw";
import paletteGeneratorCardHelpersScript from "../../js/apps/palette-generator/palette-generator-card-helpers.js?raw";
import paletteGeneratorCardsScript from "../../js/apps/palette-generator/palette-generator-cards.js?raw";

export const paletteGeneratorLegacyScripts = [
  {
    id: "shared-color-names.js",
    code: colorNamesScript,
  },
  {
    id: "palette-generator-state.js",
    code: paletteGeneratorStateScript,
  },
  {
    id: "palette-generator-core.js",
    code: paletteGeneratorCoreScript,
  },
  {
    id: "palette-generator-temperature.js",
    code: paletteGeneratorTemperatureScript,
  },
  {
    id: "palette-generator-color-mode.js",
    code: paletteGeneratorColorModeScript,
  },
  {
    id: "palette-generator-image-ui.js",
    code: paletteGeneratorImageUiScript,
  },
  {
    id: "palette-generator-card-helpers.js",
    code: paletteGeneratorCardHelpersScript,
  },
  {
    id: "palette-generator-cards.js",
    code: paletteGeneratorCardsScript,
  },
];

export default paletteGeneratorLegacyScripts;
