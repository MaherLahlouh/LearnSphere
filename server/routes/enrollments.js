const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET enrollments for a specific class
router.get('/class/:classId', async (req, res) => {
    try {
        console.log('📝 [ENROLLMENTS API] Fetching enrollments for class:', req.params.classId);
        
        const [enrollments] = await db.query(
            `SELECT 
                e.enrollment_id,
                e.class_id,
                e.student_id as user_id,
                e.enrolled_at,
                u.first_name,
                u.last_name,
                u.email,
                u.grade_level
            FROM enrollments e
            JOIN users u ON e.student_id = u.user_id
            WHERE e.class_id = ?
            ORDER BY e.enrolled_at DESC`,
            [req.params.classId]
        );

        console.log('✅ [ENROLLMENTS API] Found', enrollments.length, 'enrollments');
        
        res.json(enrollments);
        
    } catch (error) {
        console.error('❌ [ENROLLMENTS API] Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch enrollments',
            error: error.message 
        });
    }
});

// POST /api/enrollments - add a student to a class
router.post('/', async (req, res) => {
    try {
        const { class_id, user_id } = req.body;

        console.log('➕ [ENROLLMENTS API] Enrolling student:', user_id, 'in class:', class_id);

        if (!class_id || !user_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: class_id, user_id' 
            });
        }

        // Check if already enrolled
        const [existing] = await db.query(
            'SELECT enrollment_id FROM enrollments WHERE class_id = ? AND student_id = ?',
            [class_id, user_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is already enrolled in this class' 
            });
        }

        // Check class capacity
        const [classes] = await db.query(
            'SELECT max_capacity, current_enrollment FROM classes WHERE class_id = ?',
            [class_id]
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
                message: 'Class is full' 
            });
        }

        // Enroll student
        const [result] = await db.query(
            'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)',
            [class_id, user_id]
        );

        // Update enrollment count
        await db.query(
            'UPDATE classes SET current_enrollment = current_enrollment + 1 WHERE class_id = ?',
            [class_id]
        );

        console.log('✅ [ENROLLMENTS API] Student enrolled successfully');

        res.json({ 
            success: true,
            message: 'Student enrolled successfully',
            enrollment_id: result.insertId
        });

    } catch (error) {
        console.error('❌ [ENROLLMENTS API] Enroll error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to enroll student',
            error: error.message 
        });
    }
});

// DELETE - Unenroll a student from a class
router.delete('/', async (req, res) => {
    try {
        const { class_id, user_id } = req.body;

        console.log('➖ [ENROLLMENTS API] Unenrolling student:', user_id, 'from class:', class_id);

        if (!class_id || !user_id) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields: class_id, user_id' 
            });
        }

        // Delete enrollment
        const [result] = await db.query(
            'DELETE FROM enrollments WHERE class_id = ? AND student_id = ?',
            [class_id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Enrollment not found' 
            });
        }

        // Update enrollment count
        await db.query(
            'UPDATE classes SET current_enrollment = current_enrollment - 1 WHERE class_id = ?',
            [class_id]
        );

        console.log('✅ [ENROLLMENTS API] Student unenrolled successfully');

        res.json({ 
            success: true,
            message: 'Student unenrolled successfully' 
        });

    } catch (error) {
        console.error('❌ [ENROLLMENTS API] Unenroll error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to unenroll student',
            error: error.message 
        });
    }
});
//Export Statement
module.exports = router;