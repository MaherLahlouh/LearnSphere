# LearnWithTaa Project Structure

This document outlines the directory structure of the LearnWithTaa project, providing a clear overview of where to find different parts of the application.

```
/
├── client/
│   ├── css/
│   ├── js/
│   ├── pages/
│   ├── icons/
│   ├── lang/
│   └── books/
│
├── server/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── data/
│   └── app.js
│
├── docs/
├── pdfs/
├── .env
├── package.json
└── package-lock.json
```

### Root Directory

-   **`client/`**: Contains all frontend code and static assets that are served to the user's browser.
-   **`server/`**: Contains the backend Node.js and Express application, including API routes, configuration, and middleware.
-   **`docs/`**: Contains project documentation files including API documentation, database structure, and project notes.
-   **`pdfs/`**: Stores PDF files used by the application.
-   **`.env`**: Environment variables configuration file for sensitive data like database credentials and API keys.
-   **`package.json`**: Node.js project configuration file defining dependencies and scripts.
-   **`package-lock.json`**: Locked dependency versions for consistent installations.

---

### `/client`

The client directory houses all the assets that make up the user interface.

-   **`css/`**: Contains all CSS stylesheets for styling the application.
    -   `Book_viewer.css`, `course-details.css`, `dashboard.css`, `dark-mode.css`, `landing_page.css`, `lesson.css`, `login.css`, `signup.css`, `teacher_courses.css`, `teacher-create-class.css`, `teacher-dashboard.css`, `teacher-dashboard-styles.css`, `units.css`
    -   `loading-animations.css`, `mobile-menu.css`, `print-styles.css`, `toast-notifications.css`

-   **`js/`**: Contains all client-side JavaScript files.
    -   `dashboard.js`, `teacher-dashboard.js`, `teacher-dashboard-loader.js`: Logic for student and teacher dashboards.
    -   `login.js`, `signup.js`: Handles user authentication logic.
    -   `lesson.js`, `units.js`: Core logic for displaying lessons and units.
    -   `book_viewer.js`: Handles book viewing functionality.
    -   `course-details.js`: Manages course detail pages.
    -   `teacher_courses.js`, `teacher-create-class.js`: Teacher course management functionality.
    -   `dark-mode.js`: Dark mode toggle functionality.
    -   `landing_page.js`: Landing page interactions.
    -   `mobile-menu.js`, `mobile-gestures.js`: Mobile navigation and gesture handling.
    -   `toast-notifications.js`: Toast notification system.

-   **`pages/`**: Contains the main HTML files of the application.
    -   `landing_page.html`, `dashboard.html`, `login.html`, `sign_up.html`
    -   `lesson.html`, `units.html`, `Course-details.html`
    -   `teacher_dashboard.html`, `teacher_courses.html`, `teacher-create-class.html`
    -   `book_viewer.html`, `toast_test_ai.html`

-   **`icons/`**: Stores icon images and logos.
    -   Social media icons (facebook.png, google.png, instagram.png, linkedin.png, whatsapp.png)
    -   Application icons (logo_al_manhal.jpeg, logout.png, location.png, img.png)

-   **`lang/`**: Contains JSON files for internationalization (i18n) and language translations.
    -   `en.json`: English translations
    -   `ar.json`: Arabic translations

-   **`books/`**: Contains book-related images and assets.
    -   Book images (16.jpg, 17.jpg, 18.jpg)
    -   Device icons (headphone.png, keyboard.png, laptop.png, mouse.png, printer.png, scanner.png, screen.png, small_printer.png)

---

### `/server`

The server directory contains the backend logic built with Node.js and Express.

-   **`app.js`**: The main entry point for the server. It initializes Express, sets up static file serving, and starts the server.

-   **`config/`**: Configuration files for the server.
    -   `database.js`: Sets up the connection to the MySQL database.

-   **`middleware/`**: Custom Express middleware.
    -   `auth.js`: Middleware for handling user authentication and token verification.

-   **`routes/`**: Defines the API endpoints for the application.
    -   `auth.js`: Routes for user registration and login.
    -   `users.js`: API routes for user management.
    -   `teachers.js`: API routes for teacher management.
    -   `classes.js`: API routes for class management.
    -   `Quizzes.js`: Dynamically serves quiz content from a database instead of hardcoding questions in the frontend or backend logic.
    -   `Units.js`: Dynamically serves the entire curriculum structure (units, lessons, steps) from a database instead of hardcoding educational content. It's the content backbone that pairs with the quiz system to create a fully dynamic learning platform.
    -   `lessons.js`: API routes for lesson management.
    -   `enrollments.js`: API routes for student enrollment management.
    -   `book_interactions.js`: API routes for book interaction tracking.
    -   `teacher_courses.js`: API routes for teacher course management.

-   **`data/`**: Contains data files used by the server.
    -   `book_interactions.json`: Stores book interaction data.

---

### `/docs`

Documentation directory containing project documentation files.

-   `Project_Structure.md`: This file - outlines the project structure.
-   `Database_Structure.md`: Database schema and structure documentation.
-   `API Endpoints Documentation.md`: API endpoint documentation.
-   `new_files_names_and_purposes_2_5_2026.md`: Notes about new files and their purposes.

---

### `/pdfs`

Directory containing PDF files used by the application for educational content or documentation.
