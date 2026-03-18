# Classic·HEX — Version 2.1.0

A color palette generator built with Vanilla JavaScript, with support for temperature-based generation, image-based palettes, inspiration mode, and palette history tools.

---

# Table of Contents

- [Introduction](#introduction)
- [Live Version](#live-version)
- [Features](#features)
- [Visual Design](#visual-design)
- [Implementation](#implementation)
- [Application Logic](#application-logic)
- [License](#license)
- [Final Notes](#final-notes)

---

# Live Version

Live version:

```
https://kavita.es/classic-hex
```

---

# Features

The application allows users to:

- generate palettes from `Temperature mode` or `Image mode`
- choose warm, cool, or mixed temperature behavior
- adjust brightness and saturation
- define the number of colors in the palette
- upload an image and extract a palette from it
- prioritize dominant colors or accent colors in image mode
- use `Inspiration mode` to build a refined palette inspired by the uploaded image
- regenerate the full palette or a single color
- use `Surprise me` to explore more adventurous palette variations
- pin individual colors so regeneration keeps them fixed
- edit colors manually
- copy individual HEX values or the full palette
- use `Undo / Redo`
- store palette history during the session

---

# Visual Design

## Layout

At the beginning of the project we started designing the interface from a very simple wireframe that was almost black and white.

This was not because we particularly love black and white wireframes, but because we did not really know where to start attacking a task like this.

So the first thing we focused on was simply defining the layout.

We spent quite a lot of time making the interface visually pleasant before the application was even functional.

The interface was primarily designed for desktop computers with a mouse, but the current version also includes responsive adjustments for smaller screens.

We imagine this tool being used mostly by designers or developers during their work, so the most likely context of use would be a desktop environment.

The interface contains three main sections.

### Generator Controls

The left side of the interface contains the palette generator controls.

Here the user can define parameters for palette generation.

### Palette Area

The main area displays the active palette.

Each color appears as a color card that allows interaction such as copying the HEX value, editing the color, regenerating it or deleting it.

### Palette History

The bottom section stores previous versions of palettes generated during the session.

Every change creates a new version in the history, which makes it quite difficult to accidentally lose previous palette combinations.

---

## Sticky Top Bar

At the top of the interface there is a sticky bar.

It contains two elements.

The first element is our logo (a small invented mark that simply references the cosmic theme of the project).

The second element is the Reset Palette button. This button clears the palette and the palette history.

Its behavior is similar to refreshing the page, but it avoids forcing the user to reload the browser manually.

---

# Implementation

## Project Structure

Structure of the project files:

```
index.html
styles.css

css/
  style.css

assets/
fonts/

js/
  script-init.js

  app/
    app-constants.js
    app-dom.js
    script-state.js

  features/
    script-controls.js
    script-cards.js
    script-history.js

  math/
    app-color-utils.js

  lists/
    color-names.js
```

The JavaScript code is divided into several folders in order to keep responsibilities separated.

- app contains application state and shared constants  
- features contains logic for specific interface features  
- math contains color utility functions and calculations  
- lists contains static datasets used by the generator  

At the beginning of development everything lived inside a single JavaScript file.

Eventually that file grew to more than a thousand lines of code, which made refactoring absolutely necessary.

We then divided the code into several modules to improve readability and maintainability.

The project still uses pure Vanilla JavaScript without frameworks such as React or Vue.

---

## CSS Implementation

The CSS approach is intentionally simple.

We did not try to simulate any large styling framework. Layout is handled using Flexbox.

We used CSS variables mainly for colors and for some recurring spacing values as a part of our small Design System.

It is slightly funny that in a web application that generates color palettes, the interface itself uses very few fixed colors.

---

## Typography and Assets

The project uses the Figtree typeface.

The font is loaded from Google Fonts.

The assets folder mainly contains icons.

Some SVG elements are embedded directly in the HTML or JavaScript code. This makes it easier to change colors dynamically (for example on hover).

---

## AI Assistance

During development we did not avoid using AI tools.

We used them for different purposes.

In some cases AI helped improve text or microcopy. However, we never used generated text directly.   We always wrote our own text first and then used AI mainly to polish the language.

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

Users can select the palette size from the available UI presets, and additional colors can also be added manually to the palette until the configured maximum is reached.

---

### Temperature

The temperature selector always has one option selected.

Available options:

- warm  
- cool  
- both  

The option "both" simply means that the generator is free to choose colors from the entire color dataset.

---

### Intensity

Brightness and saturation are controlled with range sliders.

These controls are shared across the palette workflow and can influence temperature-based palettes, image-derived palettes, and inspired image palettes.

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
- pin the color so global regenerations keep it fixed

The color names are included partly as a small homage to Pantone-style color cards.

---

## Adding Colors

The Add Color button generates a new color based on the current generator parameters.

This means the new color already fits the palette rules.

If the user prefers, the color can then be edited manually using the color picker.

Some colors are restricted.

For example pure black (#000000) cannot be added to the palette.

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

# License

This project is released under the MIT License.

---

# Final Notes

This project ended up being longer than we initially expected, both in terms of documentation and code.

Regardless of the final result, the development process was genuinely fun and enriching. 🚀
