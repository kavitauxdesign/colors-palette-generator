# Classic·HEX — Version 2.7.0

A small suite of color tools built on `Vite + TypeScript`. The current release includes a palette generator, a flexible color converter, a `HEX to CSS filter` converter, and a color blindness simulator, all mounted as mini-apps inside a shared front-end shell.

---

# Table of Contents

- [Live Version](#live-version)
- [Mini-apps](#mini-apps)
- [Features](#features)
- [Development](#development)
- [Visual Design](#visual-design)
- [Implementation](#implementation)
- [Application Logic](#application-logic)
- [License](#license)
- [Final Notes](#final-notes)

---

# Live Version

Current public version:

```text
https://kavita.es/classic-hex
```

---

# Mini-apps

The project currently contains four tools:

- `Palette Generator`, focused on building and iterating on palettes with temperature, image, inspiration, and history workflows
- `Convert Color`, focused on converting and copying colors across digital color formats with clipboard and color-picker support
- `HEX to CSS filter`, focused on converting a target color into the closest CSS `filter` chain for recoloring SVG assets
- `Color Blindness Simulator`, focused on previewing uploaded images through common color-vision simulations

All mini-apps live inside the same page and share a small shell for navigation, module bootstrapping, clipboard handling, and color state.

---

# Features

The application allows users to:

- switch between mini-apps from a shared header navigation
- generate palettes from `Color mode`, `Temperature mode`, or `Image mode`
- build explicit color harmonies from a base color using `Monochromatic`, `Complementary`, `Analogous`, `Triad`, or `Tetrad`
- tune monochromatic generation with `Automatic`, `Shades`, or `Tints`
- change analogous separation with `Soft`, `Medium`, or `Intense` angle presets
- choose warm, cool, or mixed temperature behavior
- adjust brightness and saturation
- define the number of colors from the presets allowed by the active mode
- upload an image and extract a palette from it
- prioritize dominant colors or accent colors in image mode
- use `Inspiration mode` to build a refined palette inspired by the uploaded image
- regenerate the full palette or a single color
- use `Surprise me` to explore more adventurous palette variations
- keep `Color base` fixed in all color-based harmonies and keep `Complementary` fixed in complementary palettes
- pin individual colors manually in non-color palette workflows so regeneration keeps them fixed
- edit colors manually
- copy individual HEX values or the full palette
- use `Undo / Redo`
- store palette history during the session
- convert colors across `HEX`, `RGB`, `HSL`, `HWB`, `HSV/HSB`, `Ncol`, `OKLCH`, `OKLAB`, `LAB`, `LCH`, and `CMYK`
- copy individual converted values or insert a color code from the clipboard
- convert `HEX`, `rgb()`, `hsl()`, or CSS named colors into the closest CSS filter
- preview the original target color and the filtered SVG result side by side
- copy the final CSS filter code
- reuse the latest active palette color inside the filter tool through shared color state
- simulate common color-vision types on an image and download the processed PNG
- inspect the simulated image with an optional cursor-following zoom preview

---

# Development

Run the project locally with Vite:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run the Playwright end-to-end suite:

```bash
npm run test:e2e
```

Run the type checker:

```bash
npm run typecheck
```

The production output is generated in:

```text
dist/
```

---

# Visual Design

## Layout

At the beginning of the project we started designing the interface from a very simple wireframe that was almost black and white.

This was not because we particularly love black and white wireframes, but because we did not really know where to start attacking a task like this.

So the first thing we focused on was simply defining the layout.

We spent quite a lot of time making the interface visually pleasant before the application was even functional.

The interface was primarily designed for desktop computers with a mouse, but the current version also includes responsive adjustments for smaller screens.

We imagine this tool being used mostly by designers or developers during their work, so the most likely context of use would be a desktop environment.

The interface is now organized around a shared shell plus two focused mini-app views.

### Shared Header and Navigation

At the top of the interface there is a sticky header.

It contains the project logo and the navigation used to move between the two mini-apps.

This keeps the page-level chrome stable while each tool can keep its own workspace and controls.

### Palette Generator View

The palette generator view contains three main sections.

The left side contains the generator controls.

The main area displays the active palette.

The bottom section stores previous versions of palettes generated during the session.

Every change creates a new version in the history, which makes it quite difficult to accidentally lose previous palette combinations.

### HEX to CSS Filter View

The filter view is more compact and task-oriented.

It combines the target color input, a live swatch, before-and-after previews, the computed CSS filter code, and a short explanation of the resulting `Loss` value.

### Reset Flow

The reset action is now part of the palette generator view itself instead of the global header.

This keeps the shared header focused on navigation while the reset button stays close to the palette workflow it affects.

---

# Implementation

## Project Structure

Structure of the project files:

```text
index.html

html/
  index.template.html
  apps/
    palette-generator.html
    hex-to-filter.html

css/
  design-system.css
  layout.css
  apps/
    shared.css
    palette-generator.css
    hex-to-filter.css

src/
  main.ts
  app/
    bootstrap.ts
    shell.ts
  apps/
    palette-generator/
      index.ts
      state.ts
      core.ts
      color-mode.ts
      temperature.ts
      image-ui.ts
      history.ts
      cards.ts
      ...
    hex-to-filter/
      index.ts
      core.ts
  shared/
    color/
    services/
    dom/

tests/
  palette-generator.smoke.spec.ts
  fixtures/

scripts/
  build-index.js
```

The CSS is separated into layers: a design system, global layout, shared app styles, and app-specific stylesheets.

The runtime is split by responsibility so each mini-app stays more isolated and easier to expand.

The project still stays framework-free on the UI side, without React or Vue, but now runs through a typed module architecture.

## HTML Structure

`index.html` is generated from `html/index.template.html` plus the mini-app partials in `html/apps/`.

This keeps the shell layout separate from the markup of each tool and makes new mini-apps easier to add later.

When you edit those source HTML files, regenerate the final page with:

```bash
node scripts/build-index.js
```

The runtime boot now starts from `src/main.ts`.

## App Architecture

The current front-end is organized around a small shared shell plus typed mini-app modules:

- `src/main.ts` boots the application
- `src/app/shell.ts` manages view changes and URL hash synchronization
- `src/app/bootstrap.ts` initializes each registered mini-app
- `src/shared/services/registry.ts` provides the lightweight mini-app registry
- `src/shared/services/event-bus.ts` and `src/shared/services/shared-colors.ts` let tools communicate without tight coupling
- `src/shared/services/clipboard.ts` keeps copy behavior consistent across tools
- `src/apps/palette-generator/*` contains the palette generator logic split into focused modules
- `tests/palette-generator.smoke.spec.ts` covers the most fragile user flows with Playwright

This is much easier to maintain than the previous monolithic script structure and makes future mini-app additions more realistic.

## CSS Implementation

The CSS approach stays intentionally lightweight.

We use CSS variables for tokens, a small shared layout layer, and app-specific files instead of a large utility framework.

That keeps each mini-app easier to evolve without turning the stylesheet into a single oversized file again.

## Typography and Assets

The project uses the Figtree typeface.

The font is loaded from Google Fonts.

The assets folder mainly contains icons and small decorative images used by the UI.

Some SVG elements are embedded directly in the HTML or JavaScript code. This makes it easier to change colors dynamically, for example on hover.

## AI Assistance

During development we did not avoid using AI tools.

We used them for different purposes.

In some cases AI helped improve text or microcopy. However, we never used generated text directly. We always wrote our own text first and then used AI mainly to polish the language.

AI was also helpful in certain mathematical parts of the project, particularly in calculations related to color conversions. This saved us a significant amount of time.

AI also helped during debugging and refactoring. There were moments when something that worked perfectly before suddenly stopped working after a refactor.

At that point the process sometimes felt like searching for a needle in a haystack. AI helped us resolve several of those situations faster.

From our perspective AI is not a shortcut.

It is simply an essential modern tool that helps speed up development and allows us to focus more on the parts of the project that require real human decisions.

---

# Application Logic

## Palette Generator

The palettes are not generated completely randomly.

The generator follows a series of internal rules that control the color space used for palette creation.

The generator uses a small set of main parameters.

### Number of Colors

Users can select the palette size from the UI presets allowed by the active generation mode.

In `Color mode`, each harmony exposes only the sizes that make sense for that harmony.

In `Temperature` and `Image` workflows, additional colors can still be added manually until the configured maximum is reached.

---

### Color Mode

Color mode treats the selected input color as the main anchor for the palette.

The available harmony types are:

- `Monochromatic`
- `Complementary`
- `Analogous`
- `Triad`
- `Tetrad`

These harmonies are not just visual labels.

Each one has its own generation logic, size presets, and role ordering.

For example:

- `Monochromatic` keeps the base color first and expands toward lighter or darker steps
- `Complementary` keeps both `Color base` and `Complementary` fixed as read-only role cards
- `Analogous` keeps the base color centered and lets the user control hue separation
- `Triad` and `Tetrad` are generated from explicit hue relationships tied to the base color

When the base color input changes, the active harmony updates immediately.

---

### Temperature

The temperature selector always has one option selected.

Available options:

- warm
- cool
- both

The option `both` simply means that the generator is free to choose colors from the entire color dataset.

---

### Intensity

Brightness and saturation are controlled with range sliders.

These controls are shared across the palette workflow and can influence temperature-based palettes, image-derived palettes, inspired image palettes, and the derived role colors inside explicit color harmonies.

The goal is to keep the output flexible while still biasing the generated colors toward usable design ranges.

---

## Image Mode

Image mode allows users to upload a reference image and generate palettes from it.

The image workflow supports:

- direct extraction of colors found in the image
- ordering colors by harmony
- regenerating alternative palettes from the same source image
- prioritizing dominant colors versus accents
- showing an alert when the image does not contain enough usable color information

---

## Inspiration Mode

Inspiration mode is different from direct image extraction.

Instead of simply returning colors that are literally present in the uploaded image, it analyzes the image palette and atmosphere and then proposes a more refined palette derived from that reference.

This makes the result feel closer to a design interpretation of the image rather than a strict copy.

---

## Color Cards

Each color appears as a card.

The card displays:

- the color
- the HEX value
- the color name

Each card allows the user to:

- copy the HEX value
- regenerate the color
- edit the color manually
- delete the color
- pin the color so global regenerations keep it fixed when manual pinning is available

In color-based harmonies, role cards can also become fixed in a read-only way.

`Color base` is always fixed in `Color mode`, and `Complementary` is also fixed in explicit complementary palettes.

The color names are included partly as a small homage to Pantone-style color cards.

---

## Adding Colors

The Add Color button generates a new color based on the current generator parameters.

This means the new color already fits the palette rules.

If the user prefers, the color can then be edited manually using the color picker.

Some colors are restricted.

For example pure black (`#000000`) cannot be added to the palette.

Other small restrictions exist as well, but we prefer to leave those for curious users to discover while exploring the application.

---

## Palette History

Palette History stores all palette versions created during the session.

From each saved palette version, users can copy the HEX code of each color, copy the full palette values, or open that version again in the generator.

Every change creates a new entry in the history.

This includes:

- regenerating a color
- editing a color
- deleting a color
- generating a completely new palette
- pinning or unpinning a color

Because of this it is very difficult to accidentally lose a palette configuration.

---

## HEX to CSS Filter

The second mini-app converts a target color into the closest CSS filter chain that can reproduce that tone on a black SVG source.

The tool accepts normalized `HEX` input, but it can also parse `rgb()`, `hsl()`, and CSS named colors before converting them internally.

The workflow includes:

- a target color text input and native color picker
- a live swatch for the current target color
- a before-and-after preview using an SVG asset
- the computed CSS filter code ready to copy
- a `Loss` indicator that describes how close the approximation is

Because CSS filter combinations have real limitations, some colors remain harder to reproduce exactly. The app explains that directly in the UI so the user understands why a higher `Loss` value does not always mean the tool failed.

---

## Shared Color Flow

The two mini-apps are loosely connected through shared color state.

For example, when a user copies a HEX value from the palette generator, that color becomes the active shared color and can immediately feed the `HEX to CSS filter` tool.

This makes the overall workflow feel connected without tightly coupling the internal logic of both tools.

---

# License

This project is released under the MIT License.

---

# Final Notes

This project ended up being longer than we initially expected, both in terms of documentation and code.

Regardless of the final result, the development process was genuinely fun and enriching.
