import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const TEST_NOW_COOKIE = "mended_test_now";

export function isTestMode(): boolean {
  return process.env.TEST_MODE === "1" && process.env.VERCEL_ENV !== "production";
}

/** Current time. In test mode, an ISO timestamp cookie can pin the clock. */
export async function getNow(): Promise<Date> {
  await connection();
  if (isTestMode()) {
    const pinned = (await cookies()).get(TEST_NOW_COOKIE)?.value;
    if (pinned) {
      const parsed = new Date(pinned);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return new Date();
}
