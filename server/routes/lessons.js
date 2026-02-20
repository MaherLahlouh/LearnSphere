const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET lessons by unit ID
router.get('/unit/:unitId', async (req, res) => {
    try {
        console.log('📖 [LESSONS API] Fetching lessons for unit:', req.params.unitId);
        
        const [lessons] = await db.query(
            `SELECT 
                lesson_id,
                unit_id,
                grade_level,
                lesson_number,
                lesson_title as title,
                lesson_description as description,
                video_url,
                book_pages,
                page_range_start as page_start,
                page_range_end as page_end,
                lesson_steps,
                is_active,
                created_at
            FROM lessons
            WHERE unit_id = ?
            ORDER BY lesson_number ASC`,
            [req.params.unitId]
        );

        console.log('✅ [LESSONS API] Found', lessons.length, 'lessons');
        
        res.json(lessons);
        
    } catch (error) {
        console.error('❌ [LESSONS API] Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch lessons',
            error: error.message 
        });
    }
});

// GET /api/lessons/grade/:grade - all lessons for a grade
router.get('/grade/:grade', async (req, res) => {
    try {
        console.log('📖 [LESSONS API] Fetching lessons for grade:', req.params.grade);
        
        const [lessons] = await db.query(
            `SELECT 
                lesson_id,
                unit_id,
                grade_level,
                lesson_number,
                lesson_title as title,
                lesson_description as description,
                video_url,
                book_pages,
                page_range_start as page_start,
                page_range_end as page_end,
                lesson_steps,
                is_active,
                created_at
            FROM lessons
            WHERE grade_level = ?
            ORDER BY lesson_number ASC`,
            [req.params.grade]
        );

        console.log('✅ [LESSONS API] Found', lessons.length, 'lessons');
        
        res.json(lessons);
        
    } catch (error) {
        console.error('❌ [LESSONS API] Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch lessons',
            error: error.message 
        });
    }
});

// GET single lesson by ID
router.get('/:lessonId', async (req, res) => {
    try {
        console.log('📖 [LESSONS API] Fetching lesson:', req.params.lessonId);
        
        const [lessons] = await db.query(
            `SELECT 
                lesson_id,
                unit_id,
                grade_level,
                lesson_number,
                lesson_title as title,
                lesson_description as description,
                video_url,
                book_pages,
                page_range_start as page_start,
                page_range_end as page_end,
                lesson_steps,
                is_active,
                created_at
            FROM lessons
            WHERE lesson_id = ?`,
            [req.params.lessonId]
        );

        if (lessons.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Lesson not found' 
            });
        }

        console.log('✅ [LESSONS API] Lesson found');
        
        res.json(lessons[0]);
        
    } catch (error) {
        console.error('❌ [LESSONS API] Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch lesson',
            error: error.message 
        });
    }
});
//Export Statement.
module.exports = router;