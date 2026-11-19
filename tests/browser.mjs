import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseURL = process.env.UNTUNGLAH_TEST_URL || 'http://127.0.0.1:3001';
const channel = process.env.UNTUNGLAH_BROWSER || 'msedge';
const capture = process.env.CAPTURE_SCREENSHOTS === '1';
const browser = await chromium.launch({ channel });
const errors = [];
const name = (page, label) => page.getByRole('button', { name: label, exact: true });
const currency = (page, value) => page.getByText(new RegExp('^' + value.replace('RM', 'RM\\s*').replace('.', '\\.') + '$'));
async function present(locator) {
  await locator.first().waitFor({ state: 'visible' });
}
async function shot(page, filename, selector) {
  if (!capture) return;
  const path = 'docs/screenshots/' + filename + '.png';
  if (selector) await page.locator(selector).screenshot({ path });
  else await page.screenshot({ path });
}
function inspect(page) {
  page.setDefaultTimeout(8_000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
}

try {
  if (capture) await mkdir('docs/screenshots', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1160 }, baseURL });
  inspect(page);
  await page.goto('/');
  await present(page.getByRole('heading', { name: 'Learn smarter. Run better. Earn better.', exact: true }));
  assert.equal((await page.request.get('/api/health')).status(), 200);
  assert.equal((await page.request.post('/api/ai/coach', { data: { task: 'explain' } })).status(), 400);

  await name(page, 'Set up my business').click();
  await page.getByLabel('Business name').fill('Kedai Teh');
  await page.getByLabel('Primary product').fill('Teh Tarik');
  await page.getByLabel('Selling price (RM)').fill('2.50');
  await name(page, 'Create business').click();
  await present(page.getByText('Kedai Teh · Food stall'));
  await present(page.getByText('Add a selling price and estimated production cost to see this figure.'));
  await name(page, 'Edit business').click();
  await page.getByLabel('Estimated unit cost (RM)').fill('1.30');
  await name(page, 'Save business').click();
  await present(currency(page, 'RM1.20'));
  await page.getByRole('button', { name: /^Record sale/ }).click();
  await page.getByLabel(/Quantity · Teh Tarik/).fill('4');
  await name(page, 'Save record').click();
  await page.getByRole('button', { name: /^Add expense/ }).click();
  await name(page, 'Purchase').click();
  await page.getByLabel('Amount (RM)').fill('3');
  await name(page, 'Save record').click();
  await page.getByRole('button', { name: /^Add expense/ }).click();
  await page.getByLabel('Amount (RM)').fill('1');
  await name(page, 'Save record').click();
  await present(currency(page, 'RM6.00'));
  await name(page, 'Delete Stall costs').click();
  await name(page, 'Confirm deletion').click();
  await page.reload();
  await present(currency(page, 'RM7.00'));
  await present(currency(page, 'RM10.00'));

  await name(page, 'Demo workspace').click();
  await present(page.getByText('Mak Cik’s Nasi Lemak · Food stall'));
  await shot(page, '01-business-snapshot');
  await name(page, 'Start Guided Demo').click();
  await present(currency(page, 'RM225.00'));
  await present(currency(page, 'RM115.00'));
  await present(currency(page, 'RM110.00'));
  await name(page, 'Open lesson').click();
  await present(page.getByRole('heading', { name: 'Pricing Strategy' }));
  await name(page, 'Take quick quiz').click();
  await page.getByRole('button', { name: /RM3$/ }).click();
  await name(page, 'Next question').click();
  await page.getByRole('button', { name: /It decreases$/ }).click();
  await name(page, 'Next question').click();
  await page.getByRole('button', { name: /51\.1%$/ }).click();
  await name(page, 'See score').click();
  await present(page.getByRole('heading', { name: 'You scored 3 of 3' }));
  await name(page, 'Open pricing simulation').click();
  await page.getByLabel('Scenario selling price (RM)').fill('5.10');
  await present(currency(page, 'RM30.00 more'));
  await page.getByLabel('Scenario selling price (RM)').fill('5.00');
  await present(currency(page, 'RM25.00 more'));
  await present(currency(page, 'RM250.00'));
  await shot(page, '02-pricing-simulation');
  const coachResponse = page.waitForResponse(response => response.url().endsWith('/api/ai/coach') && response.request().method() === 'POST');
  await name(page, 'Explain This Decision').click();
  const response = await coachResponse;
  assert.equal(response.status(), 200, await response.text());
  assert.match((await response.json()).source, /^(demo|qwen)$/);
  await present(page.locator('.coach-source'));
  assert.match((await page.locator('.coach-source').textContent()).trim(), /^(Demonstration explanation|Qwen AI explanation)$/);
  await shot(page, '03-decision-explanation', '.coach-panel');
  await name(page, 'Add goal').first().click();
  const goal = await page.getByLabel('Goal title').inputValue();
  assert.ok(goal.length > 0);
  await name(page, 'Save goal').click();
  await name(page, 'Mark complete').click();
  await present(page.getByText('1 of 1 goals completed'));
  await page.reload();
  await present(page.getByText(goal, { exact: true }));
  await present(page.getByText('1 of 1 goals completed'));
  await name(page, 'Finish guided demo').click();
  await present(page.getByText('Guided demo completed.'));
  await shot(page, '04-learning-and-goal');

  await name(page, 'Learning Path').click();
  assert.equal(await page.locator('.lesson-row').count(), 6);
  await page.getByRole('button', { name: /Cost Calculation/ }).click();
  await present(page.getByText('RM110 ÷ 50 packs = RM2.20'));
  await page.getByRole('tab', { name: /Try it yourself/ }).click();
  await page.getByLabel('Units produced').fill('40');
  await present(currency(page, 'RM2.75'));
  await page.getByRole('button', { name: /^Use RM\s*2\.75 as my estimated unit cost$/ }).click();
  await present(page.getByText(/Saved RM\s*2\.75 as the estimated unit cost/));
  await page.getByRole('tab', { name: /Apply to your business/ }).click();
  await name(page, 'Save as my goal').click();
  await present(page.getByLabel('Goal title'));
  assert.match(await page.getByLabel('Goal title').inputValue(), /best-selling products/);
  await name(page, 'Cancel').click();
  await name(page, 'Learning Path').click();
  await page.getByRole('button', { name: /Cash Flow/ }).click();
  await page.getByRole('tab', { name: /Try it yourself/ }).click();
  await page.getByLabel('Supplier payments due (RM)').fill('600');
  await present(page.getByText(/You may be RM\s*210\.00 short/));
  await name(page, 'Practice Lab').click();
  await name(page, 'Ingredient Cost Increase').click();
  await present(currency(page, 'RM25.00 less'));
  await name(page, 'Raise price').click();
  await present(page.getByText('No change', { exact: true }));
  await name(page, 'Reduce variable costs').click();
  await present(currency(page, 'RM12.50 less'));
  await name(page, 'AI Coach').click();
  await page.getByLabel('Your question').fill('What should I measure before changing my price?');
  await name(page, 'Ask AI Coach').click();
  await present(page.locator('.coach-source'));
  await name(page, 'My Business').click();
  await name(page, 'Reset Demo Data').click();
  await name(page, 'Confirm demo reset').click();
  await name(page, 'My Progress').click();
  await present(page.getByText('0 of 0 goals completed'));
  await name(page, 'My own business').click();
  await present(currency(page, 'RM7.00'));

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, baseURL });
  inspect(mobile);
  await mobile.goto('/');
  await name(mobile, 'Try Demo Business').click();
  await present(mobile.getByText('Mak Cik’s Nasi Lemak · Food stall'));
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile page fits its viewport');
  assert.equal(await mobile.getByRole('navigation', { name: 'Main navigation' }).getByRole('button').count(), 5);
  await shot(mobile, '05-mobile-business');
  await name(mobile, 'Practice Lab').click();
  await present(mobile.getByRole('heading', { name: 'Practice Lab' }));
  await name(mobile, 'Pricing Decisions').click();
  await mobile.getByLabel('Adjust new selling price').fill('6');
  await present(currency(mobile, 'RM75.00 more'));
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile comparison fits its viewport');
  assert.deepEqual(errors, []);
  console.log('Desktop guided journey, record management and persistence, reset isolation, API, and mobile navigation passed.');
} finally {
  await browser.close();
}

