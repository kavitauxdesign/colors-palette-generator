# Vite + TypeScript Migration Plan

## Scope

This plan covers a migration to `Vite + TypeScript` only.

`Vue 3` is intentionally out of scope for now.

The goal is to modernize build, module boundaries, and type safety without changing product behavior.

## Current Architecture Audit

### 1. Build and entry model

The project is currently a single-page app with two mini-apps mounted into one HTML shell.

- HTML is assembled with a custom script: `scripts/build-index.js`
- The source shell lives in `html/index.template.html`
- Mini-app partials live in `html/apps/`
- The generated runtime entry is `index.html`
- The only runtime script in HTML is `js/app/app-init.js`

`app-init.js` then loads the entire script graph sequentially via script tags.

This means the runtime depends on load order rather than explicit imports.

### 2. Runtime composition depends on globals

The application is built on a set of shared globals attached to `window`:

- `window.AppConstants`
- `window.AppDom`
- `window.AppRegistry`
- `window.AppEventBus`
- `window.AppClipboard`
- `window.AppSharedColors`
- `window.AppColorUtils`
- `window.AppColorNames`
- `window.HexToFilterCore`
- `window.PaletteGeneratorApp`
- `window.HexToFilterApp`

This works today because scripts are loaded in a fixed order from `app-init.js`.

### 3. Palette generator state is a shared mutable runtime

`js/apps/palette-generator/palette-generator-state.js` is the center of the palette generator runtime.

It defines a broad set of mutable top-level variables such as:

- `paletteSize`
- `paletteBaseMode`
- `selectedPaletteBaseColor`
- `selectedColorPaletteType`
- `selectedMonochromaticGenerationMode`
- `selectedAnalogousSeparationMode`
- `temperature`
- `currentPalette`
- `paletteAdjustmentBase`
- `paletteHistory`

These are consumed implicitly across many files without imports.

This is the single biggest TypeScript migration challenge.

### 4. DOM and business logic are partially mixed

The codebase already has a helpful separation in filenames, but several files still mix concerns:

- `palette-generator-color-mode.js`
  - base color parsing
  - color harmony generation
  - color mode settings
  - UI control synchronization
  - event listeners

- `palette-generator-core.js`
  - adjustment math
  - palette commit flow
  - comparison/scoring
  - rendering orchestration
  - generation entrypoint

- `palette-generator-image-ui.js`
  - slider UI
  - mode switching
  - image upload
  - sticky layout behavior
  - action button enable/disable logic

- `palette-generator-cards.js`
  - DOM creation
  - pinning behavior
  - edit interaction
  - add/delete/regenerate controls

So the architecture is not “bad”, but it is not yet modular in the ES module sense.

### 5. Many files self-initialize on load

Several files attach listeners or run initialization code immediately at import time.

Examples:

- `palette-generator-color-mode.js` ends with `initializeColorModeControls();`
- `palette-generator-controls.js` attaches listeners at top level
- `palette-generator-cards.js` attaches document and picker listeners at top level
- `palette-generator-image-ui.js` attaches many listeners during file execution

This is important because converting these files directly to ES modules would change execution scope and can break hidden dependencies.

### 6. There is already a good split between “shared” and “app” code

This is a strength we should preserve.

Good migration candidates already exist:

- shared services
  - `js/shared/services/app-registry.js`
  - `js/shared/services/app-event-bus.js`
  - `js/shared/services/clipboard-service.js`
  - `js/shared/services/app-shared-colors.js`

- shared color domain
  - `js/shared/colors/app-color-utils.js`
  - `js/shared/colors/color-names.js`

- standalone mini-app logic
  - `js/apps/hex-to-filter/hex-to-filter-core.js`

### 7. File size hot spots

The biggest refactor targets are:

- `palette-generator-color-mode.js` — 1885 lines
- `palette-generator-image-ui.js` — 992 lines
- `palette-generator-core.js` — 967 lines
- `palette-generator-image-palette.js` — 957 lines
- `palette-generator-temperature.js` — 656 lines
- `palette-generator-cards.js` — 650 lines

These should not be migrated as one-to-one “same file but `.ts`”.

They should be split by responsibility first.

### 8. Dependency management is partially duplicated

The repo currently includes:

- npm dependency: `colorjs.io`
- vendored browser file: `js/vendor/color.global.min.js`

There are also duplicate tracked files with names ending in ` 2`, such as:

