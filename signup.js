// Import Firebase services
import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Track current user type
let currentUserType = 'student';

// Language management
let currentLang = 'en'; // Default to English if localStorage not available
try {
    currentLang = localStorage.getItem('userLanguage') || 'en';
} catch (e) {
    console.log('localStorage not available, using default language');
}

let translations = {};

// Default translations as fallback
const defaultTranslations = {
    title_SignUp: 'Sign Up - Taa Academy',
    join: 'Join',
    taa_academy: 'Taa Academy',
    tagline: 'Start your STEM journey today!',
    student: 'Student',
    teacher: 'Teacher',
    first_name: 'First Name',
    last_name: 'Last Name',
    email_placeholder: 'Email Address',
    phone_placeholder: 'Phone Number',
    select_specialization: 'Select Specialization',
    mathematics: 'Mathematics',
    science: 'Science',
    technology: 'Technology',
    engineering: 'Engineering',
    other: 'Other',
    qualifications: 'Qualifications (e.g., BSc, MSc)',
    experience: 'Years of Experience',
    select_grade: 'Select Your Grade',
    grade1: 'Grade 1',
    grade2: 'Grade 2',
    grade3: 'Grade 3',
    grade4: 'Grade 4',
    grade5: 'Grade 5',
    grade6: 'Grade 6',
    grade7: 'Grade 7',
    grade8: 'Grade 8',
    grade9: 'Grade 9',
    grade10: 'Grade 10',
    password_placeholder: 'Password',
    confirm_password: 'Confirm Password',
    terms: 'I agree to the Terms & Conditions and Privacy Policy',
    create_account: 'Create Account',
    already_have: 'Already have an account?',
    login: 'Login'
};

