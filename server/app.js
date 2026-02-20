// const express = require('express');
// const path = require('path');
// const cors = require('cors');
// const app = express();


// app.use(cors());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // IMPORT ROUTES
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const teacherRoutes = require('./routes/teachers');
// const classRoutes = require('./routes/classes');
// const enrollmentRoutes = require('./routes/enrollments');
// const lessonRoutes = require('./routes/lessons');
// const unitsRoutes = require('./routes/Units'); // added to  fetch the data from the database

// // CONFIGURATION
// const PORT = process.env.PORT || 3000;
// const ROOT_DIR = path.join(__dirname, '..');

// // STATIC FILES - Serve from 'client' folder
// app.use('/css', express.static(path.join(ROOT_DIR, 'client', 'css')));
// app.use('/js', express.static(path.join(ROOT_DIR, 'client', 'js')));
// app.use('/pages', express.static(path.join(ROOT_DIR, 'client', 'pages')));
// //-----------make the icons appears ----------------------------------
// app.use('/icons', express.static(path.join(ROOT_DIR, 'client', 'icons')));
// //-----------make the languages translation work correctly appears ----------------------------------
// app.use('/lang', express.static(path.join(ROOT_DIR, 'client', 'lang')));
// app.use('/manifest.json', express.static(path.join(ROOT_DIR, 'client', 'manifest.json')));

// // API ROUTES
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/teachers', teacherRoutes);
// app.use('/api/classes', classRoutes);
// app.use('/api/enrollments', enrollmentRoutes);
// app.use('/api/lessons', lessonRoutes);  
// app.use('/api/units', unitsRoutes); // added to fetch the data from the database

// // HEALTH CHECK ENDPOINT
// app.get('/api/health', (req, res) => {
//     res.json({ 
//         status: 'OK', 
//         message: 'LearnWithTaa API is running',
//         timestamp: new Date().toISOString(),
//         version: '1.0.0'
//     });
// });

// // DEFAULT ROUTE: Landing Page
// app.get('/', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'landing_page.html'));
// });

// // SERVE HTML PAGES
// app.get('/login.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'login.html'));
// });

// app.get('/sign_up.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'sign_up.html'));
// });

// app.get('/dashboard.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'dashboard.html'));
// });

// app.get('/lesson.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'lesson.html'));
// });

// app.get('/teacher_dashboard.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'teacher_dashboard.html'));
// });

// app.get('/teacher-create-class.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'teacher-create-class.html'));
// });


// app.get('/course-details.html', (req, res) => {
//        res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'course-details.html'));
//    });
   
// app.get('/class-details.html', (req, res) => {
//        res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'course-details.html'));
//    });

// app.get('/units.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'units.html'));
// });

// app.get('/landing_page.html', (req, res) => {
//     res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'landing_page.html'));
// });

// app.get('/*.html', (req, res) => {
//     const filePath = path.join(ROOT_DIR, 'client', 'pages', req.path);
//     res.sendFile(filePath, (err) => {
//         if (err) {
//             res.status(404).send('Page not found');
//         }
//     });
// });

// app.use((req, res, next) => {
//     res.status(404).json({ 
//         success: false,
//         message: 'Route not found',
//         requestedPath: req.path
//     });
// });

// app.use((err, req, res, next) => {
//     console.error('Server error:', err);
//     res.status(500).json({ 
//         success: false,
//         message: 'Internal server error',
//         error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
// });

// // START SERVER
// app.listen(PORT, () => {
//     console.log('\n╔════════════════════════════════════════════════════════════╗');
//     console.log('║                                                            ║');
//     console.log('║   🚀 LearnWithTaa Server Started Successfully!            ║');
//     console.log('║                                                            ║');
//     console.log(`║   🌐 Server: http://localhost:${PORT}                      ║`);
//     console.log(`║   📡 API:    http://localhost:${PORT}/api/health           ║`);
//     console.log(`║   📁 Login:  http://localhost:${PORT}/login.html           ║`);   
//     console.log('║                                                            ║');
//     console.log('╚════════════════════════════════════════════════════════════╝\n');
// }); 

const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
   

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const enrollmentRoutes = require('./routes/enrollments');
const lessonRoutes = require('./routes/lessons');
const unitsRoutes = require('./routes/Units');
const bookInteractionRoutes = require('./routes/book_interactions'); // ← NEW

// CONFIGURATION
const PORT = process.env.PORT || 3001;
const ROOT_DIR = path.join(__dirname, '..');

// STATIC FILES - Serve from 'client' folder
app.use('/css', express.static(path.join(ROOT_DIR, 'client', 'css')));
app.use('/js', express.static(path.join(ROOT_DIR, 'client', 'js')));
app.use('/pages', express.static(path.join(ROOT_DIR, 'client', 'pages')));
app.use('/icons', express.static(path.join(ROOT_DIR, 'client', 'icons')));
app.use('/lang', express.static(path.join(ROOT_DIR, 'client', 'lang')));
app.use('/manifest.json', express.static(path.join(ROOT_DIR, 'client', 'manifest.json')));
app.use('/books', express.static(path.join(ROOT_DIR, 'client', 'books'))); // ← NEW: serve book images

// API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/units', unitsRoutes);
app.use('/api/book', bookInteractionRoutes); // ← NEW

// Health check - to see if server is up (e.g. for monitoring)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'LearnWithTaa API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Home URL shows landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'landing_page.html'));
});

// Page routes - when user visits /login.html etc we send the right file
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'login.html'));
});

app.get('/sign_up.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'sign_up.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'dashboard.html'));
});

app.get('/lesson.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'lesson.html'));
});

app.get('/teacher_dashboard.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'teacher_dashboard.html'));
});

app.get('/teacher-create-class.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'teacher-create-class.html'));
});

app.get('/course-details.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'course-details.html'));
});
   
app.get('/class-details.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'course-details.html'));
});

app.get('/units.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'units.html'));
});

app.get('/landing_page.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'landing_page.html'));
});

// Book viewer page
app.get('/book_viewer.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'client', 'pages', 'book_viewer.html'));
});

// Any other .html - try to find it in pages folder
app.get('/*.html', (req, res) => {
    const filePath = path.join(ROOT_DIR, 'client', 'pages', req.path);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Page not found');
        }
    });
});

// No route matched - return 404 JSON
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        requestedPath: req.path
    });
});

// Catch errors so the app doesn't crash - send 500 and message
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start listening on PORT
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   LearnWithTaa Server Started Successfully!                ║');
    console.log(`║   Server: http://localhost:${PORT}                          ║`);
    console.log(`║   API:    http://localhost:${PORT}/api/health               ║`);
    console.log(`║   Login:  http://localhost:${PORT}/login.html               ║`);
    console.log(`║   Book:   http://localhost:${PORT}/book_viewer.html         ║`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');
});