// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const langBtn = document.getElementById('lang-btn');
const rememberCheckbox = document.getElementById('remember');

// Safe storage (avoids "Access to storage is not allowed from this context" in iframes/restricted contexts)
const safeStorage = (function () {
    const fallback = {};
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.getItem('__test');
            return {
                getItem: (k) => window.localStorage.getItem(k),
                setItem: (k, v) => { window.localStorage.setItem(k, v); },
                removeItem: (k) => { window.localStorage.removeItem(k); }
            };
        }
    } catch (e) {
        console.warn('[LOGIN] localStorage not available, using in-memory fallback:', e.message);
    }
    return {
        getItem: (k) => fallback[k] ?? null,
        setItem: (k, v) => { fallback[k] = v; },
        removeItem: (k) => { delete fallback[k]; }
    };
})();

// Language: en or ar - we read it from storage and show it on the button
let currentLang = safeStorage.getItem('userLanguage') || 'en';

function updateLangButton() {
    langBtn.textContent = currentLang === 'en' ? '🌐 EN' : '🌐 AR';
}
updateLangButton();

langBtn.addEventListener('click', function () {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    safeStorage.setItem('userLanguage', currentLang);
    updateLangButton();
});

// When user clicks Login we send email and password to the server
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberCheckbox.checked;

    // Check they filled both fields
    if (!email || !password) {
        const msg = currentLang === 'ar' 
            ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' 
            : 'Please enter email and password.';
        alert(msg);
        return;
    }

    // Disable button during login
    loginBtn.disabled = true;
    loginBtn.style.opacity = '0.6';
    loginBtn.innerHTML = `<span>${currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...'}</span>`;

    try {
        const apiUrl = '/api/auth/login';
        // Send email and password to our backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        // Put button back to normal
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        loginBtn.innerHTML = `Login<div class="btn-shine"></div>`;
        
        // If server said no or success is false, show error
        if (!response.ok || !data.success) {
            let errorMsg = data.message || 'Login failed. Please try again.';
            if (data.error) {
                errorMsg += `\n\nDevelopment Error: ${data.error}`;
            }
            // Translate some known messages to Arabic
            if (currentLang === 'ar') {
                if (errorMsg.includes('Invalid email or password')) {
                    errorMsg = 'بريد إلكتروني أو كلمة مرور غير صحيحة';
                } else if (errorMsg.includes('Account locked')) {
                    errorMsg = 'الحساب مقفل بسبب محاولات فاشلة كثيرة. حاول لاحقًا.';
                } else if (errorMsg.includes('deactivated')) {
                    errorMsg = 'الحساب غير مفعل. يرجى الاتصال بالدعم.';
                } else if (errorMsg.includes('Server error')) {
                    errorMsg = 'خطأ في الخادم. يرجى المحاولة مرة أخرى.';
                }
            }
            
            alert(errorMsg);
            return;
        }
        
        // Login worked - save user so other pages know who is logged in
        safeStorage.setItem('currentUser', JSON.stringify(data.user));

        // Students need grade_level saved so we know which units they can access
        if (data.user.user_type === 'student' && data.user.grade_level) {
            safeStorage.setItem('userGrade', data.user.grade_level.toString());
        } else {
            safeStorage.removeItem('userGrade');
        }

        safeStorage.setItem('language', currentLang);

        if (rememberMe) {
            safeStorage.setItem('rememberUser', JSON.stringify(data.user));
        } else {
            safeStorage.removeItem('rememberUser');
        }

        if (window.analytics) {
            window.analytics.trackLogin('email');
        }

        const successMsg = currentLang === 'ar' 
            ? `مرحباً، ${data.user.first_name}!` 
            : `Welcome back, ${data.user.first_name}!`;
        alert(successMsg);
        
        // Send teachers to teacher dashboard, students to student dashboard
        if (data.user.user_type === 'teacher') {
            window.location.href = '/teacher_dashboard.html';
        } else {
            window.location.href = '/dashboard.html';
        }

    } catch (error) {
        console.error('Login error:', error);
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        loginBtn.innerHTML = `Login<div class="btn-shine"></div>`;
        
        // Show user-friendly error
        let errorMsg = currentLang === 'ar' 
            ? 'خطأ في الاتصال. تأكد من تشغيل الخادم.' 
            : 'Connection error. Please make sure the server is running.';
        
        // More specific errors
        if (error.message.includes('Failed to fetch')) {
            errorMsg = currentLang === 'ar'
                ? 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل على المنفذ 3001'
                : 'Cannot connect to server. Make sure server is running on port 3001';
        }
        
        alert(errorMsg);
    }
});

// When page loads, if we have a remembered user fill in their email
document.addEventListener('DOMContentLoaded', function () {
    const rememberedUser = safeStorage.getItem('rememberUser');
    if (rememberedUser) {
        try {
            const user = JSON.parse(rememberedUser);
            rememberCheckbox.checked = true;
            emailInput.value = user.email || '';
        } catch (e) {
            safeStorage.removeItem('rememberUser');
        }
    }
});

// Call this from other pages to log out - clears storage and goes to login
function logout() {
    safeStorage.removeItem('currentUser');
    safeStorage.removeItem('userGrade');
    safeStorage.removeItem('rememberUser');
    safeStorage.removeItem('language');
    window.location.href = '/login.html';
}

// Helpers for debugging in browser console (optional)
window.debugLogin = {
    clearStorage: () => {
        safeStorage.removeItem('currentUser');
        safeStorage.removeItem('userGrade');
        safeStorage.removeItem('rememberUser');
        console.log('🧹 Debug: Cleared auth storage');
    },
    showStorage: () => {
        console.log('🔍 Current auth storage:');
        console.log('currentUser:', JSON.parse(safeStorage.getItem('currentUser') || 'null'));
        console.log('userGrade:', safeStorage.getItem('userGrade'));
        console.log('rememberUser:', JSON.parse(safeStorage.getItem('rememberUser') || 'null'));
    },
    testConnection: async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            console.log('📡 Server health check:', data);
            return data;
        } catch (e) {
            console.error('📡 Connection test failed:', e);
            return { error: 'Cannot connect to server' };
        }
    }
};

// Login script loaded