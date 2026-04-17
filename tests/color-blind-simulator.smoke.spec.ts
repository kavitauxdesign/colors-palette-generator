import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const IMAGE_FIXTURE_PATH = path.resolve(
  __dirname,
  "fixtures/three-band-palette.svg"
);

async function setRangeValue(page: Page, selector: string, value: number) {
  await page.locator(selector).evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test("color blind simulator UI boots and updates its local controls", async ({ page }) => {
  await page.goto("/");
  await page.click('.site-nav-button[data-view="color_blind_simulator"]');

  await expect(page.locator("#color_blind_simulator")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorApp")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Visión normal");
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista dividida");
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeHidden();

  await page.click('.color-blind-sim-type-btn[data-vision-type="deuteranopia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Deuteranopia");

  await setRangeValue(page, "#colorBlindSimulatorSeverity", 64);
  await expect(page.locator("#colorBlindSimulatorSeverityValue")).toHaveText("64%");
  await expect(page.locator("#colorBlindSimulatorSeverityPill")).toHaveText("Severidad 64%");

  await page.click('.color-blind-sim-mode-btn[data-preview-mode="simulated"]');
  await expect(page.locator("#colorBlindSimulatorViewport")).toHaveAttribute(
    "data-preview-mode",
    "simulated"
  );
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista simulada");

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
  await expect(page.locator("#colorBlindSimulatorDownloadBtn")).toBeDisabled();
});
