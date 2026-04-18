import path from "node:path";
import { expect, test } from "@playwright/test";

const IMAGE_FIXTURE_PATH = path.resolve(
  __dirname,
  "fixtures/three-band-palette.svg"
);

test("color blind simulator UI boots and updates its local controls", async ({ page }) => {
  await page.goto("/");
  await page.click('.site-nav-button[data-view="color_blind_simulator"]');
  await expect(page).toHaveURL(/#color_blind_simulator$/);

  const viewport = page.locator("#colorBlindSimulatorViewport");
  const viewportImage = page.locator("#colorBlindSimulatorViewport [data-preview-image]").first();
  const simulatedCanvas = page.locator("#colorBlindSimulatorCanvas");
  const defaultCaption = page.locator("#colorBlindSimulatorDefaultCaption");
  const sampleSimulatedPixel = (x: number, y: number) =>
    simulatedCanvas.evaluate(
      (canvasElement, point: { x: number; y: number }) => {
        const canvas = canvasElement as HTMLCanvasElement;
        const context = canvas.getContext("2d");

        if (!context) {
          return [];
        }

        return Array.from(context.getImageData(point.x, point.y, 1, 1).data);
      },
      { x, y }
    );

  await expect(page.locator("#color_blind_simulator")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorApp")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Visión normal");
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista previa");
  await expect(viewportImage).toHaveAttribute(
    "src",
    /peter-olexa-unsplash\.jpg/
  );
  await expect(defaultCaption).toBeVisible();
  await expect(defaultCaption).toHaveText("Peter Olexa, unsplash.com");
  await expect
    .poll(async () =>
      viewport.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--color-blind-sim-preview-ratio").trim()
      )
    )
    .toBe("4886 / 3257");
  await expect(viewport).toHaveAttribute(
    "data-preview-mode",
    "simulated"
  );
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute(
    "aria-label",
    "Visión dividida inactiva"
  );
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("data-state", "inactive");
  await expect(page.locator("#colorBlindSimulatorSplitToggleDivider")).toHaveAttribute("hidden", "");
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="normal"] .color-blind-sim-type-prevalence')).toHaveText("~92–96%");
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="deuteranomaly"] .color-blind-sim-type-prevalence')).toContainText("~3–4%");
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="deuteranomaly"] .tooltip')).toHaveText("~1 de cada 25–30");
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="achromatopsia"] .tooltip')).toHaveText("~1 de cada 30.000");
  await expect(page.locator(".color-blind-sim-type-name")).toHaveText([
    "Normal",
    "Acromatopsia",
    "Deuteranomalía",
    "Protanopia",
  ]);
  await expect(page.locator(".color-blind-sim-type-note")).toHaveText([
    "Referencia",
    "Sin color",
    "Verdes reducidos",
    "Rojos alterados",
  ]);
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="deuteranopia"], .color-blind-sim-type-btn[data-vision-type="protanomaly"], .color-blind-sim-type-btn[data-vision-type^="tritan"]')).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeHidden();

  await expect(page.locator("#colorBlindSimulatorActiveTypeDescription")).toHaveCount(0);
  await expect(page.locator('[data-preview-mode="original"]')).toHaveCount(0);
  await expect(page.locator(".color-blind-sim-mode-btn")).toHaveCount(0);

  await page.click("#colorBlindSimulatorSplitToggle");
  await expect(viewport).toHaveAttribute(
    "data-preview-mode",
    "split"
  );
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista previa");
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute(
    "aria-label",
    "Visión dividida activa"
  );
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveAttribute("data-state", "active");
  await expect(page.locator("#colorBlindSimulatorSplitToggleDivider")).not.toHaveAttribute("hidden", "");
  await expect(page.locator("#colorBlindSimulatorRunBtn")).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorDownloadBtn")).toHaveCount(0);

  await page.setInputFiles("#colorBlindSimulatorImageInput", IMAGE_FIXTURE_PATH);
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeHidden();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeVisible();
  await expect(defaultCaption).toBeHidden();
  await expect(page.locator("#colorBlindSimulatorImageName")).toHaveText("three-band-palette.svg");
  await expect(page.locator("#colorBlindSimulatorReplaceBtn")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorResetBtn")).toBeVisible();
  await expect
    .poll(async () => {
      const src = await viewportImage.getAttribute("src");
      return String(src || "").startsWith("blob:");
    })
    .toBe(true);
  await expect
    .poll(async () =>
      viewport.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--color-blind-sim-preview-ratio").trim()
      )
    )
    .toBe("300 / 120");

  await page.click('.color-blind-sim-type-btn[data-vision-type="achromatopsia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Acromatopsia");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([123, 123, 123, 255]);

  await page.click('.color-blind-sim-type-btn[data-vision-type="deuteranomaly"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Deuteranomalía");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([178, 116, 124, 255]);

  await page.click('.color-blind-sim-type-btn[data-vision-type="protanopia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Protanopia");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([100, 107, 128, 255]);

  await expect
    .poll(async () =>
      simulatedCanvas.evaluate((canvasElement) => {
        const canvas = canvasElement as HTMLCanvasElement;

        if (canvas.width !== 300 || canvas.height !== 120) {
          return false;
        }

        return true;
      })
    )
    .toBe(true);

  await page.click("#colorBlindSimulatorResetBtn");
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeHidden();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeVisible();
  await expect(defaultCaption).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImageName")).toHaveText("Imagen por defecto");
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Protanopia");
  await expect(viewport).toHaveAttribute("data-preview-mode", "split");
  await expect
    .poll(async () => {
      const src = await viewportImage.getAttribute("src");
      return String(src || "");
    })
    .toContain("peter-olexa-unsplash.jpg");
  await expect
    .poll(async () =>
      viewport.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--color-blind-sim-preview-ratio").trim()
      )
    )
    .toBe("4886 / 3257");
});
