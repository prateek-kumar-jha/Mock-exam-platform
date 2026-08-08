# Project: Competitive Exam Mock Test & Learning Platform

## What this is
A web platform for students preparing for competitive exams (SSC, banking,
railways, state PSCs). Core features: live/scheduled mock tests with an
exam-accurate test-taking engine, performance analytics, job-alert blogs,
admin-controlled exam packages (bundles like "SSC Package" = CGL + CHSL + MTS),
and subscriptions/payments.

## Full specs — always check these before building a feature
- 01-PRD.md — requirements, personas, modules, functional requirements
- 02-TRD.md — tech stack and security requirements (read this before writing ANY code)
- 03-User-Flows.md — user journeys for Student / Educator / Admin
- 04-UIUX-Design-Brief.md — color system (EduSpark Blue & Gold), typography, components
- 05-Database-Schema.md — full entity/relationship model, use this as the source of truth for migrations
- 06-Implementation-Roadmap.md — the build order we are following, phase by phase
- 07-Privacy-Policy-Data-Compliance.md — data handling rules

## Tech stack (do not substitute without asking me first)
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + NestJS + TypeScript
- Database: PostgreSQL
- Cache/queue: Redis + BullMQ
- Object storage: S3-compatible (for file uploads)
- Payment gateway: Razorpay

## Non-negotiable rules for every feature you build
1. **Server-authoritative everything.** Test timers, scores, and payment amounts
   are always computed/verified server-side. Never trust a client-submitted
   value for a score, a price, or "time remaining."
2. **Strict input validation.** Validate every input against a schema (type,
   length, format) and reject anything that doesn't match — don't just
   sanitize/escape.
3. **No hardcoded secrets.** All API keys/tokens/passwords via environment
   variables. Never let a secret reach the frontend bundle or get committed.
4. **Generic errors to the client, full errors in server logs.** Never expose
   stack traces, file paths, or raw DB errors to the user.
5. **Rate limiting on every route**, stricter on auth endpoints (login/signup/
   password reset), with per-IP + per-account limits and exponential backoff —
   not a hard lockout.
6. **File uploads**: validate actual file type/content (not just extension),
   store outside the web root in object storage, never allow execution.
7. **Soft-delete for admin-managed content that students may have already
   purchased** (packages, test series) — see docs/05-Database-Schema.md for
   the `status: archived` pattern. Never hard-delete something a paying
   student already has access to.

## Working style
- Explain what you're about to do before making large changes.
- After finishing a phase, tell me exactly how to test/verify it, and what
  the git commit message should be.
- If something in the docs is ambiguous or you need a decision from me,
  ask — don't guess silently on anything security- or money-related.