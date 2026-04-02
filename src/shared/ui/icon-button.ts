import AppAssetUrls from "../assets/app-asset-urls";

export type AppIconButtonIconName = keyof typeof AppAssetUrls.icons;

type CreateAppIconButtonOptions = {
  ariaLabel: string;
  tooltipText: string;
  iconName?: AppIconButtonIconName;
  iconSrc?: string;
  extraClasses?: string[];
  iconClassNames?: string[];
};

const APP_ICON_BUTTON_BASE_CLASSES = [
  "app-icon-btn",
  "secondary-btn",
  "secondary-btn-icon",
  "copy-btn-icon",
];

export function createAppIconButton({
  ariaLabel,
  tooltipText,
  iconName,
  iconSrc,
  extraClasses = [],
  iconClassNames = [],
}: CreateAppIconButtonOptions) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = [...APP_ICON_BUTTON_BASE_CLASSES, ...extraClasses]
    .filter(Boolean)
    .join(" ");
  button.setAttribute("aria-label", ariaLabel);

  const resolvedIconSrc =
    iconSrc || (iconName ? AppAssetUrls.icons[iconName] : "") || AppAssetUrls.icons.copy;
  const icon = document.createElement("img");
  icon.className = ["secondary-btn-icon-asset", "app-icon-btn-asset", ...iconClassNames]
    .filter(Boolean)
    .join(" ");
  icon.src = resolvedIconSrc;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  button.appendChild(icon);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;
  button.appendChild(tooltip);

  return button;
}

export default createAppIconButton;
