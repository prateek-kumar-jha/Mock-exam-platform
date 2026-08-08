# Website & User Flow
## Competitive Exam Mock Test & Learning Platform

---

## 1. Student Journey

**User states**: New User (Onboarding) → Active User (Exploring) → Power User (Attempting Tests) → Returning User (Reviewing Analytics) → Inactive User (Re-engagement)

### Flow diagram (steps)

| # | Screen | What happens | Primary action | Notes |
|---|--------|---------------|-----------------|-------|
| 1 | Landing / Home | Browse featured exams, latest job alerts, top test series | Explore | SEO-indexed for organic job-alert traffic |
| 2 | Sign Up / Login | Email+password or OTP; select exam preference(s) | Create account | If returning → straight to Dashboard |
| 3 | Dashboard | See upcoming live tests, recommended practice tests, followed job alerts, and purchasable exam packages (e.g., "SSC Package") | Open a test / view a package | Personalized by exam preference |
| 4 | Test Detail | View test pattern, duration, marking scheme, instructions | Start Test | Live tests only enabled within schedule window |
| 5 | Instructions Screen | Exam-standard instructions, language selection, declaration checkbox | Proceed | Mirrors real exam interface conventions |
| 6 | Test-Taking Screen | Question palette, timer, navigation, mark-for-review | Submit / Auto-submit on timeout | Auto-save every action; offline-tolerant |
| 7 | Submission Confirmation | Confirm submit (or auto-submit notice) | View result | Result may be delayed until test's global end time for live tests |
| 8 | Analytics / Result | Score, percentile, sectional breakdown, time analysis | Review weak areas | Compare to past attempts |
| 9 | Profile / Subscription | Manage exam preferences, subscription plan, payment history | Upgrade / renew | Payment confirmed via gateway webhook |

### Edge cases
- No internet during test attempt → local buffering of answers, sync on reconnect, no data loss
- Session expired mid-test → re-authenticate without losing test progress (server tracks elapsed time independently)
- Payment fails after test-series purchase attempt → clear retry path, no partial access granted

---

## 2. Content Creator / Educator Journey

| # | Screen | What happens | Primary action |
|---|--------|---------------|-----------------|
| 1 | Educator Login | Role-gated login | Access content dashboard |
| 2 | Question Bank | Author/bulk-upload questions, tag by exam/subject/topic/difficulty | Save to bank |
| 3 | Test Builder | Compose a test from the question bank, set duration/marking scheme | Save draft |
| 4 | Scheduling | Set live test date/time or publish as practice test | Schedule / Publish |
| 5 | Content Performance | View attempt counts, question-level difficulty index (% correct, avg. time) | Recalibrate content |
| 6 | Blog/Job Alert Editor | Draft job-alert post with structured metadata (exam, vacancy, dates, link) | Publish |

### Edge cases
- Question flagged by multiple students as incorrect/ambiguous → moderation queue before it affects future scoring
- Scheduled test conflicts with another live test in the same exam category → warning before publish

---

## 3. System Administrator Journey

| # | Screen | What happens | Primary action |
|---|--------|---------------|-----------------|
| 1 | Admin Login | 2FA-gated login | Access admin console |
| 2 | Live Ops Dashboard | Real-time concurrency, submission rate, error rate during a live test | Intervene if needed (extend test, disable a session) |
| 3 | User Management | Search/manage accounts, roles, subscription status | Suspend / refund / adjust |
| 4 | Content Moderation | Review flagged questions/posts | Approve / reject |
| 5 | Payments & Refunds | Reconcile gateway webhook events vs. internal subscription state | Approve manual refund if needed |
| 6 | Package Management | Create a package (name, price, select which exams it bundles); edit an existing package's exams/price; archive/delete a package | Create / Edit / Archive |
| 7 | Audit Log | Review all admin actions taken | — |

### Edge cases
- Payment webhook delayed/lost → reconciliation job flags mismatched subscription states for manual review
- Live test technical incident → admin can extend the test window platform-wide without invalidating already-submitted attempts
- Admin deletes/archives a package that has active subscribers → existing subscribers keep access; the package simply stops appearing for new purchases
- Admin removes an exam from a package after students already bought it → those students keep access to that exam; the change only affects future purchasers

---

## 4. Navigation Rules (all roles)

- Back / Next within a wizard-style flow (test-taking, test builder) never discards unsaved state
- Cancel/Close always prompts confirmation once any unsaved input exists
- Tab-bar/primary navigation persists across Dashboard, Job Alerts, and Profile for the Student role
