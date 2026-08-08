# Product Requirements Document (PRD)
## Competitive Exam Mock Test & Learning Platform

---

## 1. Overview

**Problem**
Aspirants preparing for competitive exams (SSC, banking, railways, state PSCs, etc.) rely on a scattered mix of Telegram groups, PDFs, YouTube videos, and low-quality test apps. There is no single, reliable source for exam-accurate mock tests, honest performance analytics, and timely job/exam notifications — leaving students unsure of their real preparation level and often misled by clickbait "sarkari job" blogs.

**Target Users**
- Students preparing for competitive exams (primary)
- Content creators / educators who build and manage test series and study content
- System administrators who run exam operations, moderate content, and manage the business

**Vision**
A single platform where a student can discover the right exam, take realistic mock tests, understand exactly where they stand versus other aspirants, and get reliable job/exam alerts and study material — without noise or misinformation.

**Goals**
- Deliver an exam-taking experience indistinguishable from the real exam interface (timing, navigation, palette, negative marking rules)
- Give every student actionable analytics, not just a raw score
- Build trust through accurate, curated job-alert content
- Support monetization via subscriptions/pay-per-series without compromising free-tier value
- Architect for concurrency — hundreds to thousands of students starting the same test at the same scheduled time

---

## 2. User Personas

### Persona 1 — Aspirant (Student)
- Preparing for one or more competitive exams (e.g., SSC CGL, CHSL, bank PO)
- Price-sensitive, mobile-first, often on unstable networks (2G/3G/4G in smaller towns)
- Needs: mock tests identical to real exam pattern, clear analytics (percentile, sectional strength/weakness, time management), reliable notifications for exam dates and job vacancies, downloadable study material
- Pain points: fear of losing test progress due to network drop, distrust of "fake" difficulty levels, information overload from unreliable sources

### Persona 2 — Content Creator / Educator
- Builds question banks, test series, and study content (may be an internal admin-managed role initially, external contributor role later)
- Needs: an efficient question-authoring tool (bulk upload, tagging by topic/difficulty), the ability to schedule tests, and visibility into how their content performs (attempt rates, difficulty calibration)
- Pain points: manual question entry is slow, no way to see if a question is miscalibrated (too easy/too hard) after enough attempts

### Persona 3 — System Administrator / Operator
- Manages exam catalog, test series scheduling, payments/subscriptions, content moderation, and user support
- Needs: dashboards for concurrency/load during live tests, ability to intervene (extend a test, issue refunds, disable a compromised account), audit logs
- Pain points: needing to react fast during a live mock test if something breaks (e.g., timer bug, payment failure spike)

---

## 3. Core Modules

### 3.1 Tests Module
- **Exam catalog**: hierarchy of Exam → Tier/Stage → Subject → Topic
- **Test types**: Live/Scheduled Mock (fixed start time, all users attempt simultaneously), Practice Mode (attempt anytime, section-wise or full), Previous Year Papers
- **Test engine**:
  - Exam-accurate UI: question palette (answered/not answered/marked for review/not visited), section-wise timer and overall timer, negative marking exactly per exam pattern
  - Auto-save every answer/navigation action so a disconnect never loses progress
  - Server-authoritative timer (client shows countdown, but submission validity is checked server-side against server time)
  - Auto-submit on time expiry, even if the client is offline
- **Scoring**: computed server-side only, using the exam's official marking scheme (correct/incorrect/unattempted marks configurable per exam)

### 3.2 Analytics Module
- Individual: raw score, percentile among that test's attempters, sectional accuracy, time spent per question/section, accuracy vs. speed matrix, comparison to personal past attempts
- Cohort: leaderboard (opt-in display name), topic-wise weak-area heatmap across all attempted tests
- Aggregated (admin-facing): question-level difficulty index (% correct, average time spent) to recalibrate future tests

### 3.3 Blogs / Job Alerts Module
- Editorial CMS for job notifications, exam calendar updates, and result announcements
- Structured metadata per post: exam name, organization, vacancy count, important dates, application link, eligibility — so it can also power a filterable "Job Alerts" list view, not just a blog feed
- Push/email notification hooks for followed exam categories

### 3.4 User Profile Module
- Profile: exam preferences/categories followed, subscription status, attempt history
- Attempt history: full list of past tests taken, with quick links back into each result/analytics view

