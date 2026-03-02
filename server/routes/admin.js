/**
 * مسارات لوحة تحكم الأدمن - إدارة الوحدات والدروس والاختبارات
 * Admin Dashboard API: CRUD for units, lessons, quizzes (مع احترام المفاتيح الأجنبية)
 * الجدول المستخدم: units, lessons, quizzes, quiz_questions, quiz_answers (حسب المخطط المطلوب)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ==================== الوحدات (Units) ====================

/**
 * GET /api/admin/units
 * جلب كل الوحدات أو حسب الصف الدراسي. يدعم جداول بها unit_title_en/ar أو unit_title فقط.
 */
router.get('/units', async (req, res) => {
    try {
        const { grade_level } = req.query;
        let sql = `SELECT unit_id, grade_level, unit_number,
                   COALESCE(unit_title_en, unit_title_ar) AS unit_title,
                   COALESCE(unit_description_en, unit_description_ar) AS unit_description
                   FROM units`;
        const params = [];
        if (grade_level) {
            sql += ' WHERE grade_level = ?';
            params.push(grade_level);
        }
        sql += ' ORDER BY grade_level, unit_number';

        let rows;
        try {
            [rows] = await db.execute(sql, params);
        } catch (e) {
            if (e.code === 'ER_BAD_FIELD_ERROR') {
                sql = `SELECT unit_id, grade_level, unit_number, unit_title, unit_description FROM units`;
                if (grade_level) sql += ' WHERE grade_level = ?';
                sql += ' ORDER BY grade_level, unit_number';
                [rows] = await db.execute(sql, grade_level ? [grade_level] : []);
            } else throw e;
        }
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('خطأ جلب الوحدات:', error);
        return res.status(500).json({ success: false, message: 'خطأ في جلب الوحدات', error: error.message });
    }
});

/**
 * POST /api/admin/units
 * إضافة وحدة جديدة. يدعم الجداول التي تحتوي unit_title أو (unit_title_en, unit_title_ar).
 */
