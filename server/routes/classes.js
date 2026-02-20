// const express = require('express');
// const router = express.Router();

// // Get all classes
// // GET /api/classes
// router.get('/', (req, res) => {
//     res.json([
//         { id: 101, name: 'Grade 1 - Math' },
//         { id: 102, name: 'Grade 2 - Science' }
//     ]);
// });

// // Create a new class
// router.post('/', (req, res) => {
//     console.log('Creating class:', req.body);
//     res.json({ message: 'Class created successfully' });
// });

// module.exports = router;

// const express = require('express');
// const router = express.Router();
// const db = require('../config/database');

// // GET ALL CLASSES
// router.get('/', async (req, res) => {
//     try {
//         const [classes] = await db.query(
//             `SELECT 
//                 c.*,
//                 u.first_name AS teacher_first_name,
//                 u.last_name AS teacher_last_name,
//                 (c.max_capacity - c.current_enrollment) AS seats_available
//             FROM classes c
//             JOIN users u ON c.teacher_id = u.user_id
//             ORDER BY c.created_at DESC`
//         );

//         res.json({
//             success: true,
//             classes: classes
//         });
//     } catch (error) {
//         console.error('Get classes error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to fetch classes',
//             error: error.message 
//         });
//     }
// });

// // GET CLASSES BY TEACHER ID
// router.get('/teacher/:teacherId', async (req, res) => {
//     try {
//         const [classes] = await db.query(
//             `SELECT 
//                 c.*,
//                 (c.max_capacity - c.current_enrollment) AS seats_available
//             FROM classes c 
//             WHERE c.teacher_id = ?
//             ORDER BY c.created_at DESC`,
//             [req.params.teacherId]
//         );

//         res.json({
//             success: true,
//             classes: classes
//         });
//     } catch (error) {
//         console.error('Get teacher classes error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to fetch classes' 
//         });
//     }
// });

// // CREATE A NEW CLASS
// router.post('/', async (req, res) => {
//     try {
//         const { 
//             teacherId, 
//             className, 
//             gradeLevel, 
//             subject, 
//             description, 
//             maxCapacity 
//         } = req.body;

//         // Validation
//         if (!teacherId || !className || !gradeLevel || !subject) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Missing required fields: teacherId, className, gradeLevel, subject' 
//             });
//         }

//         if (gradeLevel < 1 || gradeLevel > 10) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Grade level must be between 1 and 10' 
//             });
//         }

//         // Verify teacher exists
//         const [teachers] = await db.query(
//             'SELECT user_id FROM users WHERE user_id = ? AND user_type = "teacher"',
//             [teacherId]
//         );

//         if (teachers.length === 0) {
//             return res.status(403).json({ 
//                 success: false,
//                 message: 'Only teachers can create classes. User not found or not a teacher.' 
//             });
//         }

//         // Insert class
//         const [result] = await db.query(
//             `INSERT INTO classes 
//             (teacher_id, class_name, grade_level, subject, description, max_capacity)
//             VALUES (?, ?, ?, ?, ?, ?)`,
//             [
//                 teacherId,
//                 className,
//                 parseInt(gradeLevel),
//                 subject,
//                 description || null,
//                 maxCapacity ? parseInt(maxCapacity) : 30
//             ]
//         );

//         // Get created class with teacher info
//         const [classes] = await db.query(
//             `SELECT 
//                 c.*,
//                 u.first_name AS teacher_first_name,
//                 u.last_name AS teacher_last_name,
//                 (c.max_capacity - c.current_enrollment) AS seats_available
//             FROM classes c
//             JOIN users u ON c.teacher_id = u.user_id
//             WHERE c.class_id = ?`,
//             [result.insertId]
//         );

//         res.status(201).json({ 
//             success: true,
//             message: 'Class created successfully!',
//             class: classes[0] 
//         });

//     } catch (error) {
//         console.error('Create class error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to create class',
//             error: error.message 
//         });
//     }
// });

// // GET CLASS STUDENTS
// router.get('/:classId/students', async (req, res) => {
//     try {
//         const [students] = await db.query(
//             `SELECT 
//                 u.user_id,
//                 u.first_name,
//                 u.last_name,
//                 u.email,
//                 u.grade_level,
//                 e.student_class_id,
//                 e.enrolled_at
//             FROM enrollments e
//             JOIN users u ON e.student_id = u.user_id
//             WHERE e.class_id = ?
//             ORDER BY u.last_name, u.first_name`,
//             [req.params.classId]
//         );

//         res.json({
//             success: true,
//             students: students
//         });
//     } catch (error) {
//         console.error('Get students error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to fetch students' 
//         });
//     }
// });

// // ENROLL STUDENT IN CLASS
// router.post('/enroll', async (req, res) => {
//     try {
//         const { classId, studentEmail, studentClassId } = req.body;

//         // Validation
//         if (!classId || !studentEmail) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Missing required fields: classId, studentEmail' 
//             });
//         }

