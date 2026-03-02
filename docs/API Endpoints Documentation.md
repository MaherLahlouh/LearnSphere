# API Endpoints Documentation

This document provides a comprehensive list of all API endpoints available in the LearnWithTaa application.

---

## 🔐 Authentication (`/api/auth`)

**Note:** This is for **students and teachers** only (stored in the `users` table). For **admin** login, use `/api/admin/login` and the admin login page (see Admin section below).

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/login` | POST | User login (student/teacher) | `{ email, password }` | `{ success: true, message: "Login successful!", user: { user_id, email, user_type, first_name, last_name, is_verified, grade_level } }` |
| `/register` | POST | Create new account | `{ email, password, firstName, lastName, userType, gradeLevel?, phone?, specialization?, qualifications?, experienceYears? }` | `{ success: true, message: "Account created successfully!", user: { ... } }` |
| `/logout` | POST | Logout user | None | `{ success: true, message: "Logged out successfully" }` |
| `/user/:id` | GET | Get user profile by ID | None | `{ success: true, user: { user_id, email, user_type, first_name, last_name, grade_level, phone, specialization, qualifications, experience_years, created_at } }` |

**Notes:**
- `userType` must be either `"student"` or `"teacher"`
- For students: `gradeLevel` is required (1-10)
- For teachers: `phone`, `specialization`, `qualifications`, `experienceYears` are optional
- Password must be at least 6 characters long
- Auth supports both `password_hash` and `password` column names in `users` table

---

## 👥 Users (`/api/users`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/` | GET | Get all users | None | `{ success: true, users: [...] }` |
| `/email/:email` | GET | Get user by email | None | `{ success: true, user: { user_id, email, first_name, last_name, user_type, grade_level } }` |
| `/:id` | GET | Get user by ID | None | `{ success: true, user: { user_id, email, first_name, last_name, user_type, grade_level, phone, specialization, qualifications, experience_years } }` |
| `/register` | POST | Register new user (used when teacher creates students) | `{ email, password, firstName, lastName, userType, gradeLevel }` | `{ success: true, message: "User registered successfully", user: { ... } }` |
| `/:id` | PUT | Update user information | `{ first_name?, last_name?, email? }` | `{ success: true, message: "User updated successfully", user: { ... } }` |

**Notes:**
- PUT endpoint only updates provided fields
- Email must be unique

---

## 👨‍🏫 Teachers (`/api/teachers`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/` | GET | Get all teachers | None | `[{ id, name, subject }, ...]` |
| `/` | POST | Add a new teacher | Teacher object | `{ message: "Teacher added successfully", data: { ... } }` |

---

## 📚 Classes (`/api/classes`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/` | GET | Get all classes with teacher info | None | `{ success: true, classes: [{ class_id, teacher_id, class_name, grade_level, subject, description, max_capacity, current_enrollment, teacher_first_name, teacher_last_name, seats_available }, ...] }` |
| `/teacher/:teacherId` | GET | Get classes for a specific teacher | None | `{ success: true, classes: [...] }` |
| `/student/:studentId` | GET | Get classes for a specific student | None | `{ success: true, classes: [{ class_id, teacher_first_name, teacher_last_name, enrolled_at, student_class_id, ... }, ...] }` |
| `/:classId` | GET | Get specific class details | None | `{ success: true, class: { class_id, teacher_id, class_name, grade_level, subject, description, max_capacity, current_enrollment, teacher_first_name, teacher_last_name, seats_available } }` |
| `/:classId/students` | GET | Get class roster (all enrolled students) | None | `{ success: true, students: [{ user_id, first_name, last_name, email, grade_level, student_class_id, enrolled_at }, ...] }` |
| `/` | POST | Create a new class | `{ teacherId, className, gradeLevel, subject, description?, maxCapacity? }` | `{ success: true, message: "Class created successfully!", class: { ... } }` |
| `/enroll` | POST | Enroll student in class | `{ classId, studentEmail, studentClassId? }` | `{ success: true, message: "Student enrolled successfully!" }` |

**Notes:**
- `gradeLevel` must be between 1 and 10
- `maxCapacity` defaults to 30 if not provided
- Only teachers can create classes
- Enrollment checks class capacity before adding student

---

## 📖 Lessons (`/api/lessons`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/unit/:unitId` | GET | Get all lessons for a unit | None | `[{ lesson_id, unit_id, grade_level, lesson_number, title, description, video_url, book_pages, page_start, page_end, lesson_steps, is_active, created_at }, ...]` |
| `/grade/:grade` | GET | Get all lessons for a grade | None | `[{ lesson_id, unit_id, grade_level, lesson_number, title, description, video_url, book_pages, page_start, page_end, lesson_steps, is_active, created_at }, ...]` |
| `/:lessonId` | GET | Get specific lesson by ID | None | `{ lesson_id, unit_id, grade_level, lesson_number, title, description, video_url, book_pages, page_start, page_end, lesson_steps, is_active, created_at }` |

