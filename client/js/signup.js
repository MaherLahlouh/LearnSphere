// Track current user type
let currentUserType = 'student';

// Language management
let currentLang = 'en';
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
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        translations = await response.json();
        console.log('✅ [SIGNUP] Translations loaded successfully');
    } catch (error) {
        console.error('❌ [SIGNUP] Error loading translations:', error);
        console.log('ℹ️ [SIGNUP] Using default translations');
        translations = defaultTranslations;
    }
    
    applyTranslations();
}

function applyTranslations() {
    console.log('🔄 [SIGNUP] Applying translations...');
    
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

    console.log('✅ [SIGNUP] Translations applied successfully');
}

function setupUserTypeToggle() {
    const studentBtn = document.getElementById('student-btn');
    const teacherBtn = document.getElementById('teacher-btn');
    const studentFields = document.getElementById('student-fields');
    const teacherFields = document.getElementById('teacher-fields');
    const specializationField = document.getElementById('specialization');
    const gradeLevelField = document.getElementById('grade-level');

    if (!studentBtn || !teacherBtn || !studentFields || !teacherFields) {
        console.error('❌ [SIGNUP] Toggle elements not found');
        return;
    }

    studentBtn.addEventListener('click', () => {
        currentUserType = 'student';
        studentBtn.classList.add('active');
        teacherBtn.classList.remove('active');
        studentFields.style.display = 'block';
        teacherFields.style.display = 'none';
        
        console.log('👤 [SIGNUP] User type switched to: student');
        
        //Remove required from teacher fields, add to student fields
        if (specializationField) {
            specializationField.required = false;
            specializationField.removeAttribute('required');
        }
        if (gradeLevelField) {
            gradeLevelField.required = true;
            gradeLevelField.setAttribute('required', 'required');
        }
        
        // Clear teacher fields
        document.getElementById('phone').value = '';
        document.getElementById('specialization').value = '';
        document.getElementById('qualifications').value = '';
        document.getElementById('experience').value = '';
    });

    teacherBtn.addEventListener('click', () => {
        currentUserType = 'teacher';
        teacherBtn.classList.add('active');
        studentBtn.classList.remove('active');
        teacherFields.style.display = 'block';
        studentFields.style.display = 'none';
        
        console.log('👤 [SIGNUP] User type switched to: teacher');
        
        //Add required to teacher fields, remove from student fields
        if (specializationField) {
            specializationField.required = true;
            specializationField.setAttribute('required', 'required');
        }
        if (gradeLevelField) {
            gradeLevelField.required = false;
            gradeLevelField.removeAttribute('required');
        }
        
        // Clear student fields
        const gradeSelect = document.getElementById('grade-level');
        if (gradeSelect) gradeSelect.value = '';
    });
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strength-bar');

    if (!passwordInput || !strengthBar) {
        console.warn('⚠️ [SIGNUP] Password strength elements not found');
        return;
    }

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;

        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z\d]/.test(password)) strength += 10;

        strengthBar.style.width = strength + '%';
        
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
    
    console.log('✅ [SIGNUP] Password strength checker initialized');
}

