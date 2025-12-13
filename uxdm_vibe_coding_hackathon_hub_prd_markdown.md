# UXDM – VibeCoding Hackathon Hub — PRD

**Date:** 2025-12-12  
**Author(s):** Prof. Dr. Ignacio Alvarez  
**Version:** v0.2  
**Short pitch:** A web tool for university course hackathons where students enroll, connect their Git, upload required data, and have their progress automatically tracked via commits and milestones—culminating in a leaderboard and optional final pitch voting.  
**Relevant links:** None

---

## 1) Core Context

### Problem
- **Low live visibility:** During the 3-hour hackathon, it’s hard for the professor (and students) to see real-time progress across participants.
- **Low next-step clarity:** Students often don’t know what to do next, causing stalls, duplicated effort, and uneven pacing.

### Solution
A lightweight web hub that:
- Lets students **enroll** and **connect GitHub**
- Shows **professor-defined milestones** and “what to do next”
- **Automatically monitors commits** and marks milestone progress based on **commit message labels** (rules set by professor)
- Displays a **live leaderboard**
- Runs an optional **final pitch vote** and incorporates it into the final result

### Target Users
- **Primary:** Students participating in *UXDM Vibecoding WS25* (3-hour hackathon)
- **Admin:** Professor (creates milestones, sets commit-label rules, monitors progress, finalizes winner)

### Primary Use Cases
- **Student**
  - Join the hackathon and connect GitHub
  - See milestones + rules (labels to use) and identify the **next milestone**
  - Push commits using required labels and see progress reflected in the hub
  - Track standing on the leaderboard
- **Professor**
  - Create/edit milestones and define label rules (e.g., `#M1`, `#M2`)
  - Monitor live progress and identify who is stuck
  - Run/close pitch voting (optional)
  - Publish final leaderboard + winner

### North-Star Metric
- **% of enrolled students who finish** (reach the final milestone) **within the 3-hour session**

### Non-Goals
- Code quality scoring, advanced code review, or subjective “best practices” evaluation
- Any deep analytics beyond milestone completion + basic activity visibility

---

## 2) UX Foundations

### Personas
- **Student Participant**
  - Goal: finish milestones fast, understand “what’s next,” and stay motivated under time pressure
  - Constraints: varying Git/GitHub skill, limited setup time, high cognitive load in a 3-hour sprint
- **Professor (Admin)**
  - Goal: define milestones + rules, monitor progress live, keep the room moving, and finalize outcomes quickly
  - Constraints: needs “at-a-glance” clarity, minimal operational overhead, predictable/transparent scoring

### Key Insights / Pain Points
- Students lose momentum when the **next step isn’t explicit**
- Without a shared live view, progress tracking becomes **manual and fragmented**
- Git label mistakes (wrong/missing milestone tags) create confusion unless the tool **guides + validates**

### Experience Principles / “Vibe”
- **Low-friction:** enroll + connect GitHub in minutes
- **Real-time & transparent:** progress updates quickly and rules are visible
- **Motivating:** milestones feel game-like; leaderboard encourages completion
- **Classroom-simple:** minimal UI, minimal configuration, resilient to user error

### Accessibility & Inclusion Requirements
- Keyboard navigable core flows (enroll, connect, view milestones/leaderboard)
- Color-blind-safe status indicators (don’t rely on color alone)
- High-contrast, readable tables and clear status labels (e.g., “Done / In progress / Not started”)

### High-Level Journey
- **Student:** Landing → Enroll → Connect GitHub → View “Next Up” milestone + label rules → Commit with labels → See progress update → Watch leaderboard → Pitch vote
- **Professor:** Create milestones + label rules → Open enrollment → Live monitoring dashboard (progress + stuck list) → Start/close pitch vote → Publish final leaderboard + winner

---

## 3) Scope & Priorities

### MVP (V1) Goals (for a 3-hour session)
**P0 (must-have)**
- Student enrollment (name + optional student ID) and basic profile
- GitHub connect (OAuth) and select repo to track (plus “paste repo URL” fallback)
- Milestones view: ordered checklist + “Next Up” highlight
- Commit label rules: professor-defined labels (e.g., `#M1`, `#M2`) visible to students
- Auto-tracking: ingest commits and mark milestones complete when matching labels are detected
- Leaderboard: live ranking based on milestone completion (with tie-breaker rules)
- **Professor admin dashboard:** create/edit milestones + label rules; live monitoring view; stuck list
- **Pitch vote module:** voting UI + open/close voting + results + included in final winner logic

