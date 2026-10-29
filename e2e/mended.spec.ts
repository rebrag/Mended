import { devices, expect, test, type BrowserContext, type Page } from "@playwright/test";
import { answerMoment, screenshot, setClock, signIn } from "./helpers";

// Monday, October 12, 2026, 10am in New York.
const MONDAY = "2026-10-12T14:00:00Z";
const TUESDAY = "2026-10-13T14:00:00Z";
const LATER = "2026-11-20T15:00:00Z";
// Friday, November 27, 2026, 6pm in New York.
const FRIDAY_EVENING = "2026-11-27T23:00:00Z";

test.describe.serial("two people, one vessel", () => {
  let joshContext: BrowserContext;
  let mayaContext: BrowserContext;
  let josh: Page;
  let maya: Page;
  let inviteLink: string;
  let base: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    base = baseURL!;
    const options = { ...devices["Pixel 7"], timezoneId: "America/New_York", baseURL };
    joshContext = await browser.newContext(options);
    mayaContext = await browser.newContext(options);
    await setClock(joshContext, base, MONDAY);
    await setClock(mayaContext, base, MONDAY);
    josh = await joshContext.newPage();
    maya = await mayaContext.newPage();
  });

  test.afterAll(async () => {
    await joshContext.close();
    await mayaContext.close();
  });

  test("Josh signs in, makes a home, and gets an invite link", async () => {
    await josh.goto("/");
    await expect(josh).toHaveURL(/\/login/);
    await screenshot(josh, "01-login");
    await signIn(josh, "josh@example.com");

    await expect(josh).toHaveURL(/\/welcome/);
    await josh.getByLabel("What should we call you?").fill("Josh");
    await josh.getByLabel("Her name").fill("Noa");
    await josh.getByLabel("Her birthday").fill("2026-05-04");
    await screenshot(josh, "02-welcome");
    await josh.getByRole("button", { name: "Make our home" }).click();

    await expect(josh).toHaveURL(/\/invite/);
    inviteLink = (await josh.getByTestId("invite-link").innerText()).trim();
    expect(inviteLink).toMatch(/\/join\//);
    await screenshot(josh, "03-invite");

    await josh.goto("/");
    await expect(josh.getByText("The second seat is waiting")).toBeVisible();
  });

  test("Maya opens the invite, signs in, and joins", async () => {
    await maya.goto(inviteLink);
    await expect(maya.getByText("Josh made a little place for the two of you")).toBeVisible();
    await screenshot(maya, "04-join-signed-out");
    await signIn(maya, "maya@example.com");

    await expect(maya).toHaveURL(/\/join\//);
    await maya.getByLabel("What should we call you?").fill("Maya");
    await maya.getByRole("button", { name: "Come in" }).click();
    await expect(maya).toHaveURL(base + "/");
    await expect(maya.getByRole("heading", { name: "Good morning, Maya" })).toBeVisible();
    await expect(maya.getByText("Today's moment")).toBeVisible();
  });

  test("the invite can't be used twice", async ({ browser }) => {
    const stranger = await browser.newContext({ ...devices["Pixel 7"], baseURL: base });
    const page = await stranger.newPage();
    await page.goto(inviteLink);
    await expect(page.getByText("This invite has closed")).toBeVisible();
    await stranger.close();
  });

  test("answers stay private until both are in, then a piece is mended", async () => {
    await josh.goto("/moment");
    await answerMoment(josh, "SECRET-JOSH-ANSWER");
    await expect(josh.getByTestId("waiting")).toBeVisible();
    await screenshot(josh, "05-waiting");

    // Maya is told Josh answered, but can't see what he said.
    await maya.goto("/");
    await expect(maya.getByText("Josh left something for you")).toBeVisible();
    await maya.goto("/moment");
    await expect(maya.getByTestId("answer-form")).toBeVisible();
    expect(await maya.content()).not.toContain("SECRET-JOSH-ANSWER");
    const raw = await maya.request.get("/moment", { headers: { RSC: "1" } });
    expect(await raw.text()).not.toContain("SECRET-JOSH-ANSWER");
    await screenshot(maya, "06-moment-form");

    await answerMoment(maya, "MAYA-ANSWER");
    await expect(maya.getByTestId("reveal")).toBeVisible();
    await expect(maya.getByTestId("mended-count")).toHaveText("Piece 1 of 18 mended");
    await screenshot(maya, "07-reveal");

    // Josh's waiting screen notices on its own.
    await expect(josh.getByTestId("reveal")).toBeVisible({ timeout: 20_000 });
    await expect(josh.getByTestId("mended-count")).toHaveText("Piece 1 of 18 mended");

    await josh.goto("/");
    await expect(josh.getByText("Mended today")).toBeVisible();
    await expect(josh.getByText("1 of 18 pieces mended")).toBeVisible();
  });

  test("the next moment waits for the next day", async () => {
    await josh.goto("/");
    await expect(josh.getByText("Tomorrow brings a new moment.")).toBeVisible();

    await setClock(joshContext, base, TUESDAY);
    await josh.goto("/");
    await expect(josh.getByText("Today's moment")).toBeVisible();
    await screenshot(josh, "08-courtyard");
  });

  test("eighteen pieces make a whole vessel that keeps a photo", async () => {
    await setClock(joshContext, base, LATER);
    await setClock(mayaContext, base, LATER);
    const res = await josh.request.post("/api/test/fast-forward?rounds=16");
    expect(res.ok()).toBeTruthy();

    await josh.goto("/");
    await expect(josh.getByText("17 of 18 pieces mended")).toBeVisible();

    await josh.goto("/moment");
    await answerMoment(josh, "Almost whole");
    await maya.goto("/moment");
    await answerMoment(maya, "Whole at last");
    await expect(maya.getByTestId("mended-count")).toHaveText("The jug is whole");
    await screenshot(maya, "09-whole");

    await maya.getByRole("link", { name: "Place it on the shelf" }).click();
    await expect(maya.getByText("Keep a photo inside")).toBeVisible();
    await maya.getByTestId("photo-input").setInputFiles("e2e/fixtures/photo.jpg");
    await expect(maya.getByText("Kept inside")).toBeVisible({ timeout: 20_000 });
    await expect(maya.getByTestId("vessel-moments").locator("li")).toHaveCount(18);
    await screenshot(maya, "10-vessel");

    await maya.goto("/shelf");
    await expect(maya.getByTestId("shelf").getByText("Whole")).toBeVisible();
    await maya.goto("/album");
    await expect(maya.getByTestId("album-grid").locator("li")).toHaveCount(1);
  });

  test("every past moment can be found again in the journal", async () => {
    await josh.goto("/");
    await expect(josh.getByTestId("last-mended")).toContainText("Last mended");
    await josh.getByRole("link", { name: "Moments" }).click();
    await expect(josh).toHaveURL(/\/moments$/);
    const journal = josh.getByTestId("moments-journal");
    await expect(journal).toContainText("18 moments so far");
    await expect(journal.getByText("Whole at last")).toBeVisible();
    await expect(journal.getByText("Almost whole")).toBeVisible();
    await screenshot(josh, "13-moments");

    await josh.getByLabel("Search past moments").fill("whole at");
    await expect(journal).toContainText("1 of 18 moments");
    await expect(journal.getByText("Whole at last")).toBeVisible();
    await expect(journal.getByText("SECRET-JOSH-ANSWER")).toHaveCount(0);
    await josh.getByLabel("Search past moments").fill("");
    await expect(journal).toContainText("18 moments so far");

    // The home strip deep-links to the card for the last mended moment.
    await josh.goto("/");
    await josh.getByTestId("last-mended").click();
    await expect(josh).toHaveURL(/\/moments#round-/);
    const hash = new URL(josh.url()).hash.slice(1);
    await expect(josh.locator(`#${hash}`)).toBeInViewport();
  });

  test("little firsts grow fruit on her tree", async () => {
    await josh.goto("/tree");
    await expect(josh.getByRole("heading", { name: "Noa's tree" })).toBeVisible();
    await josh.getByLabel("What happened?").fill("First real belly laugh");
    await josh.getByLabel("When").fill("2026-08-21");
    await josh.getByRole("button", { name: "Add to her tree" }).click();
    await expect(josh.getByTestId("milestones")).toContainText("First real belly laugh");
    await expect(josh.getByText("1 pomegranate so far.")).toBeVisible();
    await screenshot(josh, "11-tree");
  });

  test("Friday evening lights the candles once the week's moment is shared", async () => {
    await setClock(joshContext, base, FRIDAY_EVENING);
    await setClock(mayaContext, base, FRIDAY_EVENING);
    await josh.goto("/");
    await expect(josh.getByRole("heading", { name: "Shalom, Josh" })).toBeVisible();
    await expect(josh.getByRole("img", { name: "Two candles, waiting" })).toBeVisible();

    await josh.goto("/moment");
    await expect(josh.getByText("As the week winds down")).toBeVisible();
    await answerMoment(josh, "Grateful for slow mornings");
    await maya.goto("/moment");
    await answerMoment(maya, "Grateful for you two");
    await expect(maya.getByTestId("reveal")).toBeVisible();

    await josh.goto("/");
    await expect(josh.getByRole("img", { name: "Two lit candles" })).toBeVisible();
    await screenshot(josh, "12-friday");
  });

  test("every screen renders in both themes", async () => {
    for (const theme of ["light", "dark"] as const) {
      await josh.emulateMedia({ colorScheme: theme });
      for (const [path, name] of [
        ["/", "courtyard"],
        ["/moment", "moment"],
        ["/moments", "moments"],
        ["/tree", "tree"],
        ["/album", "album"],
        ["/shelf", "shelf"],
        ["/settings", "settings"],
      ] as const) {
        await josh.goto(path);
        await expect(josh.locator("main, body").first()).toBeVisible();
        await screenshot(josh, `theme-${theme}-${name}`);
        // No horizontal scrolling at phone width.
        const overflow = await josh.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} overflows horizontally in ${theme}`).toBeLessThanOrEqual(0);
      }
    }
  });
});
