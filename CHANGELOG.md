# Changelog

## 2.3.0 (beta) - 2026-03-22

### Highlights
- Expanded `Color mode` into explicit harmony workflows with dedicated behavior for `Monochromatic`, `Complementary`, `Analogous`, `Triad`, and `Tetrad`.
- Made `Monochromatic` the default color harmony and removed the old automatic palette-type selection from the main UI.
- Added richer role-based behavior for `Color base` and `Complementary`, including fixed read-only pins and harmony-aware ordering.

### Palette generator improvements
- Added monochromatic submodes for `Automatic`, `Shades`, and `Tints`, with size presets of `6`, `9`, and `12`.
- Added explicit `Complementary` layouts for `2` and `6` colors, including lighter and darker companion steps around the base and complementary colors.
- Added `Analogous` separation controls with `Soft`, `Medium`, and `Intense` angle presets.
- Reworked `Triad` and `Tetrad` generation so they are built from explicit harmony logic tied to the selected base color instead of generic fallback variation rules.
- Improved color-size switching so palette changes in `Color mode` rebuild the harmony from the current base color.

### UX and interface updates
- Replaced palette-type radio controls with dropdowns and simplified mode-specific controls so each harmony only shows relevant options.
- Hid unsupported actions in harmony-driven color palettes, including manual pinning, irrelevant regenerate actions, and unnecessary intensity controls in monochromatic mode.
- Added a palette-only loading overlay with a soft blur and spinner while automatic palette recalculations are running.
- Unified the default shared starter colors between `Palette Generator` and `HEX to CSS filter`.

### Fixes and maintenance
- Fixed several edge cases where color roles or pinned-state rules leaked across modes or palette sizes.
- Stabilized complementary palette behavior when moving between `2` and `6` colors and when adjusting the base color live.
- Improved slider behavior in harmony modes so brightness and saturation updates respect fixed role colors and regenerate derived colors more predictably.

## 2.2.0 - 2026-03-20

### Highlights
- Formalized the front-end as a shared shell that hosts the palette generator and `HEX to CSS filter` as isolated mini-app modules.
- Added a templated HTML build flow using `html/index.template.html` and app partials compiled into `index.html`.
- Replaced the previous monolithic CSS structure with separate design-system, layout, shared, and app-specific stylesheets.
- Reorganized the JavaScript codebase into `app`, `apps`, and `shared` layers to make future growth easier.

### Workflow improvements
- Improved view switching and hash-based navigation across mini-apps.
- Improved clipboard handling and copy feedback across the palette and filter tools.
- Kept shared color state available between tools so the active palette color can feed the filter workflow.
- Added production-only Yandex Metrika loading for analytics.

### Fixes and maintenance
- Updated the footer report link so it points directly to GitHub issues.
- Simplified runtime script loading to a single app entry point.
- Refreshed the README so it documents the current architecture and both available tools.

## 2.1.0 - 2026-03-18

### Highlights
- Added `Image mode` to generate palettes from an uploaded image.
- Added `Inspiration mode` to create palettes inspired by an image instead of only extracting literal colors.
- Added improved `Regenerate palette`, `Surprise me`, and image variant flows with more meaningful results.
- Added `Undo / Redo` navigation and a stronger palette history workflow.
- Added the ability to `pin` individual colors so they stay protected during palette regeneration.

### Generation and editing improvements
- Palette ordering now favors visual harmony instead of raw frequency alone.
- Refined regeneration algorithms for temperature, image, and inspiration flows.
- Added support for prioritizing dominant colors versus accent colors in image mode.
- Integrated brightness and saturation controls more directly into the main generation flow.
- Improved palette resizing so adding and removing colors feels more natural.

### Interface improvements
- Simplified the generation flow with more immediate updates across controls.
- Added dedicated icon buttons for regenerate, surprise, and inspiration actions.
- Refined button, slider, tooltip, and footer styling throughout the app.
- Improved footer responsiveness and exposed the current app version in the UI.

### Fixes and quality improvements
- Improved handling for images that do not contain usable color information, including warning feedback and dropzone reopening.
- Improved disabled states when the source image does not provide enough real color variety.
- Improved consistency across history, manual editing, regeneration, and image-derived palette workflows.