**P1 (nice-to-have)**
- Results export (CSV) of enrollments, milestone status, commit activity, final standings

### Out of Scope (V1)
- Code quality scoring or “best code” evaluation
- Plagiarism detection
- Multi-course / long-term account management (beyond the session)
- Advanced project management features (tasks, comments)
- Git providers beyond GitHub

### Assumptions & Risks
**Assumptions**
- Students have (or can create) a GitHub account and can push commits during the session
- Network access is stable enough for GitHub auth + webhook/event ingestion

**Risks & mitigations**
- **OAuth / permissions friction** → provide “paste repo URL” fallback
- **Wrong repo/branch** tracked → validate repo + show recent commits preview
- **Label misuse** (missing/typo labels) → visible rules + warnings when commits don’t match any milestone
- **GitHub API limits / delays** → prefer webhooks + show “last updated” timestamps + graceful degradation

---

## 4) Tech Overview

### Frontend
- **Next.js (React)** + **TailwindCSS**
- Core pages: Landing/Enroll, Student Dashboard, Leaderboard, Pitch Vote, Professor Admin

### Backend
- **Next.js API routes** (Node runtime) for:
  - Enrollment + session management
  - GitHub OAuth callback + token handling
  - Webhook ingestion (push events) and commit parsing
  - Vote open/close + ballot submission + results
  - Admin CRUD for milestones/labels

### Database
- **Postgres via Supabase**

Indicative tables:
- `users` (student/admin role)
- `enrollments` (course session + user)
- `repos` (linked GitHub repo metadata)
- `milestones` (ordered, label rule, points)
- `milestone_events` (which commit satisfied which milestone)
- `votes` / `vote_sessions` (open/close window + ballots)

### APIs / Integrations
- **GitHub OAuth** for authentication + repo selection
- **GitHub Webhooks** for near-real-time commit updates
  - Verify webhook signature (HMAC)
  - Parse commit messages for milestone labels
- Optional fallback polling only if webhook setup fails

### Deployment
- **Vercel** for Next.js app + API routes
- **Supabase** managed Postgres
- Environment config: `DEV`, optional `STAGING`, `PROD`

### Security / Privacy
- Least-privilege GitHub scopes
- Store tokens securely (server-side only; encrypted at rest)
- Role-based access control (Student vs Professor)
- Minimize PII (name + optional student ID)
- Basic audit trail for milestone edits and vote lifecycle actions

---

## 5) Feature Modules

### 5.1 Enrollment & Session Access (P0)
**User Story**: As a student, I want to enroll quickly so I can start tracking my progress without setup friction.

**Acceptance Criteria**
- Enroll with name (+ optional student ID) and see a confirmation state
- Enrollment ties to a single course session (UXDM Vibecoding WS25)
- Prevent duplicate enrollments for the same identifier
- Student can access dashboard immediately after enrolling (even before GitHub connect)
- Professor sees live list of enrolled students

### 5.2 GitHub Connect & Repo Linking (P0)
**User Story**: As a student, I want to connect GitHub and select my repository so the tool can monitor my commits.

**Acceptance Criteria**
- GitHub OAuth connect
- Select **one repository** to track
- Fallback: paste GitHub repo URL
- Validate repo access and show a recent commits preview
- Student can change linked repo until a professor-defined cutoff (default: allowed; changes logged)

### 5.3 Milestones & Rules (Student View) (P0)
**User Story**: As a student, I want to see milestones and label rules so I always know what to do next.

**Acceptance Criteria**
- Ordered milestone list with statuses (Not started / In progress / Done)
- Prominent “Next Up” milestone highlight
- Each milestone shows required label(s) and brief completion guidance
- “Rules” area explains detection behavior with examples
- Completed milestones display timestamp and commit reference

### 5.4 Commit Monitoring & Milestone Auto-Completion (P0)
**User Story**: As the professor, I want milestones tracked automatically based on commit labels so I don’t have to manually verify progress.

**Acceptance Criteria**
- Ingest GitHub push events via webhooks
- Parse commit messages for milestone labels and mark completion
- Unknown/invalid labels are flagged to the student
- Deduplicate: a milestone cannot be completed twice for the same student
- Show “Last sync” timestamp and handle delays gracefully

### 5.5 Leaderboard & Scoring (P0)
**User Story**: As a student and professor, I want a live leaderboard so progress is transparent and motivating.

**Acceptance Criteria**
- Ranks by milestones completed (primary)
- Tie-breakers (default order):
  1) Earlier completion time of final milestone
  2) Faster overall milestone completion timeline
  3) Commit count during session window (last resort)
