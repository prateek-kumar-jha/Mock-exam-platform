"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup, storeTokens } from "@/lib/auth";
import {
  AuthShell,
  AuthLink,
  ErrorAlert,
  Field,
  SubmitButton,
} from "../components/auth-form";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      // The server is the authority on validation; this just relays its verdict.
      const tokens = await signup({ name, email, password });
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
      title="Create your account"
      subtitle="Start practising for SSC, banking, railways and state PSC exams."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? <ErrorAlert message={error} /> : null}

        <Field
          id="name"
          label="Full name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Your name"
        />

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          hint="Must be at least 8 characters."
        />

        <SubmitButton
          pending={pending}
          idleLabel="Create account"
          pendingLabel="Creating account…"
        />
      </form>
    </AuthShell>
  );
}