router.post('/units', async (req, res) => {
    try {
        const { grade_level, unit_number, unit_title, unit_description } = req.body;
        if (!grade_level || unit_number == null || !unit_title) {
            return res.status(400).json({
                success: false,
                message: 'الحقول المطلوبة: grade_level, unit_number, unit_title'
            });
        }
        const desc = unit_description || null;
        try {
            const [result] = await db.execute(
                `INSERT INTO units (grade_level, unit_number, unit_title_en, unit_title_ar, unit_description_en, unit_description_ar)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [grade_level, unit_number, unit_title, unit_title, desc, desc]
            );
            return res.status(201).json({
                success: true,
                message: 'تم إنشاء الوحدة بنجاح',
                data: { unit_id: result.insertId, grade_level, unit_number, unit_title }
            });
        } catch (e) {
            if (e.code === 'ER_BAD_FIELD_ERROR') {
                const [result] = await db.execute(
                    `INSERT INTO units (grade_level, unit_number, unit_title, unit_description) VALUES (?, ?, ?, ?)`,
                    [grade_level, unit_number, unit_title, desc]
                );
                return res.status(201).json({
                    success: true,
                    message: 'تم إنشاء الوحدة بنجاح',
                    data: { unit_id: result.insertId, grade_level, unit_number, unit_title }
                });
            }
            throw e;
        }
    } catch (error) {
        console.error('خطأ إنشاء الوحدة:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'الوحدة موجودة مسبقاً لهذا الصف' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في إنشاء الوحدة', error: error.message });
    }
});

/**
 * PUT /api/admin/units/:id
 * تحديث وحدة
 */
router.put('/units/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { grade_level, unit_number, unit_title, unit_description } = req.body;
        if (!unit_title) {
            return res.status(400).json({ success: false, message: 'unit_title مطلوب' });
        }
        const desc = unit_description ?? null;
        try {
            await db.execute(
                `UPDATE units SET grade_level = COALESCE(?, grade_level), unit_number = COALESCE(?, unit_number),
                 unit_title_en = ?, unit_title_ar = ?, unit_description_en = ?, unit_description_ar = ? WHERE unit_id = ?`,
                [grade_level, unit_number, unit_title, unit_title, desc, desc, id]
            );
        } catch (e) {
            if (e.code === 'ER_BAD_FIELD_ERROR') {
                await db.execute(
                    `UPDATE units SET grade_level = COALESCE(?, grade_level), unit_number = COALESCE(?, unit_number),
                     unit_title = ?, unit_description = ? WHERE unit_id = ?`,
                    [grade_level, unit_number, unit_title, desc, id]
                );
            } else throw e;
        }
        return res.json({ success: true, message: 'تم تحديث الوحدة' });
    } catch (error) {
        console.error('خطأ تحديث الوحدة:', error);
        return res.status(500).json({ success: false, message: 'خطأ في التحديث', error: error.message });
    }
});

/**
 * DELETE /api/admin/units/:id
 * حذف وحدة (قد يفشل إذا كانت هناك دروس مرتبطة - foreign key)
 */
router.delete('/units/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM units WHERE unit_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الوحدة غير موجودة' });
        }
        return res.json({ success: true, message: 'تم حذف الوحدة' });
    } catch (error) {
        console.error('خطأ حذف الوحدة:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'لا يمكن الحذف: توجد دروس مرتبطة بالوحدة' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في الحذف', error: error.message });
    }
});

// ==================== الدروس (Lessons) ====================

/**
 * GET /api/admin/lessons
 * جلب الدروس (اختياري: unit_id أو grade_level)
 */
router.get('/lessons', async (req, res) => {
    try {
        const { unit_id, grade_level } = req.query;
        let sql = `SELECT lesson_id, unit_id, grade_level, lesson_number, lesson_title, lesson_description, video_url, lesson_steps
                   FROM lessons WHERE 1=1`;
        const params = [];
        if (unit_id) { sql += ' AND unit_id = ?'; params.push(unit_id); }
        if (grade_level) { sql += ' AND grade_level = ?'; params.push(grade_level); }
        sql += ' ORDER BY unit_id, lesson_number';

        const [rows] = await db.execute(sql, params);
        const data = rows.map(r => ({
            ...r,
            lesson_steps: typeof r.lesson_steps === 'string' ? (r.lesson_steps ? JSON.parse(r.lesson_steps) : null) : r.lesson_steps
        }));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('خطأ جلب الدروس:', error);
        return res.status(500).json({ success: false, message: 'خطأ في جلب الدروس', error: error.message });
    }
});

/**
 * POST /api/admin/lessons
 * إضافة درس جديد (unit_id مطلوب لاحترام المفتاح الأجنبي)
 */
router.post('/lessons', async (req, res) => {
    try {
        const { unit_id, grade_level, lesson_number, lesson_title, lesson_description, video_url, lesson_steps } = req.body;
        if (!unit_id || lesson_number == null || !lesson_title) {
            return res.status(400).json({
                success: false,
                message: 'الحقول المطلوبة: unit_id, lesson_number, lesson_title'
            });
        }
        const stepsJson = lesson_steps != null
            ? (typeof lesson_steps === 'string' ? lesson_steps : JSON.stringify(lesson_steps))
            : null;
        const [result] = await db.execute(
            `INSERT INTO lessons (unit_id, grade_level, lesson_number, lesson_title, lesson_description, video_url, lesson_steps)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [unit_id, grade_level ?? null, lesson_number, lesson_title, lesson_description ?? null, video_url ?? null, stepsJson]
        );
        return res.status(201).json({
            success: true,
            message: 'تم إنشاء الدرس بنجاح',
            data: { lesson_id: result.insertId, unit_id, lesson_number, lesson_title }
        });
    } catch (error) {
        console.error('خطأ إنشاء الدرس:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ success: false, message: 'unit_id غير موجود' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في إنشاء الدرس', error: error.message });
    }
});

