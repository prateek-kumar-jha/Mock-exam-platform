# Technical Requirements Document (TRD)
## Competitive Exam Mock Test & Learning Platform

---

## 1. System Overview

A web-based (responsive/PWA) platform delivering scheduled and practice mock tests, analytics, job-alert blogs, and study resources, built for exam-day concurrency spikes and designed for phased scale-up from an initial small-hosting deployment to a fuller cloud architecture as usage grows.

> Note: your current build runs on PHP/MySQL on shared hosting (Hostinger). That stack is fine to launch and validate with, but it will not hold up to a true "hundreds of students starting the same test at 10:00 AM sharp" load pattern. This TRD targets a Node.js/NestJS rebuild (see Backend, below) — treat that migration as a planned phase rather than something bolted on later.

---

## 2. Recommended Technology Stack

### Frontend
- **Framework**: Next.js (React) — server-side rendering for blog/SEO pages, client-rendered app shell for the test-taking interface
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State/data-fetching**: React Query (or SWR) for caching analytics/profile data; local component state + IndexedDB for in-progress test answers (survives refresh/disconnect)

### Backend
- **Framework**: Node.js with NestJS (TypeScript) — REST for CRUD, WebSocket channel only for the live-test countdown/heartbeat, not for answer submission (answers go over authenticated REST/HTTP for reliable retry semantics)
- Background jobs: BullMQ (Redis-backed queue) for scoring computation, analytics aggregation, notification dispatch — kept off the request/response path
- This means the current PHP/Hostinger build will need to be rebuilt on this stack rather than incrementally evolved — plan the migration as its own phase before scaling test-day traffic through it

### Database
- **Primary**: PostgreSQL (preferred for this domain due to strong relational integrity, JSONB for flexible question metadata, and better concurrency behavior than MySQL under write-heavy bursts) — MySQL/MariaDB is an acceptable fallback if you're staying on the current stack
- **Read replicas**: for analytics queries, so heavy reporting never competes with live-test write traffic

### Caching
- **Redis**: session store, per-endpoint rate-limit counters, live-test question-set cache (so 5,000 students starting at once read from cache, not the DB), leaderboard sorted sets

### Media & Storage
- Object storage (e.g., S3-compatible: AWS S3, Cloudflare R2, or Backblaze B2) for PDFs, images, and study resources — never store uploads on the same filesystem as the application code
- CDN in front of object storage for static asset and study-material delivery

### Hosting / Cloud Infrastructure
- Start: a VPS or small managed cloud (DigitalOcean/Hetzner/AWS Lightsail) once you outgrow shared hosting — shared hosting cannot guarantee resources during a concurrency spike
- Target: containerized deployment (Docker) behind a load balancer, with horizontal auto-scaling for the API tier ahead of scheduled live tests
- Managed database service (RDS or equivalent) once traffic justifies it, for automated backups/failover

---

## 3. Concurrency & High-Availability Strategy

This is the part that most exam-platform builds get wrong, so it deserves explicit rules:

1. **Pre-warm, don't scale reactively.** Scheduled tests have a known start time — scale the API tier and warm the cache *before* the scheduled time, not in response to the traffic spike.
2. **Serve the question set from cache, not the DB**, for the entire duration of a live test. The DB should only be hit for writes (answer submissions) and occasional cache misses.
3. **Write answers idempotently and asynchronously where possible**: accept the answer write, acknowledge immediately, and let a queue worker persist it — but never lose an ack'd write (use a durable queue, not fire-and-forget).
4. **Server-authoritative timing.** The client displays a countdown, but the server independently tracks each session's start time and rejects/auto-submits based on its own clock — never trust a client-reported "time's up."
5. **Graceful degradation plan.** If load exceeds capacity, the system should shed non-critical load (e.g., pause analytics computation, disable non-essential read endpoints) before it drops live-test writes.
6. **Load testing before every major scheduled test** until you have enough historical headroom data to trust the numbers.

---

## 4. Auth & Security

- **Authentication**: JWT-based sessions (short-lived access token + refresh token), or server-side sessions backed by Redis — either is fine, but pick one and be consistent
- **Authorization**: role-based access control (Student / Educator / Admin), enforced server-side on every endpoint — never rely on the frontend hiding a button
- **Input validation**: every input validated against a strict schema (type, length, format) and rejected outright if it doesn't match — sanitizing/escaping alone is not sufficient
- **Secrets management**: no hardcoded API keys, tokens, or passwords anywhere in the codebase; all secrets via environment variables, verified to never ship into frontend bundles or get committed to git
- **Dependency audits**: run a dependency vulnerability scan (e.g., `npm audit` / Composer's audit equivalent) on a recurring schedule, not just once; patch or replace vulnerable packages where safe

### Rate Limiting (from your security requirements doc)
- Stricter limits on authentication routes (login, signup, password reset)
- Moderate limits on public endpoints (exam catalog, blog listing)
- Looser limits on authenticated user actions (answer submission during a live test — this must not be the thing that gets throttled)
- Combine **per-IP and per-account** limits with **exponential backoff**, not a hard lockout, for auth routes
- All thresholds configurable (env/config), never hardcoded

### Error Handling & Information Leakage
- Users must never see stack traces, internal file paths, or raw database errors
- Return generic error messages to the client; log full error detail server-side for debugging

### File Upload Safety (relevant to study resource uploads and profile pictures)
- Validate actual file type, size, and content (not just the file extension)
- Store uploads outside the web root / in isolated object storage, never in a web-servable app directory
- Uploaded files must never be executable as code (correct storage permissions, no script execution on the upload path)

### Money & Payments
- All monetary calculations (pricing, discounts, final charge amount) happen **server-side only**, verified against the payment gateway's own webhook confirmation — never trust a client-supplied amount
- Reconcile subscription state from the gateway's webhook, not just the client's post-payment redirect

---

## 5. AI & APIs (optional / future scope)

- AI-assisted question tagging / difficulty estimation (batch job, not real-time-critical)
- Email/SMS/push notification API for job alerts and test reminders
- Payment gateway API (e.g., Razorpay, given your India-first user base)

---

## 6. Deployment

- **CI/CD**: GitHub Actions (or equivalent) — lint, test, build, deploy on merge to main, with a manual approval gate for production
- **Environments**: local → staging → production, with staging used for load-testing before every scheduled live test launch
- **Monitoring & logging**: centralized logging (e.g., a hosted log service) plus uptime/error monitoring (e.g., Sentry for errors, a status dashboard for uptime), with alerts wired to whoever's on call during a live test window

---

## 7. Engineering Rules

- **Scalable**: built to grow without hard limits baked into the schema or API contracts
- **Modular**: loose coupling between the Tests, Analytics, Blogs, and Payments modules — each should be independently deployable/testable
- **Observable**: logs, metrics, and alerts everywhere that matters, especially the test-submission path
- **Secure by default**: security controls (validation, rate limits, RBAC) built in from day one, not retrofitted before launch
