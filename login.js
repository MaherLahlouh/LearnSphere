// Import Firebase modules
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// DOM Elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const langBtn = document.getElementById('lang-btn');

// Language handling
let currentLang = localStorage.getItem('userLanguage') || 'en';

const updateLangButton = () => {
    langBtn.textContent = currentLang === 'en' ? '🌐 EN' : '🌐 AR';
};
updateLangButton();

langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('userLanguage', currentLang);
    updateLangButton();
});

// Check if user is a teacher or student and get their data
async function getUserData(uid) {
    try {
        // First check teachers collection
        const teacherDoc = await getDoc(doc(db, "teachers", uid));
        if (teacherDoc.exists()) {
            console.log('User is a teacher');
            return { 
                userType: 'teacher', 
                data: teacherDoc.data() 
            };
        }

        // Then check users (students) collection
        const studentDoc = await getDoc(doc(db, "users", uid));
        if (studentDoc.exists()) {
            console.log('User is a student');
            return { 
                userType: 'student', 
                data: studentDoc.data() 
            };
        }

        // User exists in auth but not in database
        console.log('User not found in database');
        return null;
    } catch (error) {
        console.error('Error checking user data:', error);
        return null;
    }
}

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

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
    loginBtn.textContent = currentLang === 'ar' ? 'جاري تسجيل الدخول...' : 'Logging in...';

    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Track login event
        if (window.analytics) {
            window.analytics.trackLogin('email');
        }
        const user = userCredential.user;
        console.log('Login successful:', user.email);

        // Get user data from Firestore
        const userData = await getUserData(user.uid);

        if (!userData) {
            // User exists in auth but not in database
            console.error('User profile not found in database');
            
            const errorMsg = currentLang === 'ar'
                ? 'خطأ: لم يتم العثور على ملف المستخدم. يرجى الاتصال بالدعم.'
                : 'Error: User profile not found. Please contact support.';
            
            alert(errorMsg);
            
            // Sign out the user
            await auth.signOut();
            
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
            loginBtn.textContent = currentLang === 'ar' ? 'تسجيل الدخول' : 'Login';
            return;
        }

        // Store user type in localStorage
        localStorage.setItem('userType', userData.userType);

        if (userData.userType === 'teacher') {
            console.log('Redirecting to teacher dashboard');
            window.location.href = './teacher_dashboard.html';
        } else if (userData.userType === 'student') {
            // Store student's grade in localStorage
            if (userData.data.grade) {
                localStorage.setItem('userGrade', userData.data.grade);
                console.log('Student grade stored:', userData.data.grade);
            } else {
                console.warn('No grade found for student');
                // Default to grade 1 if no grade is set
                localStorage.setItem('userGrade', '1');
            }
            
            console.log('Redirecting to student dashboard');
            window.location.href = './dashboard.html';
        } else {
            // Unknown user type
            console.error('Unknown user type:', userData.userType);
            alert(currentLang === 'ar' 
                ? 'نوع المستخدم غير معروف' 
                : 'Unknown user type');
            
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.style.opacity = '1';
            loginBtn.textContent = currentLang === 'ar' ? 'تسجيل الدخول' : 'Login';
        }

    } catch (error) {
        console.error('Firebase login error:', error);

        // Re-enable button
        loginBtn.disabled = false;
        loginBtn.style.opacity = '1';
        loginBtn.textContent = currentLang === 'ar' ? 'تسجيل الدخول' : 'Login';

        // Error messages
        let message = 'Login failed. Please check your credentials.';
        if (currentLang === 'ar') {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = 'بريد إلكتروني أو كلمة مرور غير صحيحة.';
                    break;
                case 'auth/invalid-email':
                    message = 'عنوان بريد إلكتروني غير صالح.';
                    break;
                case 'auth/too-many-requests':
                    message = 'محاولات كثيرة جدًا. حاول لاحقًا.';
                    break;
                case 'auth/network-request-failed':
                    message = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.';
                    break;
                default:
                    message = 'فشل تسجيل الدخول.';
            }
        } else {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    message = 'Incorrect email or password.';
                    break;
                case 'auth/invalid-email':
                    message = 'Invalid email address.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many failed attempts. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Network error. Please check your internet connection.';
                    break;
                default:
                    message = 'Login failed. Please try again.';
            }
        }
        alert(message);
    }
});