---

## 📑 Units (`/api/units`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/:grade` | GET | Get all units for a specific grade | None | `{ success: true, data: [{ unit_id, unit_number, title: { en, ar }, description: { en, ar } }, ...] }` |
| `/:grade/:unitNumber/lessons` | GET | Get all lessons for a specific unit | None | `{ success: true, data: [{ id, title, desc, video, bookPages, pageRange: { start, end }, steps: [{ heading, text }, ...] }, ...] }` |
| `/:grade/:unitNumber/lessons/:lessonNumber` | GET | Get a specific lesson with all details | None | `{ success: true, data: { id, title, desc, video, bookPages, pageRange: { start, end }, steps: [{ heading, text }, ...] } }` |
| `/` | POST | Create a new unit (Admin only) | `{ grade, unitNumber, title, description }` | `{ success: true, message: "Unit created successfully", data: { unitId, grade, unitNumber, title } }` |
| `/:grade/:unitNumber/lessons` | POST | Create a new lesson (Admin only) | `{ lessonNumber, title, description?, videoUrl?, bookPages?, pageRangeStart?, pageRangeEnd?, steps?: [{ heading, text }, ...] }` | `{ success: true, message: "Lesson created successfully", data: { lessonId, lessonNumber, title } }` |

**Notes:**
- Units support bilingual content (English and Arabic)
- Lessons can include multiple steps with headings and content

---

## ✅ Quizzes (`/api/quizzes`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/:grade/:unit/:lesson` | GET | Get quiz questions for a lesson | None | `{ success: true, data: [{ id, type, question, explanation, answers?, correct?, options?, items?, zones?, pairs? }, ...] }` |
| `/progress` | POST | Save user's quiz progress/completion | `{ userId, grade, unitId, lessonId }` | `{ success: true, message: "Progress saved successfully" }` |
| `/progress/:userId/:grade` | GET | Get user's progress for a specific grade | None | `{ success: true, data: [{ unit_number, lesson_number, completed_at }, ...] }` |
| `/question` | POST | Create a new quiz question (Admin only) | See below | `{ success: true, message: "Quiz question created successfully", data: { questionId, grade, unitId, lessonId } }` |
| `/question/:id` | DELETE | Delete a quiz question (Admin only; `id` = `question_id`) | None | `{ success: true, message: "Quiz question deleted successfully" }` |

**POST `/question` body:**  
`grade`, `unitId`, `lessonId`, `questionType`, `questionText`, `correctAnswer?`, `explanation?`, `questionOrder`, `language?` (default `'en'`), plus type-specific fields:
- **multiple-choice / image-selection:** `answers`: `[{ text?, imageUrl?, label?, isCorrect }]`
- **drag-drop:** `dragDropItems`: `[{ text, category }]`, `dropZones`: `[{ id, label }]`
- **matching:** `matchingPairs`: `[{ left, right }]`

**Notes:**
- Question types: `multiple-choice`, `image-selection`, `drag-drop`, `matching`
- GET response includes `id` (question_id) for each question for admin delete
- Questions are stored in `quiz_questions` with `unit_id_ref`, `lesson_id_ref` (see Database_Structure.md)
- Progress is stored in `user_progress`; questions support multiple languages (default: `'en'`)

---

## 📝 Enrollments (`/api/enrollments`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/class/:classId` | GET | Get all enrollments for a class | None | `[{ enrollment_id, class_id, user_id, enrolled_at, first_name, last_name, email, grade_level }, ...]` |
| `/` | POST | Enroll a student in a class | `{ class_id, user_id }` | `{ success: true, message: "Student enrolled successfully", enrollment_id }` |
| `/` | DELETE | Unenroll a student from a class | `{ class_id, user_id }` | `{ success: true, message: "Student unenrolled successfully" }` |

**Notes:**
- Enrollment automatically updates class `current_enrollment` count
- Checks class capacity before enrollment
- Prevents duplicate enrollments

---

## 📖 Book Interactions (`/api/book`)

