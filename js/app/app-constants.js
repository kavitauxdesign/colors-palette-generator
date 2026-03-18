// Shared constants
// Keep limits, defaults, and labels in one place
window.AppConstants = {
  DISALLOWED_COLORS: new Set(),
  HEX_6_REGEX: /^#[0-9A-F]{6}$/,
  MAX_UNIQUE_COLOR_ATTEMPTS: 500,
  MAX_PALETTE_COLORS: 39,
  CARD_COPY_TOOLTIP_DEFAULT: "Copiar HEX",
  HISTORY_COPY_TOOLTIP_DEFAULT: "Copiar paleta",
  ADD_DISABLED_LABEL:
    "Esperemos, que con 39 colores la paleta esté completa\u261D\uFE0F",
  DEFAULT_PALETTE_SIZE: 6,
  DEFAULT_TEMPERATURE: { warm: true, cool: false },
  DEFAULT_BRIGHTNESS: 75,
  DEFAULT_SATURATION: 100,
  LOW_SATURATION_FALLBACK_THRESHOLD: 15,
  LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS: 30,
};
