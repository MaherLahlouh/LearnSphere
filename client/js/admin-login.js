/**
 * تسجيل دخول الأدمن - إرسال البريد الإلكتروني وكلمة المرور واستلام JWT وحفظه ثم التوجيه للوحة التحكم
 */

(function () {
    const form = document.getElementById('admin-login-form');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const errorEl = document.getElementById('admin-login-error');
    const loginBtn = document.getElementById('admin-login-btn');

    // تخزين آمن للتوكن (نفس أسلوب login.js)
    const safeStorage = (function () {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.getItem('__test');
                return {
                    getItem: function (k) { return window.localStorage.getItem(k); },
                    setItem: function (k, v) { window.localStorage.setItem(k, v); },
                    removeItem: function (k) { window.localStorage.removeItem(k); }
                };
            }
        } catch (e) {
            console.warn('localStorage not available', e.message);
        }
        const fallback = {};
        return {
            getItem: function (k) { return fallback[k] ?? null; },
            setItem: function (k, v) { fallback[k] = v; },
            removeItem: function (k) { delete fallback[k]; }
        };
    })();

    function showError(msg) {
        errorEl.textContent = msg || '';
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        showError('');

        var email = emailInput.value.trim();
        var password = passwordInput.value;

        if (!email || !password) {
            showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'جاري التحقق...';

        try {
            var response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            var data = await response.json();

            if (data.success && data.token) {
                safeStorage.setItem('adminToken', data.token);
                window.location.href = '/admin-dashboard.html';
                return;
            }

            showError(data.message || 'فشل تسجيل الدخول');
        } catch (err) {
            console.error('Admin login error:', err);
            showError('خطأ في الاتصال بالخادم. حاول مرة أخرى.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'تسجيل الدخول';
        }
    });
})();
