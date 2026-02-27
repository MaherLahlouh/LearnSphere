const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Resolve (grade, unit_number, lesson_number) to (unit_id, lesson_id).
 * Params can be strings; they are parsed as integers for unit_number and lesson_number.
 * Returns { unitId, lessonId } or null if not found.
 */
async function resolveUnitAndLesson(grade, unitNumber, lessonNumber) {
    const uNum = parseInt(unitNumber, 10);
    const lNum = parseInt(lessonNumber, 10);
    if (isNaN(uNum) || isNaN(lNum)) return null;
    const [units] = await db.execute(
        'SELECT unit_id FROM units WHERE grade_level = ? AND unit_number = ? LIMIT 1',
        [grade, uNum]
    );
    if (!units || units.length === 0) return null;
    const unitId = units[0].unit_id;
    const [lessons] = await db.execute(
        'SELECT lesson_id FROM lessons WHERE unit_id = ? AND lesson_number = ? LIMIT 1',
        [unitId, lNum]
    );
    if (!lessons || lessons.length === 0) return null;
    return { unitId, lessonId: lessons[0].lesson_id };
}

/**
 * Get or create a quiz row for the given lesson. quiz_questions requires a valid quiz_id (FK to quizzes).
 * Returns quiz_id.
 */
async function getOrCreateQuizId(grade, unitId, lessonId) {
    const [existing] = await db.execute(
        'SELECT quiz_id FROM quizzes WHERE lesson_id = ? LIMIT 1',
        [lessonId]
    );
    if (existing && existing.length > 0) {
        return existing[0].quiz_id;
    }
    const [result] = await db.execute(
        `INSERT INTO quizzes (grade_level, unit_id, lesson_id, is_active)
         VALUES (?, ?, ?, 1)`,
        [grade, unitId, lessonId]
    );
    return result.insertId;
}

router.get('/:grade/:unit/:lesson', async (req, res) => {
    try {
        const { grade, unit, lesson } = req.params;

        // Resolve unit_number and lesson_number (from URL) to unit_id and lesson_id
        const resolved = await resolveUnitAndLesson(grade, unit, lesson);
        if (!resolved) {
            return res.json({ success: true, data: [] });
        }
        const { unitId, lessonId } = resolved;

        // Get all questions for this lesson (quiz_questions uses unit_id_ref, lesson_id_ref)
        const [questions] = await db.execute(
            `SELECT question_id, question_type, question_text, correct_answer, explanation, question_order
             FROM quiz_questions
             WHERE grade = ? AND unit_id_ref = ? AND lesson_id_ref = ?
             ORDER BY question_order ASC`,
            [grade, unitId, lessonId]
        );

        // For each question, get its specific data based on type
        const quizData = await Promise.all(questions.map(async (question) => {
            const qId = question.question_id;
            const questionData = {
                id: qId,
                type: question.question_type,
                question: question.question_text,
                explanation: question.explanation
            };

            if (question.question_type === 'multiple-choice') {
                // Get answers for multiple choice
                const [answers] = await db.execute(
                    `SELECT answer_text, is_correct, answer_order
                     FROM quiz_answers
                     WHERE question_id = ?
                     ORDER BY answer_order ASC`,
                    [qId]
                );
                
                questionData.answers = answers.map(a => a.answer_text);
                questionData.correct = question.correct_answer !== null 
                    ? question.correct_answer 
                    : answers.findIndex(a => a.is_correct);

            } else if (question.question_type === 'image-selection') {
                // Get image options
                const [options] = await db.execute(
                    `SELECT image_url, label, is_correct, answer_order
                     FROM quiz_answers
                     WHERE question_id = ?
                     ORDER BY answer_order ASC`,
                    [qId]
                );
                
                questionData.options = options.map(opt => ({
                    image: opt.image_url,
                    label: opt.label,
                    correct: opt.is_correct
                }));

            } else if (question.question_type === 'drag-drop') {
                // Get drag-drop items
                const [items] = await db.execute(
                    `SELECT item_order as id, item_text as text, correct_category as category
                     FROM drag_drop_items
                     WHERE question_id = ?
                     ORDER BY item_order ASC`,
                    [qId]
                );
                
                // Get drop zones
                const [zones] = await db.execute(
                    `SELECT zone_identifier as id, zone_label as label
                     FROM drop_zones
                     WHERE question_id = ?
                     ORDER BY zone_order ASC`,
                    [qId]
                );
                
                questionData.items = items;
                questionData.zones = zones;
            } else if (question.question_type === 'matching') {
                // Get matching pairs (stored in quiz_answers: answer_text = left, label = right)
                const [pairsRows] = await db.execute(
                    `SELECT answer_text, label
                     FROM quiz_answers
                     WHERE question_id = ?
                     ORDER BY answer_order ASC`,
                    [qId]
                );
                questionData.pairs = (pairsRows || []).map(row => ({
                    left: row.answer_text || '',
                    right: row.label || ''
                }));
            }

            return questionData;
        }));

        res.json({
            success: true,
            data: quizData
        });

    } catch (error) {
        console.error('Error fetching quiz data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching quiz data',
            error: error.message
        });
    }
});

/*
POST /api/quizzes/progress
Save user's quiz progress/completion
 */