- Updates near-real-time after webhook processing
- Shows per-student progress (e.g., “4/6 done”) and last activity time

**Default scoring model**
- Each milestone = 1 point

### 5.6 Professor Admin Dashboard (P0)
**User Story**: As the professor, I want one simple dashboard to configure milestones and monitor who is progressing vs stuck.

**Acceptance Criteria**
- CRUD + reorder milestones with name/description/label(s)/optional points
- Live status table: enrolled, GitHub connected, repo linked, milestones done, last sync, last commit time
- “Stuck” view highlights: no commits since X minutes, invalid labels, missing repo, not connected
- Optional config lock to prevent mid-session rule changes
- Audit trail for milestone edits (timestamps minimum)

### 5.7 Pitch Vote (P0)
**User Story**: As a student, I want to cast a final pitch vote so the winner reflects execution and pitch quality.

**Acceptance Criteria**
- Professor can open/close voting
- Only enrolled students can vote; one ballot per student
- Candidate list is clear and unambiguous
- Results visible only after professor reveals them (default: after close)
- Vote results feed into final ranking

**Default winner formula**
- Final score = **80% Milestone score + 20% Vote score**
- Vote score normalized (votes received / max votes)

### 5.8 Finalization & Export (P1)
**User Story**: As the professor, I want a clean end-of-session output to announce results and retain evidence.

**Acceptance Criteria**
- “Finalize” freezes leaderboard + vote results
- Export CSV: enrollments, repo links, milestone completion timestamps, votes, final ranks

---

## 6) AI Design
- Not applicable for V1.

---

## 7) IA, Flows & UI

### Main Screens
- Landing / Enroll
- Student Dashboard (Next Up + milestones + rules + sync status)
- Leaderboard
- Pitch Vote
- Professor Admin Dashboard

### Key Flows
- Student: Enroll → Connect GitHub → Select Repo → Commit w/ Labels → Milestones update → Leaderboard → Vote
- Professor: Configure milestones/labels → Open enrollment → Monitor → Open/close/reveal vote → Finalize/export

### Design Tokens / Components
- Status pills (Done/In progress/Not started), tables, “Next Up” banner, toast notifications
- High contrast; do not rely on color alone

### Localization / Tone
- English (default)
- Short, directive, classroom-friendly copy

---

## 8) Iteration & Workflow

### Build Rhythm
- Setup: OAuth + webhooks + DB schema
- Milestones UI + enrollment
- Commit ingestion + leaderboard
- Admin dashboard + pitch vote + finalize/export

### Review Process
- Professor demo checkpoints
- 30-minute dry-run with test repos before classroom use

### Spike / Risk Items
- OAuth scopes + secure token storage
- Webhook reliability and event delays
- Label parsing edge cases

---

## 9) Quality

### Testing Requirements
- Unit tests: label parser, scoring/tie-break logic, vote normalization
- Integration tests: webhook → milestone completion → leaderboard update
- E2E: enroll → connect → commit → milestone done; admin configure → vote open/close → finalize

### Accessibility Checks
- Keyboard navigation for primary flows
- Non-color status indicators
- Clear focus states and readable tables

### Performance Targets
- Leaderboard updates visible within **≤ 10s** of webhook receipt (best effort)
- Page loads **< 2s** on typical campus Wi-Fi

---

## 10) Metrics & Analytics

### Events
- `enroll_submitted`
- `github_connected`
- `repo_linked`
- `webhook_received`
- `milestone_completed`
- `label_invalid_detected`
- `leaderboard_viewed`
- `vote_opened` / `vote_submitted` / `vote_closed` / `vote_revealed`
- `session_finalized` / `export_downloaded`

### KPIs
- **North-star:** % enrolled students reaching final milestone within 3 hours
- Activation: % enrolled who connect GitHub + link repo
- Progress: median time to first milestone completion
- Reliability: webhook processing success rate; % with invalid label commits

### Experimentation / A/B
- Not required for V1.

---

## 11) Launch & Operations

### Environments
- Prod
- Optional staging for pre-class dry run

### Rollout Plan (single 3-hour session)
- T-1 day: configure milestones + label rules; test with sample repo
- Start: open enrollment + share join link/QR
- During: monitor stuck list; resolve repo/link issues; keep leaderboard visible
- End: open vote window; close/reveal; finalize; export

### Support & Maintenance
- “Reset session” admin action
- Minimal logging + visible error states for webhook failures
- Admin manual override to mark a milestone complete (logged) as a last-resort fallback

