const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/:grade/:unit/:lesson', async (req, res) => {
    try {
        const { grade, unit, lesson } = req.params;

        // Get all questions for this lesson
        const [questions] = await db.execute(
            `SELECT id, question_type, question_text, correct_answer, explanation, question_order
             FROM quiz_questions
             WHERE grade = ? AND unit_id = ? AND lesson_id = ?
             ORDER BY question_order ASC`,
            [grade, unit, lesson]
        );

        // For each question, get its specific data based on type
        const quizData = await Promise.all(questions.map(async (question) => {
            const questionData = {
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
                    [question.id]
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
                    [question.id]
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
                    [question.id]
                );
                
                // Get drop zones
                const [zones] = await db.execute(
                    `SELECT zone_identifier as id, zone_label as label
                     FROM drop_zones
                     WHERE question_id = ?
                     ORDER BY zone_order ASC`,
                    [question.id]
                );
                
                questionData.items = items;
                questionData.zones = zones;
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
            dropZones
        } = req.body;

        // Validate required fields
        if (!grade || !unitId || !lessonId || !questionType || !questionText) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Insert question
        const [result] = await db.execute(
            `INSERT INTO quiz_questions 
             (grade, unit_id, lesson_id, question_type, question_text, correct_answer, explanation, question_order, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [grade, unitId, lessonId, questionType, questionText, correctAnswer || null, explanation || null, questionOrder, language || 'en']
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
            `DELETE FROM quiz_questions WHERE id = ?`,
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