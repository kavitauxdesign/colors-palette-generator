import { expect, test } from "@playwright/test";

test("page exposes core SEO tags and the app heading hierarchy", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Classic HEX: paletas, conversión, filtros CSS y simulador de daltonismo"
  );

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://kavita.es/classic-hex/"
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index,follow/
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    "https://kavita.es/classic-hex/"
  );
  await expect(page.locator("main > h1")).toHaveText(
    "Classic HEX: paletas, conversión, filtros CSS y simulador de daltonismo"
  );
  await expect(page.locator("#palette_generator .app-view-title")).toHaveText(
    "Generador de Paletas de Colores"
  );
  await expect(page.locator("#convert_color .app-view-title")).toHaveText("Convert Color");
  await expect(page.locator("#hex_to_filter .app-view-title")).toHaveText(
    "HEX to CSS Filter"
  );
  await expect(page.locator("#color_blind_simulator .app-view-title")).toHaveText(
    "Simulador de Daltonismo"
  );
  await expect(page.locator("h1")).toHaveCount(5);
});

test("custom sitemap lists the deployed folder URL", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();

  const body = await response.text();
  expect(body).toContain("<loc>https://kavita.es/classic-hex/</loc>");
});
