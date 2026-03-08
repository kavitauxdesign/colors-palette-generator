# SHIFTA·HEX — The Palette Awakens🚀

A small cosmic color palette generator built with Vanilla JavaScript.

---

# Table of Contents

- [Introduction](#introduction)
- [Live Version](#live-version)
- [Features](#features)
- [Visual Design](#visual-design)
- [Implementation](#implementation)
- [Application Logic](#application-logic)
- [Final Notes](#final-notes)
---

# Introduction

After an intense year of projects during the UX Master, our ship was not exactly in perfect condition.
The journeys we had taken during the year had been long and demanding, and the ship had suffered a bit from all those previous missions.

But when this new mission appeared (building a color palette generator) we launched immediately.

As the project progressed, the ship picked up speed and the process became unstoppable.

SHIFTA·HEX is a small web application designed to generate color palettes and allow users to copy HEX values from those palettes.

The goal of the project was to explore a simple idea and turn it into a small but usable tool.

Even though the application is technically simple, we approached it as if we were building a small real design tool rather than just completing a coding exercise.

---

# Live Version

The application is also published on the school server.

Live version:

```
https://a487.masterux.net/javascript/04-colors-generator/index.html
```

---

# Features

The application allows users to:

- generate palettes of 3, 6 or 9 colors  
- control color temperature (warm / cool / both)  
- adjust brightness  
- add additional colors to the palette  
- regenerate individual colors  
- edit colors manually  
- copy HEX values  
- store palette history during the session  
- copy HEX values for a full palette or for individual colors  

---

# Visual Design

## Layout

At the beginning of the project we started designing the interface from a very simple wireframe that was almost black and white.

This was not because we particularly love black and white wireframes, but because we did not really know where to start attacking a task like this.

So the first thing we focused on was simply defining the layout.

We spent quite a lot of time making the interface visually pleasant before the application was even functional.

The interface was primarily designed for desktop computers with a mouse.

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
  satoshi.css
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

The project uses the Satoshi typeface.

The font is stored locally inside the fonts folder. Although the folder name is plural, we only actually use one font. Originally we considered loading it from the internet, but we decided to keep it locally for reliability.

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

The generator uses three main parameters.

### Number of Colors

Users can generate palettes of:

- 3 colors  
- 6 colors  
- 9 colors  

Additional colors can also be added manually to the palette.

---

### Temperature

The temperature selector always has one option selected.

Available options:

- warm  
- cool  
- both  

The option "both" simply means that the generator is free to choose colors from the entire color dataset.

---

### Brightness

Brightness is controlled with a range slider.

Although the slider visually allows the full range, internally the generator limits the values.

The effective range is approximately between 20% and 80%.

This prevents generating colors that are either too dark or too bright to be useful.

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

Because of this it is very difficult to accidentally lose a palette configuration.

---

## Special Colors

Some colors appear with a small rocket badge matching the application logo.

This badge simply highlights colors whose names reference the cosmic theme of the project.

It does not affect the behavior of the palette generator.

---

# Final Notes

This project ended up being longer than we initially expected, both in terms of documentation and code.

Regardless of the final result, the development process was genuinely fun and enriching.

Group 4 🚀
Master in UX Design and Digital Product
SHIFTA by Elisava — 2026
