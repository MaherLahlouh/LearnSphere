const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Parse the lessons.lesson_steps column (longtext, typically JSON array).
 * Expects [{ heading, content }] or [{ heading, text }]. Returns array of { heading, text }.
 */
function parseLessonStepsColumn(lessonSteps) {
    if (lessonSteps == null || (typeof lessonSteps === 'string' && lessonSteps.trim() === '')) {
        return [];
    }
    try {
        const parsed = typeof lessonSteps === 'string' ? JSON.parse(lessonSteps) : lessonSteps;
        if (!Array.isArray(parsed)) return [];
        return parsed.map((step) => ({
            heading: step.heading || '',
            text: step.content != null ? step.content : (step.text != null ? step.text : '')
        }));
    } catch {
        return [];
    }
}

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

        // Get lessons: join units; use lessons.lesson_steps column (longtext/JSON), not a separate table
        let [lessons] = await db.execute(
            `SELECT l.lesson_id, l.lesson_number, l.lesson_title, l.lesson_description,
                    l.video_url, l.book_pages, l.page_range_start, l.page_range_end,
                    l.lesson_steps
             FROM lessons l
             INNER JOIN units u ON l.unit_id = u.unit_id
             WHERE u.grade_level = ? AND u.unit_number = ?
             ORDER BY l.lesson_number ASC`,
            [grade, unitNumber]
        );

        if (lessons.length === 0) {
            const [unitRows] = await db.execute(
                `SELECT unit_id FROM units WHERE grade_level = ? AND unit_number = ? LIMIT 1`,
                [grade, unitNumber]
            );
            if (unitRows.length > 0) {
                [lessons] = await db.execute(
                    `SELECT lesson_id, lesson_number, lesson_title, lesson_description,
                            video_url, book_pages, page_range_start, page_range_end,
                            lesson_steps
                     FROM lessons WHERE unit_id = ? ORDER BY lesson_number ASC`,
                    [unitRows[0].unit_id]
                );
            }
        }

        const lessonsWithSteps = lessons.map((lesson) => {
            const steps = parseLessonStepsColumn(lesson.lesson_steps);
            return {
                id: lesson.lesson_number,
                title: lesson.lesson_title || '',
                desc: lesson.lesson_description || '',
                video: lesson.video_url,
                bookPages: lesson.book_pages,
                pageRange: {
                    start: lesson.page_range_start,
                    end: lesson.page_range_end
                },
                steps
            };
        });

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

        // Get lesson: use lessons.lesson_steps column (longtext/JSON), not a separate table
        const [lessons] = await db.execute(
            `SELECT l.lesson_id, l.lesson_number, l.lesson_title, l.lesson_description,
                    l.video_url, l.book_pages, l.page_range_start, l.page_range_end,
                    l.lesson_steps
             FROM lessons l
             INNER JOIN units u ON l.unit_id = u.unit_id
             WHERE u.grade_level = ? AND u.unit_number = ? AND l.lesson_number = ?`,
            [grade, unitNumber, lessonNumber]
        );

        if (lessons.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        const lesson = lessons[0];
        const steps = parseLessonStepsColumn(lesson.lesson_steps);

        const lessonData = {
            id: lesson.lesson_number,
            title: lesson.lesson_title,
            desc: lesson.lesson_description,
            video: lesson.video_url,
            bookPages: lesson.book_pages,
            pageRange: {
                start: lesson.page_range_start,
                end: lesson.page_range_end
            },
            steps
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
            `SELECT unit_id FROM units WHERE grade_level = ? AND unit_number = ?`,
            [grade, unitNumber]
        );

        if (units.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        const unitId = units[0].unit_id;
        const lessonStepsJson = (steps && Array.isArray(steps) && steps.length > 0)
            ? JSON.stringify(steps.map((step) => ({ heading: step.heading, content: step.text || step.content })))
            : null;

        const [result] = await db.execute(
            `INSERT INTO lessons (unit_id, grade_level, lesson_number, lesson_title, lesson_description,
                                 video_url, book_pages, page_range_start, page_range_end, lesson_steps)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [unitId, grade, lessonNumber, title, description || null,
             videoUrl || null, bookPages || null, pageRangeStart || null, pageRangeEnd || null, lessonStepsJson]
        );

        const lessonId = result.insertId;

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