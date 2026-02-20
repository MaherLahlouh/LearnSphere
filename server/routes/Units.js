const express = require('express');
const router = express.Router();
const db = require('../config/database');

/*
GET /api/units/:grade
 Get all units for a specific grade
 */
router.get('/:grade', async (req, res) => {
    try {
        const { grade } = req.params;

        // Return BOTH English and Arabic fields
        const [units] = await db.execute(
            `SELECT 
                unit_id, 
                unit_number, 
                unit_title_en, 
                unit_title_ar,
                unit_description_en,
                unit_description_ar
             FROM units
             WHERE grade_level = ?
             ORDER BY unit_number ASC`,
            [grade]
        );

        res.json({
            success: true,
            data: units.map(unit => ({
                unit_id: unit.unit_id,
                unit_number: unit.unit_number,
                title: {
                    en: unit.unit_title_en,
                    ar: unit.unit_title_ar
                },
                description: {
                    en: unit.unit_description_en,
                    ar: unit.unit_description_ar
                }
            }))
        });

    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching units',
            error: error.message
        });
    }
});

// GET /api/units/:grade/:unitNumber/lessons - all lessons in a unit
router.get('/:grade/:unitNumber/lessons', async (req, res) => {
    try {
        const { grade, unitNumber } = req.params;

        // Get lessons
        const [lessons] = await db.execute(
            `SELECT lesson_id, lesson_number, title, description, 
                    video_url, book_pages, page_range_start, page_range_end
             FROM lessons
             WHERE grade = ? AND unit_number = ?
             ORDER BY lesson_number ASC`,
            [grade, unitNumber]
        );

        const lessonsWithSteps = await Promise.all(lessons.map(async (lesson) => {
            const [steps] = await db.execute(
                `SELECT heading, content
                 FROM lesson_steps
                 WHERE lesson_id = ?
                 ORDER BY step_order ASC`,
                [lesson.lesson_id]
            );

            return {
                id: lesson.lesson_number,
                title: lesson.title,
                desc: lesson.description,
                video: lesson.video_url,
                bookPages: lesson.book_pages,
                pageRange: {
                    start: lesson.page_range_start,
                    end: lesson.page_range_end
                },
                steps: steps.map(step => ({
                    heading: step.heading,
                    text: step.content
                }))
            };
        }));

        res.json({
            success: true,
            data: lessonsWithSteps
        });

    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lessons',
            error: error.message
        });
    }
});

// GET /api/units/:grade/:unitNumber/lessons/:lessonNumber - one lesson with steps
router.get('/:grade/:unitNumber/lessons/:lessonNumber', async (req, res) => {
    try {
        const { grade, unitNumber, lessonNumber } = req.params;

        // Get lesson
        const [lessons] = await db.execute(
            `SELECT lesson_id, lesson_number, title, description, 
                    video_url, book_pages, page_range_start, page_range_end
             FROM lessons
             WHERE grade = ? AND unit_number = ? AND lesson_number = ?`,
            [grade, unitNumber, lessonNumber]
        );

        if (lessons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const lesson = lessons[0];

        // Get steps
        const [steps] = await db.execute(
            `SELECT heading, content
             FROM lesson_steps
             WHERE lesson_id = ?
             ORDER BY step_order ASC`,
            [lesson.lesson_id]
        );

        const lessonData = {
            id: lesson.lesson_number,
            title: lesson.title,
            desc: lesson.description,
            video: lesson.video_url,
            bookPages: lesson.book_pages,
            pageRange: {
                start: lesson.page_range_start,
                end: lesson.page_range_end
            },
            steps: steps.map(step => ({
                heading: step.heading,
                text: step.content
            }))
        };

        res.json({
            success: true,
            data: lessonData
        });

    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lesson',
            error: error.message
        });
    }
});

// POST /api/units - create a new unit (admin)
router.post('/', async (req, res) => {
    try {
        const { grade, unitNumber, title, description } = req.body;

        if (!grade || !unitNumber || !title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: grade, unitNumber, title'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO units (grade, unit_number, title, description)
             VALUES (?, ?, ?, ?)`,
            [grade, unitNumber, title, description || null]
        );

        res.status(201).json({
            success: true,
            message: 'Unit created successfully',
            data: {
                unitId: result.insertId,
                grade,
                unitNumber,
                title
            }
        });

    } catch (error) {
        console.error('Error creating unit:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Unit already exists for this grade'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating unit',
            error: error.message
        });
    }
});

// POST /api/units/:grade/:unitNumber/lessons - create a new lesson (admin)
router.post('/:grade/:unitNumber/lessons', async (req, res) => {
    try {
        const { grade, unitNumber } = req.params;
        const { 
            lessonNumber, 
            title, 
            description, 
            videoUrl, 
            bookPages, 
            pageRangeStart, 
            pageRangeEnd,
            steps 
        } = req.body;

        if (!lessonNumber || !title) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: lessonNumber, title'
            });
        }

        const [units] = await db.execute(
            `SELECT unit_id FROM units WHERE grade = ? AND unit_number = ?`,
            [grade, unitNumber]
        );

        if (units.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        const unitId = units[0].unit_id;

        const [result] = await db.execute(
            `INSERT INTO lessons (unit_id, grade, unit_number, lesson_number, title, description, 
                                 video_url, book_pages, page_range_start, page_range_end)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [unitId, grade, unitNumber, lessonNumber, title, description || null, 
             videoUrl || null, bookPages || null, pageRangeStart || null, pageRangeEnd || null]
        );

        const lessonId = result.insertId;

        if (steps && Array.isArray(steps) && steps.length > 0) {
            const stepValues = steps.map((step, index) => [
                lessonId,
                index + 1,
                step.heading,
                step.text || step.content
            ]);

            await db.query(
                `INSERT INTO lesson_steps (lesson_id, step_order, heading, content)
                 VALUES ?`,
                [stepValues]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: {
                lessonId,
                lessonNumber,
                title
            }
        });

    } catch (error) {
        console.error('Error creating lesson:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Lesson already exists for this unit'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating lesson',
            error: error.message
        });
    }
});
module.exports = router;