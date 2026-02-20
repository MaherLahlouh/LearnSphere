let allStudents = [];
let filteredStudents = [];
let currentUser = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let allCourses = [];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const API_BASE_URL = '/api';

function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return (first + last).toUpperCase() || '??';
}

function getGradeBadgeClass(grade) {
  return `grade-${grade || '1'}`;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return 'N/A';
  }
}

// Show inline edit modal for teacher profile fields (name or email)
function showEditModal(fieldType, currentValue) {
  const modal = document.createElement('div');
  modal.className = 'edit-modal-overlay';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
    z-index: 1000; font-family: inherit;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white; padding: 24px; border-radius: 12px;
    width: 90%; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  `;

  const isName = fieldType === 'name';
  modalContent.innerHTML = `
    <h3 style="margin: 0 0 16px; color: #115879; font-size: 18px;">Edit ${isName ? 'Full Name' : 'Email'}</h3>
    ${isName ? `
      <div style="margin-bottom: 12px;">
        <label style="display:block; margin-bottom:4px; font-weight:500; color:#333;">First Name</label>
        <input type="text" id="edit-first-name" value="${currentUser.first_name || ''}"
          style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:14px;">
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display:block; margin-bottom:4px; font-weight:500; color:#333;">Last Name</label>
        <input type="text" id="edit-last-name" value="${currentUser.last_name || ''}"
          style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:14px;">
      </div>
    ` : `
      <div style="margin-bottom: 16px;">
        <label style="display:block; margin-bottom:4px; font-weight:500; color:#333;">Email Address</label>
        <input type="email" id="edit-email" value="${currentValue}"
          style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-size:14px;">
      </div>
    `}
    <div style="display:flex; gap:12px; justify-content:flex-end;">
      <button id="modal-cancel" style="padding:10px 20px; background:#6c757d; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">Cancel</button>
      <button id="modal-save" style="padding:10px 20px; background:#115879; color:white; border:none; border-radius:6px; cursor:pointer; font-size:14px;">Save Changes</button>
    </div>
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Close modal helpers
  const closeModal = () => document.body.removeChild(modal);

  document.getElementById('modal-cancel').onclick = closeModal;
  modal.onclick = e => { if (e.target === modal) closeModal(); };

  document.getElementById('modal-save').onclick = async () => {
    let updateData = {};

    if (isName) {
      const firstName = document.getElementById('edit-first-name').value.trim();
      const lastName  = document.getElementById('edit-last-name').value.trim();
      if (!firstName || !lastName) {
        alert('Please fill in both name fields');
        return;
      }
      updateData = { first_name: firstName, last_name: lastName };
    } else {
      const email = document.getElementById('edit-email').value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
      updateData = { email };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update');
      }

      // Persist updated user locally
      currentUser = { ...currentUser, ...result.user };
      if (currentUser.user_id && !currentUser.id) currentUser.id = currentUser.user_id;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      // Refresh the relevant UI elements
      if (isName) {
        const fullName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        document.getElementById('settings-name').textContent = fullName || 'Not set';
        document.getElementById('teacher-name').textContent  = fullName || 'Teacher';
        document.getElementById('teacher-avatar').src =
          `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=115879&color=fff`;
      } else {
        document.getElementById('settings-email').textContent = currentUser.email || 'Not set';
      }

      if (typeof showToast === 'function') {
        showToast('Profile updated successfully!', 'success');
      } else {
        alert('✅ Profile updated!');
      }

      closeModal();

    } catch (error) {
      console.error('❌ [EDIT] Update failed:', error);
      alert('❌ Failed to update: ' + error.message);
    }
  };
}

// Authentication Check — redirects non-teachers away
function checkAuth() {
  const userData = localStorage.getItem('currentUser');

  if (!userData) {
    console.error('❌ [AUTH CHECK] No user data found in localStorage');
    alert('Please login first');
    window.location.href = 'login.html';
    return null;
  }

  try {
    const user = JSON.parse(userData);

    if (user.user_type !== 'teacher') {
      console.error('❌ [AUTH CHECK] User is not a teacher:', user.user_type);
      alert('Access denied. This page is only for teachers.');
      window.location.href = 'dashboard.html';
      return null;
    }

    return user;
  } catch (error) {
    console.error('❌ [AUTH CHECK] Error parsing user data:', error);
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
    return null;
  }
}