//         // Get student by email
//         const [students] = await db.query(
//             'SELECT user_id FROM users WHERE email = ? AND user_type = "student" AND is_active = TRUE',
//             [studentEmail]
//         );

//         if (students.length === 0) {
//             return res.status(404).json({ 
//                 success: false,
//                 message: 'Student not found with this email. Please check the email address.' 
//             });
//         }

//         const studentId = students[0].user_id;

//         // Check class capacity
//         const [classes] = await db.query(
//             'SELECT class_id, max_capacity, current_enrollment FROM classes WHERE class_id = ?',
//             [classId]
//         );

//         if (classes.length === 0) {
//             return res.status(404).json({ 
//                 success: false,
//                 message: 'Class not found' 
//             });
//         }

//         const classData = classes[0];

//         if (classData.current_enrollment >= classData.max_capacity) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Class is full. Maximum capacity reached.' 
//             });
//         }

//         // Check if already enrolled
//         const [existing] = await db.query(
//             'SELECT enrollment_id FROM enrollments WHERE class_id = ? AND student_id = ?',
//             [classId, studentId]
//         );

//         if (existing.length > 0) {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Student is already enrolled in this class' 
//             });
//         }

//         // Enroll student
//         await db.query(
//             'INSERT INTO enrollments (class_id, student_id, student_class_id) VALUES (?, ?, ?)',
//             [classId, studentId, studentClassId || null]
//         );

//         // Update enrollment count
//         await db.query(
//             'UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE class_id = ?',
//             [classId]
//         );

//         res.json({ 
//             success: true,
//             message: 'Student enrolled successfully!' 
//         });

//     } catch (error) {
//         console.error('Enroll error:', error);
        
//         // Handle duplicate enrollment gracefully
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({ 
//                 success: false,
//                 message: 'Student already enrolled in this class' 
//             });
//         }
        
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to enroll student',
//             error: error.message 
//         });
//     }
// });

// // GET STUDENT'S CLASSES
// router.get('/student/:studentId', async (req, res) => {
//     try {
//         const [classes] = await db.query(
//             `SELECT 
//                 c.*,
//                 u.first_name AS teacher_first_name,
//                 u.last_name AS teacher_last_name,
//                 e.enrolled_at,
//                 e.student_class_id
//             FROM enrollments e
//             JOIN classes c ON e.class_id = c.class_id
//             JOIN users u ON c.teacher_id = u.user_id
//             WHERE e.student_id = ?
//             ORDER BY c.created_at DESC`,
//             [req.params.studentId]
//         );

//         res.json({
//             success: true,
//             classes: classes
//         });
//     } catch (error) {
//         console.error('Get student classes error:', error);
//         res.status(500).json({ 
//             success: false,
//             message: 'Failed to fetch student classes' 
//         });
//     }
// });

// module.exports = router;
//The Above code can be deleted after checking if everything is working correctly and without any issues.
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET ALL CLASSES
router.get('/', async (req, res) => {
    try {
        const [classes] = await db.query(
            `SELECT 
                c.*,
                u.first_name AS teacher_first_name,
                u.last_name AS teacher_last_name,
                (c.max_capacity - c.current_enrollment) AS seats_available
            FROM classes c
            JOIN users u ON c.teacher_id = u.user_id
            ORDER BY c.created_at DESC`
        );

        res.json({
            success: true,
            classes: classes
        });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch classes',
            error: error.message 
        });
    }
});

// GET /api/classes/teacher/:teacherId - classes for one teacher
router.get('/teacher/:teacherId', async (req, res) => {
    try {
        const [classes] = await db.query(
            `SELECT 
                c.*,
                (c.max_capacity - c.current_enrollment) AS seats_available
            FROM classes c 
            WHERE c.teacher_id = ?
            ORDER BY c.created_at DESC`,
            [req.params.teacherId]
        );

        res.json({
            success: true,
            classes: classes
        });
    } catch (error) {
        console.error('Get teacher classes error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch classes' 
        });
    }
});

// GET /api/classes/student/:studentId - classes a student is enrolled in
router.get('/student/:studentId', async (req, res) => {
    try {
        const [classes] = await db.query(
            `SELECT 
                c.*,
                u.first_name AS teacher_first_name,
                u.last_name AS teacher_last_name,
                e.enrolled_at,
                e.student_class_id
            FROM enrollments e
            JOIN classes c ON e.class_id = c.class_id
            JOIN users u ON c.teacher_id = u.user_id
            WHERE e.student_id = ?
            ORDER BY c.created_at DESC`,
            [req.params.studentId]
        );

        res.json({
            success: true,
            classes: classes
        });
    } catch (error) {
        console.error('Get student classes error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch student classes' 
        });
    }
});

