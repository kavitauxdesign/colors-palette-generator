import "../../../js/shared/colors/color-names.js";

type AppColorNameEntry = {
  name: string;
  hex: string;
};

type ColorNamesWindow = Window &
  typeof globalThis & {
    AppColorNames?: AppColorNameEntry[];
  };

const runtimeWindow = window as ColorNamesWindow;

export function getAppColorNames(): AppColorNameEntry[] {
  return Array.isArray(runtimeWindow.AppColorNames) ? runtimeWindow.AppColorNames : [];
}

export default getAppColorNames;
