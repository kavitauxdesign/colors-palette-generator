import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const IMAGE_FIXTURE_PATH = path.resolve(
  __dirname,
  "fixtures/three-band-palette.svg"
);
function normalizeHex(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

async function collectUnexpectedDialogs(page: Page) {
  const dialogMessages: string[] = [];

  page.on("dialog", async (dialog) => {
    dialogMessages.push(dialog.message());
    await dialog.dismiss();
  });

  return dialogMessages;
}

async function gotoPaletteGenerator(page: Page) {
  await page.goto("/");
  await expect(page.locator("#palette_generator")).toBeVisible();
  await expect
    .poll(async () => page.locator(".color-card").count())
    .toBeGreaterThan(0);
}

async function getVisiblePaletteSizes(page: Page) {
  return page.locator(".palette-size .size").evaluateAll((buttons) =>
    buttons
      .filter((button) => !(button as HTMLButtonElement).hidden)
      .map((button) => Number((button as HTMLButtonElement).dataset.size))
  );
}

async function getActivePaletteSize(page: Page) {
  return page.locator(".palette-size .size").evaluateAll((buttons) => {
    const activeButton = buttons.find(
      (button) =>
        !(button as HTMLButtonElement).hidden &&
        button.classList.contains("active")
    ) as HTMLButtonElement | undefined;

    return activeButton ? Number(activeButton.dataset.size) : null;
  });
}

async function getPaletteHexes(page: Page) {
  const labels = await page.locator(".color-card .color-label").allTextContents();
  return labels.map((label) => normalizeHex(label));
}

function expectValidPaletteHexes(colors: string[], expectedCount?: number) {
  if (Number.isFinite(expectedCount)) {
    expect(colors).toHaveLength(expectedCount as number);
  }

  colors.forEach((color) => {
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
  });
}

async function setRangeValue(page: Page, selector: string, value: number) {
  const locator = page.locator(selector);
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function selectPaletteBaseMode(page: Page, value: "color" | "temperature" | "image") {
  await page.selectOption("#paletteBaseModeSelect", value);
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue(value);
}

test("boot and color harmony controls stay in sync", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  await expect(page.locator("#monochromaticModeControl")).toBeVisible();
  await expect(page.locator("#analogousSeparationControl")).toBeHidden();
  await expect(page.locator("#paletteRegenerateBtn")).toBeHidden();
  await expect(page.locator(".color-card")).toHaveCount(9);
  await expect(await getVisiblePaletteSizes(page)).toEqual([6, 9, 12]);

  await page.selectOption("#paletteTypeOptions", "complementary");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("complementary");
  await expect(await getVisiblePaletteSizes(page)).toEqual([2, 6]);
  const activeComplementarySize = await getActivePaletteSize(page);
  expect([2, 6]).toContain(activeComplementarySize);
  await expect
    .poll(() => page.locator(".color-card").count())
    .toBe(activeComplementarySize as number);
  await expect(page.locator("#paletteRegenerateBtn")).toBeHidden();

  await page.selectOption("#paletteTypeOptions", "analogous");
  await expect(page.locator("#analogousSeparationControl")).toBeVisible();
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect(await getVisiblePaletteSizes(page)).toEqual([3]);

  await page.selectOption("#paletteTypeOptions", "tetrad");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("tetrad");
  await expect.poll(() => page.locator(".color-card").count()).toBe(4);
  await expect(await getVisiblePaletteSizes(page)).toEqual([4]);
  await expect(page.locator("#paletteRegenerateBtn")).toBeHidden();

  expect(dialogMessages).toEqual([]);
});

test("temperature to color keeps flow and undo/redo stable", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "temperature");
  await expect.poll(() => page.locator(".color-card").count()).toBeGreaterThan(0);

  await setRangeValue(page, "#brightness", 40);
  await setRangeValue(page, "#saturation", 90);
  await expect(page.locator("#brightnessValue")).toHaveText("40%");
  await expect(page.locator("#saturationValue")).toHaveText("90%");
  const adjustedTempPalette = await getPaletteHexes(page);
  const adjustedFirstTempColor = adjustedTempPalette[0];

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);
  await expect
    .poll(async () =>
      normalizeHex(await page.locator("#paletteColorTextInput").inputValue())
    )
    .toBe(adjustedFirstTempColor);
  const colorPaletteAfterTemp = await getPaletteHexes(page);
  expect(colorPaletteAfterTemp).toHaveLength(9);
  expect(colorPaletteAfterTemp.slice(0, adjustedTempPalette.length)).not.toEqual(
    adjustedTempPalette
  );

  await page.click("#paletteUndoBtn");
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue("temperature");

  await page.click("#paletteRedoBtn");
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue("color");
  await expect
    .poll(async () =>
      normalizeHex(await page.locator("#paletteColorTextInput").inputValue())
    )
    .toBe(adjustedFirstTempColor);

  expect(dialogMessages).toEqual([]);
});

