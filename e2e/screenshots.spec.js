import { test } from '@playwright/test';

// Visual capture of backend-independent screens (no Supabase needed).
// Not an assertion test — produces screenshots for UI review, light + dark.
for (const scheme of /** @type {const} */ (['light', 'dark'])) {
  test(`capture entry screens (${scheme})`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: scheme });
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `e2e/__shots__/mode-select-${scheme}.png` });

    // HomeScreen: with the dead backend this also shows the connection-error banner.
    await page.goto('/online');
    await page.waitForTimeout(3000); // let anon-auth fail
    await page.screenshot({ path: `e2e/__shots__/home-${scheme}.png` });

    await ctx.close();
  });
}