router.get('/:classId/students', async (req, res) => {
    try {
        const [students] = await db.query(
            `SELECT 
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.grade_level,
                e.student_class_id,
                e.enrolled_at
            FROM enrollments e
            JOIN users u ON e.student_id = u.user_id
            WHERE e.class_id = ?
            ORDER BY u.last_name, u.first_name`,
            [req.params.classId]
        );

        res.json({
            success: true,
            students: students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch students' 
        });
    }
});

router.get('/:classId', async (req, res) => {
    try {
        console.log('📚 [API] Fetching class with ID:', req.params.classId);
        
        const [classes] = await db.query(
            `SELECT 
                c.*,
                u.first_name AS teacher_first_name,
                u.last_name AS teacher_last_name,
                (c.max_capacity - c.current_enrollment) AS seats_available
            FROM classes c
            JOIN users u ON c.teacher_id = u.user_id
            WHERE c.class_id = ?`,
            [req.params.classId]
        );

        if (classes.length === 0) {
            console.log('❌ [API] Class not found with ID:', req.params.classId);
            return res.status(404).json({ 
                success: false,
                message: 'Class not found' 
            });
        }

        console.log('✅ [API] Class found:', classes[0]);
        res.json({
            success: true,
            class: classes[0]
        });
    } catch (error) {
        console.error('❌ [API] Get class error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch class details',
            error: error.message 
        });
    }
});

// CREATE A NEW CLASS
router.post('/', async (req, res) => {
    try {
        const { 
            teacherId, 
            className, 
            gradeLevel, 
            subject, 
            description, 
            maxCapacity 
        } = req.body;

        // Validation
        if (!teacherId || !className || !gradeLevel || !subject) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: teacherId, className, gradeLevel, subject' 
            });
        }

        if (gradeLevel < 1 || gradeLevel > 10) {
            return res.status(400).json({ 
                success: false,
                message: 'Grade level must be between 1 and 10' 
            });
        }

        // Verify teacher exists
        const [teachers] = await db.query(
            'SELECT user_id FROM users WHERE user_id = ? AND user_type = "teacher"',
            [teacherId]
        );

        if (teachers.length === 0) {
            return res.status(403).json({ 
                success: false,
                message: 'Only teachers can create classes. User not found or not a teacher.' 
            });
        }

        // Insert class
        const [result] = await db.query(
            `INSERT INTO classes 
            (teacher_id, class_name, grade_level, subject, description, max_capacity)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                teacherId,
                className,
                parseInt(gradeLevel),
                subject,
                description || null,
                maxCapacity ? parseInt(maxCapacity) : 30
            ]
        );

        // Get created class with teacher info
        const [classes] = await db.query(
            `SELECT 
                c.*,
                u.first_name AS teacher_first_name,
                u.last_name AS teacher_last_name,
                (c.max_capacity - c.current_enrollment) AS seats_available
            FROM classes c
            JOIN users u ON c.teacher_id = u.user_id
            WHERE c.class_id = ?`,
            [result.insertId]
        );

        res.status(201).json({ 
            success: true,
            message: 'Class created successfully!',
            class: classes[0] 
        });

    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to create class',
            error: error.message 
        });
    }
});

// ENROLL STUDENT IN CLASS
router.post('/enroll', async (req, res) => {
    try {
        const { classId, studentEmail, studentClassId } = req.body;

        // Validation
        if (!classId || !studentEmail) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: classId, studentEmail' 
            });
        }

        // Get student by email
        const [students] = await db.query(
            'SELECT user_id FROM users WHERE email = ? AND user_type = "student" AND is_active = TRUE',
            [studentEmail]
        );

        if (students.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found with this email. Please check the email address.' 
            });
        }

        const studentId = students[0].user_id;

        // Check class capacity
        const [classes] = await db.query(
            'SELECT class_id, max_capacity, current_enrollment FROM classes WHERE class_id = ?',
            [classId]
        );

        if (classes.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Class not found' 
            });
        }

        const classData = classes[0];

        if (classData.current_enrollment >= classData.max_capacity) {
            return res.status(400).json({ 
                success: false,
                message: 'Class is full. Maximum capacity reached.' 
            });
        }

        // Check if already enrolled
        const [existing] = await db.query(
            'SELECT enrollment_id FROM enrollments WHERE class_id = ? AND student_id = ?',
            [classId, studentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is already enrolled in this class' 
            });
        }

        // Enroll student
        await db.query(
            'INSERT INTO enrollments (class_id, student_id, student_class_id) VALUES (?, ?, ?)',
            [classId, studentId, studentClassId || null]
        );

        // Update enrollment count
        await db.query(
            'UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE class_id = ?',
            [classId]
        );

        res.json({ 
            success: true,
            message: 'Student enrolled successfully!' 
        });

    } catch (error) {
        console.error('Enroll error:', error);
        
        // Handle duplicate enrollment gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                message: 'Student already enrolled in this class' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Failed to enroll student',
            error: error.message 
        });
    }
});
//Export Statement.
module.exports = router;