- `js/vendor/color.global.min 2.js`
- `node_modules/colorjs.io/LICENSE 2`
- `node_modules/colorjs.io/README 2.json`

These should be treated as cleanup targets during migration.

## What This Means for the Migration

The migration should not start by “converting everything to TypeScript”.

It should start by:

1. preserving runtime behavior
2. reducing hidden dependencies
3. extracting stable module boundaries
4. only then introducing typed ES modules in the hot paths

## Recommended Target Architecture

Suggested destination structure:

```text
src/
  main.ts

  app/
    shell.ts
    bootstrap.ts

  shared/
    constants.ts
    dom/
      app-dom.ts
    services/
      event-bus.ts
      registry.ts
      clipboard.ts
      shared-colors.ts
    color/
      color-utils.ts
      color-names.ts
      types.ts

  apps/
    hex-to-filter/
      index.ts
      core.ts
      dom.ts
      types.ts

    palette-generator/
      index.ts
      types.ts
      state/
        store.ts
        selectors.ts
        actions.ts
      domain/
        adjustments.ts
        generation.ts
        scoring.ts
        history.ts
        temperature.ts
        image/
          analysis.ts
          palette.ts
          inspiration.ts
        color-mode/
          index.ts
          base-color.ts
          sizing.ts
          monochromatic.ts
          complementary.ts
          analogous.ts
          triad.ts
          tetrad.ts
      ui/
        dom.ts
        controls.ts
        cards.ts
        history.ts
        image-ui.ts
        labels.ts
```

This preserves the current product architecture:

- shared shell
- shared services
- two mini-apps
- palette-generator split into domain, state, and UI

## Migration Principles

### Principle 1: keep behavior stable

No redesign during migration.

No palette logic changes unless needed to preserve behavior under modules.

### Principle 2: migrate pure code first

Pure and low-DOM modules should move to TypeScript first.

### Principle 3: keep a compatibility bridge temporarily

For a while, TypeScript modules may still expose compatibility shims to `window` while the rest of the legacy runtime is being converted.

This is normal and reduces risk.

### Principle 4: do not start with the biggest file

Do not begin by rewriting `palette-generator-color-mode.js`.

It should only move after shared services, state boundaries, and helper modules are established.

## Recommended Migration Phases

## Phase 0: Audit and architecture definition

This document is the output of that phase.

Deliverable:

- approved module map
- agreed order of migration
- explicit “do not change behavior” rule

## Phase 1: Introduce Vite with minimal runtime change

Goal:

- use Vite as dev server and build tool
- keep the app working before major refactors

Recommended approach:

1. Add:
   - `vite`
   - `typescript`
   - `@types/node`

2. Create:
   - `vite.config.ts`
   - `tsconfig.json`

3. Keep the initial runtime conservative:
   - preserve the current HTML structure
   - keep the current CSS files
   - keep the current script behavior working first

4. During this step, do not also restructure the entire app.

Important note:

The current HTML partial build (`html/index.template.html` + partials + `scripts/build-index.js`) does not map naturally to Vite.

For the first Vite PR, the safest option is:

- make root `index.html` the source of truth temporarily
- stop relying on the custom HTML assembler during development

This avoids adding another abstraction before the migration even starts.

Deliverable:

- `npm run dev`
- `npm run build`
- app still works visually and functionally

## Phase 2: Convert shared infrastructure to TypeScript modules

Start with the lowest-risk shared files:

- `app-constants.js`
- `app-registry.js`
- `app-event-bus.js`
- `clipboard-service.js`
- `app-color-utils.js`
- `app-shared-colors.js`
- `color-names.js`

Why these first:

- they are relatively isolated
- they already represent domain boundaries
- they unlock the rest of the migration

Deliverable:

- shared infra no longer depends on `window` internally
- optional temporary compatibility exports to `window` remain allowed

## Phase 3: Establish typed state for the palette generator

Before converting the large palette files, replace the implicit state model.

Create:

- `types.ts`
- `state/store.ts`
- `state/selectors.ts`
- `state/actions.ts`

The store should absorb what is currently spread through:

- `palette-generator-state.js`
- parts of `palette-generator-core.js`
- parts of `palette-generator-image-ui.js`

Key types to define:

- `PaletteBaseMode`
- `ColorPaletteType`
- `MonochromaticGenerationMode`
- `AnalogousSeparationMode`
- `PaletteAdjustmentSettings`
- `PaletteHistoryEntry`
- `PinnedEntry`
- `UploadedImageState`
- `PaletteGeneratorState`