### 3.5 Exam Packages Module
- **Admin-controlled bundling**: admin (you) can create a "package" that groups multiple individual exams under one purchasable offering — e.g., an "SSC Package" bundling SSC CGL, CHSL, MTS, Steno, etc.
- **Full CRUD in admin's hands**: create, edit (rename, change price, add/remove included exams), and delete/deactivate packages at any time — no developer involvement needed after launch
- A package is composed of one or more existing Exams (and, through them, their Test Series) — admin picks which exams belong in a package via a simple multi-select, not a separate content-authoring step
- **Student-facing**: packages surface on the student dashboard as purchasable bundles (e.g., "Get all SSC exams in one plan") alongside or instead of buying individual exam access
- **Deletion safety**: deleting or deactivating a package must not revoke access for students who already purchased it — recommend a soft-delete/"archive" state (package stops appearing for new purchases, but existing subscribers keep what they paid for) rather than a hard delete
- **Editing an existing package** (adding/removing an exam from the bundle) applies going forward for new purchasers; already-subscribed students keep access per their original purchase terms unless you explicitly choose to extend the change retroactively

### 3.6 Payments & Subscriptions Module
- Plans: free tier (limited practice tests), individual paid test-series, paid exam packages, full subscription
- Payment gateway integration (e.g., Razorpay), invoices, renewal reminders, refund workflow
- All monetary calculations happen server-side only (see Security Addendum in TRD) — client never determines a price or a final charge amount

---

## 4. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | A student can register/log in via email+password or OTP, browse exams, and view test series relevant to their preference |
| FR-2 | A student can attempt a live scheduled test only within its start/end window, and a practice test anytime |
| FR-3 | The test engine must auto-save every 1 action (answer selection, mark for review, navigation) |
| FR-4 | On submission (manual or auto-submit on timeout), the score must be computed server-side and shown within the same session |
| FR-5 | A student can view sectional and overall analytics with percentile ranking immediately after a live test's global end time (to avoid leaking questions to later starters) |
| FR-6 | An educator/admin can create a test by selecting/composing questions, setting duration, marking scheme, and schedule |
| FR-7 | An admin can publish, edit, and tag blog/job-alert posts with structured fields (exam, dates, link) |
| FR-8 | A student can subscribe to a paid plan and get access provisioned within seconds of successful payment confirmation (via webhook, not client callback alone) |
| FR-9 | An admin can view real-time concurrency dashboards during a live test (active sessions, submission rate, error rate) |
| FR-10 | The system must support role-based access control for Student, Educator, Admin |
| FR-11 | An admin can create, edit, and delete/deactivate exam packages that bundle multiple exams into one purchasable offering, without developer involvement; deleting a package must never revoke access already granted to existing subscribers |

---

## 5. Non-Functional Requirements

- **Concurrency**: support a defined peak concurrent-test-taker target (e.g., 5,000–10,000 simultaneous test sessions at a scheduled start) without degraded response times — see TRD for load strategy
- **Availability**: 99.5%+ uptime target, with graceful degradation (read-only mode) during incidents rather than full outage
- **Performance**: question navigation/answer save round-trip under 300ms on 4G
- **Data integrity**: no attempt/score data loss even under connection drops (client-side local buffering + server ack)
- **Security**: per the Security Addendum (rate limiting, strict input validation, secrets management, dependency audits, safe error handling, safe file uploads, server-side money calculation) — detailed in the TRD
- **Scalability**: horizontally scalable backend and stateless API layer so capacity can be added ahead of scheduled high-traffic tests
- **Accessibility**: usable on low-end Android devices and slow networks; readable at various zoom levels; screen-reader-friendly where feasible in exam-taking flows

---

## 6. Success Metrics

- % of students completing a started mock test (target: >90%, indicating the engine doesn't lose sessions)
- Median time-to-first-analytics-view after a live test ends
- Payment success rate (webhook-confirmed) vs. payment attempt rate
- Zero data-loss incidents during scheduled live tests per quarter
- Growth in returning-user rate (students who take more than one test)

---

## 7. Out of Scope (v1)

- Live proctoring (webcam/AI monitoring) — flagged as a possible v2 addition
- Native mobile apps (v1 is a responsive web app / PWA)
- Peer-to-peer discussion forums (may route to a lightweight comments feature instead)
