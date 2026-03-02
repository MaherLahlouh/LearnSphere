/**
 * مسارات تسجيل دخول الأدمن (Admin Authentication Routes)
 * بيانات الأدمن مخزنة في الكود أو متغيرات البيئة وليست في قاعدة البيانات.
 * نستخدم JWT للحفاظ على جلسة الأدمن.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// تحميل متغيرات البيئة إن وجدت (للاستخدام في production)
require('dotenv').config();

// بيانات الأدمن الثابتة (Hardcoded) - يمكن استبدالها بمتغيرات البيئة
// Admin credentials: يمكن وضعها في .env كالتالي: ADMIN_EMAIL=admin@example.com , ADMIN_PASSWORD=admin123
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@learnwithtaa.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'learnwithtaa-admin-secret-key';
const JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES || '24h'; // مدة صلاحية التوكن

/**
 * POST /api/admin/login
 * تسجيل دخول الأدمن: التحقق من البريد الإلكتروني وكلمة المرور ثم إصدار JWT
 */
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;

        // التحقق من وجود الحقول المطلوبة
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
            });
        }

        // تطبيع البريد للمقارنة (حروف صغيرة)
        const emailNormalized = String(email).trim().toLowerCase();

        // مقارنة البيانات مع بيانات الأدمن المخزنة (ليست من قاعدة البيانات)
        if (emailNormalized !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // إنشاء JWT يحتوي على معرف الأدمن والدور
        const token = jwt.sign(
            {
                id: 'admin',
                email: ADMIN_EMAIL,
                role: 'admin'
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        return res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            admin: {
                email: ADMIN_EMAIL,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('خطأ في تسجيل دخول الأدمن:', error);
        return res.status(500).json({
            success: false,
            message: 'خطأ في الخادم أثناء تسجيل الدخول',
            error: error.message
        });
    }
});

/**
 * POST /api/admin/logout
 * تسجيل خروج الأدمن (العميل يحذف التوكن من التخزين المحلي)
 */
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
    });
});

module.exports = router;
