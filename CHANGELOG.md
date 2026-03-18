# Changelog

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
