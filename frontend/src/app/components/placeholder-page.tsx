"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { Alert } from "./ui/alert";

/**
 * Shared shell for nav destinations that aren't built yet. Carries the same
 * auth guard as the dashboard so no protected route renders without a token.
 */
export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = getAccessToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
  }, [router]);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-text-secondary">Loading…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <div className="mt-6">
            <Alert tone="info">{description}</Alert>
          </div>
        </div>
      </main>
    </div>
  );
}
