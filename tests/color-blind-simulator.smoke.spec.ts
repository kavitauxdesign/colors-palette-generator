import path from "node:path";
import { expect, test } from "@playwright/test";

const IMAGE_FIXTURE_PATH = path.resolve(
  __dirname,
  "fixtures/three-band-palette.svg"
);

test("color blind simulator UI boots and updates its local controls", async ({ page }) => {
  await page.goto("/");
  await page.click('.site-nav-button[data-view="color_blind_simulator"]');

  await expect(page.locator("#color_blind_simulator")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorApp")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Visión normal");
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista dividida");
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeHidden();

  await page.click('.color-blind-sim-type-btn[data-vision-type="deuteranopia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Deuteranopia");
  await expect(page.locator('[data-preview-mode="original"]')).toHaveCount(0);
  await expect(page.locator(".color-blind-sim-mode-btn")).toHaveCount(0);

  await page.click("#colorBlindSimulatorSplitToggle");
  await expect(page.locator("#colorBlindSimulatorViewport")).toHaveAttribute(
    "data-preview-mode",
    "simulated"
  );
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista simulada");
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#colorBlindSimulatorRunBtn")).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorDownloadBtn")).toHaveCount(0);

  const viewportImage = page.locator("#colorBlindSimulatorViewport [data-preview-image]").first();
  await page.setInputFiles("#colorBlindSimulatorImageInput", IMAGE_FIXTURE_PATH);
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeHidden();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImageName")).toHaveText("three-band-palette.svg");
  await expect(page.locator("#colorBlindSimulatorReplaceBtn")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorResetBtn")).toBeVisible();
  await expect
    .poll(async () => {
      const src = await viewportImage.getAttribute("src");
      return String(src || "").startsWith("blob:");
    })
    .toBe(true);

  await page.click("#colorBlindSimulatorResetBtn");
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeHidden();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImageName")).toHaveText("Imagen por defecto");
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Deuteranopia");
  await expect(page.locator("#colorBlindSimulatorViewport")).toHaveAttribute("data-preview-mode", "simulated");
  await expect
    .poll(async () => {
      const src = await viewportImage.getAttribute("src");
      return String(src || "").startsWith("blob:");
    })
    .toBe(false);
});
