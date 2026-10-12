import { expect, test } from "@playwright/test";
import { video } from "../config/video";

// Keep app checks independent of Drive's network, cookies, and playback limits.
// Real provider playback is verified separately in a browser.
test.beforeEach(async ({ context }) => {
  await context.route(video.embedUrl, (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Video preview</p>" }),
  );
});

test("renders the responsive video and conference shell without app errors", async ({
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
  await expect(page.getByRole("heading", { name: "IDSW Stream" })).toBeVisible();
  const player = page.locator("iframe");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("title", video.title);
  await expect(player).toHaveAttribute(
    "src",
    "https://drive.google.com/file/d/1ETJtIVmHI3KnteYDXmnUty6fzEJMyiHl/preview",
  );
  await expect(player).toHaveAttribute("allow", "fullscreen");
  await expect(player).toHaveAttribute("allowfullscreen", "");
  const bounds = await player.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.height).toBeCloseTo(Math.max(280, bounds!.width * 9 / 16), 1);
  await expect(page.getByRole("link", { name: "Open in Google Drive" })).toHaveAttribute(
    "href",
    video.watchUrl,
  );
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

test("the direct video link works when the embedded preview cannot load", async ({
  page,
  context,
}) => {
  await context.route(video.embedUrl, (route) => route.abort());
  await context.route(video.watchUrl, (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Direct video page</p>" }),
  );
  await page.goto("/");
  const newPage = context.waitForEvent("page");
  await page.getByRole("link", { name: "Open in Google Drive" }).click();
  const directVideo = await newPage;
  await expect(directVideo).toHaveURL(video.watchUrl);
  await expect(directVideo.locator("body")).toHaveText("Direct video page");
  await expect(page.locator("main")).toBeVisible();
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
    await context.route(video.embedUrl, (route) =>
      route.fulfill({ contentType: "text/html", body: "<p>Video preview</p>" }),
    );
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByAltText("IDSW 2026")).toHaveCount(2);
    await expect(page.locator("footer")).toContainText("Updates & Questions");
    await expect(page.getByRole("heading", { name: "IDSW Stream" })).toBeVisible();
    await expect(page.locator("iframe")).toHaveAttribute("src", video.embedUrl);
    await expect(page.getByRole("link", { name: "Open in Google Drive" })).toBeVisible();
    await page.locator(".site-nav-toggle").click();
    await expect(page.locator(".site-nav-panel")).toBeVisible();
  } finally {
    await context.close();
  }
});
