"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, storeTokens } from "@/lib/auth";
import {
  AuthShell,
  AuthLink,
  ErrorAlert,
  Field,
  SubmitButton,
} from "../components/auth-form";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const tokens = await login({ email, password });
      storeTokens(tokens);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your exam preparation."
      footer={
        <>
          New here? <AuthLink href="/signup">Create an account</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? <ErrorAlert message={error} /> : null}

        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />

        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
        />

        <SubmitButton
          pending={pending}
          idleLabel="Log in"
          pendingLabel="Logging in…"
        />
      </form>
    </AuthShell>
  );
}