async function loadTranslations(lang) {
    try {
        const response = await fetch(`./lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        console.log('Translations loaded successfully');
    } catch (error) {
        console.error('Error loading translations:', error);
        console.log('Using default translations');
        translations = defaultTranslations;
    }
    
    applyTranslations();
}

// Apply translations to the page
function applyTranslations() {
    console.log('Applying translations...');
    
    const updateElement = (id, property, value, fallback) => {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element[property] = value;
        } else if (element && fallback) {
            element[property] = fallback;
        }
    };

    updateElement('page-title', 'textContent', translations.title_SignUp, 'Sign Up - Taa Academy');
    updateElement('tagline', 'textContent', translations.tagline, 'Start your STEM journey today!');
    updateElement('student-text', 'textContent', translations.student, 'Student');
    updateElement('teacher-text', 'textContent', translations.teacher, 'Teacher');
    updateElement('create-account-text', 'textContent', translations.create_account, 'Create Account');
    updateElement('already-have-text', 'textContent', translations.already_have, 'Already have an account?');
    updateElement('login-link-text', 'textContent', translations.login, 'Login');

    const firstNameInput = document.getElementById('first-name');
    if (firstNameInput) firstNameInput.placeholder = translations.first_name || 'First Name';

    const lastNameInput = document.getElementById('last-name');
    if (lastNameInput) lastNameInput.placeholder = translations.last_name || 'Last Name';

    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.placeholder = translations.email_placeholder || 'Email Address';

    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.placeholder = translations.phone_placeholder || 'Phone Number';

    const qualInput = document.getElementById('qualifications');
    if (qualInput) qualInput.placeholder = translations.qualifications || 'Qualifications (e.g., BSc, MSc)';

    const expInput = document.getElementById('experience');
    if (expInput) expInput.placeholder = translations.experience || 'Years of Experience';

    const passwordInput = document.getElementById('password');
    if (passwordInput) passwordInput.placeholder = translations.password_placeholder || 'Password';

    const confirmPasswordInput = document.getElementById('confirm-password');
    if (confirmPasswordInput) confirmPasswordInput.placeholder = translations.confirm_password || 'Confirm Password';

    updateElement('select-specialization', 'textContent', translations.select_specialization, 'Select Specialization');
    updateElement('opt-math', 'textContent', translations.mathematics, 'Mathematics');
    updateElement('opt-science', 'textContent', translations.science, 'Science');
    updateElement('opt-tech', 'textContent', translations.technology, 'Technology');
    updateElement('opt-eng', 'textContent', translations.engineering, 'Engineering');
    updateElement('opt-other', 'textContent', translations.other, 'Other');

    updateElement('select-grade', 'textContent', translations.select_grade, 'Select Your Grade');
    updateElement('opt-grade1', 'textContent', translations.grade1 || 'Grade 1', 'Grade 1');
    updateElement('opt-grade2', 'textContent', translations.grade2 || 'Grade 2', 'Grade 2');
    updateElement('opt-grade3', 'textContent', translations.grade3 || 'Grade 3', 'Grade 3');
    updateElement('opt-grade4', 'textContent', translations.grade4 || 'Grade 4', 'Grade 4');
    updateElement('opt-grade5', 'textContent', translations.grade5 || 'Grade 5', 'Grade 5');
    updateElement('opt-grade6', 'textContent', translations.grade6 || 'Grade 6', 'Grade 6');
    updateElement('opt-grade7', 'textContent', translations.grade7 || 'Grade 7', 'Grade 7');
    updateElement('opt-grade8', 'textContent', translations.grade8 || 'Grade 8', 'Grade 8');
    updateElement('opt-grade9', 'textContent', translations.grade9 || 'Grade 9', 'Grade 9');
    updateElement('opt-grade10', 'textContent', translations.grade10 || 'Grade 10', 'Grade 10');

    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    console.log('Translations applied successfully');
}

function setupUserTypeToggle() {
    const studentBtn = document.getElementById('student-btn');
    const teacherBtn = document.getElementById('teacher-btn');
    const studentFields = document.getElementById('student-fields');
    const teacherFields = document.getElementById('teacher-fields');

    if (!studentBtn || !teacherBtn || !studentFields || !teacherFields) {
        console.error('Toggle elements not found');
        return;
    }

    studentBtn.addEventListener('click', () => {
        currentUserType = 'student';
        studentBtn.classList.add('active');
        teacherBtn.classList.remove('active');
        studentFields.style.display = 'block';
        teacherFields.style.display = 'none';
        
        document.getElementById('phone').value = '';
        document.getElementById('specialization').value = '';
        document.getElementById('qualifications').value = '';
        document.getElementById('experience').value = '';
    });

    teacherBtn.addEventListener('click', () => {
        currentUserType = 'teacher';
        teacherBtn.classList.add('active');
        studentBtn.classList.remove('active');
        teacherFields.style.display = 'flex';
        studentFields.style.display = 'none';
        
        document.getElementById('grade-level').value = '';
    });
}

// Password strength checker
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');

    if (!passwordInput || !strengthBar) return;

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;

        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z\d]/.test(password)) strength += 10;

        strengthBar.style.width = strength + '%';
        
        // Update color based on strength
        if (strength <= 25) {
            strengthBar.style.background = '#ef4444';
        } else if (strength <= 50) {
            strengthBar.style.background = '#f59e0b';
        } else if (strength <= 75) {
            strengthBar.style.background = '#10b981';
        } else {
            strengthBar.style.background = '#059669';
        }
    });
}

// Validate form
function validateForm(formData) {
    const { firstName, lastName, email, password, confirmPassword, terms } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return { valid: false, message: currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields' };
    }

    if (password.length < 8) {
        return { valid: false, message: currentLang === 'ar' ? 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters long' };
    }

    if (password !== confirmPassword) {
        return { valid: false, message: currentLang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' };
    }

    if (!terms) {
        return { valid: false, message: currentLang === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'You must agree to the terms and conditions' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: currentLang === 'ar' ? 'عنوان البريد الإلكتروني غير صالح' : 'Invalid email address' };
    }

    // Validate teacher-specific fields
    if (currentUserType === 'teacher') {
        if (!formData.specialization) {
            return { valid: false, message: currentLang === 'ar' ? 'يرجى اختيار التخصص' : 'Please select a specialization' };
        }
    }

    // Validate student-specific fields - GRADE IS REQUIRED
    if (currentUserType === 'student') {
        if (!formData.grade || formData.grade === '') {
            return { valid: false, message: currentLang === 'ar' ? 'يرجى اختيار الصف الدراسي' : 'Please select your grade level' };
        }
        
        // Validate grade is between 1-10
        const gradeNum = parseInt(formData.grade);
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 10) {
            return { valid: false, message: currentLang === 'ar' ? 'يرجى اختيار صف صحيح (1-10)' : 'Please select a valid grade (1-10)' };
        }
    }

    return { valid: true };
}

// Handle form submission
async function handleSignup(e) {
    e.preventDefault();
    console.log('Signup form submitted');

    const submitButton = document.getElementById('submit-btn');
    
    // Get form data
    const formData = {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value,
        terms: document.getElementById('terms').checked
    };

    // Add user-type specific data
    if (currentUserType === 'teacher') {
        formData.phone = document.getElementById('phone').value.trim();
        formData.specialization = document.getElementById('specialization').value;
        formData.qualifications = document.getElementById('qualifications').value.trim();
        formData.experience = document.getElementById('experience').value;
    } else {
        formData.grade = document.getElementById('grade-level').value;
    }

    const validation = validateForm(formData);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.6';
        const btnText = submitButton.querySelector('#create-account-text');
        if (btnText) {
            btnText.textContent = currentLang === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Account...';
        }
    }

    try {
        console.log('Creating user account...');
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Track signup event
        if (window.analytics) {
            window.analytics.trackSignup('email');
        }
        const user = userCredential.user;
        
        console.log('User created:', user.uid);

        // Prepare user data
        const userData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            userType: currentUserType,
            createdAt: new Date().toISOString()
        };

        if (currentUserType === 'teacher') {
            userData.phone = formData.phone || '';
            userData.specialization = formData.specialization;
            userData.qualifications = formData.qualifications || '';
            userData.experience = parseInt(formData.experience) || 0;
            
            await setDoc(doc(db, "teachers", user.uid), userData);
            console.log('Teacher profile created in teachers collection');
            
            localStorage.setItem('userType', 'teacher');
            
            alert(currentLang === 'ar' 
                ? 'تم إنشاء حساب المعلم بنجاح!' 
                : 'Teacher account created successfully!');
            window.location.href = './teacher_dashboard.html';
            
        } else {
            userData.grade = formData.grade;
            
            await setDoc(doc(db, "users", user.uid), userData);
            console.log('Student profile created in users collection with grade:', userData.grade);
            
            // Store user type and grade in localStorage
            localStorage.setItem('userType', 'student');
            localStorage.setItem('userGrade', userData.grade);
            
            // Redirect to student dashboard
            alert(currentLang === 'ar' 
                ? 'تم إنشاء حساب الطالب بنجاح!' 
                : 'Student account created successfully!');
            window.location.href = './dashboard.html';
        }

    } catch (error) {
        console.error('Signup error:', error.code, error.message);

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            const btnText = submitButton.querySelector('#create-account-text');
            if (btnText) {
                btnText.textContent = currentLang === 'ar' ? 'إنشاء حساب' : 'Create Account';
            }
        }

        let errorMessage = 'Signup failed. Please try again.';

        if (currentLang === 'ar') {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'صيغة البريد الإلكتروني غير صالحة.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'حسابات البريد الإلكتروني / كلمة المرور غير مفعلة.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة جدًا. استخدم 6 أحرف على الأقل.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'خطأ في الشبكة. يرجى التحقق من اتصالك.';
                    break;
                default:
                    errorMessage = `فشل التسجيل: ${error.message}`;
            }
        } else {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please login instead.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Use at least 6 characters.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = `Signup failed: ${error.message}`;
            }
        }

        alert(errorMessage);
    }
}

function initializePage() {
    console.log('Initializing signup page...');
    console.log('Current language:', currentLang);

    // Load translations
    loadTranslations(currentLang);

    // Setup user type toggle
    setupUserTypeToggle();

    // Setup password strength indicator
    setupPasswordStrength();

    // Setup form submission
    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', handleSignup);
        console.log('Form submit handler attached');
    } else {
        console.error('Form not found!');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

export { loadTranslations, applyTranslations };