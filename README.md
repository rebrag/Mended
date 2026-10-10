# Mended

A small daily ritual for two.

Each day brings one light moment to share: a question, a this-or-that, a guess-your-partner, or a riddle where each of you holds half the clue.
Answers stay private until you have both answered.
Then they are revealed side by side and one piece of a broken clay vessel is mended with gold.
Eighteen moments make a whole vessel, which goes on the shelf with a photo kept inside, and a new vessel begins.

There are no streaks and no missed days.
A moment simply waits until you both get to it.

## The quiet details

- Mending broken vessels so the light inside can shine through echoes tikkun.
- Every vessel has 18 pieces.
- On Fridays the moment is about gratitude, and once you have both shared it two candles in the courtyard stay lit from Friday evening until Saturday night.
- On those evenings the courtyard greets you with "Shalom".
- Your daughter is a young pomegranate tree that grows with her real age. Each "little first" you add becomes a pomegranate.
- The courtyard is Jerusalem limestone with a blue Tzfat door and a small scroll case on its doorpost.
- The typefaces (Frank Ruhl Libre and Assistant) were designed for Hebrew and Latin.
- A few riddles hide braided bread, apples dipped in honey, and the three stars that end the day.

None of this is ever explained in the app.

## Stack

- Next.js 16 (App Router, Cache Components, Server Actions) and React 19
- Postgres with Drizzle ORM: Neon in production, embedded PGlite for local development and tests
- Passwordless email sign-in (Resend), with sessions stored in the database
- Private photo storage on Vercel Blob (local disk in development)
- Web push notifications and an installable PWA
- Tailwind CSS 4 and hand-drawn SVG art animated with Motion
- Vitest unit tests and Playwright end-to-end tests with two simulated people

## Run it locally

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run db:migrate
```

```bash
npm run dev
```

Open http://localhost:3000 and sign in with any email.
With `MAIL_TRANSPORT=outbox`, no email is sent: the sign-in link is printed in the dev server's console.

To play both sides on one computer, use a second browser profile (or a private window) for the second person.

## Tests

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run test:e2e
```

The end-to-end suite builds the production app, then plays through everything as two people: signing in by email, inviting, keeping answers private, mending all 18 pieces, keeping a photo, growing the tree, and lighting the Friday candles.
It also captures every screen in light and dark themes to `e2e/.screenshots`.

`TEST_MODE=1` enables test-only helpers (a clock you can pin with a cookie, an outbox reader, fast-forward, and an art gallery at `/dev/vessels`).
They return 404 when `TEST_MODE` is unset, and are always disabled on Vercel production.

## Deploy (about 20 minutes, all free tiers)

1. On [Vercel](https://vercel.com), import the GitHub repository.
2. In the Vercel project, open **Storage** and create and connect:
   - a **Neon** Postgres database (this sets `DATABASE_URL`), and
   - a **Blob** store (this sets `BLOB_READ_WRITE_TOKEN`).
3. Turn on 2-Step Verification for your Google account if it isn't already, then create an app password at https://myaccount.google.com/apppasswords.
4. Generate push notification keys:

   ```bash
   npx web-push generate-vapid-keys
   ```

5. Add these in **Settings > Environment Variables**:

   | Name                           | Value                        |
   | ------------------------------ | ---------------------------- |
   | `MAIL_TRANSPORT`               | `gmail`                      |
   | `GMAIL_USER`                   | Your Gmail address           |
   | `GMAIL_APP_PASSWORD`           | The app password from step 3 |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key from step 4       |
   | `VAPID_PRIVATE_KEY`            | Private key from step 4      |
   | `VAPID_SUBJECT`                | `mailto:` plus your Gmail    |

   Links in emails use the project's production domain automatically; set `APP_URL` only if you add a custom domain.
   Leave `TEST_MODE` unset.

6. Redeploy (**Deployments > ... > Redeploy**).
   Every build first checks that these settings exist and prints what's missing, then applies database migrations.
7. Sign in, set up your home, and play one full round with a second account on two real phones before sending the invite.

On iPhone, notifications only work after adding the site to the home screen (Share, then Add to Home Screen) and opening it from there.

To send from your own domain instead of Gmail, set `MAIL_TRANSPORT=resend` with `RESEND_API_KEY` and `MAIL_FROM` from a domain verified in [Resend](https://resend.com).

## Project layout

- `src/lib/game/` holds the game rules: prompt deck, prompt selection, rounds, answers, and vessel geometry.
- `src/components/art/` holds the hand-built SVG art: vessel, courtyard, tree, candles.
- `src/app/(app)/` holds the signed-in screens: courtyard, today's moment, tree, album, shelf, settings.
- `src/lib/dal.ts` is the data access layer; every page, action and route checks the session and home membership there.
- `drizzle/` holds the SQL migrations, generated with `npm run db:generate` after editing `src/db/schema.ts`.

Prompt ids in `src/lib/game/prompts.ts` are stored in the database, so add new prompts freely but never rename or reuse an id.
