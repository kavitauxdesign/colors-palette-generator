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
  const zoomCanvas = page.locator("#colorBlindSimulatorZoomCanvas");
  const zoomToggleButton = page.locator("#colorBlindSimulatorZoomToggle");
  const downloadButton = page.locator("#colorBlindSimulatorDownloadBtn");
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
    /peter-olexa-unsplash(?:-[A-Za-z0-9_-]+)?\.jpg/
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
  await expect(downloadButton).toBeVisible();
  await expect(downloadButton).toBeEnabled();
  await expect(downloadButton).toHaveAttribute("aria-label", "Descargar imagen simulada");
  await expect(downloadButton.locator(".tooltip")).toHaveText("Descargar imagen simulada");
  await expect(zoomCanvas).toHaveAttribute("aria-hidden", "true");
  await expect(zoomCanvas).toHaveCSS("opacity", "0");
  await expect(zoomCanvas).toHaveCSS("border-radius", "50%");
  await expect(zoomCanvas).toHaveCSS("width", "270px");
  await expect(zoomCanvas).toHaveCSS("height", "270px");
  await expect(zoomToggleButton).toBeVisible();
  await expect(zoomToggleButton).toHaveAttribute("aria-pressed", "true");
  await expect(zoomToggleButton).toHaveAttribute("aria-label", "Desactivar lupa");
  await expect(zoomToggleButton.locator(".tooltip")).toHaveText("Desactivar lupa");
  await expect(viewport).toHaveClass(/is-zoom-enabled/);
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
  await expect(page.locator(".color-blind-sim-help .footer-loss-help-trigger")).toHaveText("Tipos de visión en el simulador");
  await expect(page.locator(".color-blind-sim-help-popover")).toContainText("Existen más variantes de daltonismo");
  await expect(page.locator(".color-blind-sim-help-popover")).toContainText("no depender únicamente del color");
  await page.locator(".color-blind-sim-help .footer-loss-help-trigger").focus();
  await expect(page.locator(".color-blind-sim-help-popover")).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });
  await expect(page.locator(".color-blind-sim-help-popover")).toBeHidden();
  await expect(page.locator('.color-blind-sim-type-btn[data-vision-type="deuteranopia"], .color-blind-sim-type-btn[data-vision-type="protanomaly"], .color-blind-sim-type-btn[data-vision-type^="tritan"]')).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorImageDropzonePanel")).toBeVisible();
  await expect(page.locator("#colorBlindSimulatorImagePreview")).toBeHidden();

  await expect(page.locator("#colorBlindSimulatorActiveTypeDescription")).toHaveCount(0);
  await expect(page.locator('[data-preview-mode="original"]')).toHaveCount(0);
  await expect(page.locator('[data-preview-mode="split"]')).toHaveCount(0);
  await expect(page.locator(".color-blind-sim-mode-btn")).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorSplitToggle")).toHaveCount(0);
  await expect(page.locator(".color-blind-sim-split-indicator")).toHaveCount(0);
  await expect(page.locator("#colorBlindSimulatorActiveModeLabel")).toHaveText("Vista previa");
  await expect(page.locator("#colorBlindSimulatorRunBtn")).toHaveCount(0);

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

  const viewportBox = await viewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  if (!viewportBox) {
    throw new Error("Missing color blindness simulator viewport bounds.");
  }

  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.25,
    viewportBox.y + viewportBox.height * 0.5
  );
  await expect(viewport).toHaveClass(/is-zooming/);
  await expect(zoomCanvas).toHaveCSS("opacity", "1");
  await expect
    .poll(async () =>
      zoomCanvas.evaluate((canvasElement) => {
        const canvas = canvasElement as HTMLCanvasElement;
        const context = canvas.getContext("2d");

        if (!context || !canvas.width || !canvas.height) {
          return false;
        }

        const pixel = context.getImageData(
          Math.floor(canvas.width / 2),
          Math.floor(canvas.height / 2),
          1,
          1
        ).data;

        return pixel[3] > 0;
      })
    )
    .toBe(true);
  await page.mouse.move(8, 8);
  await expect(viewport).not.toHaveClass(/is-zooming/);

  await zoomToggleButton.click();
  await expect(zoomToggleButton).toHaveAttribute("aria-pressed", "false");
  await expect(zoomToggleButton).toHaveAttribute("aria-label", "Activar lupa");
  await expect(zoomToggleButton.locator(".tooltip")).toHaveText("Activar lupa");
  await expect(viewport).not.toHaveClass(/is-zoom-enabled/);
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.4,
    viewportBox.y + viewportBox.height * 0.5
  );
  await expect(viewport).not.toHaveClass(/is-zooming/);
  await expect(zoomCanvas).toHaveCSS("opacity", "0");

  await zoomToggleButton.click();
  await expect(zoomToggleButton).toHaveAttribute("aria-pressed", "true");
  await expect(zoomToggleButton).toHaveAttribute("aria-label", "Desactivar lupa");
  await expect(viewport).toHaveClass(/is-zoom-enabled/);
  await page.mouse.move(
    viewportBox.x + viewportBox.width * 0.35,
    viewportBox.y + viewportBox.height * 0.5
  );
  await expect(viewport).toHaveClass(/is-zooming/);
  await page.mouse.move(8, 8);
  await expect(viewport).not.toHaveClass(/is-zooming/);

  await page.click('.color-blind-sim-type-btn[data-vision-type="achromatopsia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Acromatopsia");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([123, 123, 123, 255]);

  await page.click('.color-blind-sim-type-btn[data-vision-type="deuteranomaly"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Deuteranomalía");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([178, 116, 124, 255]);

  await page.click('.color-blind-sim-type-btn[data-vision-type="protanopia"]');
  await expect(page.locator("#colorBlindSimulatorActiveTypePill")).toHaveText("Protanopia");
  await expect.poll(async () => sampleSimulatedPixel(50, 60)).toEqual([100, 107, 128, 255]);
  await expect(downloadButton).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await downloadButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("three-band-palette-protanopia-simulada.png");

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
  await expect
    .poll(async () => {
      const src = await viewportImage.getAttribute("src");
      return String(src || "");
    })
    .toMatch(/peter-olexa-unsplash(?:-[A-Za-z0-9_-]+)?\.jpg/);
  await expect
    .poll(async () =>
      viewport.evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue("--color-blind-sim-preview-ratio").trim()
      )
    )
    .toBe("4886 / 3257");
});
