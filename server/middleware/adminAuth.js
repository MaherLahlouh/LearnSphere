/**
 * وسيط التحقق من صلاحيات الأدمن (Admin Auth Middleware)
 * يتحقق من وجود JWT صالح وأن المستخدم له دور admin.
 */

const jwt = require('jsonwebtoken');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'learnwithtaa-admin-secret-key';

/**
 * التحقق من أن الطلب قادم من أدمن مسجل دخوله (يحتوي على JWT صالح ودور admin)
 * @param {object} req - طلب Express
 * @param {object} res - استجابة Express
 * @param {function} next - الدالة التالية في السلسلة
 */
function requireAdmin(req, res, next) {
    // استخراج التوكن من رأس Authorization (Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح. يرجى تسجيل الدخول كأدمن.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // التأكد من أن الدور هو admin
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية الدخول لوحة الأدمن'
            });
        }

        // إرفاق بيانات المستخدم بالطلب للاستخدام في المسارات
        req.admin = decoded;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'توكن غير صالح'
        });
    }
}

module.exports = { requireAdmin };
