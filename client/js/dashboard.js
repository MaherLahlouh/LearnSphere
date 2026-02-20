// Configuration
const API_BASE_URL = '/api';

let translations = {};
let currentLang = localStorage.getItem('userLanguage') || 'en';
let currentUser = null;
let userGrade = null;

// Grade data for all levels
const gradeData = {
  '1': { 
    title: 'Grade 1', 
    badge: 'Beginner', 
    desc: 'Introduction to logic and simple commands', 
    lessons: 12, 
    progress: 0 
  },
  '2': { 
    title: 'Grade 2', 
    badge: 'Beginner', 
    desc: 'Sequences, loops, and basic problem solving', 
    lessons: 14, 
    progress: 0 
  },
  '3': { 
    title: 'Grade 3', 
    badge: 'Intermediate', 
    desc: 'Events, conditions, and interactive stories', 
    lessons: 16, 
    progress: 45 
  },
  '4': { 
    title: 'Grade 4', 
    badge: 'Intermediate', 
    desc: 'Functions, variables, and mini-games', 
    lessons: 18, 
    progress: 0 
  },
  '5': { 
    title: 'Grade 5', 
    badge: 'Advanced', 
    desc: 'Algorithms, debugging, and teamwork projects', 
    lessons: 20, 
    progress: 0 
  },
  '6': { 
    title: 'Grade 6', 
    badge: 'Advanced', 
    desc: 'Advanced logic, robotics, and real-world apps', 
    lessons: 22, 
    progress: 0 
  },
  '7': { 
    title: 'Grade 7', 
    badge: 'Advanced', 
    desc: 'Programming fundamentals and web development', 
    lessons: 24, 
    progress: 0 
  },
  '8': { 
    title: 'Grade 8', 
    badge: 'Expert', 
    desc: 'Data structures and advanced algorithms', 
    lessons: 26, 
    progress: 0 
  },
  '9': { 
    title: 'Grade 9', 
    badge: 'Expert', 
    desc: 'Object-oriented programming and databases', 
    lessons: 28, 
    progress: 0 
  },
  '10': { 
    title: 'Grade 10', 
    badge: 'Expert', 
    desc: 'Full-stack development and final projects', 
    lessons: 30, 
    progress: 0 
  }
};

