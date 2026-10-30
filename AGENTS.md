# AGENTS.md

# University of Sri Jayewardenepura — Incident Reporting & Resolution Management System

Engineering rules, security, permissions, workflow, deployment, and UI standards for this repository. **Read this before changing code.**

---

## 1. Mission

Students and staff report campus incidents (maintenance, security, infrastructure, etc.) through a controlled lifecycle:

```text
Student / Lecturer → Submit complaint or suggestion → Administrator review
→ Accept (not started) / Reject → Administrator assigns Relevant Authority
→ Authority progress → Solved → Administrator closes → Closed
```

Faculty of Management & Commerce (FMSC) complaint & suggestion app — institutional case management aligned with the formal proposal MVP (not an anonymous public board).

---

## 2. Product principles

- **Institutional** — Official university system; not generic SaaS, crypto, or social UI.
- **Professional** — Clarity, trust, hierarchy, accessibility, predictable workflows.
- **Simple** — Simplest architecture that meets requirements; no extra infrastructure for show.
- **Secure** — Authorization on the backend; never rely on hidden UI alone.
- **Maintainable** — Clear names, small modules, explicit business logic.

---

## 3. Technology stack

| Layer | Choice |
|--------|--------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS → **Vercel** |
| Backend | Django, Django REST Framework → **Railway** |
| Database | PostgreSQL on Railway (SQLite locally if `DATABASE_URL` unset) |
| Media | Cloudinary (references in DB, not large blobs in PostgreSQL) |

**Not required initially:** Redis, Celery, WebSockets, GraphQL, microservices.

Frontend calls the API through **HTTPS**. Next.js **same-origin `/api` proxy** to Django keeps **session cookies** on the frontend origin.

---

## 4. Authentication

**Implemented approach:** Django **database sessions** + **CSRF** (not JWT).

```text
Browser → Next.js (/api proxy) → Django REST
Session cookie (HttpOnly) + CSRF token on mutating requests
```

- `ActiveSessionAuthentication` only; no client-stored access/refresh tokens.
- Login, logout, password change, and profile updates require CSRF.
- Production: `DJANGO_DEBUG=False`, strong `SECRET_KEY`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` set to the **Vercel frontend origin** (not the Railway API host). `DJANGO_ALLOWED_HOSTS` is the API host.
- Vercel: `API_PROXY_URL` → Railway API base including `/api`.

**Students:** No self-registration. Roster import: **MC number = username**, **CPM = initial password**; password change after first login.

**Lecturers:** Staff reporter accounts (email login); same submit/track flows as students where applicable.

**Relevant authorities:** Created by the **System Administrator** (invitation / activation), not self-registration.

**Roles (PDF / MVP):** `STUDENT`, `LECTURER`, `ADMIN` (Administrator), `AUTHORITY` (Relevant Authority), `MANAGEMENT` (Faculty Management — dashboards/read-only oversight), `SYSADMIN` (System Administrator — users, authorities, reference data). Never accept client-chosen staff roles on create/update payloads.

---

## 5. Permissions (summary)

Enforce every privileged action in Django views/permissions, including **object-level** access (no ID tampering across users’ incidents).

| Role | May | Must not |
|------|-----|----------|
| **Student / Lecturer** | Submit cases, own cases, permitted messages | Verify, assign, close, manage users |
| **Administrator** | Review, accept/reject, assign authority, set priority, close/reopen | Sysadmin-only user provisioning |
| **Relevant Authority** | Assigned cases, progress, mark solved (with note) | Assign work, close cases, manage users |
| **Faculty Management** | Dashboards, read authorized case detail | Assign, close, verify, manage users |
| **System Administrator** | Authority accounts, responsible parties, reference data | Routine case workflow (unless also given another role) |

Official **position** (e.g. maintenance, security) is separate from role; do not use position as the only permission check.

---

## 6. Incident workflow

**Statuses:** `SUBMITTED`, `UNDER_REVIEW`, `NOT_STARTED`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_INFORMATION`, `RESOLVED` (solved), `CLOSED`, `REJECTED`, `REOPENED`.

Validate transitions on the server (no arbitrary jumps, e.g. `SUBMITTED` → `CLOSED`).

