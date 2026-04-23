# Changelog

## 2.7.0 - 2026-04-23

### Highlights
- Added the `Color Blindness Simulator` mini-app to review images through common color-vision simulations.
- Added image upload, reset, replacement, simulated preview, toggleable hover zoom inspection, and PNG download for simulated images.
- Updated the simulator navigation icon with the new eye-hide SVG asset.

## 2.6.0 - 2026-04-02

### Highlights
- Added the new `Convert Color` mini-app for synchronized color conversion across classic, perceptual, and print-oriented formats.
- Refined the shared shell with icon-led mini-app navigation and more consistent icon-button behavior across the interface.
- Reduced friction in color entry by auto-normalizing forgiving HEX input patterns across the tools.

### Convert Color
- Added conversion support for `HEX`, `RGB`, `HSL`, `HWB`, `HSV/HSB`, `Ncol`, `OKLCH`, `OKLAB`, `LAB`, `LCH`, and `CMYK`.
- Added per-format copy actions, a global `Insert color` action powered by the clipboard, and a swatch linked to the native color picker.
- Reworked the layout so the swatch acts as the visual anchor while grouped input cards stay organized by `Classics`, `Perceptual`, and `Print`.
- Added approximate color-name labeling, successful-apply glow feedback, and cascade reveal transitions when the mini-app opens.

### UI and shell polish
- Updated the top mini-app menu to use large icons with compact labels and refreshed SVG assets for the app navigation.
- Aligned `Convert Color` controls and actions more closely with the visual language of `Palette Generator`, including shared icon-button styling and tooltip behavior.
- Improved copy and insert affordances so clipboard-driven actions feel clearer and less intrusive during editing.

### Input resilience
- Made HEX entry more forgiving across the mini-apps by accepting values like `AABBCC`, `abc`, or even duplicated leading hashes such as `##AABBCC`.
- Normalized corrected HEX values back into the inputs automatically once they resolve to a valid color.

## 2.5.0 - 2026-04-01

### Highlights
- Added shareable palette URLs that reopen `Palette Generator` with the saved colors and the correct creation mode.
- Improved `HEX to CSS filter` accuracy by exploring more solver candidates and selecting the lowest-loss result before rendering it.
- Optimized `Image mode` to stay much more responsive with complex or very large uploads.

### Palette sharing and filter quality
- Added a dedicated palette URL action, loading feedback via top snackbar, and shared-link restoration for `Color`, `Temperature`, and `Image` modes.
- Strengthened the filter solver so it tries more search paths, refines the best candidates, and reduces cases with visibly high `Loss`.

### Image mode performance
- Replaced the expensive exact harmony ordering on large image-cluster sets with a faster approximate fallback to avoid browser freezes.
- Switched large image uploads to browser `blob:` URLs and revoke stale preview URLs to reduce retained memory.
- Downscaled oversized images more aggressively before sampling and release canvas memory immediately after extraction.

## 2.4.0 - 2026-04-01

### Highlights
- Completed the front-end migration to `Vite + TypeScript`, replacing the last raw script bridge with a module-based runtime boot.
- Stabilized the palette generator around typed modules for `Color`, `Temperature`, `Image`, history, cards, and shared runtime helpers.
- Added stronger automated regression coverage with `Playwright` for the most fragile palette flows.

### Release polish
- Replaced the previous Classic HEX logo with the new palette icon and linked the full header brand back to the homepage.
- Refined the shared header behavior with scroll-only shadow treatment and smoother cross-app cascade reveal transitions.
- Promoted the visible front-end version label from beta to the stable `2.4.0` release.

### Platform and architecture
- Moved the palette generator boot flow to `src/main.ts` and `src/apps/palette-generator/index.ts`.
- Removed the remaining legacy script-loading layer and cleaned up obsolete migration leftovers.
- Synced the visible front-end version label with `package.json` through the HTML build step.

### Quality and QA
- Added end-to-end coverage for intensity sliders in `Color` and `Image`.
- Added end-to-end coverage for `Undo / Redo` around image adjustments and mode roundtrips.
- Added end-to-end coverage for pinned-card isolation across modes and for `COMP` switching between `6` and `2` colors.
- Completed a focused manual QA pass for the highest-risk transitions, history flows, role pins, and image restoration behavior.

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
- Migrated the front-end workflow to `Vite + TypeScript`, replacing the old raw script boot process with a module-based app entry.
- Added `Playwright` end-to-end coverage for the most fragile palette flows, including mode transitions, intensity sliders, copy feedback, and history behavior.

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
