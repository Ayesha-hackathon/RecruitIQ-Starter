export interface ReplitUser {
  id: string;
  name: string;
  profileImage: string | null;
}

export async function getSession(): Promise<ReplitUser | null> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json() as { user?: ReplitUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function loginUrl(): string {
  return `/api/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}
