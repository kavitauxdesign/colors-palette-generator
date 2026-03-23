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
  await expect
    .poll(async () =>
      normalizeHex(await page.locator("#paletteColorTextInput").inputValue())
    )
    .toBe(adjustedFirstTempColor);

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

test("image mode extracts real colors and restores when returning from color", async ({ page }) => {
  const dialogMessages = await collectUnexpectedDialogs(page);
  await gotoPaletteGenerator(page);

  await selectPaletteBaseMode(page, "image");
  await page.setInputFiles("#paletteImageInput", IMAGE_FIXTURE_PATH);

  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);

  const imagePalette = await getPaletteHexes(page);
  expect(imagePalette).toHaveLength(3);
  expect(new Set(imagePalette).size).toBe(3);

  await selectPaletteBaseMode(page, "color");
  await expect(page.locator("#paletteTypeOptions")).toHaveValue("monochromatic");
  const adoptedBaseColor = normalizeHex(
    await page.locator("#paletteColorTextInput").inputValue()
  );
  expect(adoptedBaseColor).toBe(imagePalette[0]);

  await selectPaletteBaseMode(page, "image");
  await expect.poll(() => page.locator(".color-card").count()).toBe(3);
  await expect.poll(() => getActivePaletteSize(page)).toBe(3);

  const imagePaletteAgain = await getPaletteHexes(page);
  expect(imagePaletteAgain).toEqual(imagePalette);

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