- Server generates case numbers (e.g. `FMSC-2026-00142`).
- **Case type:** `COMPLAINT` | `SUGGESTION`; reporter urgency: `URGENT` | `NORMAL` (official priority remains staff-controlled).
- **Visibility:** default private for MVP; authenticated access only for listings unless requirements expand.
- Authority marks **solved** with mandatory resolution note; **Administrator** **closes**.
- Use responsible-party entities; do not hard-code user IDs in business logic.
- Incident-specific updates and notifications; not a general chat platform.
- **No dedicated audit-log subsystem** (`AuditLog`, etc.) unless requirements change.

---

## 7. API and data

- REST with clear endpoints; avoid generic “action” URLs when a specific route exists.
- Serializers: never blind `fields = "__all__"` on sensitive models; separate public vs private shapes.
- Paginate incident lists; optimize queries (`select_related` / `prefetch_related`).
- Custom user model from the start; passwords hashed; secrets in environment variables only.
- Rate-limit sensitive endpoints (login, incident create, etc.).
- Images via Cloudinary; validate uploads; protect private media at the API.

---

## 8. UI and visual design

Use **sjp.ac.lk as visual reference only** — colors, typography, masthead, footer style. Do **not** copy unrelated university services, contact directories, marketing blocks, or invented statistics.

**Tokens (current spec):**

- Maroon `#800000` utility bar; yellow `#F4D535` accent; white identity row; navy `#192F59` section headings; charcoal `#181818` footer.
- **Fonts:** Open Sans (body), Poppins (headings/nav) via Next.js font optimization — no serif UI type.
- **Layout:** Max content width ~1320px; desktop gutters 40px, mobile 22px; masthead ~112px; nav collapses ~1100px.
- **Controls:** ~2px radius on buttons/inputs; incident panels square with restrained borders; semantic status/priority colors stay distinct.
- **Homepage:** Campus imagery with readable overlay, public incidents, reporting guidance — not university news filler.
- **Workspaces:** Compact role nav, tables, operational panels; mobile single-column forms; respect `prefers-reduced-motion`.

**Anti–AI-slop:** No excessive gradients, glassmorphism, neon, giant rounded cards, decorative blobs, 3D/AI people, card overload, or huge marketing headlines. Prefer solid colors, subtle borders, clean tables, clear status badges.

**UI workflow:** Understand the task → required fields → primary action → remove noise → apply tokens above → responsive → accessibility.

Preserve existing API contracts and authorization when changing UI.

---

## 9. Frontend conventions

- TypeScript with explicit domain types (e.g. incident status unions, not bare `string`).
- Reusable components; follow patterns in `frontend/components/` and `globals.css`.
- Forms: visible labels, inline errors, no placeholder-only labels.
- Loading and empty states; prevent duplicate submits.
- Do not add `NEXT_PUBLIC_` secrets; proxy target is server-side `API_PROXY_URL`.

---

## 10. Deployment checklist

```text
DEBUG=False, production SECRET_KEY, DATABASE_URL
DJANGO_ALLOWED_HOSTS, CORS + CSRF origins = Vercel URL
Cloudinary, migrations applied, static files (WhiteNoise on Railway)
Session auth + permissions tested on private/public incidents
```

---

## 11. Development standards

- Inspect existing models, serializers, views, permissions, and UI before large rewrites.
- Migrations for every model change; descriptive commits.
- Test permission boundaries and status transitions.
- **Definition of done:** Backend + auth + validation + frontend + responsive + errors + tests; not “page renders only.”

**Agents must not:** invent major requirements, add Redis/Celery/WebSockets/audit logs without need, create hidden admin routes, expose private incident data, or trust frontend-only authorization.

**Source of truth:** Explicit user requirements → this file → existing code → framework defaults.

---

## 12. Non-negotiable rules

1. Students and authorities do not self-register; System Administrator provisions authority accounts.
2. Backend authorization is mandatory; Administrator closes cases; authorities solve assigned work only.
3. Never expose reporter personal data on unauthorized or public-facing serializers.
4. No client-controlled role escalation.
5. Next.js on Vercel, Django + PostgreSQL on Railway; Cloudinary for images.
6. UI stays institutional (section 8); keep architecture simple until real need appears.
