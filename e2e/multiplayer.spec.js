import { test, expect } from '@playwright/test';

/**
 * End-to-end multiplayer tests.
 *
 * Each player runs in its own browser context (own localStorage → own
 * anonymous Supabase session), so this exercises the real realtime path:
 * room creation, INSERT (joins), UPDATE (start/reveal/vote), status
 * transitions, and cross-client sync — against a live Supabase backend.
 */

// Preflight: fail fast with a clear message if the Supabase backend is
// unreachable, instead of letting every step time out mysteriously.
test.beforeAll(async ({ request }) => {
  const url = process.env.VITE_SUPABASE_URL;
  if (!url) return;
  let ok = false;
  try {
    const res = await request.get(`${url}/auth/v1/health`, { timeout: 10_000 });
    ok = res.ok();
  } catch {
    ok = false;
  }
  if (!ok) {
    throw new Error(
      `Supabase backend at ${url} is unreachable (DNS/health check failed). ` +
        `Multiplayer requires a live Supabase project. Start the local stack ` +
        `with \`npx supabase start\` (see LOCAL_DEV.md) or point .env at a hosted project.`
    );
  }
});

// ---- helpers ---------------------------------------------------------------

// Hold the chameleon icon long enough to trigger the long-press reveal.
async function revealRole(page) {
  const icon = page.locator('.chameleon-icon');
  await expect(icon).toBeVisible();
  const box = await icon.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200); // long-press fills in ~1s
  await page.mouse.up();
}

async function createRoom(page, name) {
  await page.goto('/online');
  await page.getByRole('button', { name: /Create Room/i }).click();
  const modal = page.locator('.create-modal');
  await modal.getByPlaceholder('Enter your name').fill(name);
  await modal.getByRole('button', { name: /Create Room/i }).click();
  await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}\/lobby/, { timeout: 20_000 });
  return page.url().match(/\/room\/([A-Z0-9]{6})\//)[1];
}

async function joinRoom(page, code, name) {
  await page.goto('/online');
  await page.getByRole('button', { name: /Join Room/i }).click();
  await page.getByPlaceholder('Enter 6-character code').fill(code);
  await page.getByPlaceholder('Enter your name').fill(name);
  await page.getByRole('button', { name: /Join Game/i }).click();
}

// Cast a vote for the first available (non-self) player.
async function voteForAnyone(page) {
  const firstOption = page.locator('.vote-option').first();
  await expect(firstOption).toBeVisible({ timeout: 10_000 });
  await firstOption.click();
  await page.getByRole('button', { name: /Confirm Vote/i }).click();
  await expect(page.getByRole('heading', { name: /Vote Submitted/i })).toBeVisible({ timeout: 10_000 });
}

// ---- tests -----------------------------------------------------------------

