# LearnWithTaa Project Structure

This document outlines the directory structure of the LearnWithTaa project and matches the current codebase.

---

## Root Directory Layout

```
LearnWithTaa/
├── client/                 # Frontend: HTML, CSS, JS, assets
├── server/                 # Backend: Node.js + Express
├── docs/                   # Project documentation
├── pdfs/                   # PDF lesson materials (grades 7–10)
├── code_editor_python.html # Python compiler page (served at /code_editor_python.html)
├── FIX_LOG.md              # Log of admin/compiler/PDF fixes and new features
├── package.json
├── package-lock.json
└── .env                    # Environment variables (DB credentials, etc.)
```

- **`client/`** – All frontend code and static assets served to the browser.
- **`server/`** – Express app: API routes, config, middleware.
- **`docs/`** – Documentation (structure, database, API, fixes).
- **`pdfs/`** – PDF files for lesson books; served under `/pdfs`.
- **`code_editor_python.html`** – Standalone compiler page; served at `/code_editor_python.html`.
- **`FIX_LOG.md`** – Summary of Admin Quiz Manager, compiler 404, and PDF loading fixes.
- **`.env`** – Optional; DB and other env config (see `server/config/database.js`).

---

## `/client`

### `client/css/`
Stylesheets for the app.

| File | Purpose |
|------|--------|
| `admin-quiz.css` | Admin Quiz Question Manager form and list |
| `admin-login.css` | Admin login page styling |
| `admin-dashboard.css` | Admin dashboard (units, lessons, quizzes) styling |
| `Book_viewer.css` | Book viewer layout |
| `course-details.css` | Course details page |
| `dashboard.css` | Student dashboard |
| `dark-mode.css` | Dark theme |
| `landing_page.css` | Landing page |
| `lesson.css` | Lesson page, quiz UI, PDF viewer, matching/drag-drop |
| `login.css`, `signup.css` | Auth pages |
| `teacher-dashboard.css`, `teacher-dashboard-styles.css` | Teacher dashboard and shared teacher styles |
| `teacher_courses.css`, `teacher-create-class.css` | Teacher courses and create-class |
| `units.css` | Units list page |
| `loading-animations.css`, `mobile-menu.css`, `print-styles.css`, `toast-notifications.css` | Shared UI |

### `client/js/`
Client-side logic.

| File | Purpose |
|------|--------|
| `admin-quiz.js` | Admin quiz: units/lessons, load/save/delete questions |
| `admin-login.js` | Admin login: send email/password, store JWT, redirect to dashboard |
| `admin-dashboard.js` | Admin dashboard: CRUD units, lessons, quizzes, questions (with auth header) |
| `book_viewer.js` | Book viewer behavior |
| `course-details.js` | Course details page |
| `dashboard.js` | Student dashboard |
| `lesson.js` | Lessons, quiz (API + fallback), PDF, matching/drag-drop, compiler button |
| `units.js` | Units list and API |
| `login.js`, `signup.js` | Auth |
| `teacher-dashboard.js`, `teacher-dashboard-loader.js` | Teacher dashboard |
| `teacher_courses.js`, `teacher-create-class.js` | Teacher courses and create-class |
| `landing_page.js`, `dark-mode.js`, `mobile-menu.js`, `mobile-gestures.js`, `toast-notifications.js` | Shared / landing |

### `client/pages/`
HTML entry points (served via Express routes).

| Page | Route | Purpose |
|------|--------|--------|
| `landing_page.html` | `/`, `/landing_page.html` | Home |
| `login.html`, `sign_up.html` | `/login.html`, `/sign_up.html` | Auth |
| `dashboard.html` | `/dashboard.html` | Student dashboard |
| `units.html` | `/units.html` | Units for a grade |
| `lesson.html` | `/lesson.html` | Lesson content + quiz + PDF + compiler link |
| `book_viewer.html` | `/book_viewer.html` | Book viewer |
| `teacher_dashboard.html` | `/teacher_dashboard.html` | Teacher dashboard (includes Quiz Manager link) |
| `teacher-create-class.html`, `teacher_courses.html` | Same-name routes | Teacher class/course management |
| `course-details.html`, `Course-details.html` | `/course-details.html`, `/class-details.html` | Course/class details |
| `admin-quiz.html` | `/admin-quiz.html` | Admin Quiz Question Manager |
| `admin-login.html` | `/admin-login.html` | Admin login (email + password; credentials in `.env`) |
| `admin-dashboard.html` | `/admin-dashboard.html` | Admin dashboard: manage units, lessons, quizzes |
| `toast_test_ai.html` | Via catch-all `/*.html` | Toast test |