/**
 * PUT /api/admin/lessons/:id
 * تحديث درس
 */
router.put('/lessons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { grade_level, lesson_number, lesson_title, lesson_description, video_url, lesson_steps } = req.body;
        if (!lesson_title) {
            return res.status(400).json({ success: false, message: 'lesson_title مطلوب' });
        }
        const stepsJson = lesson_steps != null
            ? (typeof lesson_steps === 'string' ? lesson_steps : JSON.stringify(lesson_steps))
            : undefined;
        await db.execute(
            `UPDATE lessons SET grade_level = COALESCE(?, grade_level), lesson_number = COALESCE(?, lesson_number),
             lesson_title = ?, lesson_description = ?, video_url = ?, lesson_steps = COALESCE(?, lesson_steps)
             WHERE lesson_id = ?`,
            [grade_level, lesson_number, lesson_title, lesson_description ?? null, video_url ?? null, stepsJson, id]
        );
        return res.json({ success: true, message: 'تم تحديث الدرس' });
    } catch (error) {
        console.error('خطأ تحديث الدرس:', error);
        return res.status(500).json({ success: false, message: 'خطأ في التحديث', error: error.message });
    }
});

/**
 * DELETE /api/admin/lessons/:id
 * حذف درس
 */
router.delete('/lessons/:id', async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM lessons WHERE lesson_id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'الدرس غير موجود' });
        }
        return res.json({ success: true, message: 'تم حذف الدرس' });
    } catch (error) {
        console.error('خطأ حذف الدرس:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'لا يمكن الحذف: توجد اختبارات مرتبطة بالدرس' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في الحذف', error: error.message });
    }
});

// ==================== الاختبارات (Quizzes) ====================

/**
 * GET /api/admin/quizzes
 * جلب الاختبارات (اختياري: lesson_id أو unit_id)
 */
router.get('/quizzes', async (req, res) => {
    try {
        const { lesson_id, unit_id } = req.query;
        let sql = 'SELECT quiz_id, grade_level, unit_id, lesson_id FROM quizzes WHERE 1=1';
        const params = [];
        if (lesson_id) { sql += ' AND lesson_id = ?'; params.push(lesson_id); }
        if (unit_id) { sql += ' AND unit_id = ?'; params.push(unit_id); }
        const [rows] = await db.execute(sql, params);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('خطأ جلب الاختبارات:', error);
        return res.status(500).json({ success: false, message: 'خطأ في جلب الاختبارات', error: error.message });
    }
});

/**
 * POST /api/admin/quizzes
 * إنشاء اختبار لدرس معين (احترام FK: unit_id, lesson_id)
 */
router.post('/quizzes', async (req, res) => {
    try {
        const { grade_level, unit_id, lesson_id } = req.body;
        if (!unit_id || !lesson_id) {
            return res.status(400).json({
                success: false,
                message: 'الحقول المطلوبة: unit_id, lesson_id'
            });
        }
        const [result] = await db.execute(
            `INSERT INTO quizzes (grade_level, unit_id, lesson_id) VALUES (?, ?, ?)`,
            [grade_level ?? null, unit_id, lesson_id]
        );
        return res.status(201).json({
            success: true,
            message: 'تم إنشاء الاختبار بنجاح',
            data: { quiz_id: result.insertId, unit_id, lesson_id }
        });
    } catch (error) {
        console.error('خطأ إنشاء الاختبار:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ success: false, message: 'unit_id أو lesson_id غير موجود' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في إنشاء الاختبار', error: error.message });
    }
});

/**
 * GET /api/admin/quizzes/:quizId/questions
 * جلب أسئلة اختبار معين (متوافق مع أعمدة quiz_questions و quiz_answers الموجودة)
 */