test('full game: create, join, start, reveal, vote, and reach results', async ({ browser }) => {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  const [host, p2, p3] = await Promise.all(contexts.map((c) => c.newPage()));
  const everyone = [host, p2, p3];

  // --- Host creates a room ---
  const roomCode = await createRoom(host, 'Alice');
  expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
  await expect(host.getByText('Alice')).toBeVisible();
  await expect(host.getByText(/Players \(1\/8\)/)).toBeVisible();

  // --- Players 2 & 3 join; host sees them arrive in realtime ---
  await joinRoom(p2, roomCode, 'Bob');
  await expect(p2).toHaveURL(/\/lobby/, { timeout: 20_000 });
  await expect(host.getByText('Bob')).toBeVisible({ timeout: 15_000 });

  await joinRoom(p3, roomCode, 'Carol');
  await expect(p3).toHaveURL(/\/lobby/, { timeout: 20_000 });
  await expect(host.getByText('Carol')).toBeVisible({ timeout: 15_000 });
  await expect(host.getByText(/Players \(3\/8\)/)).toBeVisible();

  // --- Host starts the game; all clients transition ---
  const startBtn = host.getByRole('button', { name: /Start Game/i });
  await expect(startBtn).toBeEnabled();
  await startBtn.click();
  for (const page of everyone) {
    await expect(page).toHaveURL(/\/game/, { timeout: 20_000 });
  }

  // --- Everyone reveals their role → discussion phase ---
  for (const page of everyone) {
    await revealRole(page);
  }
  for (const page of everyone) {
    await expect(page.getByText(/Discussion Time/i)).toBeVisible({ timeout: 20_000 });
  }

  // Host controls voting; non-hosts wait.
  await expect(host.getByRole('button', { name: /Start Voting/i })).toBeVisible();
  await expect(p2.getByText(/host will start voting/i)).toBeVisible();

  // --- Host starts voting; all move to the voting screen ---
  await host.getByRole('button', { name: /Start Voting/i }).click();
  for (const page of everyone) {
    await expect(page).toHaveURL(/\/vote/, { timeout: 20_000 });
    await expect(page.getByText(/Who is the Chameleon/i)).toBeVisible();
  }

  // --- Everyone votes ---
  for (const page of everyone) {
    await voteForAnyone(page);
  }

  // --- Host ends voting → results for all ---
  await host.getByRole('button', { name: /End Voting Now/i }).click();
  for (const page of everyone) {
    await expect(page).toHaveURL(/\/results/, { timeout: 20_000 });
    // Results screen reveals the chameleon + secret word for everyone.
    await expect(page.getByText(/The Chameleon was/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/The Secret Word was/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Vote Results/i })).toBeVisible();
  }

  // Host can start a new round; others wait.
  await expect(host.getByRole('button', { name: /New Round/i })).toBeVisible();
  await expect(p2.getByText(/Waiting for host to start new round/i)).toBeVisible();

  // --- Second round: verifies the room-wide reset actually cleared last
  // round's reveal/vote state (regression for the self-only-RLS reset bug —
  // otherwise players start round 2 already "revealed" and with stale votes). ---
  await host.getByRole('button', { name: /New Round/i }).click();
  for (const page of everyone) {
    await expect(page).toHaveURL(/\/lobby/, { timeout: 20_000 });
  }

  await host.getByRole('button', { name: /Start Game/i }).click();
  for (const page of everyone) {
    await expect(page).toHaveURL(/\/game/, { timeout: 20_000 });
    // Each player must see the reveal prompt again — i.e. has_revealed was
    // reset for EVERYONE, not just the host.
    await expect(page.getByText(/Hold the chameleon to reveal/i)).toBeVisible({ timeout: 15_000 });
  }

  await Promise.all(contexts.map((c) => c.close()));
});

// Regression: promoted host must actually get host powers (BUG: isHost went
// stale on realtime promotion, so the new host couldn't start the game).
test('when the host leaves, a remaining player is promoted and can start', async ({ browser }) => {
  // Use 4 players so 3 remain (the minimum to start) after the host leaves.
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);
  const [host, p2, p3, p4] = await Promise.all(contexts.map((c) => c.newPage()));

  const roomCode = await createRoom(host, 'Alice');
  await joinRoom(p2, roomCode, 'Bob');
  await joinRoom(p3, roomCode, 'Carol');
  await joinRoom(p4, roomCode, 'Dave');
  await expect(host.getByText(/Players \(4\/8\)/)).toBeVisible({ timeout: 15_000 });

  // Host leaves (auto-accept the confirm dialog). The leave control is an
  // icon-only button in the lobby header.
  host.on('dialog', (d) => d.accept());
  await host.locator('.leave-btn').click();
  await expect(host).not.toHaveURL(/\/lobby/, { timeout: 15_000 });

  // Bob (oldest remaining) should now be host: a Start Game button appears for him
  // (regression: previously isHost stayed stale / RLS blocked the promotion).
  const bobStart = p2.getByRole('button', { name: /Start Game/i });
  await expect(bobStart).toBeVisible({ timeout: 20_000 });
  await expect(bobStart).toBeEnabled();

  // And it actually works — the game starts for the remaining players.
  await bobStart.click();
  await expect(p2).toHaveURL(/\/game/, { timeout: 20_000 });
  await expect(p3).toHaveURL(/\/game/, { timeout: 20_000 });
  await expect(p4).toHaveURL(/\/game/, { timeout: 20_000 });

  await Promise.all(contexts.map((c) => c.close()));
});

test('joining a nonexistent room shows an error and stays put', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await joinRoom(page, 'ZZ9999', 'Nobody');

  // Should surface a "room not found" error and NOT navigate into a lobby.
  await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 15_000 });
  await expect(page).not.toHaveURL(/\/lobby/);

  await ctx.close();
});

test('duplicate names in the same room are rejected', async ({ browser }) => {
  const hostCtx = await browser.newContext();
  const dupeCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const dupe = await dupeCtx.newPage();

  const roomCode = await createRoom(host, 'Alice');

  // Second player tries to join as "Alice" too.
  await joinRoom(dupe, roomCode, 'Alice');
  await expect(dupe.getByText(/already exists/i)).toBeVisible({ timeout: 15_000 });
  await expect(dupe).not.toHaveURL(/\/lobby/);

  await hostCtx.close();
  await dupeCtx.close();
});
