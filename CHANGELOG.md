# Changelog

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
