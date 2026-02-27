let currentUser = null;
let currentCourse = null;
let allStudents = [];
let enrolledStudents = [];
let availableStudents = [];
let courseLessons = [];
let pendingChanges = {
  toAdd: new Set(),
  toRemove: new Set()
};

const API_BASE_URL = '/api';

function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return (first + last).toUpperCase() || '??';
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

//Authentication Check
function checkAuth() {
  const userData = localStorage.getItem('currentUser');

  if (!userData) {
    console.error('❌ [AUTH CHECK] No user data found');
    alert('Please login first');
    window.location.href = 'login.html';
    return null;
  }

  try {
    const user = JSON.parse(userData);

    if (user.user_type !== 'teacher') {
      console.error('❌ [AUTH CHECK] User is not a teacher');
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

//Initialize Teacher Profile
function initializeTeacherProfile() {
  if (!currentUser) return;

  const teacherName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Teacher';
  document.getElementById('teacher-name').textContent = teacherName;

  // avatarUrl is always a valid string so the avatar image is always set
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=115879&color=fff`;
  const avatarEl = document.getElementById('teacher-avatar');
  avatarEl.style.backgroundImage = `url(${avatarUrl})`;
  avatarEl.style.backgroundSize = 'cover';
  avatarEl.style.backgroundPosition = 'center';
  avatarEl.textContent = '';
  // NOTE: If avatarUrl ever becomes optional in the future, add an else branch here
  // that falls back to getInitials(currentUser.first_name, currentUser.last_name)
}

//Get Course ID from URL
function getCourseIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  if (!courseId) {
    console.error('❌ [COURSE] No course ID in URL');
    alert('No course specified');
    window.location.href = 'teacher_dashboard.html';
    return null;
  }

  return courseId;
}

//Load Course Details
async function loadCourseDetails(courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/classes/${courseId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [COURSE] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentCourse = data.class;
    renderCourseInfo(currentCourse);

    await Promise.all([
      loadAllStudents(),
      loadEnrolledStudents(courseId),
      loadCourseLessons(courseId)
    ]);

  } catch (error) {
    console.error('❌ [COURSE] Error loading course:', error);
    alert(`Failed to load course details: ${error.message}`);
  }
}

function renderCourseInfo(course) {
  const courseName = course.class_name || 'Course Name';
  const courseDesc = course.description || 'No description available';
  const courseGrade = course.grade_level || 'N/A';

  const titleEl = document.getElementById('course-title');
  const nameEl = document.getElementById('course-name');
  const descEl = document.getElementById('course-description');
  const gradeEl = document.getElementById('course-grade');

  if (titleEl) titleEl.textContent = courseName;
  if (nameEl) nameEl.textContent = courseName;
  if (descEl) descEl.textContent = courseDesc;
  if (gradeEl) gradeEl.textContent = `Grade ${courseGrade}`;

  const iconElement = document.querySelector('.course-icon i');
  if (iconElement) {
    iconElement.className = getCourseIcon(courseGrade);
  }
}

function getCourseIcon(grade) {
  const gradeNum = parseInt(grade);
  if (gradeNum <= 6) return 'fas fa-child';
  if (gradeNum <= 8) return 'fas fa-user-graduate';
  return 'fas fa-graduation-cap';
}

async function loadAllStudents() {
  try {
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
    }

    allStudents = users.filter(user => user.user_type === 'student');

  } catch (error) {
    console.error('❌ [STUDENTS] Error loading students:', error);
  }
}

async function loadEnrolledStudents(courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/class/${courseId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        enrolledStudents = [];
        renderStudentsTable([]);
        updateAvailableStudents();
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const enrollments = await response.json();
    const enrolledStudentIds = enrollments.map(e => e.user_id);

    enrolledStudents = allStudents.filter(student =>
      enrolledStudentIds.includes(student.user_id)
    );

    const countEl = document.getElementById('enrolled-count');
    if (countEl) {
      countEl.textContent = `${enrolledStudents.length} Students`;
    }

    renderStudentsTable(enrolledStudents);
    updateAvailableStudents();

  } catch (error) {
    console.error('❌ [ENROLLMENT] Error loading enrolled students:', error);
    enrolledStudents = [];
    renderStudentsTable([]);
    updateAvailableStudents();
  }
}

function renderStudentsTable(students) {
  const container = document.getElementById('students-table-container');

  if (!container) {
    console.error('❌ [TABLE] Container element not found!');
    return;
  }

  if (students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-graduate"></i>
        <h3>No Students Enrolled</h3>
        <p>Click "Manage Students" to add students to this course</p>
      </div>
    `;
    return;
  }

  const tableHTML = `
    <table class="students-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Email</th>
          <th>Grade Level</th>
          <th>Joined Date</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(student => `
          <tr>
            <td>
              <div class="student-info">
                <div class="student-avatar">${getInitials(student.first_name, student.last_name)}</div>
                <div>
                  <div class="student-name">${student.first_name || 'Unknown'} ${student.last_name || 'Student'}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="student-email">${student.email || 'N/A'}</div>
            </td>
            <td>
              <span class="grade-badge">Grade ${student.grade_level || 'N/A'}</span>
            </td>
            <td>${formatDate(student.created_at)}</td>
            <td>
              <button class="action-btn btn-remove" onclick="removeStudentFromCourse(${student.user_id})">
                <i class="fas fa-times"></i> Remove
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
}

async function loadCourseLessons(courseId) {
  try {
    const unitId = currentCourse.grade_level || 1;

    console.log('📖 [LESSONS] Using unit ID:', unitId);

    const response = await fetch(`${API_BASE_URL}/lessons/unit/${unitId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 404) {
        courseLessons = [];
        renderLessons([]);
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    courseLessons = await response.json();

    const lessonsCountEl = document.getElementById('lessons-count');
    const totalLessonsBadgeEl = document.getElementById('total-lessons-badge');

    if (lessonsCountEl) lessonsCountEl.textContent = `${courseLessons.length} Lessons`;
    if (totalLessonsBadgeEl) totalLessonsBadgeEl.textContent = `${courseLessons.length} Lessons`;

    renderLessons(courseLessons);

  } catch (error) {
    console.error('❌ [LESSONS] Error loading lessons:', error);
    courseLessons = [];
    renderLessons([]);
  }
}

function renderLessons(lessons) {
  const container = document.getElementById('lessons-container');

  if (!container) {
    console.error('❌ [LESSONS RENDER] Container element not found!');
    return;
  }

  if (lessons.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book-open"></i>
        <h3>No Lessons Available</h3>
        <p>Lessons will appear here once they are added to the course</p>
      </div>
    `;
    return;
  }

  container.innerHTML = lessons.map((lesson, index) => `
    <div class="lesson-item">
      <div class="lesson-number">${lesson.lesson_number || index + 1}</div>
      <div class="lesson-info">
        <div class="lesson-title">${lesson.title || 'Untitled Lesson'}</div>
        <div class="lesson-description">${lesson.description || 'No description'}</div>
        <div class="lesson-meta">
          <span><i class="fas fa-book"></i> ${lesson.book_pages || 'No pages specified'}</span>
          <span><i class="fas fa-video"></i> ${lesson.video_url ? 'Video Available' : 'No Video'}</span>
          ${lesson.page_start && lesson.page_end ? `<span><i class="fas fa-file-alt"></i> Pages ${lesson.page_start} - ${lesson.page_end}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function updateAvailableStudents() {
  const enrolledIds = new Set(enrolledStudents.map(s => s.user_id));
  availableStudents = allStudents.filter(student => !enrolledIds.has(student.user_id));
}

function openManageStudentsModal() {
  const modal = document.getElementById('manage-students-modal');
  if (!modal) {
    console.error('❌ [MODAL] Modal element not found!');
    return;
  }

  modal.classList.add('active');
  pendingChanges.toAdd.clear();
  pendingChanges.toRemove.clear();

  renderAvailableStudentsList();
  renderEnrolledStudentsList();
  updateModalCounts();
}

function closeManageStudentsModal() {
  const modal = document.getElementById('manage-students-modal');
  if (modal) modal.classList.remove('active');
}

function renderAvailableStudentsList() {
  const container = document.getElementById('available-students-list');

  if (!container) {
    console.error('❌ Available students list container not found!');
    return;
  }

  const searchInput = document.getElementById('modal-student-search');
  const gradeFilter = document.getElementById('grade-filter');

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const gradeFilterValue = gradeFilter ? gradeFilter.value : 'all';

  const filtered = availableStudents.filter(student => {
    const matchesSearch =
      (student.first_name || '').toLowerCase().includes(searchTerm) ||
      (student.last_name || '').toLowerCase().includes(searchTerm) ||
      (student.email || '').toLowerCase().includes(searchTerm);

    const matchesGrade = gradeFilterValue === 'all' || student.grade_level == gradeFilterValue;

    return matchesSearch && matchesGrade && !pendingChanges.toAdd.has(student.user_id);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No Available Students</h3>
        <p>All students are already enrolled or match your filters</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(student => `
    <div class="student-list-item">
      <div class="student-list-info">
        <div class="student-avatar">${getInitials(student.first_name, student.last_name)}</div>
        <div class="student-list-details">
          <div class="student-list-name">${student.first_name || 'Unknown'} ${student.last_name || 'Student'}</div>
          <div class="student-list-email">${student.email || 'N/A'}</div>
        </div>
        <span class="grade-badge">Grade ${student.grade_level || 'N/A'}</span>
      </div>
      <button class="action-btn btn-add" onclick="addStudentToPending(${student.user_id})">
        <i class="fas fa-plus"></i> Add
      </button>
    </div>
  `).join('');
}

function renderEnrolledStudentsList() {
  const container = document.getElementById('enrolled-students-list');

  if (!container) {
    console.error('❌ Enrolled students list container not found!');
    return;
  }

  // Merge: enrolled minus pending removals, plus pending additions
  const base = enrolledStudents.filter(student => !pendingChanges.toRemove.has(student.user_id));
  const pendingStudents = allStudents.filter(s => pendingChanges.toAdd.has(s.user_id));
  const students = [...base, ...pendingStudents];

  if (students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-graduate"></i>
        <h3>No Enrolled Students</h3>
        <p>Add students from the Available Students tab</p>
      </div>
    `;
    return;
  }

  container.innerHTML = students.map(student => {
    const isPending = pendingChanges.toAdd.has(student.user_id);
    return `
      <div class="student-list-item ${isPending ? 'pending-add' : ''}">
        <div class="student-list-info">
          <div class="student-avatar">${getInitials(student.first_name, student.last_name)}</div>
          <div class="student-list-details">
            <div class="student-list-name">
              ${student.first_name || 'Unknown'} ${student.last_name || 'Student'}
              ${isPending ? '<span style="color: #2e7d32; font-size: 12px; margin-left: 8px;">(Pending)</span>' : ''}
            </div>
            <div class="student-list-email">${student.email || 'N/A'}</div>
          </div>
          <span class="grade-badge">Grade ${student.grade_level || 'N/A'}</span>
        </div>
        <button class="action-btn btn-remove" onclick="removeStudentFromPending(${student.user_id})">
          <i class="fas fa-times"></i> Remove
        </button>
      </div>
    `;
  }).join('');
}

function updateModalCounts() {
  const availableCount = availableStudents.length - pendingChanges.toAdd.size;
  const enrolledCount = enrolledStudents.length + pendingChanges.toAdd.size - pendingChanges.toRemove.size;

  const availableCountEl = document.getElementById('available-count');
  const enrolledCountEl = document.getElementById('enrolled-tab-count');

  if (availableCountEl) availableCountEl.textContent = availableCount;
  if (enrolledCountEl) enrolledCountEl.textContent = enrolledCount;
}

window.addStudentToPending = function(studentId) {
  pendingChanges.toAdd.add(studentId);
  pendingChanges.toRemove.delete(studentId);
  renderAvailableStudentsList();
  renderEnrolledStudentsList();
  updateModalCounts();
};

window.removeStudentFromPending = function(studentId) {
  if (pendingChanges.toAdd.has(studentId)) {
    pendingChanges.toAdd.delete(studentId);
  } else {
    pendingChanges.toRemove.add(studentId);
  }
  renderAvailableStudentsList();
  renderEnrolledStudentsList();
  updateModalCounts();
};

async function saveStudentChanges() {
  const saveBtn = document.getElementById('save-changes-btn');

  // Helper to reset the save button state
  const resetSaveBtn = () => {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  };

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }

  try {
    for (const studentId of pendingChanges.toAdd) {
      await enrollStudent(currentCourse.class_id, studentId);
    }
    for (const studentId of pendingChanges.toRemove) {
      await unenrollStudent(currentCourse.class_id, studentId);
    }

    await loadEnrolledStudents(currentCourse.class_id);
    closeManageStudentsModal();

  } catch (error) {
    console.error('❌ [SAVE] Error saving changes:', error);
    alert('Failed to save changes. Please try again.');
  } finally {
    // Runs on both success and error — no duplication needed
    resetSaveBtn();
  }
}

async function enrollStudent(classId, userId) {
  const response = await fetch(`${API_BASE_URL}/enrollments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_id: classId, user_id: userId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [ENROLL] Failed:', errorText);
    throw new Error(`Failed to enroll student ${userId}`);
  }

  return response.json();
}

async function unenrollStudent(classId, userId) {
  const response = await fetch(`${API_BASE_URL}/enrollments`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_id: classId, user_id: userId })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [UNENROLL] Failed:', errorText);
    throw new Error(`Failed to unenroll student ${userId}`);
  }

  return response.json();
}

window.removeStudentFromCourse = async function(studentId) {
  if (!confirm('Are you sure you want to remove this student from the course?')) return;

  try {
    await unenrollStudent(currentCourse.class_id, studentId);
    await loadEnrolledStudents(currentCourse.class_id);
  } catch (error) {
    console.error('❌ Error removing student:', error);
    alert('Failed to remove student. Please try again.');
  }
};

function setupSearch() {
  const searchInput = document.getElementById('student-search');
  const modalSearchInput = document.getElementById('modal-student-search');
  const gradeFilter = document.getElementById('grade-filter');

  if (searchInput) {
    searchInput.addEventListener('input', filterEnrolledStudents);
  }
  if (modalSearchInput) {
    modalSearchInput.addEventListener('input', renderAvailableStudentsList);
  }
  if (gradeFilter) {
    gradeFilter.addEventListener('change', renderAvailableStudentsList);
  }
}

function filterEnrolledStudents() {
  const searchInput = document.getElementById('student-search');
  if (!searchInput) return;

  const searchTerm = searchInput.value.toLowerCase();
  const filtered = enrolledStudents.filter(student =>
    (student.first_name || '').toLowerCase().includes(searchTerm) ||
    (student.last_name || '').toLowerCase().includes(searchTerm) ||
    (student.email || '').toLowerCase().includes(searchTerm)
  );

  renderStudentsTable(filtered);
}

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      const tabContent = document.getElementById(`${tabName}-tab`);
      if (tabContent) tabContent.classList.add('active');
    });
  });
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎬 [INIT] Course Details page initializing...');

  currentUser = checkAuth();
  if (!currentUser) return;

  initializeTeacherProfile();

  const courseId = getCourseIdFromURL();
  if (!courseId) return;

  await loadCourseDetails(courseId);

  setupSearch();
  setupTabs();
  setupLogout();

  const manageStudentsBtn = document.getElementById('manage-students-btn');
  const closeModalBtn     = document.getElementById('close-modal-btn');
  const cancelBtn         = document.getElementById('cancel-btn');
  const saveChangesBtn    = document.getElementById('save-changes-btn');

  if (manageStudentsBtn) manageStudentsBtn.addEventListener('click', openManageStudentsModal);
  if (closeModalBtn)     closeModalBtn.addEventListener('click', closeManageStudentsModal);
  if (cancelBtn)         cancelBtn.addEventListener('click', closeManageStudentsModal);
  if (saveChangesBtn)    saveChangesBtn.addEventListener('click', saveStudentChanges);

  // Close modal when clicking the backdrop
  const modal = document.getElementById('manage-students-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeManageStudentsModal();
    });
  }

  console.log('✅ [INIT] Course Details initialized successfully');
});