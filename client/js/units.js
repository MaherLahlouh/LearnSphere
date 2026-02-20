const urlParams = new URLSearchParams(window.location.search);
const grade = urlParams.get('grade');
const userGrade = localStorage.getItem('userGrade');
let currentLang = localStorage.getItem('language') || 'en';
let unitsData = [];

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.body.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.lang = lang;
  updateUILanguage();
  if (unitsData.length > 0) renderUnits(unitsData);
}

// Update "Back to Dashboard", "Select a unit", etc. based on current language
function updateUILanguage() {
  var translations = {
    en: {
      backText: 'Back to Dashboard',
      selectUnitText: 'Select a unit to begin your lesson',
      langText: 'AR',
      gradeTitle: `Grade ${grade} Units`
    },
    ar: {
      backText: 'العودة إلى لوحة التحكم',
      selectUnitText: 'اختر وحدة لبدء درسك',
      langText: 'EN',
      gradeTitle: `وحدات الصف ${grade}`
    }
  };

  const t = translations[currentLang];
  if (document.getElementById('backText')) {
    document.getElementById('backText').textContent = t.backText;
  }
  if (document.getElementById('selectUnitText')) {
    document.getElementById('selectUnitText').textContent = t.selectUnitText;
  }
  if (document.getElementById('langText')) {
    document.getElementById('langText').textContent = t.langText;
  }
  if (document.getElementById('gradeTitle')) {
    document.getElementById('gradeTitle').textContent = t.gradeTitle;
  }
}

if (document.getElementById('langToggle')) {
  document.getElementById('langToggle').addEventListener('click', () => {
    setLanguage(currentLang === 'en' ? 'ar' : 'en');
  });
}

// Students can only see their own grade
if (userGrade && grade !== userGrade) {
  alert('You can only access your assigned grade level.');
  window.location.href = 'dashboard.html';
}
if (!grade) {
  window.location.href = 'dashboard.html';
}

// Which units the user has completed (stored in localStorage)
function getCompletedUnits() {
  const completed = localStorage.getItem('taa_completed_units');
  return completed ? new Set(JSON.parse(completed)) : new Set();
}

function isUnitUnlocked(grade, unitNumber) {
  return unitNumber >= 1 && unitNumber <= 5;
}

async function fetchUnitsFromAPI(gradeLevel) {
  try {
    const response = await fetch(`/api/units/${encodeURIComponent(gradeLevel)}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error('Invalid units data format from server');
    }
    
    // Map the data correctly - backend now returns title/description as objects
    return result.data.map(unit => ({
      id: unit.unit_number,
      title: unit.title, // Now contains { en: "...", ar: "..." }
      desc: unit.description, // Now contains { en: "...", ar: "..." }
      unitId: unit.unit_id
    }));
  } catch (error) {
    console.error('Units API Error:', error);
    if (document.getElementById('unitsContainer')) {
      document.getElementById('unitsContainer').innerHTML = `
        <div class="error-message" style="text-align: center; padding: 40px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 3em; color: #ff6b6b;"></i>
          <p style="font-size: 1.2em; margin-top: 20px;">
            ${currentLang === 'ar' ? 'فشل تحميل الوحدات' : 'Failed to load units'}
          </p>
          <p style="color: #888; margin-top: 10px;">
            ${error.message}
          </p>
        </div>
      `;
    }
    return [];
  }
}


function renderUnits(units) {
  const container = document.getElementById('unitsContainer');
  if (!container) return;

  if (units.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 60px;">
        <i class="fas fa-book-open fa-3x" style="opacity:0.3; margin-bottom: 20px;"></i>
        <p style="font-size: 1.1em; color: #666;">
          ${currentLang === 'ar' ? 'لا توجد وحدات متاحة لهذا الصف' : 'No units available for this grade'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = units.map((unit, index) => {
    const unlocked = isUnitUnlocked(grade, unit.id);
    const cardClass = unlocked ? '' : 'locked';
    const clickAction = unlocked 
      ? `window.location.href='lesson.html?grade=${grade}&unit=${unit.id}'` 
      : '';
    
    const title = unit.title?.[currentLang] || unit.title?.en || `Unit ${unit.id}`;
    const desc = unit.desc?.[currentLang] || unit.desc?.en || '';
    
    return `
      <div class="unit-card ${cardClass}" ${unlocked ? `onclick="${clickAction}"` : ''}>
        <div class="unit-icon">${index + 1}</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
        ${!unlocked ? `<div class="lock-overlay"><i class="fas fa-lock lock-icon"></i></div>` : ''}
      </div>
    `;
  }).join('');
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function initUnitsPage() {
  setLanguage(currentLang);
  unitsData = await fetchUnitsFromAPI(grade);
  renderUnits(unitsData);
  
  const darkModeIcon = document.getElementById('dark-mode-icon');
  if (darkModeIcon) {
    const isDark = typeof darkMode !== 'undefined' && darkMode.isEnabled && darkMode.isEnabled();
    darkModeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUnitsPage);
} else {
  initUnitsPage();
}

window.addEventListener('darkModeChanged', (e) => {
  const icon = document.getElementById('dark-mode-icon');
  if (icon) {
    icon.className = e.detail.isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
});