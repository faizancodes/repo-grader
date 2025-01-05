import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const USER_SESSION_COOKIE = "user_session_id";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies();
  let userId = cookieStore.get(USER_SESSION_COOKIE)?.value;

  if (!userId) {
    userId = uuidv4();
    // Set cookie with 30 day expiry
    cookieStore.set(USER_SESSION_COOKIE, userId, {
      expires: new Date(Date.now() + SESSION_DURATION),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }

  return userId;
}
