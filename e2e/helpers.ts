import { expect, type BrowserContext, type Page } from "@playwright/test";

export const CLOCK_COOKIE = "mended_test_now";

/** Pins the server's clock for this browser (test mode only). */
export async function setClock(context: BrowserContext, baseURL: string, iso: string) {
  await context.addCookies([{ name: CLOCK_COOKIE, value: iso, url: baseURL }]);
}

/** Signs in through the real email flow, reading the link from the test outbox. */
export async function signIn(page: Page, email: string) {
  await expect(page.getByLabel("Your email")).toBeVisible();
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Send me a link" }).click();
  await expect(page.getByText("Check your email")).toBeVisible();

  const res = await page.request.get(`/api/test/outbox?to=${encodeURIComponent(email)}`);
  expect(res.ok()).toBeTruthy();
  const { link } = (await res.json()) as { link: string };
  await page.goto(link);
  await page.getByRole("button", { name: "Come in" }).click();
}

/** Answers whatever kind of moment is showing, using the given text where text is needed. */
export async function answerMoment(page: Page, text: string) {
  const form = page.getByTestId("answer-form");
  await expect(form).toBeVisible();
  const textarea = form.locator("textarea[name=text]");
  if (await textarea.count()) {
    await textarea.fill(text);
  } else {
    // Choice-based moments: pick the first option for yourself (and your guess).
    await form.locator("label:has(input[name=choice])").first().click();
    const guess = form.locator("label:has(input[name=guess])");
    if (await guess.count()) await guess.first().click();
    const note = form.locator("textarea[name=note]");
    if (await note.count()) await note.fill(text);
  }
  await form.getByRole("button", { name: /Share my answer|Save/ }).click();
}

export async function screenshot(page: Page, name: string) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `e2e/.screenshots/${name}.png`, fullPage: true });
}
