import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { projects } from "../atlas/universe.js";

test("the engine renders, changes form, filters signals, and resolves deep links", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/atlas/#casecrop");
  await expect(page.locator("#selected-name")).toHaveText("Casecrop");
  await expect(page.locator("#engine")).toHaveAttribute(
    "data-rendered",
    "true",
  );
  await expect(page.locator(".project-row")).toHaveCount(projects.length);
  await page.getByRole("button", { name: "02 / Weave", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "02 / Weave", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await expect(page.locator(".project-row")).toHaveCount(
    projects.filter((p) => p.district === "research").length,
  );
  await expect(page.locator(".beacon:visible")).toHaveCount(
    projects.filter((p) => p.district === "research").length,
  );
  await page.getByRole("searchbox").fill("bernoulli");
  await expect(page.locator(".project-row")).toHaveCount(1);
  await expect(page.locator("#selected-source")).toHaveAttribute(
    "href",
    "https://github.com/shi1720/bernoulli-reliability",
  );
  await page.getByRole("searchbox").fill("no matching project");
  await expect(page.getByRole("status")).toContainText("No projects match");
  await expect(page.locator("#next")).toBeDisabled();
  expect(errors).toEqual([]);
});

test("keyboard exploration opens the selected project and keeps the URL shareable", async ({
  page,
}) => {
  await page.goto("/atlas/");
  await page
    .getByRole("button", { name: "Locate Swivel in the engine", exact: true })
    .press("Enter");
  await expect(page.locator("#selected-source")).toBeFocused();
  await expect(page).toHaveURL(/#Computer-Use-Automation-System$/);
  await page.reload();
  await expect(page.locator("#selected-name")).toHaveText("Swivel");
});

test("reduced motion is stable and a changed form can be saved", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/atlas/");
  await expect(
    page.getByRole("button", { name: "Resume sculpture", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#engine")).toHaveAttribute(
    "data-rendered",
    "true",
  );
  const before = await page.locator("#engine").evaluate((c) => c.toDataURL());
  await page.waitForTimeout(200);
  expect(await page.locator("#engine").evaluate((c) => c.toDataURL())).toBe(
    before,
  );
  await page.getByRole("button", { name: "03 / Bloom", exact: true }).click();
  await expect
    .poll(() => page.locator("#engine").evaluate((c) => c.toDataURL()))
    .not.toBe(before);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save this frame ↓", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "shivam-gupta-possibility-engine.png",
  );
});

test("320px layout has no overflow and the brief stays clear of the sculpture", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/atlas/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const copy = await page.locator(".hero-copy").boundingBox();
  const stage = await page.locator(".engine-stage").boundingBox();
  expect(stage.y).toBeGreaterThan(copy.y + copy.height);
  await expect(page.locator("#selected-source")).toBeVisible();
});

test("the directory still works when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind === "webgl" ? null : get.call(this, kind, ...args);
    };
  });
  await page.goto("/atlas/");
  await expect(page.locator("#fallback")).toBeVisible();
  await expect(page.locator(".project-row")).toHaveCount(projects.length);
  await page.getByRole("searchbox").fill("toolstorm");
  await expect(page.locator(".project-row")).toHaveCount(1);
  await expect(page.locator("#selected-source")).toHaveAttribute(
    "href",
    "https://github.com/shi1720/toolstorm",
  );
});

test("the exhibit has no serious or critical accessibility violations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/atlas/");
  const result = await new AxeBuilder({ page }).analyze();
  expect(
    result.violations.filter((v) => ["serious", "critical"].includes(v.impact)),
  ).toEqual([]);
});

test("the sculpture and image export recover after a graphics context loss", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/atlas/");
  await expect(page.locator("#engine")).toHaveAttribute("data-rendered", "true");
  const supported = await page.locator("#engine").evaluate((canvas) => {
    window.contextRecovery = canvas.getContext("webgl").getExtension("WEBGL_lose_context");
    return Boolean(window.contextRecovery);
  });
  test.skip(!supported, "The graphics driver does not expose context-loss simulation");
  await page.evaluate(() => window.contextRecovery.loseContext());
  await expect(page.locator("#fallback")).toBeVisible();
  await expect(page.locator("#download")).toBeDisabled();
  await page.evaluate(() => window.contextRecovery.restoreContext());
  await expect(page.locator("#fallback")).toBeHidden();
  await expect(page.locator("#download")).toBeEnabled();
  await expect(page.locator(".beacon:visible")).toHaveCount(projects.length);
});