// Student Management
function renderStudentsTable(students) {
  const container = document.getElementById('students-container');

  if (students.length === 0) {
    container.innerHTML = `
      <div class="no-students" style="padding: 48px; text-align: center;">
        <i class="fas fa-user-graduate" style="font-size: 64px; color: #ccc; margin-bottom: 16px;"></i>
        <h3 style="color: #666; font-size: 20px; margin-bottom: 8px;">No Students Found</h3>
        <p style="color: #999;">There are no students registered yet or matching your search criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <table class="grades-table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
          <th style="padding: 12px; text-align: left;">Student</th>
          <th style="padding: 12px; text-align: left;">Email</th>
          <th style="padding: 12px; text-align: left;">Grade Level</th>
          <th style="padding: 12px; text-align: left;">Joined Date</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(student => `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 12px;">
              <div class="student-name" style="display: flex; align-items: center; gap: 12px;">
                <div class="student-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #115879; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600;">${getInitials(student.first_name, student.last_name)}</div>
                <span style="font-weight: 500;">${student.first_name || 'Unknown'} ${student.last_name || 'Student'}</span>
              </div>
            </td>
            <td style="padding: 12px; color: #666;">${student.email || 'N/A'}</td>
            <td style="padding: 12px;">
              <span class="grade-badge ${getGradeBadgeClass(student.grade_level)}" style="display: inline-block; padding: 4px 12px; background: #e3f2fd; color: #1976d2; border-radius: 12px; font-size: 12px; font-weight: 600;">
                Grade ${student.grade_level || 'N/A'}
              </span>
            </td>
            <td style="padding: 12px; color: #666;">${formatDate(student.created_at)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function loadStudents() {
  // Error state also targets students-container to match where success content goes
  const container = document.getElementById('students-container');

  try {
    console.log('📚 [STUDENTS] Loading students from API...');

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different API response shapes
    let users = [];
    if (Array.isArray(data)) {
      users = data;
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else if (data.data && Array.isArray(data.data)) {
      users = data.data;
    } else {
      throw new Error('Unexpected API response format');
    }

    allStudents = users.filter(user => user.user_type === 'student');

    document.getElementById('total-students').textContent = allStudents.length;

    if (allStudents.length > 0) {
      const totalGrade = allStudents.reduce((sum, student) => {
        const grade = parseInt(student.grade_level);
        return sum + (isNaN(grade) ? 0 : grade);
      }, 0);
      document.getElementById('avg-grade').textContent = (totalGrade / allStudents.length).toFixed(1);
    } else {
      document.getElementById('avg-grade').textContent = '-';
    }

    filteredStudents = [...allStudents];
    renderStudentsTable(filteredStudents);

  } catch (error) {
    console.error('❌ [STUDENTS] Error loading students:', error);

    container.innerHTML = `
      <div class="no-students" style="padding: 48px; text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 64px; color: #e74c3c; margin-bottom: 16px;"></i>
        <h3 style="color: #e74c3c; font-size: 20px; margin-bottom: 8px;">Error Loading Students</h3>
        <p style="color: #666; margin-bottom: 12px;">Failed to load student data from the server.</p>
        <button class="btn-primary-action" onclick="location.reload()" style="padding: 10px 20px; background: #115879; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
          <i class="fas fa-refresh"></i> Retry
        </button>
      </div>
    `;
  }
}

function filterStudents() {
  const searchInput = document.getElementById('search-input');
  const gradeFilter = document.getElementById('grade-filter');

  if (!searchInput || !gradeFilter) return;

  const searchTerm      = searchInput.value.toLowerCase();
  const gradeFilterValue = gradeFilter.value;

  filteredStudents = allStudents.filter(student => {
    const matchesSearch =
      (student.first_name || '').toLowerCase().includes(searchTerm) ||
      (student.last_name  || '').toLowerCase().includes(searchTerm) ||
      (student.email      || '').toLowerCase().includes(searchTerm);

    const matchesGrade = gradeFilterValue === 'all' || student.grade_level == gradeFilterValue;

    return matchesSearch && matchesGrade;
  });

  renderStudentsTable(filteredStudents);
}

// Course Management
async function loadCourses() {
  try {
    console.log('📚 [COURSES] Loading courses from API...');

    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allCourses = await response.json();
    renderCourses(allCourses);

  } catch (error) {
    console.error('❌ [COURSES] Error loading courses:', error);
  }
}

function renderCourses(courses) {
  const coursesContainer = document.querySelector('.courses-grid');
  if (!coursesContainer) return;

  if (courses.length === 0) {
    coursesContainer.innerHTML = `
      <div class="no-courses" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
        <i class="fas fa-book" style="font-size: 64px; color: #ccc; margin-bottom: 16px;"></i>
        <h3 style="color: #666; font-size: 20px; margin-bottom: 8px;">No Courses Yet</h3>
        <p style="color: #999;">Create your first course to get started!</p>
      </div>
    `;
    return;
  }

  coursesContainer.innerHTML = courses.map(course => `
    <div class="course-card">
      <div class="course-card-header">
        <div class="course-icon">
          <i class="${getCourseIconClass(course.grade)}"></i>
        </div>
        <h3>${course.class_name || 'Untitled Course'}</h3>
      </div>
      <p class="course-description">${course.description || 'No description available'}</p>
      <div class="course-stats">
        <div class="stat">
          <i class="fas fa-users"></i>
          <span id="course-students-${course.id}">Loading...</span>
        </div>
        <div class="stat">
          <i class="fas fa-graduation-cap"></i>
          <span>Grade ${course.grade || 'N/A'}</span>
        </div>
      </div>
      <div class="course-actions">
        <button class="btn-view-details" onclick="viewCourseDetails(${course.id})">
          <i class="fas fa-eye"></i> View Details
        </button>
        <button class="btn-manage" onclick="manageStudents(${course.id})">
          <i class="fas fa-user-edit"></i> Manage
        </button>
      </div>
    </div>
  `).join('');

  // Fetch real enrollment counts from the API for each course card
  courses.forEach(course => loadCourseEnrollmentCount(course.id));
}

function getCourseIconClass(grade) {
  if (grade <= 6) return 'fas fa-child';
  if (grade <= 8) return 'fas fa-user-graduate';
  return 'fas fa-graduation-cap';
}

async function loadCourseEnrollmentCount(courseId) {
  const element = document.getElementById(`course-students-${courseId}`);

  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/class/${courseId}`);

    if (!response.ok) {
      if (response.status === 404) {
        if (element) element.textContent = '0 Students';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const enrollments = await response.json();
    const count = enrollments.length;
    if (element) element.textContent = `${count} Student${count !== 1 ? 's' : ''}`;

  } catch (error) {
    console.error(`❌ Error loading enrollment count for course ${courseId}:`, error);
    if (element) element.textContent = '0 Students';
  }
}

// Navigate to full course details page
window.viewCourseDetails = function(courseId) {
  window.location.href = `Course-details.html?id=${courseId}`;
};

// Navigate to course details page, anchored to the manage section
window.manageStudents = function(courseId) {
  window.location.href = `Course-details.html?id=${courseId}#manage`;
};

// Calendar Management
function renderCalendar() {
  const calendarGrid  = document.getElementById('calendar-grid');
  const monthYearEl   = document.getElementById('current-month-year');

  if (!calendarGrid || !monthYearEl) return;

  monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay       = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  const today          = new Date();

  calendarGrid.innerHTML = '';

  // Day-of-week headers
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.textContent    = day;
    dayHeader.style.fontWeight  = '700';
    dayHeader.style.color       = 'var(--primary-teal)';
    dayHeader.style.textAlign   = 'center';
    dayHeader.style.padding     = '8px';
    calendarGrid.appendChild(dayHeader);
  });

  // Trailing days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className   = 'calendar-day other-month';
    day.textContent = daysInPrevMonth - i;
    calendarGrid.appendChild(day);
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.className   = 'calendar-day';
    day.textContent = i;

    if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      day.classList.add('today');
    }

    day.addEventListener('click', () => {
      alert(`Selected: ${monthNames[currentMonth]} ${i}, ${currentYear}`);
    });

    calendarGrid.appendChild(day);
  }

  // Leading days for next month to fill 6-row grid (42 cells total)
  const remainingCells = 42 - calendarGrid.children.length;
  for (let i = 1; i <= remainingCells; i++) {
    const day = document.createElement('div');
    day.className   = 'calendar-day other-month';
    day.textContent = i;
    calendarGrid.appendChild(day);
  }
}