// Load translation strings for the current language and apply them to the page
async function loadTranslations(lang) {
  try {
    if (lang === 'ar') {
      translations = {
        "dashboard_title": "لوحة التحكم - أكاديمية تاء",
        "student_portal": "بوابة الطالب",
        "lang_btn": "🌐 AR",
        "logout": "تسجيل الخروج",
        "welcome_dashboard": "مرحباً بك في عالمي الرقمي",
        "dashboard_subtitle": "واصل رحلتك التعليمية واستكشف مفاهيم برمجية جديدة",
        "lessons_completed": "الدروس المكتملة",
        "achievements": "الإنجازات المكتسبة",
        "day_streak": "سلسلة الأيام",
        "your_grades": "صفك الدراسي",
        "select_grade_text": "اختر وحدة للوصول إلى الدروس والأنشطة",
        "grade1": "الصف 1",
        "grade2": "الصف 2",
        "grade3": "الصف 3",
        "grade4": "الصف 4",
        "grade5": "الصف 5",
        "grade6": "الصف 6",
        "grade7": "الصف 7",
        "grade8": "الصف 8",
        "grade9": "الصف 9",
        "grade10": "الصف 10",
        "desc_grade1": "مقدمة إلى المنطق والأوامر البسيطة",
        "desc_grade2": "التسلسلات، الحلقات، وحل المشكلات الأساسية",
        "desc_grade3": "الأحداث، الشروط، والقصص التفاعلية",
        "desc_grade4": "الدوال، المتغيرات، والألعاب الصغيرة",
        "desc_grade5": "الخوارزميات، تصحيح الأخطاء، ومشاريع العمل الجماعي",
        "desc_grade6": "المنطق المتقدم، الروبوتات، والتطبيقات الواقعية",
        "desc_grade7": "أساسيات البرمجة وتطوير الويب",
        "desc_grade8": "هياكل البيانات والخوارزميات المتقدمة",
        "desc_grade9": "البرمجة الكائنية وقواعد البيانات",
        "desc_grade10": "تطوير التطبيقات الكاملة والمشاريع النهائية",
        "beginner": "مبتدئ",
        "intermediate": "متوسط",
        "advanced": "متقدم",
        "expert": "خبير",
        "progress": "التقدم",
        "lessons": "دروس",
        "start": "ابدأ",
        "continue": "متابعة",
        "logout_confirm": "هل أنت متأكد أنك تريد تسجيل الخروج?"
      };
    } else {
      translations = {
        "dashboard_title": "Dashboard - Taa Academy",
        "student_portal": "Student Portal",
        "lang_btn": "🌐 EN",
        "logout": "Logout",
        "welcome_dashboard": "Welcome to عالمي الرقمي",
        "dashboard_subtitle": "Continue your learning journey and explore new coding concepts",
        "lessons_completed": "Lessons Completed",
        "achievements": "Achievements Earned",
        "day_streak": "Day Streak",
        "your_grades": "Your Grade Level",
        "select_grade_text": "Select a unit to access lessons and activities",
        "grade1": "Grade 1",
        "grade2": "Grade 2",
        "grade3": "Grade 3",
        "grade4": "Grade 4",
        "grade5": "Grade 5",
        "grade6": "Grade 6",
        "grade7": "Grade 7",
        "grade8": "Grade 8",
        "grade9": "Grade 9",
        "grade10": "Grade 10",
        "desc_grade1": "Introduction to logic and simple commands",
        "desc_grade2": "Sequences, loops, and basic problem solving",
        "desc_grade3": "Events, conditions, and interactive stories",
        "desc_grade4": "Functions, variables, and mini-games",
        "desc_grade5": "Algorithms, debugging, and teamwork projects",
        "desc_grade6": "Advanced logic, robotics, and real-world apps",
        "desc_grade7": "Programming fundamentals and web development",
        "desc_grade8": "Data structures and advanced algorithms",
        "desc_grade9": "Object-oriented programming and databases",
        "desc_grade10": "Full-stack development and final projects",
        "beginner": "Beginner",
        "intermediate": "Intermediate",
        "advanced": "Advanced",
        "expert": "Expert",
        "progress": "Progress",
        "lessons": "Lessons",
        "start": "Start",
        "continue": "Continue",
        "logout_confirm": "Are you sure you want to log out?"
      };
    }
    
    applyTranslations();
    updatePageDirection(lang);
    currentLang = lang;
    localStorage.setItem('userLanguage', lang);
  } catch (error) {
    console.error('Error loading translations:', error);
  }
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translations[key];
      } else if (element.tagName === 'TITLE') {
        element.textContent = translations[key];
      } else {
        element.innerHTML = translations[key];
      }
    }
  });
  
  const langToggleSpan = document.querySelector('#langToggle span');
  if (langToggleSpan) {
    langToggleSpan.textContent = translations.lang_btn || (currentLang === 'en' ? '🌐 EN' : '🌐 AR');
  }
}

function updatePageDirection(lang) {
  if (lang === 'ar') {
    document.body.classList.add('rtl');
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.body.classList.remove('rtl');
    document.documentElement.setAttribute('lang', 'en');
    document.documentElement.setAttribute('dir', 'ltr');
  }
}