router.post('/progress', async (req, res) => {
    try {
        const { userId, grade, unitId, lessonId } = req.body;

        if (!userId || !grade || !unitId || !lessonId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, grade, unitId, lessonId'
            });
        }

        // Insert or update progress
        await db.execute(
            `INSERT INTO user_progress (user_id, grade, unit_number, lesson_number, completed)
             VALUES (?, ?, ?, ?, TRUE)
             ON DUPLICATE KEY UPDATE completed = TRUE, completed_at = CURRENT_TIMESTAMP`,
            [userId, grade, unitId, lessonId]
        );

        res.json({
            success: true,
            message: 'Progress saved successfully'
        });

    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving progress',
            error: error.message
        });
    }
});

/*
GET /api/quizzes/progress/:userId/:grade
Get user's progress for a specific grade
*/
router.get('/progress/:userId/:grade', async (req, res) => {
    try {
        const { userId, grade } = req.params;

        const [progress] = await db.execute(
            `SELECT unit_number, lesson_number, completed_at
             FROM user_progress
             WHERE user_id = ? AND grade = ? AND completed = TRUE`,
            [userId, grade]
        );

        res.json({
            success: true,
            data: progress
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching progress',
            error: error.message
        });
    }
});

/*
POST /api/quizzes/question
Create a new quiz question (Admin only)
 */
router.post('/question', async (req, res) => {
    try {
        const { 
            grade, 
            unitId, 
            lessonId, 
            questionType, 
            questionText, 
            correctAnswer, 
            explanation, 
            questionOrder,
            language,
            answers,
            dragDropItems,
            dropZones,
            matchingPairs
        } = req.body;

        // Validate required fields
        if (!grade || unitId === undefined || unitId === '' || lessonId === undefined || lessonId === '' || !questionType || !questionText) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields (grade, unit, lesson, question type, question text)'
            });
        }

        // Resolve unit_number and lesson_number (from admin dropdowns) to unit_id and lesson_id
        const resolved = await resolveUnitAndLesson(grade, unitId, lessonId);
        if (!resolved) {
            return res.status(400).json({
                success: false,
                message: 'Unit or lesson not found. Please select a valid grade, unit, and lesson.'
            });
        }
        const { unitId: resolvedUnitId, lessonId: resolvedLessonId } = resolved;

        const quizId = await getOrCreateQuizId(grade, resolvedUnitId, resolvedLessonId);

        // Insert question (quiz_questions requires quiz_id FK; also store grade, unit_id_ref, lesson_id_ref for lookups)
        const [result] = await db.execute(
            `INSERT INTO quiz_questions 
             (quiz_id, grade, unit_id_ref, lesson_id_ref, question_type, question_text, correct_answer, explanation, question_order, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [quizId, grade, resolvedUnitId, resolvedLessonId, questionType, questionText, correctAnswer ?? null, explanation || null, questionOrder, language || 'en']
        );

        const questionId = result.insertId;

        // Insert answers if provided (for multiple-choice and image-selection)
        if (answers && Array.isArray(answers) && answers.length > 0) {
            const answerValues = answers.map((answer, index) => [
                questionId,
                index,
                answer.text || null,
                answer.imageUrl || null,
                answer.label || null,
                answer.isCorrect || false
            ]);

            await db.query(
                `INSERT INTO quiz_answers (question_id, answer_order, answer_text, image_url, label, is_correct)
                 VALUES ?`,
                [answerValues]
            );
        }

        // Insert drag-drop items if provided
        if (dragDropItems && Array.isArray(dragDropItems) && dragDropItems.length > 0) {
            const itemValues = dragDropItems.map((item, index) => [
                questionId,
                index + 1,
                item.text,
                item.category
            ]);

            await db.query(
                `INSERT INTO drag_drop_items (question_id, item_order, item_text, correct_category)
                 VALUES ?`,
                [itemValues]
            );
        }

        // Insert drop zones if provided
        if (dropZones && Array.isArray(dropZones) && dropZones.length > 0) {
            const zoneValues = dropZones.map((zone, index) => [
                questionId,
                index + 1,
                zone.id,
                zone.label
            ]);

            await db.query(
                `INSERT INTO drop_zones (question_id, zone_order, zone_identifier, zone_label)
                 VALUES ?`,
                [zoneValues]
            );
        }

        // Insert matching pairs if provided (answer_text = left, label = right)
        if (questionType === 'matching' && matchingPairs && Array.isArray(matchingPairs) && matchingPairs.length > 0) {
            const pairValues = matchingPairs.map((pair, index) => [
                questionId,
                index,
                pair.left || null,
                null,
                pair.right || null,
                false
            ]);
            await db.query(
                `INSERT INTO quiz_answers (question_id, answer_order, answer_text, image_url, label, is_correct)
                 VALUES ?`,
                [pairValues]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Quiz question created successfully',
            data: {
                questionId,
                grade,
                unitId,
                lessonId
            }
        });

    } catch (error) {
        console.error('Error creating quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating quiz question',
            error: error.message
        });
    }
});

/*
DELETE /api/quizzes/question/:id
Delete a quiz question (Admin only)
 */
router.delete('/question/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete question (answers, items, and zones will be cascade deleted)
        const [result] = await db.execute(
            `DELETE FROM quiz_questions WHERE question_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Quiz question not found'
            });
        }

        res.json({
            success: true,
            message: 'Quiz question deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting quiz question:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting quiz question',
            error: error.message
        });
    }
});
//Export Statement.
module.exports = router;