// Settings Management
function loadSettings() {
  if (!currentUser) return;

  const nameEl= document.getElementById('settings-name');
  const emailEl= document.getElementById('settings-email');
  const lastLoginEl= document.getElementById('last-login');

  if (nameEl)      nameEl.textContent      = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Not set';
  if (emailEl)     emailEl.textContent     = currentUser.email || 'Not set';
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString();
}

// View Management — switches which section is visible
function switchView(viewName) {
  document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));

  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) targetView.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'students':  'Students',
    'courses':   'Courses',
    'schedule':  'Schedule',
    'settings':  'Settings'
  };

  document.getElementById('page-title').textContent = titles[viewName] || 'Dashboard';

  if (viewName === 'students' && allStudents.length === 0) {
    loadStudents();
  } else if (viewName === 'courses' && allCourses.length === 0) {
    loadCourses();
  } else if (viewName === 'schedule') {
    renderCalendar();
  } else if (viewName === 'settings') {
    loadSettings();
  }
}

// Initialize Teacher Profile in the sidebar
function initializeTeacherProfile() {
  if (!currentUser) return;

  const teacherName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Teacher';
  document.getElementById('teacher-name').textContent = teacherName;
  document.getElementById('teacher-avatar').src =
    `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=115879&color=fff`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎬 [INIT] Teacher Dashboard initializing...');

  currentUser = checkAuth();
  if (!currentUser) return;

  // Normalize user ID field (API may return user_id instead of id)
  if (currentUser.user_id && !currentUser.id) currentUser.id = currentUser.user_id;

  initializeTeacherProfile();
  loadStudents();
  loadCourses();

  // Both buttons navigate to the same place — shared handler avoids duplication
  const goToCreateClass = () => { window.location.href = 'teacher-create-class.html'; };
  const createClassBtn  = document.getElementById('create-class-btn');
  const createClassNav  = document.getElementById('create-class-nav');
  if (createClassBtn) createClassBtn.addEventListener('click', goToCreateClass);
  if (createClassNav) createClassNav.addEventListener('click', goToCreateClass);

  const teacherCoursesNav = document.getElementById('teacher-courses-nav');
  if (teacherCoursesNav) {
    teacherCoursesNav.addEventListener('click', () => {
      window.location.href = 'teacher_courses.html';
    });
  }

  // Sidebar navigation tabs
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const viewName = this.getAttribute('data-view');
      if (viewName) {
        navItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        switchView(viewName);
      }
    });
  });

  const searchInput = document.getElementById('search-input');
  const gradeFilter = document.getElementById('grade-filter');
  if (searchInput) searchInput.addEventListener('input', filterStudents);
  if (gradeFilter)  gradeFilter.addEventListener('change', filterStudents);

  const addCourseBtn = document.getElementById('add-course-btn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => {
      alert('Add Course functionality will be implemented soon!');
    });
  }

  // Calendar month navigation
  const prevMonthBtn = document.getElementById('prev-month-btn');
  const nextMonthBtn = document.getElementById('next-month-btn');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) { currentMonth = 11; currentYear--; }
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) { currentMonth = 0; currentYear++; }
      renderCalendar();
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'landing_page.html';
      }
    });
  }

  // Edit profile buttons
  const editNameBtn  = document.getElementById('edit-name-btn');
  const editEmailBtn = document.getElementById('edit-email-btn');
  if (editNameBtn)  editNameBtn.addEventListener('click', () => showEditModal('name', null));
  if (editEmailBtn) editEmailBtn.addEventListener('click', () => showEditModal('email', currentUser.email));
});