test("image mode restores the last image palette when returning from color", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);

  const imagePalette = await getPaletteHexes(page);
  expect(imagePalette).toHaveLength(3);
  expect(new Set(imagePalette).size).toBe(3);

  await page.click("#surpriseBtn");
  await expect(page.locator("#paletteLoadingOverlay")).toBeHidden();
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  const lastImagePalette = await getPaletteHexes(page);
  expectValidPaletteHexes(lastImagePalette, 3);

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);
  const adoptedBaseColor = normalizeHex(
    await page.locator("#paletteColorTextInput").inputValue()
  );
  expect(adoptedBaseColor).toBe(lastImagePalette[0]);
  const colorPaletteAfterImage = await getPaletteHexes(page);
  expect(colorPaletteAfterImage).toHaveLength(9);
  expect(colorPaletteAfterImage.slice(0, lastImagePalette.length)).not.toEqual(lastImagePalette);

  await selectPaletteBaseMode(page, "image");
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);

  const imagePaletteAgain = await getPaletteHexes(page);
  expect(imagePaletteAgain).toEqual(lastImagePalette);

  expect(dialogMessages).toEqual([]);
});

test("pinned cards hide edit, delete and regenerate actions outside color mode", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "temperature");
  const firstCard = page.locator(".color-card").first();

  await firstCard.locator(".color-pin-btn").click();

  await expect(firstCard.locator(".action-edit")).toBeHidden();
  await expect(firstCard.locator(".action-delete")).toBeHidden();
  await expect(firstCard.locator(".action-regenerate")).toBeHidden();
  await expect(firstCard.locator(".action-copy")).toBeVisible();
  await expect(firstCard.locator(".color-pin-btn")).toBeVisible();

  expect(dialogMessages).toEqual([]);
});

test("individual card copy shows copied feedback", async ({ page, context }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await gotoPaletteGenerator(page);

  const firstCopyButton = page.locator(".color-card .action-copy").first();
  await firstCopyButton.click();

  await expect(firstCopyButton).toHaveClass(/show-feedback/);
  await expect(firstCopyButton.locator(".tooltip")).toHaveText("¡Copiado!");

  expect(dialogMessages).toEqual([]);
});

test("color base input updates palette and keeps base role placement", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await page.locator("#paletteColorTextInput").fill("#FF537E");
  await page.locator("#paletteColorTextInput").dispatchEvent("change");

  await expect
    .poll(async () =>
      normalizeHex(await page.locator("#paletteColorTextInput").inputValue())
    )
    .toBe("#FF537E");
  await expect
    .poll(async () => (await getPaletteHexes(page))[0])
    .toBe("#FF537E");

  await page.selectOption("#paletteTypeOptions", "analogous");
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect(page.locator(".color-card").nth(1).locator(".color-base-indicator")).toBeVisible();

  expect(dialogMessages).toEqual([]);
});

