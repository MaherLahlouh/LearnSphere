function getTeacherId() {
    let userData = localStorage.getItem('userData');
    
    if (!userData) {
        userData = localStorage.getItem('user');
    }
    
    if (!userData) {
        userData = localStorage.getItem('teacherData');
    }
    
    if (!userData) {
        userData = localStorage.getItem('currentUser');
    }
    
    if (userData) {
        try {
            const user = JSON.parse(userData);
            return user.user_id || user.id || user.userId;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    return null;
}

async function loadTeacherStudents() {
    const teacherId = getTeacherId();
    
    if (!teacherId) {
        console.error('Teacher not authenticated');
        return;
    }

    try {
        const classesResponse = await fetch(`/api/classes/teacher/${teacherId}`);
        const classesResult = await classesResponse.json();
        
        if (!classesResult.success) {
            console.error('Failed to load classes');
            return;
        }

        const classes = classesResult.classes;
        console.log('Teacher classes:', classes);

        const allStudents = [];
        const studentMap = new Map();// To avoid duplicates

        for (const classItem of classes) {
            const studentsResponse = await fetch(`/api/classes/${classItem.class_id}/students`);
            const studentsResult = await studentsResponse.json();
            
            if (studentsResult.success && studentsResult.students) {
                studentsResult.students.forEach(student => {
                    // Add class name to student object
                    const studentWithClass = {
                        ...student,
                        class_name: classItem.class_name
                    };
                    
                    // Use Map to avoid duplicate students (if they're in multiple classes)
                    if (!studentMap.has(student.user_id)) {
                        studentMap.set(student.user_id, studentWithClass);
                    }
                });
            }
        }

        allStudents.push(...studentMap.values());
        
        console.log('All students:', allStudents);
        displayStudents(allStudents);

    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function displayStudents(students) {
    const container = document.getElementById('students-container');
    
    if (!container) {
        console.error('students-container not found');
        return;
    }

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 48px; color: #ccc;"></i>
                <p>No students enrolled yet</p>
                <p>Create a class and add students to see them here.</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="students-list">
            <h3>All Students in Your Classes (${students.length})</h3>
            <table class="students-table">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Grade Level</th>
                        <th>Class</th>
                        <th>Joined Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>
                                <div class="student-avatar">
                                    ${getInitials(student.first_name, student.last_name)}
                                </div>
                                <span>${student.first_name} ${student.last_name}</span>
                            </td>
                            <td>${student.email}</td>
                            <td><span class="grade-badge">Grade ${student.grade_level || 'N/A'}</span></td>
                            <td>${student.class_name || 'N/A'}</td>
                            <td>${formatDate(student.enrolled_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;
}

// COURSES PAGE - Show teacher's classes (not general courses)
async function loadTeacherClasses() {
    const teacherId = getTeacherId();
    
    if (!teacherId) {
        console.error('Teacher not authenticated');
        return;
    }

    try {
        const response = await fetch(`/api/classes/teacher/${teacherId}`);
        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to load classes');
            return;
        }

        console.log('Teacher classes:', result.classes);
        displayClasses(result.classes);

    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

function displayClasses(classes) {
    const container = document.getElementById('courses-container');
    
    if (!container) {
        console.error('courses-container not found');
        return;
    }

    if (classes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book" style="font-size: 48px; color: #ccc;"></i>
                <p>No classes created yet</p>
                <a href="teacher-create-class.html" class="btn-primary">
                    <i class="fas fa-plus"></i> Create Your First Class
                </a>
            </div>
        `;
        return;
    }

    //Display classes as cards
    const html = `
        <div class="classes-grid">
            ${classes.map(classItem => `
                <div class="class-card">
                    <div class="class-header">
                        <h3>${classItem.class_name}</h3>
                        <span class="grade-badge">Grade ${classItem.grade_level}</span>
                    </div>
                    <div class="class-body">
                        <p class="subject"><i class="fas fa-book"></i> ${classItem.subject}</p>
                        <p class="description">${classItem.description || 'No description'}</p>
                        <div class="class-stats">
                            <span><i class="fas fa-users"></i> ${classItem.current_enrollment || 0}/${classItem.max_capacity} students</span>
                            <span><i class="fas fa-calendar"></i> Created ${formatDate(classItem.created_at)}</span>
                        </div>
                    </div>
                    <div class="class-footer">
                        <button onclick="viewClassDetails(${classItem.class_id})" class="btn-view">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button onclick="manageStudents(${classItem.class_id})" class="btn-manage">
                            <i class="fas fa-users-cog"></i> Manage Students
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = html;
}

function getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function viewClassDetails(classId) {
    window.location.href = `class-details.html?id=${classId}`;
}

function manageStudents(classId) {
    window.location.href = `manage-students.html?classId=${classId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Teacher dashboard script loaded');
    
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('students') || document.getElementById('students-container')) {
        console.log('Loading students page...');
        loadTeacherStudents();
    }
    
    if (currentPath.includes('courses') || currentPath.includes('classes') || document.getElementById('courses-container')) {
        console.log('Loading classes page...');
        loadTeacherClasses();
    }
});

window.loadTeacherStudents = loadTeacherStudents;
window.loadTeacherClasses = loadTeacherClasses;
window.viewClassDetails = viewClassDetails;
window.manageStudents = manageStudents;