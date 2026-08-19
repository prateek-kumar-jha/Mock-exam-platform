# Backend Database Schema
## Competitive Exam Mock Test & Learning Platform

**Legend**: PK = Primary Key · FK = Foreign Key · 1 = One · N = Many

---

## 1. Core Entities

### USERS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| name | VARCHAR | |
| email | VARCHAR | unique |
| phone | VARCHAR | unique, nullable |
| password_hash | VARCHAR | never store plaintext |
| role | ENUM | student / educator / admin |
| exam_preferences | JSONB | array of followed exam categories |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### SESSIONS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| user_id (FK → USERS) | UUID | |
| token_hash | VARCHAR | store hash, never raw token |
| device_info | TEXT | |
| expires_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

**USERS (1) → SESSIONS (N)**

---

## 2. Exam Catalog & Content

### EXAMS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| name | VARCHAR | e.g., "SSC CGL" |
| category | VARCHAR | e.g., Govt/Banking/Railways |
| description | TEXT | |
| created_at | TIMESTAMP | |

### PACKAGES
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| title | VARCHAR | e.g., "SSC Package" |
| description | TEXT | |
| price | DECIMAL | |
| status | ENUM | draft / active / archived — archived instead of hard-deleted once it has real subscribers |
| created_by (FK → USERS) | UUID | admin who created/owns it |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### PACKAGE_EXAMS (join table)
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| package_id (FK → PACKAGES) | UUID | |
| exam_id (FK → EXAMS) | UUID | |
| added_at | TIMESTAMP | when this exam was added to the package — useful if you later need to know what a package contained at a given time |

**PACKAGES (1) → PACKAGE_EXAMS (N) ← (N) EXAMS** — admin freely adds/removes rows here to build or edit a package's contents; deleting a `PACKAGE_EXAMS` row only affects future access grants, never past ones (see SUBSCRIPTIONS note below)

### TEST_SERIES
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| exam_id (FK → EXAMS) | UUID | |
| title | VARCHAR | |
| type | ENUM | live / practice / previous_year |
| price | DECIMAL | null if free |
| created_by (FK → USERS) | UUID | educator/admin who authored it |
| created_at | TIMESTAMP | |

### TESTS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| test_series_id (FK → TEST_SERIES) | UUID | |
| title | VARCHAR | |
| duration_minutes | INT | |
| marking_scheme | JSONB | correct/incorrect/unattempted marks per question type |
| scheduled_start | TIMESTAMP | null for practice tests |
| scheduled_end | TIMESTAMP | null for practice tests |
| status | ENUM | draft / published / archived |

**TEST_SERIES (1) → TESTS (N)**

### QUESTIONS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| subject | VARCHAR | |
| topic | VARCHAR | |
| difficulty | ENUM | easy / medium / hard |
| question_text | TEXT | |
| options | JSONB | array of option text/labels |
| correct_option | VARCHAR | |
| explanation | TEXT | |
| created_by (FK → USERS) | UUID | |
| created_at | TIMESTAMP | |

### TEST_QUESTIONS (join table)
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| test_id (FK → TESTS) | UUID | |
| question_id (FK → QUESTIONS) | UUID | |
| sequence_order | INT | |
| section | VARCHAR | e.g., "Quantitative Aptitude" |

**TESTS (1) → TEST_QUESTIONS (N) ← (N) QUESTIONS**

---

## 3. Attempts & Scoring

### ATTEMPTS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| test_id (FK → TESTS) | UUID | |
| user_id (FK → USERS) | UUID | |
| started_at | TIMESTAMP | server-recorded |
| submitted_at | TIMESTAMP | nullable until submit/auto-submit |
| status | ENUM | in_progress / submitted / auto_submitted |
| total_score | DECIMAL | computed server-side only, on submit |
| percentile | DECIMAL | computed after test's global end |

**USERS (1) → ATTEMPTS (N) ; TESTS (1) → ATTEMPTS (N)**

### ATTEMPT_ANSWERS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| attempt_id (FK → ATTEMPTS) | UUID | |
| question_id (FK → QUESTIONS) | UUID | |
| selected_option | VARCHAR | nullable (unattempted) |
| status | ENUM | answered / marked_for_review / not_visited |
| time_spent_seconds | INT | |
| updated_at | TIMESTAMP | last auto-save timestamp |

**ATTEMPTS (1) → ATTEMPT_ANSWERS (N)**

---

## 4. Payments & Subscriptions

### PAYMENTS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| user_id (FK → USERS) | UUID | |
| amount | DECIMAL | server-verified against gateway, never client-supplied |
| currency | VARCHAR | |
| status | ENUM | pending / success / failed / refunded |
| payment_method | VARCHAR | |
| gateway_reference_id | VARCHAR | reconciliation key from payment gateway webhook |
| created_at | TIMESTAMP | |

### SUBSCRIPTIONS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| user_id (FK → USERS) | UUID | |
| test_series_id (FK → TEST_SERIES) | UUID | nullable — set when purchasing a single test series directly |
| package_id (FK → PACKAGES) | UUID | nullable — set when purchasing a package; grants access to every exam in `PACKAGE_EXAMS` for this package as of the purchase date |
| plan_type | VARCHAR | |
| starts_at | TIMESTAMP | |
| expires_at | TIMESTAMP | |
| payment_id (FK → PAYMENTS) | UUID | |

**USERS (1) → PAYMENTS (N) ; USERS (1) → SUBSCRIPTIONS (N) ; PACKAGES (1) → SUBSCRIPTIONS (N)**

> Because access is resolved through this `SUBSCRIPTIONS` row rather than by re-checking `PACKAGE_EXAMS` live, archiving a package or removing an exam from it later never revokes what an existing subscriber already has — their access was granted at purchase time and stays put unless you explicitly revoke it.

---

## 5. Blogs / Job Alerts

### POSTS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| author_id (FK → USERS) | UUID | |
| title | VARCHAR | |
| body | TEXT | |
| category | ENUM | job_alert / exam_update / study_tip |
| exam_name | VARCHAR | structured field for job alerts |
| organization | VARCHAR | nullable |
| vacancy_count | INT | nullable |
| important_dates | JSONB | e.g., {"apply_start":..., "apply_end":..., "exam_date":...} |
| application_link | VARCHAR | nullable |
| published_at | TIMESTAMP | nullable until published |

---

## 6. Notifications

### NOTIFICATIONS
| Column | Type | Notes |
|--------|------|-------|
| id (PK) | UUID | |
| user_id (FK → USERS) | UUID | |
| title | VARCHAR | |
| message | TEXT | |
| is_read | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## 7. Key Design Notes

- **Structured & scalable**: JSONB fields (marking_scheme, exam_preferences, important_dates) allow flexible metadata without constant schema migrations
- **Fast queries**: index on (test_id, user_id) in ATTEMPTS, (exam_id, category) in POSTS, and (subject, topic, difficulty) in QUESTIONS for analytics/filtering
- **Data integrity**: all FK relationships enforced at the DB level, not just application code
- **Easy maintenance**: scoring/percentile fields are always derived server-side and recomputable — never treat client-submitted values as authoritative