test("color picker waits for dragging to settle before regenerating", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await page.evaluate(() => {
    const runtimeWindow = window as any;
    const originalGeneratePalette = runtimeWindow.generatePalette;
    runtimeWindow.__paletteGeneratorTestGenerateCalls = 0;
    runtimeWindow.generatePalette = (...args: unknown[]) => {
      runtimeWindow.__paletteGeneratorTestGenerateCalls += 1;
      return originalGeneratePalette?.(...args);
    };
  });

  const immediateCallCount = await page.locator("#paletteColorPicker").evaluate((element) => {
    const input = element as HTMLInputElement;
    ["#ff0000", "#00ff00", "#0000ff", "#ff537e"].forEach((value) => {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    return (window as any).__paletteGeneratorTestGenerateCalls;
  });

  expect(immediateCallCount).toBe(0);
  await expect
    .poll(() => page.evaluate(() => (window as any).__paletteGeneratorTestGenerateCalls))
    .toBe(1);
  await expect
    .poll(async () => normalizeHex(await page.locator("#paletteColorTextInput").inputValue()))
    .toBe("#FF537E");
  await expect.poll(async () => (await getPaletteHexes(page))[0]).toBe("#FF537E");

  expect(dialogMessages).toEqual([]);
});

test("image priority toggle waits for changes to settle before regenerating", async ({
  page,
}) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect(page.locator("#paletteLoadingOverlay")).toBeHidden();

  await page.evaluate(() => {
    const runtimeWindow = window as any;
    const originalGeneratePalette = runtimeWindow.generatePalette;
    const originalGetImageColorClusters = runtimeWindow.getImageColorClusters;
    const originalBuildImageBasedPaletteCandidate =
      runtimeWindow.buildImageBasedPaletteCandidate;

    runtimeWindow.__paletteGeneratorTestImageToggleGenerateCalls = 0;
    runtimeWindow.__paletteGeneratorTestImageToggleClusterCalls = 0;
    runtimeWindow.__paletteGeneratorTestImageToggleOptions = null;

    runtimeWindow.generatePalette = (...args: unknown[]) => {
      runtimeWindow.__paletteGeneratorTestImageToggleGenerateCalls += 1;
      return originalGeneratePalette?.(...args);
    };

    runtimeWindow.getImageColorClusters = async (...args: unknown[]) => {
      runtimeWindow.__paletteGeneratorTestImageToggleClusterCalls += 1;
      return originalGetImageColorClusters?.(...args);
    };

    runtimeWindow.buildImageBasedPaletteCandidate = (
      targetCount: number,
      options: Record<string, unknown> = {}
    ) => {
      runtimeWindow.__paletteGeneratorTestImageToggleOptions = options;
      return originalBuildImageBasedPaletteCandidate?.(targetCount, options);
    };
  });

  const immediateCallCount = await page
    .locator("#paletteImageDominantToggle")
    .evaluate((element) => {
      const input = element as HTMLInputElement;
      [false, true, false].forEach((checked) => {
        input.checked = checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      return (window as any).__paletteGeneratorTestImageToggleGenerateCalls;
    });

  expect(immediateCallCount).toBe(0);
  await expect(page.locator("#paletteImageDominantToggle")).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__paletteGeneratorTestImageToggleGenerateCalls)
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__paletteGeneratorTestImageToggleClusterCalls)
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Array.isArray((window as any).__paletteGeneratorTestImageToggleOptions?.referencePalette)
            ? (window as any).__paletteGeneratorTestImageToggleOptions.referencePalette.length
            : -1
      )
    )
    .toBe(0);
  expectValidPaletteHexes(await getPaletteHexes(page), 3);

  expect(dialogMessages).toEqual([]);
});

test("temperature sliders update labels and palette colors", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "temperature");
  const beforePalette = await getPaletteHexes(page);
  expectValidPaletteHexes(beforePalette);

  await setRangeValue(page, "#brightness", 35);
  await setRangeValue(page, "#saturation", 75);

  await expect(page.locator("#brightnessValue")).toHaveText("35%");
  await expect(page.locator("#saturationValue")).toHaveText("75%");

  const afterPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(afterPalette, beforePalette.length);
  expect(afterPalette).not.toEqual(beforePalette);

  expect(dialogMessages).toEqual([]);
});

test("color intensity sliders keep the base fixed and adjust the rest of the palette", async ({
  page,
}) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await page.locator("#paletteColorTextInput").fill("#FF537E");
  await page.locator("#paletteColorTextInput").dispatchEvent("change");

  await expect
    .poll(async () => normalizeHex(await page.locator("#paletteColorTextInput").inputValue()))
    .toBe("#FF537E");
  await expect.poll(async () => (await getPaletteHexes(page))[0]).toBe("#FF537E");

  const beforePalette = await getPaletteHexes(page);
  expectValidPaletteHexes(beforePalette, 9);

  await setRangeValue(page, "#brightness", 55);
  await setRangeValue(page, "#saturation", 82);

  await expect(page.locator("#brightnessValue")).toHaveText("55%");
  await expect(page.locator("#saturationValue")).toHaveText("82%");

  const afterPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(afterPalette, beforePalette.length);
  expect(afterPalette[0]).toBe("#FF537E");
  expect(afterPalette.slice(1)).not.toEqual(beforePalette.slice(1));

  expect(dialogMessages).toEqual([]);
});

test("image intensity sliders keep extracted color count stable and restore adjusted palette", async ({
  page,
}) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);

  const beforePalette = await getPaletteHexes(page);
  expectValidPaletteHexes(beforePalette, 3);

  await setRangeValue(page, "#brightness", 45);
  await setRangeValue(page, "#saturation", 72);

  await expect(page.locator("#brightnessValue")).toHaveText("45%");
  await expect(page.locator("#saturationValue")).toHaveText("72%");

  const adjustedPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(adjustedPalette, 3);
  expect(adjustedPalette).not.toEqual(beforePalette);

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);

  await selectPaletteBaseMode(page, "image");
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);
  await expect
    .poll(async () => await getPaletteHexes(page))
    .toEqual(adjustedPalette);

  expect(dialogMessages).toEqual([]);
});

