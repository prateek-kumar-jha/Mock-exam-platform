# UI/UX Design Brief
## Competitive Exam Mock Test & Learning Platform

**Goal**: Create an interface that feels as serious and trustworthy as the real exam it's preparing students for, while staying approachable, fast, and usable on low-end Android devices over patchy networks.

---

## 1. Design Principles

- **Clarity over decoration** — a student under time pressure should never have to think about the UI, only the question
- **Consistency** — the test-taking screen should match real government-exam interface conventions (palette colors, timer placement, negative-marking indicators) so there are no surprises on exam day
- **Trust signals** — accuracy of job-alert dates, transparent scoring logic, visible last-updated timestamps on content
- **Accessibility** — legible at various zoom levels, sufficient color contrast (WCAG AA minimum), usable one-handed on a phone
- **Performance-first** — lightweight assets; the test-taking screen especially must load and respond fast on 4G/patchy connections

---

## 2. Color Palette — EduSpark Blue & Gold

| Role | Color | HEX |
|------|-------|-----|
| Primary | Royal Blue | #2563EB |
| Primary Hover | Deep Blue | #1D4ED8 |
| Secondary | Indigo | #4F46E5 |
| Secondary Hover | Deep Indigo | #4338CA |
| Primary Accent | Soft Golden Yellow | #FBBF24 |
| Accent Hover | Golden Amber | #F59E0B |
| Warm Accent | Orange Gold | #F97316 |
| Success | Emerald Green | #10B981 |
| Warning | Amber | #F59E0B |
| Error / Negative marking | Rose Red | #EF4444 |
| Info | Sky Blue | #0EA5E9 |
| Light Background | Cool White | #F8FAFC |
| Card (light mode) | White | #FFFFFF |
| Surface | Soft Gray | #F1F5F9 |
| Border (light mode) | Light Slate | #E2E8F0 |
| Dark Background | Slate 950 | #0F172A |
| Dark Card | Slate 800 | #1E293B |
| Dark Hover | Slate 700 | #334155 |
| Dark Border | Slate | #475569 |
| Primary Text | Slate 900 | #0F172A |
| Secondary Text | Slate 600 | #475569 |
| Placeholder | Slate 400 | #94A3B8 |
| Disabled | Slate 300 | #CBD5E1 |

**Usage ratio**: Blue 60% · White/Light Gray 25% · Yellow 10% · Status colors 5%

> Both light and dark mode are supported natively in this system (Slate 950/800/700 for dark surfaces) — good fit given many students study/attempt tests late at night. Reserve the golden yellow/amber accent for calls-to-action and highlights (10% usage) so it doesn't compete with blue as the dominant trust color.

## 3. Layout & Component Style — Reference Direction

The visual language for dashboard-style screens (Student Dashboard, Educator content tools, Admin console) should follow a **card-based, soft-rounded, dashboard aesthetic** — think modern e-learning platform, not a dense government-form look. This applies to browsing/dashboard screens; the actual **test-taking screen stays plainer and more exam-standard** per Section 5 below — clarity there beats decoration.

**Structure:**
- **Icon-only left sidebar** for primary navigation (Dashboard, Tests, Packages, Job Alerts, Profile, Settings) — collapses to icons, no persistent text labels, keeps focus on content
- **Card-based content grid** for browsable items: exam packages, test series, blog/job-alert posts — each card has a category tag, a title, a small stat line (e.g., "9,530 students" → adapt to "1,240 attempts" or similar), and where relevant an avatar-stack or rating
- **Top-right profile/activity widget** on the dashboard — shows the student's name, a small activity chart (e.g., tests attempted per month), and quick stats — optional for v1, nice-to-have
- **Rounded corners throughout** — cards, buttons, input fields all use a consistent generous radius (16–20px), not sharp edges
- **Soft drop shadows** on cards for depth, not heavy borders
- **Category tags/pills** on cards use the palette's status colors (Success/Warning/Info/Error) rather than the reference's pastel palette — keep everything within EduSpark Blue & Gold

**What to keep vs. what to leave behind from typical e-learning dashboard references:**
- Keep: card grid, rounded/soft aesthetic, icon sidebar, clean whitespace, activity/progress visualization
- Leave out: unrelated social features (friends lists, generic "featured course" carousels) — this platform's cards are exams, packages, and job alerts, not lifestyle courses



## 4. Typography

- Primary font: a highly legible, neutral sans-serif (e.g., Inter, or a similar system font) — avoid decorative fonts anywhere near the test-taking screen
- Support for regional language rendering (Hindi/Devanagari and other scripts) if multi-language tests are planned, since many competitive exams are bilingual

## 5. Screen-Specific Guidance

### Test-Taking Screen
- Question palette clearly color-coded: Answered / Not Answered / Marked for Review / Not Visited — matching the real exam's convention exactly
- Timer always visible, non-intrusive but impossible to miss
- No animations or transitions that could delay perceived responsiveness
- Large, unambiguous tap targets for options (mobile-first)

### Analytics/Result Screens
- Lead with the headline number (score, percentile) before the detail
- Use simple bar/heatmap visuals for sectional strength — avoid over-designed charts that obscure the data

### Blog/Job Alerts
- Scannable list view with structured fields (exam, vacancy count, last date) visible without opening the post
- Clear "last updated" timestamp on every listing to reinforce trust

## 6. UI Components (system to define)
- Buttons: Primary, Secondary, Text/Link — consistent states (default, hover, disabled, loading)
- Input fields: text, OTP, password (with show/hide)
- Cards: for test series, blog posts, analytics summaries
- Alerts: success, warning, error, info — used consistently across the app (e.g., "Your test was auto-submitted" always uses the same warning style)
- Progress/sliders: subscription usage, section completion within a test
- Icons: consistent icon set across navigation (home, tests, analytics, profile, jobs)

## 7. Responsive Design
- Mobile-first (majority of aspirants access via phone); the test-taking screen must be fully usable on small screens without horizontal scrolling
- Tablet/desktop layouts can introduce a persistent sidebar for navigation, but the core test-taking layout should remain visually consistent across breakpoints so muscle memory transfers

## 8. Accessibility for Exam Environments
- Sufficient contrast ratios (WCAG AA) for long reading sessions
- Text resizing without breaking layout
- Clear focus states for keyboard/switch navigation
- Avoid color as the *only* signal (e.g., pair red/green with icons or text, not color alone) for colorblind users, especially in the question palette

## 9. Overall Feel
Modern, trustworthy, exam-serious, and fast — a student should feel like they're using something built specifically for high-stakes exam prep, not a generic quiz app.