router.get('/quizzes/:quizId/questions', async (req, res) => {
    try {
        const [questions] = await db.execute(
            `SELECT question_id, quiz_id, question_type, question_text, correct_answer, explanation, question_order
             FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order ASC, question_id`,
            [req.params.quizId]
        );
        const withAnswers = await Promise.all(questions.map(async (q) => {
            const [answers] = await db.execute(
                'SELECT answer_id, question_id, answer_text, is_correct, answer_order FROM quiz_answers WHERE question_id = ? ORDER BY answer_order',
                [q.question_id]
            );
            return { ...q, answers };
        }));
        return res.json({ success: true, data: withAnswers });
    } catch (error) {
        console.error('خطأ جلب الأسئلة:', error);
        return res.status(500).json({ success: false, message: 'خطأ في جلب الأسئلة', error: error.message });
    }
});

/**
 * POST /api/admin/quizzes/:quizId/questions
 * إضافة سؤال لاختبار (اختيار من متعدد). نستخرج من جدول quizzes قيم grade_level و unit_id و lesson_id لاحترام أعمدة quiz_questions (grade, unit_id_ref, lesson_id_ref).
 * Body: question_type, question_text, correct_answer (فهرس الإجابة الصحيحة 0-based)، answers: [{ answer_text, is_correct }]
 */
router.post('/quizzes/:quizId/questions', async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const { question_type, question_text, correct_answer, explanation, question_order, answers } = req.body;
        if (!question_type || !question_text) {
            return res.status(400).json({
                success: false,
                message: 'الحقول المطلوبة: question_type, question_text'
            });
        }
        // جلب بيانات الاختبار لملء unit_id_ref و lesson_id_ref و grade (إن وجدت في الجدول)
        const [quizRows] = await db.execute(
            'SELECT grade_level, unit_id, lesson_id FROM quizzes WHERE quiz_id = ? LIMIT 1',
            [quizId]
        );
        if (!quizRows || quizRows.length === 0) {
            return res.status(400).json({ success: false, message: 'quiz_id غير موجود' });
        }
        const { grade_level, unit_id, lesson_id } = quizRows[0];
        const order = question_order != null ? parseInt(question_order, 10) : 0;

        const [result] = await db.execute(
            `INSERT INTO quiz_questions (quiz_id, grade, unit_id_ref, lesson_id_ref, question_type, question_text, correct_answer, explanation, question_order, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [quizId, grade_level || null, unit_id, lesson_id, question_type, question_text, correct_answer ?? null, explanation || null, order, 'ar']
        );
        const questionId = result.insertId;

        if (answers && Array.isArray(answers) && answers.length > 0) {
            for (let i = 0; i < answers.length; i++) {
                const a = answers[i];
                await db.execute(
                    'INSERT INTO quiz_answers (question_id, answer_order, answer_text, image_url, label, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
                    [questionId, i, a.answer_text || '', null, null, !!a.is_correct]
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: 'تم إضافة السؤال بنجاح',
            data: { question_id: questionId, quiz_id: quizId }
        });
    } catch (error) {
        console.error('خطأ إضافة السؤال:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ success: false, message: 'quiz_id غير موجود' });
        }
        return res.status(500).json({ success: false, message: 'خطأ في إضافة السؤال', error: error.message });
    }
});

/**
 * DELETE /api/admin/quizzes/questions/:questionId
 * حذف سؤال
 */
router.delete('/quizzes/questions/:questionId', async (req, res) => {
    try {
        const questionId = req.params.questionId;
        await db.execute('DELETE FROM quiz_answers WHERE question_id = ?', [questionId]);
        const [result] = await db.execute('DELETE FROM quiz_questions WHERE question_id = ?', [questionId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'السؤال غير موجود' });
        }
        return res.json({ success: true, message: 'تم حذف السؤال' });
    } catch (error) {
        console.error('خطأ حذف السؤال:', error);
        return res.status(500).json({ success: false, message: 'خطأ في الحذف', error: error.message });
    }
});

module.exports = router;
