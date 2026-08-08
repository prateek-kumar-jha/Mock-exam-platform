# Privacy Policy & Data Compliance Documentation
## Competitive Exam Mock Test & Learning Platform

> This is a draft prepared as an internal working document to guide your published Privacy Policy and your internal data-handling practices. It is not a substitute for review by a qualified lawyer familiar with Indian data protection law (the Digital Personal Data Protection Act, 2023, and any sector-specific rules that may apply), especially before you collect payment data or launch publicly. Treat this as a strong starting draft, not a finished legal document.

---

## 1. Data We Collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Identity data | Name, email, phone number | Account creation, login, communication |
| Exam preference data | Followed exam categories, subjects of interest | Personalizing test recommendations and job alerts |
| Usage data | Test attempts, answers, time spent, scores | Delivering results/analytics; improving question quality |
| Device/technical data | IP address, device type, browser | Security (rate limiting, fraud detection), performance troubleshooting |
| Payment metadata | Transaction ID, amount, payment status, payment method type | Subscription provisioning, invoicing, refunds |
| Uploaded content (if applicable) | Profile picture | Profile personalization |

**Important**: full payment card/bank details are never collected or stored by the platform directly — all card/UPI/bank data is handled by the payment gateway (e.g., Razorpay) under its own PCI-DSS compliance; the platform only stores the gateway's transaction reference and status.

---

## 2. How We Use Data

- To create and manage user accounts and authenticate logins
- To deliver the core service: test access, scoring, analytics, study resources, and job-alert notifications relevant to the user's stated exam preferences
- To process payments and manage subscriptions
- To improve the platform: identifying miscalibrated questions, understanding drop-off points in the test-taking flow, and general product analytics
- To detect and prevent abuse (e.g., rate-limiting, fraud detection on payments)
- To communicate service updates, exam reminders, and (where consented) promotional job-alert content

We do **not** sell user data to third parties.

---

## 3. Legal Basis & Consent

- Account creation requires affirmative consent to this policy (checkbox, not pre-ticked)
- Optional data uses (e.g., promotional notifications) are opt-in, with an easy opt-out at any time
- Consent is recorded (timestamp + version of policy accepted) for auditability

---

## 4. Data Sharing with Third Parties

| Third Party | Data Shared | Purpose |
|-------------|-------------|---------|
| Payment gateway (e.g., Razorpay) | Name, email, phone, transaction amount | Processing payments |
| Cloud/object storage provider | Uploaded files, study resource files | Hosting content |
| Email/SMS/push notification provider | Name, email/phone, notification content | Delivering alerts |
| Analytics tooling (if used) | Aggregated/pseudonymized usage data | Product improvement |

All third parties are bound by their own data-processing terms; we select providers with reasonable security commitments.

---

## 5. Data Retention

- Account data: retained while the account is active, deleted or anonymized within a defined period (e.g., 90 days) after account deletion request, subject to any legal retention requirements for payment records
- Test attempt data: retained to support historical analytics (student's own progress tracking) unless deletion is requested
- Payment records: retained as required by applicable financial/tax record-keeping regulations, independent of account deletion

---

## 6. User Rights

Users may, subject to applicable law:
- Access the personal data held about them
- Request correction of inaccurate data
- Request deletion of their account and associated personal data (subject to retention exceptions above)
- Withdraw consent for optional data uses (e.g., promotional notifications) at any time
- Lodge a complaint with the relevant data protection authority if they believe their data has been mishandled

A defined contact channel (e.g., a privacy/support email) should be published for exercising these rights, with a committed response window (e.g., 30 days).

---

## 7. Security Measures

Summarized from the platform's technical security requirements (see TRD for full detail):
- Strict input validation on all data collection points
- Rate limiting on authentication and sensitive endpoints
- Secrets (API keys, credentials) never hardcoded or exposed to the frontend
- Regular dependency vulnerability audits
- Generic error messages to users; detailed errors logged securely server-side only
- File uploads validated by actual content/type, stored outside the web root, never executable
- All monetary calculations verified server-side against the payment gateway

---

## 8. Children's Data

Given the platform serves competitive-exam aspirants (typically 18+, though some exams have younger eligible candidates), age-appropriate handling should be confirmed: if users under 18 are expected, consider a lower minimum-age requirement for account creation or parental-consent handling as required by applicable law.

---

## 9. Policy Updates

- Users notified of material changes to this policy (e.g., email notice or in-app banner) with a defined notice period before changes take effect
- Version history maintained internally for audit purposes

---

## 10. Next Steps Before Publishing

1. Have this reviewed by a lawyer familiar with the Digital Personal Data Protection Act, 2023 (India), particularly around consent mechanics and data localization if you use non-Indian cloud infrastructure
2. Confirm your actual data retention periods with your finance/ops needs before finalizing numbers
3. Publish the finished policy at a stable URL and link it from account signup and payment flows
