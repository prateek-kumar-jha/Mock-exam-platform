"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearTokens, getAccessToken } from "@/lib/auth";
import {
  ApiError,
  fetchPackages,
  fetchTests,
  type PackageSummary,
  type TestSummary,
} from "@/lib/catalog";
import { Sidebar } from "../components/sidebar";
import { Button } from "../components/ui/button";
import { Alert } from "../components/ui/alert";
import {
  Card,
  CardBody,
  CardFooter,
  CardStats,
  CardTag,
  CardTitle,
} from "../components/ui/card";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage is browser-only, so this has to run after mount.
    const stored = getAccessToken();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setToken(stored);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextPackages, nextTests] = await Promise.all([
        fetchPackages(),
        fetchTests(),
      ]);
      setPackages(nextPackages);
      setTests(nextTests);
    } catch (err) {
      // An expired token means the guard's premise no longer holds — send
      // the student back to login rather than showing an empty dashboard.
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearTokens();
        router.replace("/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Could not load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  // Guard: render nothing authenticated until a token is confirmed present.
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Your mock tests and exam packages.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </header>

          {error ? (
            <div className="mt-6 space-y-3">
              <Alert tone="error">{error}</Alert>
              <Button variant="secondary" size="sm" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : null}

          {loading ? (
            <p className="mt-8 text-sm text-text-secondary">Loading…</p>
          ) : null}

          {!loading && !error ? (
            <>
              <Section title="Exam packages">
                {packages.length === 0 ? (
                  <Alert tone="info">
                    No packages are available yet. Run the database seed to add
                    sample data.
                  </Alert>
                ) : (
                  <Grid>
                    {packages.map((pkg) => (
                      <Card key={pkg.id}>
                        <CardTag tone="warning">Package</CardTag>
                        <CardTitle>{pkg.title}</CardTitle>
                        {pkg.description ? (
                          <CardBody>{pkg.description}</CardBody>
                        ) : null}
                        <CardStats
                          items={[
                            `${pkg.exams.length} ${
                              pkg.exams.length === 1 ? "exam" : "exams"
                            }`,
                            pkg.exams.map((exam) => exam.name).join(", "),
                          ]}
                        />
                        <CardFooter>
                          <Button size="sm">
                            Buy for {INR.format(pkg.price)}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Section>

              <Section title="Practice tests">
                {tests.length === 0 ? (
                  <Alert tone="info">
                    No published tests yet. Run the database seed to add sample
                    data.
                  </Alert>
                ) : (
                  <Grid>
                    {tests.map((test) => (
                      <Card key={test.id}>
                        <CardTag tone="info">
                          {test.exam?.name ?? "Mock test"}
                        </CardTag>
                        <CardTitle>{test.title}</CardTitle>
                        {test.series ? (
                          <CardBody>{test.series.title}</CardBody>
                        ) : null}
                        <CardStats
                          items={[
                            `${test.question_count} questions`,
                            `${test.duration_minutes} min`,
                          ]}
                        />
                        <CardFooter>
                          {/* Wired up in Phase 5 — the test engine. */}
                          <Button size="sm" disabled>
                            Start test
                          </Button>
                          <span className="text-xs text-text-secondary">
                            Coming soon
                          </span>
                        </CardFooter>
                      </Card>
                    ))}
                  </Grid>
                )}
              </Section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-text-secondary uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}
