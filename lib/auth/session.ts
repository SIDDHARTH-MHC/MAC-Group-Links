import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type AdminSession = {
  isLoggedIn: boolean;
  username?: string;
};

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "mac_group_links_admin",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8,
    path: "/",
  },
};

export async function getAdminSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return getIronSession<AdminSession>(await cookies(), sessionOptions);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    return false;
  }
  return username === expectedUser && password === expectedPass;
}