test("image slider changes survive undo and redo through a color-mode roundtrip", async ({
  page,
}) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  const initialPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(initialPalette, 3);

  await setRangeValue(page, "#brightness", 42);
  await setRangeValue(page, "#saturation", 78);
  await expect(page.locator("#brightnessValue")).toHaveText("42%");
  await expect(page.locator("#saturationValue")).toHaveText("78%");

  const adjustedPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(adjustedPalette, 3);
  expect(adjustedPalette).not.toEqual(initialPalette);

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue("color");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);

  await page.click("#paletteUndoBtn");
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue("image");
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(async () => await getPaletteHexes(page)).toEqual(adjustedPalette);

  await page.click("#paletteRedoBtn");
  await expect(page.locator("#paletteBaseModeSelect")).toHaveValue("color");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);
  await expect(page.locator("#brightnessValue")).toHaveText("42%");
  await expect(page.locator("#saturationValue")).toHaveText("78%");

  expect(dialogMessages).toEqual([]);
});

test("user pins in temperature do not leak into color mode", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "temperature");
  const firstTempCard = page.locator(".color-card").first();
  await firstTempCard.locator(".color-pin-btn").click();

  await expect(firstTempCard.locator(".action-edit")).toBeHidden();
  await expect(firstTempCard.locator(".action-delete")).toBeHidden();

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  await expect.poll(() => page.locator(".color-card").count()).toBe(9);

  const secondColorCard = page.locator(".color-card").nth(1);
  await expect(secondColorCard.locator(".action-copy")).toBeVisible();
  await expect(secondColorCard.locator(".action-edit")).toBeVisible();
  await expect(secondColorCard.locator(".action-delete")).toBeVisible();

  expect(dialogMessages).toEqual([]);
});

test("complementary palette switches cleanly between 6 and 2 colors", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await page.locator("#paletteColorTextInput").fill("#00A4D6");
  await page.locator("#paletteColorTextInput").dispatchEvent("change");
  await page.selectOption("#paletteTypeOptions", "complementary");

  await expect.poll(() => page.locator(".color-card").count()).toBe(6);
  await page.locator('.palette-size .size[data-size="6"]').click();
  await expect.poll(() => page.locator(".color-card").count()).toBe(6);

  const complementarySixPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(complementarySixPalette, 6);
  expect(new Set(complementarySixPalette).size).toBeGreaterThan(3);

  await expect(page.locator(".color-card").nth(1).locator(".color-base-indicator")).toBeVisible();
  await expect(
    page.locator(".color-card").nth(4).locator(".color-complementary-indicator")
  ).toBeVisible();

  await page.locator('.palette-size .size[data-size="2"]').click();
  await expect.poll(() => page.locator(".color-card").count()).toBe(2);
  const complementaryTwoPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(complementaryTwoPalette, 2);
  expect(complementaryTwoPalette[0]).toBe("#00A4D6");
  expect(complementaryTwoPalette[1]).not.toBe("#00A4D6");

  await page.locator('.palette-size .size[data-size="6"]').click();
  await expect.poll(() => page.locator(".color-card").count()).toBe(6);
  const complementarySixPaletteAgain = await getPaletteHexes(page);
  expectValidPaletteHexes(complementarySixPaletteAgain, 6);
  expect(complementarySixPaletteAgain[1]).toBe("#00A4D6");
  await expect(page.locator(".color-card").nth(1).locator(".color-base-indicator")).toBeVisible();
  await expect(
    page.locator(".color-card").nth(4).locator(".color-complementary-indicator")
  ).toBeVisible();

  expect(dialogMessages).toEqual([]);
});

test("image surprise keeps palette generation stable", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect(page.locator("#surpriseBtn")).toBeVisible();
  await expect(page.locator("#paletteInspirationBtn")).toBeVisible();

  const initialPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(initialPalette, 3);

  await page.click("#surpriseBtn");
  await expect(page.locator("#paletteLoadingOverlay")).toBeHidden();
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  const surprisePalette = await getPaletteHexes(page);
  expectValidPaletteHexes(surprisePalette, 3);

  expect(dialogMessages).toEqual([]);
});

test("image inspiration keeps palette generation stable", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect(page.locator("#paletteInspirationBtn")).toBeVisible();
  await expect(page.locator("#paletteInspirationBtn")).toBeEnabled();

  await page.click("#paletteInspirationBtn");
  await expect(page.locator("#paletteLoadingOverlay")).toBeHidden();
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  const inspiredPalette = await getPaletteHexes(page);
  expectValidPaletteHexes(inspiredPalette, 3);

  expect(dialogMessages).toEqual([]);
});