Deliverable:

- palette state becomes explicit and typed
- future modules stop depending on free globals like `paletteSize` and `currentPalette`

## Phase 4: Extract pure palette domain modules

Only after the typed store exists, split palette logic into pure modules.

Suggested order:

1. `adjustments.ts`
   - brightness/saturation mapping
   - adjustment helpers

2. `generation.ts`
   - orchestration of palette generation by mode

3. `temperature.ts`
   - temperature palette logic

4. `color-mode/`
   - `base-color.ts`
   - `sizing.ts`
   - `monochromatic.ts`
   - `complementary.ts`
   - `analogous.ts`
   - `triad.ts`
   - `tetrad.ts`

5. `image/`
   - `analysis.ts`
   - `palette.ts`
   - `inspiration.ts`

This is where most of the long-term maintainability gains will come from.

Deliverable:

- domain logic becomes mostly pure
- business rules become testable
- UI files become much thinner

## Phase 5: Convert UI/controller files

Once state and domain are stable, migrate UI integration files:

- `app-dom.js`
- `app-shell.js`
- `palette-generator-controls.js`
- `palette-generator-cards.js`
- `palette-generator-history.js`
- `palette-generator-image-ui.js`
- `palette-generator-card-names.js`
- `palette-generator-card-helpers.js`
- `palette-generator-app.js`
- `hex-to-filter-app.js`

At this stage, the job is mostly:

- replace implicit globals with imports
- replace top-level side effects with explicit `initialize()` calls
- keep DOM behavior identical

Deliverable:

- no hidden runtime ordering requirements
- explicit app bootstrap from `src/main.ts`

## Phase 6: Remove legacy bootstrapping and cleanup

Final cleanup:

- remove `js/app/app-init.js`
- remove sequential script loader behavior
- remove temporary `window.*` compatibility shims that are no longer needed
- remove vendored `color.global.min.js` if `colorjs.io` package import is in use
- remove accidental duplicate tracked files ending in ` 2`
- remove obsolete build script if no longer needed

Deliverable:

- one modern Vite entrypoint
- typed ES module graph
- no legacy loader

## Suggested PR Sequence

To reduce risk, I would split work like this:

1. `chore: add vite and typescript scaffold`
2. `refactor: move shared infra to typed modules`
3. `refactor: introduce palette generator typed store`
4. `refactor: extract palette adjustment and temperature domain`
5. `refactor: extract color-mode generators to modules`
6. `refactor: extract image analysis and inspiration domain`
7. `refactor: migrate palette generator ui controllers`
8. `refactor: migrate hex-to-filter app to typed modules`
9. `chore: remove legacy bootloader and duplicate vendored files`

## Best Pilot Area

The best early pilot is not the palette generator.

It is:

- shared infrastructure
- then `HEX to Filter`

Why:

- smaller scope
- less implicit cross-file state
- fewer DOM synchronization rules
- easier TypeScript win

If that goes well, the palette generator migration becomes much less risky.

## Main Risks

### Risk 1: hidden cross-file dependencies

Today, many palette files rely on variables and functions existing in the global runtime.

Mitigation:

- move to typed store and explicit imports before converting large files

### Risk 2: accidental behavior regressions

The palette generator now has a lot of product-specific behavior.

Mitigation:

- keep migration PRs small
- do not combine refactor and feature work
- use manual regression checks after each phase

### Risk 3: HTML entry churn

The current partial-based HTML flow is custom.

Mitigation:

- simplify HTML entry first
- avoid inventing a complicated Vite partial system during the initial migration

### Risk 4: trying to “finish everything” in one branch

This would be very risky.

Mitigation:

- use the new Vite branch for staged PRs
- keep each PR independently valid

## Recommended First Implementation Step

The first real implementation step should be:

1. install `vite` and `typescript`
2. create `vite.config.ts` and `tsconfig.json`
3. keep the current UI and CSS unchanged
4. make root `index.html` the working Vite entry
5. confirm the app still runs before touching the palette generator internals

Only after that should we start moving shared code into typed modules.

## Summary

The repo is absolutely a good candidate for `Vite + TypeScript`.

But the correct migration path is:

- not “convert files to TS”
- not “start with the biggest palette file”
- not “mix migration with redesign”

The correct path is:

1. Vite scaffold
2. shared infra
3. typed state
4. pure domain extraction
5. UI/controller migration
6. legacy cleanup

That path gives the best balance between safety, speed, and long-term maintainability.
