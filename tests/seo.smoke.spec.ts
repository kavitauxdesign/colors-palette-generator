import { expect, test } from "@playwright/test";

test("page exposes core SEO tags and a single primary heading", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(
    "Classic HEX: generador de paletas, convertidor de color y HEX a CSS filter"
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
  await expect(page.locator("h1")).toHaveText(
    "Classic HEX: generador de paletas, convertidor de color y HEX a CSS filter"
  );
});

test("custom sitemap lists the deployed folder URL", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();

  const body = await response.text();
  expect(body).toContain("<loc>https://kavita.es/classic-hex/</loc>");
});