function validateForm(formData) {
    const { firstName, lastName, email, password, confirmPassword, terms } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return { 
            valid: false, 
            message: currentLang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields' 
        };
    }

    if (password.length < 6) {
        return { 
            valid: false, 
            message: currentLang === 'ar' ? 'يجب أن تكون كلمة المرور 6 أحرف على الأقل' : 'Password must be at least 6 characters long' 
        };
    }

    if (password !== confirmPassword) {
        return { 
            valid: false, 
            message: currentLang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' 
        };
    }

    if (!terms) {
        return { 
            valid: false, 
            message: currentLang === 'ar' ? 'يجب الموافقة على الشروط والأحكام' : 'You must agree to the terms and conditions' 
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { 
            valid: false, 
            message: currentLang === 'ar' ? 'عنوان البريد الإلكتروني غير صالح' : 'Invalid email address' 
        };
    }

    // Validate student-specific fields
    if (currentUserType === 'student') {
        if (!formData.gradeLevel || formData.gradeLevel === '') {
            return { 
                valid: false, 
                message: currentLang === 'ar' ? 'يرجى اختيار الصف الدراسي' : 'Please select your grade level' 
            };
        }
        
        const gradeNum = parseInt(formData.gradeLevel, 10);
        if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 10) {
            return { 
                valid: false, 
                message: currentLang === 'ar' ? 'يرجى اختيار صف صحيح (1-10)' : 'Please select a valid grade (1-10)' 
            };
        }
    }

    // Validate teacher-specific fields
    if (currentUserType === 'teacher') {
        if (!formData.specialization) {
            return { 
                valid: false, 
                message: currentLang === 'ar' ? 'يرجى اختيار التخصص' : 'Please select a specialization' 
            };
        }
    }

    return { valid: true };
}

async function handleSignup(e) {
    e.preventDefault();
    console.log('\n🚀 [SIGNUP] Form submitted');
    console.log('👤 [SIGNUP] User type:', currentUserType);

    const submitButton = document.getElementById('submit-btn');
    
    // Collect basic form data
    const formData = {
        firstName: document.getElementById('first-name').value.trim(),
        lastName: document.getElementById('last-name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value,
        terms: document.getElementById('terms').checked,
        userType: currentUserType
    };

    // Add user-type specific data
    if (currentUserType === 'teacher') {
        formData.phone = document.getElementById('phone').value.trim() || null;
        formData.specialization = document.getElementById('specialization').value || null;
        formData.qualifications = document.getElementById('qualifications').value.trim() || null;
        formData.experienceYears = document.getElementById('experience').value || null;
    } else if (currentUserType === 'student') {
        const gradeElement = document.getElementById('grade-level');
        formData.gradeLevel = gradeElement ? gradeElement.value : '';
    }

    console.log('📋 [SIGNUP] Form data collected:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userType: formData.userType,
        gradeLevel: formData.gradeLevel,
        specialization: formData.specialization
    });

    // Validate form
    const validation = validateForm(formData);
    if (!validation.valid) {
        console.warn('❌ [SIGNUP] Validation failed:', validation.message);
        alert(validation.message);
        return;
    }

    console.log('✅ [SIGNUP] Form validation passed');

    // Disable button during signup
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.style.opacity = '0.6';
        const btnText = submitButton.querySelector('#create-account-text');
        if (btnText) {
            btnText.textContent = currentLang === 'ar' ? 'جاري إنشاء الحساب...' : 'Creating Account...';
        }
    }

    try {
        console.log('📡 [SIGNUP] Sending registration request to backend...');
        
        // Build request body
        const requestBody = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            userType: formData.userType
        };

        // Add type-specific fields
        if (formData.userType === 'student') {
            requestBody.gradeLevel = parseInt(formData.gradeLevel, 10);
        } else if (formData.userType === 'teacher') {
            requestBody.phone = formData.phone;
            requestBody.specialization = formData.specialization;
            requestBody.qualifications = formData.qualifications;
            if (formData.experienceYears) {
                requestBody.experienceYears = parseInt(formData.experienceYears, 10);
            }
        }

        console.log('📤 [SIGNUP] Request body:', requestBody);
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 [SIGNUP] Response received - Status:', response.status);

        const data = await response.json();
        console.log('📋 [SIGNUP] Response data:', data);

        // Re-enable button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            const btnText = submitButton.querySelector('#create-account-text');
            if (btnText) {
                btnText.textContent = currentLang === 'ar' ? 'إنشاء حساب' : 'Create Account';
            }
        }

        if (!response.ok || !data.success) {
            console.error('❌ [SIGNUP] Registration failed:', data.message);
            
            let errorMsg = data.message || 'Registration failed. Please try again.';
            
            if (currentLang === 'ar') {
                if (errorMsg.includes('already registered')) {
                    errorMsg = 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.';
                } else if (errorMsg.includes('Invalid grade level')) {
                    errorMsg = 'مستوى الصف غير صالح. يجب أن يكون بين 1 و 10.';
                } else if (errorMsg.includes('Missing required fields')) {
                    errorMsg = 'يرجى ملء جميع الحقول المطلوبة.';
                }
            }
            
            alert(errorMsg);
            return;
        }
        
        console.log('🎉 [SIGNUP] Registration successful!');
        
        if (window.analytics) {
            window.analytics.trackSignup('email');
        }
        
        const successMsg = currentLang === 'ar' 
            ? 'تم إنشاء الحساب بنجاح! سيتم توجيهك إلى صفحة تسجيل الدخول...' 
            : 'Account created successfully! Redirecting to login page...';
        
        alert(successMsg);
        
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        
    } catch (error) {
        console.error('💥 [SIGNUP] Error:', error);
        
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            const btnText = submitButton.querySelector('#create-account-text');
            if (btnText) {
                btnText.textContent = currentLang === 'ar' ? 'إنشاء حساب' : 'Create Account';
            }
        }
        
        let errorMsg = currentLang === 'ar' 
            ? 'خطأ في الاتصال. تأكد من تشغيل الخادم.' 
            : 'Connection error. Please make sure the server is running.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMsg = currentLang === 'ar'
                ? 'لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل على المنفذ 3001'
                : 'Cannot connect to server. Make sure server is running on port 3001';
        }
        
        alert(errorMsg);
    }
}

