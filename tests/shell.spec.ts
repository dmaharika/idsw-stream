import { expect, test } from "@playwright/test";

test("renders the blank conference shell without hydration or asset errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => errors.push(request.url()));
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("IDSW Stream");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("main")).toHaveText("");
  await expect(page.locator("iframe, video, audio, form")).toHaveCount(0);
  await expect(page.getByAltText("IDSW 2026")).toHaveCount(2);
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  expect(errors).toEqual([]);
});

test("mobile navigation supports keyboard, Escape, link clicks, and resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.locator("#nav-toggle");
  const panel = page.locator(".site-nav-panel");
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(panel).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await page.locator(".site-nav-toggle").click();
  // Keep the browser local while testing the shared external link handler.
  await panel
    .getByRole("link", { name: "Home", exact: true })
    .evaluate((link) => {
      link.addEventListener("click", (event) => event.preventDefault(), {
        once: true,
      });
    });
  await panel.getByRole("link", { name: "Home", exact: true }).click();
  await expect(panel).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await page.locator(".site-nav-toggle").click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).not.toBeChecked();
  await expect(panel).toBeHidden();
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "instant" }));
  await expect(page.locator(".site-nav")).toHaveClass(/is-scrolled/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator(".site-nav")).not.toHaveClass(/is-scrolled/);
});

test("server-rendered content and CSS menu work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByAltText("IDSW 2026")).toHaveCount(2);
    await expect(page.locator("footer")).toContainText("Updates & Questions");
    await expect(page.locator("main")).toHaveText("");
    await page.locator(".site-nav-toggle").click();
    await expect(page.locator(".site-nav-panel")).toBeVisible();
  } finally {
    await context.close();
  }
});