### `client/icons/`, `client/lang/`, `client/books/`
- **icons/** – Logos, social icons (e.g. facebook, google, logout).
- **lang/** – `en.json`, `ar.json` for i18n.
- **books/** – Book images and device icons.

### `client/manifest.json`
Web app manifest (PWA).

---

## `/server`

### `server/app.js`
- Loads `dotenv` first so `.env` (including `ADMIN_EMAIL`, `ADMIN_PASSWORD`) is available.
- Express app setup, CORS, JSON/urlencoded.
- Static: `/css`, `/js`, `/pages`, `/icons`, `/lang`, `/manifest.json`, `/books`, `/pdfs`.
- API: `/api/auth`, `/api/users`, `/api/teachers`, `/api/classes`, `/api/enrollments`, `/api/lessons`, `/api/units`, `/api/quizzes`, `/api/book`, `/api/admin` (login + protected CRUD).
- Page routes: explicit routes for each HTML page including `admin-login.html`, `admin-dashboard.html`, `GET /code_editor_python.html`, `GET /admin-quiz.html`, and catch-all for other `*.html` from `client/pages`.
- Default port: `3001` (or `process.env.PORT`).

### `server/config/`
- **`database.js`** – MySQL/MariaDB pool for `learning_platform` (can use `.env`).

### `server/middleware/`
- **`auth.js`** – JWT verification for general auth.
- **`adminAuth.js`** – Admin JWT verification (`requireAdmin`); ensures `role === 'admin'`.

### `server/routes/`
| File | Mount | Purpose |
|------|--------|--------|
| `auth.js` | `/api/auth` | Login, register, logout, user by ID |
| `users.js` | `/api/users` | User CRUD |
| `teachers.js` | `/api/teachers` | Teachers list/add |
| `classes.js` | `/api/classes` | Class CRUD, enrollments, roster |
| `enrollments.js` | `/api/enrollments` | Enrollments by class, add/remove |
| `lessons.js` | `/api/lessons` | Lessons by unit or grade |
| `Units.js` | `/api/units` | Units by grade, lessons by unit, create unit/lesson |
| `Quizzes.js` | `/api/quizzes` | Quiz by grade/unit/lesson, progress, create/delete question |
| `book_interactions.js` | `/api/book` | Book interactions and answers |
| `adminAuth.js` | `/api/admin` | Admin login/logout (no token); reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` from env |
| `admin.js` | `/api/admin` (with `requireAdmin`) | Admin CRUD: units, lessons, quizzes, quiz questions |

### `server/data/`
- **`book_interactions.json`** – File-backed storage for book interactions.

---

## `/docs`

| Document | Purpose |
|----------|--------|
| **Project_Structure.md** | This file – project layout and structure |
| **Database_Structure.md** | Database schema and table descriptions |
| **API Endpoints Documentation.md** | All API endpoints (including Admin API) and usage |
| **Admin Only.md** | Admin login credentials (email/password); keep private |
| **QUIZ_AND_COMPILER_FIXES.md** | Quiz DB column names, compiler button, troubleshooting |

---

## Static and Page Routes Summary

- **Static:** `/css`, `/js`, `/pages`, `/icons`, `/lang`, `/books`, `/pdfs` → mapped to `client/` or `pdfs/`.
- **HTML pages:** Explicit routes for main pages; `code_editor_python.html` from project root; `admin-quiz.html` from `client/pages`; other `*.html` from `client/pages` via catch-all.

---

*Last updated: admin login/dashboard pages and routes, admin middleware, Admin Only.md, manifest/dotenv.*
