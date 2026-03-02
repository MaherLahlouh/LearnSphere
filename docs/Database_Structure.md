# Learning Platform Database Schema

## Overview

The **`learning_platform`** database (MySQL/MariaDB) supports an educational LMS with **students** and **teachers**. It covers users, classes, enrollments, units, lessons, quizzes, progress, and notifications.

**Admin accounts are not stored in this database.** Admin login uses credentials from the application (hardcoded or `.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`). See `docs/Admin Only.md` and `SUMMARY.md` for admin access.

This document describes the schema as used by the application. Table and column names match the current codebase (e.g. **`quiz_questions`** uses **`question_id`**, **`unit_id_ref`**, **`lesson_id_ref`**).

---

## Tables (as used in the application)

### 1. `users`
Central table for all users (students and teachers). **Does not include admin;** admin login is separate (see `docs/Admin Only.md`).

- **Key fields:** `user_id` (PK), `user_type` (`student` | `teacher`) or `role`, `grade_level` (students), `specialization`, `qualifications`, `experience_years` (teachers), `is_active`, `is_verified`, `email`, `first_name`, `last_name`, etc.
- **Password:** The app supports either `password_hash` or `password` column (bcrypt-hashed). Login uses whichever is present.

---

### 2. `classes`
Classrooms managed by teachers.

- **Key fields:** `class_id` (PK), `teacher_id` (FK → users), `grade_level`, `subject`, `max_capacity`, `current_enrollment`, etc.

---

### 3. `courses`
Structured learning content (independent of a specific class).

- **Key fields:** `course_id` (PK), `title`, `description`, `category`, `level`, `duration_hours`, `total_lessons`, etc.

---

### 4. `units`
Curriculum units per grade (bilingual).

- **Key fields:** `unit_id` (PK), `grade_level`, `unit_number`, `unit_title_en`, `unit_title_ar`, `unit_description_en`, `unit_description_ar`.
- **Unique:** `(grade_level, unit_number)`.

---

### 5. `lessons`
Lesson content within a unit.

- **Key fields:** `lesson_id` (PK), `unit_id` (FK), `grade_level`, `unit_number`, `lesson_number`, `title` / `lesson_title`, `description` / `lesson_description`, `video_url`, `book_pages`, `page_range_start`, `page_range_end`, `lesson_steps` (JSON or separate `lesson_steps` table), `is_active`, etc.
- **Unique:** `(unit_id, lesson_number)` (or equivalent).

---

### 6. `lesson_steps`
Steps for a lesson (when not stored as JSON in `lessons`).

- **Key fields:** `lesson_id` (FK), `step_order`, `heading`, `content`.

---

### 7. `quizzes`
One quiz per lesson.

- **Key fields:** `quiz_id` (PK), `grade_level`, `unit_id`, `lesson_id`, `is_active`, `created_at`, `updated_at`.
- **Unique:** e.g. `lesson_id` (one quiz per lesson).

---

### 8. `quiz_questions`
Questions for a quiz. **Column names used by the app:**

| Column | Type | Notes |
|--------|------|--------|
| `question_id` | INT, PK, AUTO_INCREMENT | Primary key (not `id`) |
| `quiz_id` | INT | FK to `quizzes` (optional depending on usage) |
| `grade` | TINYINT, NULL | Grade level |
| `unit_id_ref` | INT, NULL | Unit reference (**not** `unit_id`) |
| `lesson_id_ref` | INT, NULL | Lesson reference (**not** `lesson_id`) |
| `question_type` | ENUM | `'multiple-choice'`, `'image-selection'`, `'drag-drop'`, `'matching'` |
| `question_text` | TEXT | Question text |
| `question_order` | INT | Display order |
| `correct_answer` | INT, NULL | Index or reference for correct answer |
| `question_data` | LONGTEXT, NULL | Optional JSON for extra data |
| `explanation` | TEXT, NULL | Shown after answering |
| `language` | VARCHAR(5) | e.g. `'en'`, default `'en'` |
| `created_at`, `updated_at` | DATETIME | Timestamps |

- Queries use **`unit_id_ref`** and **`lesson_id_ref`** in `WHERE` and in `INSERT` (not `unit_id` / `lesson_id`).

---

### 9. `quiz_answers`
Answers (and matching pairs) for a question.

- **Key fields:** `answer_id` (PK), `question_id` (FK → quiz_questions), `answer_order`, `answer_text`, `image_url`, `label`, `is_correct`.
- Used for: multiple-choice (text + `is_correct`), image-selection (image_url, label, is_correct), matching (answer_text = left, label = right).

---

### 10. `drag_drop_items`
Items for drag-drop questions.

- **Key fields:** `question_id` (FK), `item_order`, `item_text`, `correct_category`.

---

### 11. `drop_zones`
Drop zones for drag-drop questions.

- **Key fields:** `question_id` (FK), `zone_order`, `zone_identifier`, `zone_label`.

---

### 12. `quiz_attempts`
Student quiz attempts (if used).

- **Key fields:** `user_id`, `quiz_id`, `lesson_id`, `score`, `total_questions`, `is_completed`, `attempt_data` (JSON), timestamps.

---

### 13. `enrollments`
Student enrollment in classes.

- **Key fields:** `class_id`, `student_id` (→ users), `student_class_id` (optional). Unique on `(class_id, student_id)`.

---

### 14. `teacher_course_enrollments`
Teacher–course assignment.

- **Key fields:** `teacher_id`, `course_id`, `status`, `progress_percent`, timestamps. Unique on `(teacher_id, course_id)`.

---

### 15. `student_lesson_progress` / `user_progress`
Lesson completion and progress.

- **student_lesson_progress:** `user_id`, `unit_id`, `lesson_id`, `is_completed`, `completed_at`.
- **user_progress:** Used by Quizzes route: `user_id`, `grade`, `unit_number`, `lesson_number`, `completed`, `completed_at`. Unique per user/grade/unit/lesson.

---

### 16. `notifications`
User notifications.

- **Key fields:** `user_id`, `title`, `message`, `type`, `is_read`, `created_at`.

---

## Relationships (summary)

```
users
 ├── classes (teacher_id)
 ├── enrollments (student_id)
 ├── teacher_course_enrollments (teacher_id)
 ├── quiz_attempts (user_id)
 ├── student_lesson_progress / user_progress (user_id)
 └── notifications (user_id)

classes ── enrollments (class_id)

units ── lessons (unit_id)

lessons
 ├── quizzes (lesson_id)
 ├── quiz_attempts (lesson_id)
 └── student_lesson_progress (lesson_id)

quizzes
 ├── quiz_questions (quiz_id – optional in current app)
 └── quiz_attempts (quiz_id)

quiz_questions
 ├── quiz_answers (question_id)
 ├── drag_drop_items (question_id)
 └── drop_zones (question_id)
```

---

## Application usage notes

- **Quiz questions** are keyed by **grade**, **unit_id_ref**, and **lesson_id_ref** in `quiz_questions` for the GET and POST quiz endpoints.
- **Primary key** for `quiz_questions` is **`question_id`** (used in SELECT and DELETE).
- **Units** and **lessons** are fetched via `Units.js` (by grade and unit number); lessons may expose `lesson_id` and `lesson_number` for linking to quizzes.
- **Bilingual** content is supported in `units` (e.g. `unit_title_en`, `unit_title_ar`).

---

*Last updated: admin noted as out-of-DB; users table password column flexibility; Quizzes/Units/Admin routes.*
