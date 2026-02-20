# Learning Platform Database Schema

## Overview

The `learning_platform` database is a structured relational system designed to support an educational platform with two primary user roles: **students** and **teachers**. It manages everything from user accounts and class enrollments to lesson delivery, quizzes, progress tracking, and notifications.

The database consists of 12 tables, each serving a distinct purpose and connected through well-defined foreign key relationships.

---

## Tables and Their Purpose

### 1. `users`
The central table of the entire system. Every person on the platform — whether a student or teacher — has a record here.

Key fields include `user_type` (an enum of `student` or `teacher`), which determines how the rest of the system interacts with that user. Students have a `grade_level`, while teachers have `specialization`, `qualifications`, and `experience_years`. Fields like `is_active` and `is_verified` control access and account status.

---

### 2. `classes`
Represents a classroom managed by a teacher. Each class is assigned to one teacher (`teacher_id`), belongs to a `grade_level`, covers a `subject`, and has a `max_capacity` with a tracked `current_enrollment` count.

---

### 3. `courses`
Represents structured learning content independent of any specific class. A course has a `title`, `description`, `category`, difficulty `level` (beginner / intermediate / advanced), `duration_hours`, and `total_lessons`.

---

### 4. `units`
Courses are divided into units. Each unit belongs to a `grade_level` and is identified by a `unit_number`. Units have bilingual titles and descriptions (`unit_title_en`, `unit_title_ar`, `unit_description_en`, `unit_description_ar`), reflecting support for both English and Arabic content.

A unique constraint on `(grade_level, unit_number)` ensures no duplicate units exist within the same grade.

---

### 5. `lessons`
The core content delivery unit. Each lesson belongs to a `unit_id` and a `grade_level`, and is ordered by `lesson_number`. A lesson can include a `video_url`, reference `book_pages`, a `page_range_start` and `page_range_end`, and detailed `lesson_steps` stored as structured JSON in a `longtext` field.

A unique constraint on `(unit_id, lesson_number)` enforces ordered, non-duplicate lessons within a unit.

---

### 6. `quizzes`
Each lesson can have one associated quiz. The quiz is tied to a `lesson_id`, `unit_id`, and `grade_level`. A unique constraint on `lesson_id` enforces a one-to-one relationship between a lesson and its quiz.

---

### 7. `quiz_questions`
Stores individual questions belonging to a quiz (`quiz_id`). Supports multiple question types via an enum: `multiple-choice`, `image-selection`, `drag-drop`, and others. Each question has a `question_text`, `question_order`, a `correct_answer` reference, optional `question_data` (for complex types stored as JSON), and an `explanation` shown after answering.

---

### 8. `quiz_attempts`
Records every time a student attempts a quiz. Links to the `user_id`, `quiz_id`, and `lesson_id`. Tracks the `score`, `total_questions`, whether the attempt `is_completed`, and stores the full attempt detail in `attempt_data` (JSON). Timestamps capture when the attempt started and completed.

---

### 9. `enrollments`
Manages which students are enrolled in which classes. Each record links a `class_id` to a `student_id`, with a unique constraint on `(class_id, student_id)` to prevent duplicate enrollments. An optional `student_class_id` field allows integration with external student ID systems.

---

### 10. `teacher_course_enrollments`
Tracks which teachers are assigned to which courses, separate from the student enrollment system. Includes a `status` field (`not_started`, `in_progress`, `completed`), a `progress_percent`, and timestamps for enrollment and completion. A unique constraint on `(teacher_id, course_id)` ensures each teacher is assigned to a course only once.

---

### 11. `student_lesson_progress`
Tracks each student's progress through individual lessons. Links `user_id`, `unit_id`, and `lesson_id`, and records whether the lesson `is_completed` along with a `completed_at` timestamp. A unique constraint on `(user_id, lesson_id)` ensures one progress record per student per lesson.

---

### 12. `notifications`
Delivers system messages to users. Each notification has a `user_id`, a `title`, a `message`, a `type` (info, success, warning, alert, assignment, etc.), and an `is_read` flag. Indexed on `user_id`, `is_read`, and `created_at` for efficient querying of unread or recent notifications.

---

## Relationships

```
users
 ├── classes            (teacher_id → users.user_id)
 ├── enrollments        (student_id → users.user_id)
 ├── teacher_course_enrollments (teacher_id → users.user_id)
 ├── quiz_attempts      (user_id → users.user_id)
 ├── student_lesson_progress (user_id → users.user_id)
 └── notifications      (user_id → users.user_id)

classes
 └── enrollments        (class_id → classes.class_id)

courses
 └── teacher_course_enrollments (course_id → courses.course_id)

units
 └── lessons            (unit_id → units.unit_id)

lessons
 ├── quizzes            (lesson_id → lessons.lesson_id)
 ├── quiz_attempts      (lesson_id → lessons.lesson_id)
 └── student_lesson_progress (lesson_id → lessons.lesson_id)

quizzes
 ├── quiz_questions     (quiz_id → quizzes.quiz_id)
 └── quiz_attempts      (quiz_id → quizzes.quiz_id)
```

---

## Data Flow: How It All Works Together

When a **teacher** joins the platform, they are registered in `users` with `user_type = 'teacher'`. They can create a `class` which students enroll in via the `enrollments` table. Teachers are also assigned to `courses` through `teacher_course_enrollments`, where their progress through course material is tracked.

**Students** are registered with `user_type = 'student'` and assigned to a `grade_level`. As they study, they move through `units` and `lessons` within those units. Their completion of each lesson is recorded in `student_lesson_progress`.

At the end of each lesson, students may take a `quiz`. The quiz is composed of `quiz_questions`, and each time a student attempts it, a `quiz_attempts` record is created capturing their responses, score, and completion status.

Throughout the experience, the platform communicates with users through the `notifications` table, which supports a variety of message types to keep users informed of assignments, alerts, and progress updates.

---

## Design Highlights

- **Bilingual support** is built into the `units` table with parallel English and Arabic fields.
- **Flexible quiz types** are supported through the `question_type` enum and the `question_data` JSON field, allowing for multiple-choice, image-based, drag-and-drop, and other interactive formats.
- **Grade-level scoping** appears across `users`, `classes`, `units`, `lessons`, and `quizzes`, ensuring content is always served to the appropriate grade.
- **Audit timestamps** (`created_at`, `updated_at`) are present on all major tables, supporting activity tracking and data integrity.
- **Unique constraints** are used throughout to prevent duplicate enrollments, progress records, and quiz assignments at both the database level.