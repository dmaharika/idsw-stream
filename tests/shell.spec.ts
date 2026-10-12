import { expect, test } from "@playwright/test";
import { dayTwoVideo, video } from "./video-fixtures";

// Keep app checks independent of Drive's network, cookies, and playback limits.
// Real provider playback is verified separately in a browser.
test.beforeEach(async ({ context }) => {
  await context.route("https://drive.google.com/file/d/*/preview", (route) =>
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
  await expect(page.getByRole("tablist", { name: "Conference day" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "IDSW Stream" })).toHaveCount(0);
  const player = page.locator("iframe");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("title", video.title);
  await expect(player).toHaveAttribute(
    "src",
    video.embedUrl,
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

test("centered day tabs replace the player and its direct link", async ({ page }) => {
  await page.goto("/");
  const dayOne = page.getByRole("tab", { name: "Day 1" });
  const dayTwo = page.getByRole("tab", { name: "Day 2" });
  await expect(dayOne).toHaveAttribute("aria-selected", "true");
  await expect(dayTwo).toHaveAttribute("aria-selected", "false");
  const firstPlayer = await page.locator("iframe").elementHandle();
  const tabsBounds = (await page.getByRole("tablist").boundingBox())!;
  const playerBounds = (await page.locator("iframe").boundingBox())!;
  expect(tabsBounds.x + tabsBounds.width / 2).toBeCloseTo(
    playerBounds.x + playerBounds.width / 2,
    0,
  );

  await dayTwo.click();
  await expect(dayTwo).toHaveAttribute("aria-selected", "true");
  await expect(dayOne).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("tabpanel", { name: "Day 2" })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(1);
  await expect(page.locator("iframe")).toHaveAttribute("src", dayTwoVideo.embedUrl);
  await expect(page.getByRole("link", { name: "Open in Google Drive" })).toHaveAttribute(
    "href", dayTwoVideo.watchUrl,
  );
  expect(await firstPlayer!.evaluate((element) => element.isConnected)).toBe(false);
  expect((await page.locator("iframe").boundingBox())!.height).toBe(playerBounds.height);

  const secondPlayer = await page.locator("iframe").elementHandle();
  await dayOne.click();
  await expect(page.locator("iframe")).toHaveAttribute("src", video.embedUrl);
  expect(await secondPlayer!.evaluate((element) => element.isConnected)).toBe(false);
});

test("tabs support arrows, Home, End, and manual keyboard activation", async ({ page }) => {
  await page.goto("/");
  const dayOne = page.getByRole("tab", { name: "Day 1" });
  const dayTwo = page.getByRole("tab", { name: "Day 2" });
  await dayOne.focus();
  await page.keyboard.press("ArrowRight");
  await expect(dayTwo).toBeFocused();
  await expect(dayOne).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", video.embedUrl);
  await page.keyboard.press("Enter");
  await expect(dayTwo).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", dayTwoVideo.embedUrl);
  await page.keyboard.press("ArrowRight");
  await expect(dayOne).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(dayTwo).toBeFocused();
  await page.keyboard.press("Home");
  await expect(dayOne).toBeFocused();
  await page.keyboard.press("Space");
  await expect(dayOne).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(dayTwo).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel", { name: "Day 2" })).toBeFocused();
});

test("runtime env selects Day 2 and a missing Day 1 stays usable", async ({ page }) => {
  await page.goto("http://127.0.0.1:3101");
  await expect(page.getByRole("tab", { name: "Day 2" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("iframe")).toHaveAttribute("src", dayTwoVideo.embedUrl);
  const previousPlayer = await page.locator("iframe").elementHandle();
  await page.getByRole("tab", { name: "Day 1" }).click();
  await expect(page.getByRole("status")).toContainText("Day 1 recording is not available yet.");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open in Google Drive" })).toHaveCount(0);
  expect(await previousPlayer!.evaluate((element) => element.isConnected)).toBe(false);
  await page.getByRole("tab", { name: "Day 2" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", dayTwoVideo.embedUrl);
  await page.reload();
  await expect(page.getByRole("tab", { name: "Day 2" })).toHaveAttribute("aria-selected", "true");
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
    await expect(page.getByRole("tablist", { name: "Conference day" })).toBeVisible();
    await expect(page.locator("iframe")).toHaveAttribute("src", video.embedUrl);
    await expect(page.getByRole("link", { name: "Open in Google Drive" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Day 1", exact: true })).toHaveAttribute("href", video.watchUrl);
    await expect(page.getByRole("link", { name: "Day 2", exact: true })).toHaveAttribute("href", dayTwoVideo.watchUrl);
    await page.locator(".site-nav-toggle").click();
    await expect(page.locator(".site-nav-panel")).toBeVisible();
  } finally {
    await context.close();
  }
});
