"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getAccessToken } from "@/lib/auth";

/**
 * Placeholder dashboard — proves the auth round-trip landed. The real
 * card-based dashboard (03-User-Flows.md step 3) comes later.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // localStorage is browser-only, so this has to run after mount.
    const stored = getAccessToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
  }, [router]);

  // Guard: render nothing authenticated until a token is confirmed present.
  // This covers both the unauthenticated visitor (redirect above is in
  // flight) and the moment just after logout clears the token.
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Loading…</p>
      </main>
    );
  }

  function handleLogout() {
    clearTokens();
    setToken(null);
    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-[var(--radius-card)] border border-border-subtle bg-card p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            Signed in
          </span>

          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Placeholder screen. Upcoming live tests, recommended practice tests
            and exam packages will live here.
          </p>

          <div className="mt-6 rounded-[var(--radius-field)] bg-surface p-4">
            <p className="text-xs font-medium text-text-secondary">
              Access token (first 32 chars)
            </p>
            <code className="mt-1 block break-all font-mono text-xs text-foreground">
              {token.slice(0, 32)}…
            </code>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 rounded-[var(--radius-field)] border border-border-subtle px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
