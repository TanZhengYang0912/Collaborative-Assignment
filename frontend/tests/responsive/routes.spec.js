import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const routes = [
  ["landing", "/"],
  ["vendors", "/vendors"],
  ["map", "/map?view=map"],
  ["ai", "/ai"],
  ["login", "/login"],
  ["engagement", "/engagement"],
  ["admin-login", "/wsdasabi123&admin-login"],
  ["admin-overview", "/admin"],
  ["admin-set-password", "/admin-set-password"],
  ["admin-vendors", "/admin/vendors2"],
  ["profile", "/profile"],
  ["admin-ai", "/admin/ai"],
  ["reset-password", "/reset-password"],
  ["admin-reviews", "/admin/reviews"],
  ["onboarding", "/onboarding"],
  ["admin-settings", "/admin/settings"],
];

const viewports = [
  ["375", { width: 375, height: 812 }],
  ["768", { width: 768, height: 1024 }],
  ["1440", { width: 1440, height: 1000 }],
];

const output = process.env.RESPONSIVE_OUTPUT || "responsive-output";
const assertResponsive = process.env.ASSERT_RESPONSIVE === "1";
const fixtures = "tests/responsive/fixtures";
mkdirSync(output, { recursive: true });
mkdirSync(fixtures, { recursive: true });

// Record/replay for every backend call (:4000 main API and :8000 AI service).
// First run with the backends up writes a fixture per URL; every later run
// replays it. Without this the migration compares live Supabase data captured
// days apart, and content drift drowns out the layout changes we are checking.
// Backend origins only. A "**/api/**" glob also matches Vite's own module URLs
// (/src/api/admin.js), which would be replayed as application/json — the module
// then fails to load and the whole page renders blank.
const BACKEND = /^https?:\/\/(localhost|127\.0\.0\.1):(4000|8000)\//;

function fixturePath(url) {
  const { pathname, search } = new URL(url);
  const key = (pathname + search).replace(/[^a-z0-9]+/gi, "_").slice(0, 120) + ".json";
  return join(fixtures, key);
}

async function stubApi(page) {
  await page.route((url) => BACKEND.test(url.href), async (route) => {
    const file = fixturePath(route.request().url());
    if (existsSync(file)) {
      const { status, body } = JSON.parse(readFileSync(file, "utf8"));
      return route.fulfill({ status, contentType: "application/json", body });
    }
    try {
      const response = await route.fetch();
      const body = await response.text();
      writeFileSync(file, JSON.stringify({ status: response.status(), body }));
      return route.fulfill({ status: response.status(), contentType: "application/json", body });
    } catch {
      // Backend not running and no fixture recorded yet.
      writeFileSync(file, JSON.stringify({ status: 503, body: "[]" }));
      return route.fulfill({ status: 503, contentType: "application/json", body: "[]" });
    }
  });
}

for (const [routeName, route] of routes) {
  for (const [viewportName, viewport] of viewports) {
    test(`${routeName} at ${viewportName}px`, async ({ page }) => {
      await stubApi(page);
      await page.setViewportSize(viewport);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      // Playfair and Inter load over the network; screenshotting before they
      // settle captures fallback metrics and shifts every text box.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(routeName === "map" ? 2500 : 800);

      await page.screenshot({
        path: join(output, `${routeName}-${viewportName}.png`),
        fullPage: true,
        animations: "disabled",
      });

      if (!assertResponsive) return;

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect.soft(overflow, "document must not overflow horizontally").toBeLessThanOrEqual(1);

      // Touch-target rule applies to the touch viewport only. Enforcing 44px at
      // 1440 would contradict "desktop matches the original product" — today's
      // pagination controls are deliberately 32px. Inline text links are exempt
      // at every width (WCAG 2.5.5).
      if (viewportName !== "375") return;

      const undersized = await page.locator("#root button, #root [role=button], #root input, #root select, #root textarea")
        .evaluateAll((elements) => elements
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none"
              && style.visibility !== "hidden"
              && rect.width > 0
              && rect.height > 0
              && (rect.width < 44 || rect.height < 44);
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element: element.outerHTML.slice(0, 160),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          }));
      expect.soft(undersized, "touch targets must be at least 44×44px at 375px").toEqual([]);
    });
  }
}