// Draw the big grade card (grade number, badge, progress bar, Start/Continue button)
function renderUserGrade(grade) {
  const container = document.getElementById('gradesContainer');
  const data = gradeData[grade];
  
  if (!data) {
    container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Grade information not found.</p>';
    return;
  }

  const badgeClass = data.badge.toLowerCase();
  const progressPercent = data.progress;
  const buttonText = progressPercent > 0 ? (translations.continue || 'Continue') : (translations.start || 'Start');

  container.innerHTML = `
    <div class="grade-card" data-grade="${grade}">
      <div class="grade-card-header">
        <div class="grade-icon">${grade}</div>
        <div class="grade-info">
          <h2 data-i18n="grade${grade}">${translations['grade' + grade] || data.title}</h2>
          <span class="grade-badge" data-i18n="${badgeClass}">${translations[badgeClass] || data.badge}</span>
        </div>
      </div>
      <p data-i18n="desc_grade${grade}">${translations['desc_grade' + grade] || data.desc}</p>
      <div class="grade-progress">
        <div class="progress-header">
          <span data-i18n="progress">${translations.progress || 'Progress'}</span>
          <span>${progressPercent}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      </div>
      <div class="grade-footer">
        <div class="lesson-count">
          <i class="fas fa-book"></i>
          <span>${data.lessons} <span data-i18n="lessons">${translations.lessons || 'Lessons'}</span></span>
        </div>
        <button class="start-btn">${buttonText}</button>
      </div>
    </div>
  `;

  const startBtn = document.querySelector('.start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      window.location.href = `units.html?grade=${grade}`;
    });
  }
}

// Fetch user from API and fill in name, avatar, grade; then show the grade card
async function loadUserData(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
    const data = await response.json();
    
    if (data.success && data.user) {
      const userData = data.user;
      
      const userNameEl = document.getElementById('userName');
      const userAvatarEl = document.getElementById('userAvatar');
      
      if (userNameEl) {
        userNameEl.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'Student';
      }
      
      if (userAvatarEl) {
        userAvatarEl.textContent = (userData.first_name || 'S').charAt(0).toUpperCase();
      }
      
      userGrade = userData.grade_level ? userData.grade_level.toString() : '1';
      localStorage.setItem('userGrade', userGrade);
      renderUserGrade(userGrade);
      
    } else {
      // Fallback to localStorage
      const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (savedUser.first_name) {
        document.getElementById('userName').textContent = `${savedUser.first_name} ${savedUser.last_name || ''}`.trim();
        document.getElementById('userAvatar').textContent = savedUser.first_name.charAt(0).toUpperCase();
      }
      userGrade = savedUser.grade_level ? savedUser.grade_level.toString() : localStorage.getItem('userGrade') || '1';
      renderUserGrade(userGrade);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    
    // Fallback to localStorage
    const savedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (savedUser.first_name) {
      document.getElementById('userName').textContent = `${savedUser.first_name} ${savedUser.last_name || ''}`.trim();
      document.getElementById('userAvatar').textContent = savedUser.first_name.charAt(0).toUpperCase();
    } else {
      document.getElementById('userName').textContent = 'Student';
      document.getElementById('userAvatar').textContent = 'S';
    }
    
    userGrade = savedUser.grade_level ? savedUser.grade_level.toString() : localStorage.getItem('userGrade') || '1';
    renderUserGrade(userGrade);
  }
}

// On load: if we have a saved user, load their data; otherwise show default
function checkAuthentication() {
  const savedUser = localStorage.getItem('currentUser');
  
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      loadUserData(currentUser.user_id);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      // Still try to load with cached grade
      userGrade = localStorage.getItem('userGrade') || '1';
      renderUserGrade(userGrade);
    }
  } else {
    // No saved user, use cached grade or default
    userGrade = localStorage.getItem('userGrade') || '1';
    document.getElementById('userName').textContent = 'Student';
    document.getElementById('userAvatar').textContent = 'S';
    renderUserGrade(userGrade);
  }
}

// Logout: confirm then clear storage and go to landing page
async function handleLogout() {
  const confirmMessage = translations.logout_confirm || 'Are you sure you want to log out?';
  if (confirm(confirmMessage)) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      //Clear all stored data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userGrade');
      
      //Redirect to landing page
      window.location.href = 'landing_page.html';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data and redirect
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userGrade');
      window.location.href = 'landing_page.html';
    }
  }
}

// When page is ready: load language, then user data, then set up buttons
document.addEventListener('DOMContentLoaded', function () {
  loadTranslations(currentLang);
  checkAuthentication();

  var langToggleBtn = document.getElementById('langToggle');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', function () {
      var newLang = currentLang === 'en' ? 'ar' : 'en';
      loadTranslations(newLang);
      if (userGrade) {
        renderUserGrade(userGrade);
      }
    });
  }

  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});