| Endpoint | Method | Purpose | Request Body | Query Params | Response |
|----------|--------|---------|--------------|--------------|----------|
| `/interactions` | GET | Get all interactions for a specific page | None | `book`, `page` | `{ success: true, interactions: [...] }` |
| `/interactions` | POST | Save a new interaction (teacher adds question) | `{ book, page, interaction }` | None | `{ success: true, interaction: { id, createdAt, ...interaction } }` |
| `/interactions/:id` | PUT | Update an existing interaction | `{ book, page, updates }` | None | `{ success: true, interaction: { ... } }` |
| `/interactions/:id` | DELETE | Delete an interaction | None | `book`, `page` | `{ success: true }` |
| `/answers` | POST | Save student answer | `{ studentId, interactionId, answer, book?, page? }` | None | `{ success: true }` |
| `/answers` | GET | Get student answers for a page | None | `studentId`, `book`, `page` | `{ success: true, answers: { ... } }` |
| `/all` | GET | Get all data (for teacher dashboard) | None | None | `{ success: true, data: { interactions: {}, answers: {} } }` |

**Notes:**
- Interactions are stored per book and page combination
- Answers are tracked per student per interaction
- Data is stored in JSON file (`server/data/book_interactions.json`)

---

---

## 🔒 Admin (`/api/admin`)

**Authentication:** Admin credentials are **not** stored in the database. They are configured in code or in `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). After login, send the JWT in the header: `Authorization: Bearer <token>` for all admin CRUD endpoints.

| Endpoint | Method | Auth | Purpose | Request Body | Response |
|----------|--------|------|---------|--------------|----------|
| `/login` | POST | No | Admin login | `{ email, password }` | `{ success: true, token, admin: { email, role: "admin" } }` |
| `/logout` | POST | No | Admin logout (client clears token) | None | `{ success: true, message: "..." }` |
| `/units` | GET | Yes | List all units (optional `?grade_level=`) | None | `{ success: true, data: [...] }` |
| `/units` | POST | Yes | Create unit | `{ grade_level, unit_number, unit_title, unit_description? }` | `{ success: true, data: { unit_id, ... } }` |
| `/units/:id` | PUT | Yes | Update unit | `{ grade_level?, unit_number?, unit_title, unit_description? }` | `{ success: true }` |
| `/units/:id` | DELETE | Yes | Delete unit | None | `{ success: true }` |
| `/lessons` | GET | Yes | List lessons (optional `?unit_id=`, `?grade_level=`) | None | `{ success: true, data: [...] }` |
| `/lessons` | POST | Yes | Create lesson | `{ unit_id, grade_level?, lesson_number, lesson_title, lesson_description?, video_url?, lesson_steps? }` | `{ success: true, data: { lesson_id, ... } }` |
| `/lessons/:id` | PUT | Yes | Update lesson | Same fields as POST | `{ success: true }` |
| `/lessons/:id` | DELETE | Yes | Delete lesson | None | `{ success: true }` |
| `/quizzes` | GET | Yes | List quizzes (optional `?lesson_id=`, `?unit_id=`) | None | `{ success: true, data: [...] }` |
| `/quizzes` | POST | Yes | Create quiz for a lesson | `{ grade_level?, unit_id, lesson_id }` | `{ success: true, data: { quiz_id, ... } }` |
| `/quizzes/:quizId/questions` | GET | Yes | Get questions for a quiz | None | `{ success: true, data: [{ question_id, question_text, answers: [...], ... }, ...] }` |
| `/quizzes/:quizId/questions` | POST | Yes | Add question (e.g. multiple choice) | `{ question_type, question_text, correct_answer?, answers?: [{ answer_text, is_correct }] }` | `{ success: true, data: { question_id, quiz_id } }` |
| `/quizzes/questions/:questionId` | DELETE | Yes | Delete a question | None | `{ success: true }` |

**Admin pages:** `/admin-login.html`, `/admin-dashboard.html`. See `docs/Admin Only.md` for default credentials.

---

## 🌐 Health Check (`/api/health`)

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/` | GET | Verify server is running | None | `{ status: "OK", message: "LearnWithTaa API is running", timestamp: "...", version: "1.0.0" }` |

---

## 📋 Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Optional success message",
  "data": { ... } // or "user", "class", "classes", etc.
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "error": "Detailed error message (development only)"
}
```

## 🔒 Authentication & Authorization

- **Regular users (students/teachers):** Login via `/api/auth/login`; credentials are in the `users` table. No Bearer token is required for most public endpoints currently.
- **Admin:** Login via `/api/admin/login` with email/password from `.env` (see `docs/Admin Only.md`). All `/api/admin/*` CRUD routes (units, lessons, quizzes, questions) require the JWT in `Authorization: Bearer <token>`.
- User type validation is performed for certain operations (e.g., only teachers can create classes).

## 📝 Notes

- All timestamps are in ISO 8601 format
- Grade levels are integers between 1 and 10
- Email addresses must be unique across the system
- Class enrollment automatically updates capacity counters
- Book interactions use a file-based storage system (JSON)

---

**Last Updated:** February 2026 (admin API, auth notes, admin-only endpoints documented)