function initializePage() {
    console.log('🚀 Signup Page Initializing...');
    console.log('🌐 Language:', currentLang);
    console.log('👤 User Type:', currentUserType);

    loadTranslations(currentLang);
    setupUserTypeToggle();
    setupPasswordStrength();

    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', handleSignup);
        console.log('✅ Form submit handler attached');
    } else {
        console.error('❌ Form not found!');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

window.debugSignup = {
    clearStorage: () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userGrade');
        console.log('🧹 Cleared auth storage');
    },
    showStorage: () => {
        console.log('currentUser:', JSON.parse(localStorage.getItem('currentUser') || 'null'));
        console.log('userGrade:', localStorage.getItem('userGrade'));
    },
    testConnection: async () => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@test.com',
                    password: '123456',
                    firstName: 'Test',
                    lastName: 'User',
                    userType: 'student',
                    gradeLevel: 5
                })
            });
            const data = await res.json();
            console.log('Test response:', data);
        } catch (e) {
            console.error('Connection test failed:', e);
        }
    },
    simulateStudentData: () => {
        document.getElementById('first-name').value = 'Ahmad';
        document.getElementById('last-name').value = 'Ali';
        document.getElementById('email').value = 'student' + Date.now() + '@test.com';
        document.getElementById('password').value = 'password123';
        document.getElementById('confirm-password').value = 'password123';
        document.getElementById('grade-level').value = '7';
        document.getElementById('terms').checked = true;
        console.log('✅ Filled student form');
    },
    simulateTeacherData: () => {
        document.getElementById('teacher-btn').click();
        setTimeout(() => {
            document.getElementById('first-name').value = 'Dr. Mohammed';
            document.getElementById('last-name').value = 'Ahmed';
            document.getElementById('email').value = 'teacher' + Date.now() + '@test.com';
            document.getElementById('password').value = 'password123';
            document.getElementById('confirm-password').value = 'password123';
            document.getElementById('phone').value = '+966501234567';
            document.getElementById('specialization').value = 'mathematics';
            document.getElementById('qualifications').value = 'PhD Mathematics';
            document.getElementById('experience').value = '8';
            document.getElementById('terms').checked = true;
            console.log('✅ Filled teacher form');
        }, 100);
    }
};

console.log('🔐 Signup System Initialized');
console.log('💡 Type window.debugSignup in console for helper tools');