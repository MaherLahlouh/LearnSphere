//NO FIREBASE-Pure MySQL Backend Version
let students = [];

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
            console.log('Found user data:', user);
            return user.user_id || user.id || user.userId;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    console.error('No user data found in localStorage. Available keys:', Object.keys(localStorage));
    return null;
}

// Debug: Log what's in localStorage on page load
console.log('Current localStorage keys:', Object.keys(localStorage));
console.log('Teacher ID:', getTeacherId());

const modal = document.getElementById('add-student-modal');
const addStudentBtn = document.getElementById('add-student-btn');
const closeModalBtn = document.getElementById('close-modal');
const cancelAddBtn = document.getElementById('cancel-add');
const studentForm = document.getElementById('student-form');

addStudentBtn.addEventListener('click', () => {
    modal.classList.add('active');
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    studentForm.reset();
});

cancelAddBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    studentForm.reset();
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        studentForm.reset();
    }
});

studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('student-first-name').value.trim();
    const lastName = document.getElementById('student-last-name').value.trim();
    const email = document.getElementById('student-email').value.trim().toLowerCase(); // Convert to lowercase
    const studentId = document.getElementById('student-id').value.trim() || `STU${Date.now().toString().slice(-6)}`;
    
    console.log('Adding student:', { firstName, lastName, email, studentId });
    console.log('Current students array:', students);
    
    const emailExists = students.some(s => {
        const existingEmail = s.email.toLowerCase();
        console.log(`Comparing: "${existingEmail}" with "${email}"`);
        return existingEmail === email;
    });
    
    if (emailExists) {
        alert('A student with this email already exists in this class.');
        return;
    }
    
    const student = {
        id: studentId,
        firstName: firstName,
        lastName: lastName,
        email: email, // Store as lowercase
        addedAt: new Date().toISOString()
    };
    
    students.push(student);
    console.log('Student added. Total students:', students.length);
    console.log('Updated students array:', students);
    
    updateStudentList();
    modal.classList.remove('active');
    studentForm.reset();
    
    showToast(`${firstName} ${lastName} added to list!`, 'success');
});

function updateStudentList() {
    const studentList = document.getElementById('student-list');
    const emptyState = document.getElementById('empty-state');
    const countEl = document.getElementById('count');
    
    countEl.textContent = students.length;
    
    if (students.length === 0) {
        emptyState.style.display = 'block';
        studentList.innerHTML = '';
        studentList.appendChild(emptyState);
    } else {
        emptyState.style.display = 'none';
        studentList.innerHTML = students.map((student, index) => `
            <div class="student-item">
                <div class="info">
                    <span><strong>${student.firstName} ${student.lastName}</strong></span>
                    <small>${student.email}</small>
                    <small style="color: #888;">ID: ${student.id}</small>
                </div>
                <div class="actions">
                    <button onclick="removeStudent(${index})" title="Remove student">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
}

window.removeStudent = function(index) {
    if (confirm(`Remove ${students[index].firstName} ${students[index].lastName} from the list?`)) {
        students.splice(index, 1);
        console.log('Student removed. Total students:', students.length);
        updateStudentList();
        showToast('Student removed', 'info');
    }
};

document.getElementById('submit-btn').addEventListener('click', async () => {
    const className = document.getElementById('class-name').value.trim();
    const classGrade = document.getElementById('class-grade').value;
    const classSubject = document.getElementById('class-subject').value.trim();
    const classDescription = document.getElementById('class-description').value.trim();
    const classCapacity = document.getElementById('class-capacity').value;
    
    // Validation
    if (!className || !classGrade || !classSubject) {
        alert('Please fill in all required fields (Class Name, Grade Level, Subject).');
        return;
    }
    
    if (students.length === 0) {
        alert('Please add at least one student to the class.');
        return;
    }
    
    const teacherId = getTeacherId();
    console.log('Teacher ID from localStorage:', teacherId);
    
    if (!teacherId) {
        alert('Teacher not authenticated. Please login again.\n\nDebug info: No user data found in localStorage.\nAvailable keys: ' + Object.keys(localStorage).join(', '));
        
        if (confirm('Would you like to go to the login page?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    const submitBtn = document.getElementById('submit-btn');
    const successMessage = document.getElementById('success-message');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating class...';
    
    try {
        console.log('Creating class with:', {
            teacherId,
            className,
            gradeLevel: parseInt(classGrade),
            subject: classSubject,
            description: classDescription,
            maxCapacity: parseInt(classCapacity)
        });

        const classResponse = await fetch('/api/classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                teacherId: teacherId,
                className: className,
                gradeLevel: parseInt(classGrade),
                subject: classSubject,
                description: classDescription,
                maxCapacity: parseInt(classCapacity)
            })
        });

        const classResult = await classResponse.json();
        console.log('Class creation response:', classResult);
        
        if (!classResult.success) {
            throw new Error(classResult.message || 'Failed to create class');
        }

        const classId = classResult.class.class_id;
        console.log('✅ Class created with ID:', classId);
        
        let successCount = 0;
        let failCount = 0;
        const failedStudents = [];
        const defaultPassword = 'Student123!'; // Default password for all new students
        
        for (const student of students) {
            try {
                console.log(`Processing student: ${student.firstName} ${student.lastName} (${student.email})`);

                // Try to create student user account
                const userResponse = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: student.email,
                        password: defaultPassword,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        userType: 'student',
                        gradeLevel: parseInt(classGrade)
                    })
                });

                const userResult = await userResponse.json();
                console.log(`User creation response for ${student.email}:`, userResult);
                
                let studentUserId;
                if (!userResult.success && userResult.message && userResult.message.includes('already exists')) {
                    console.log(`Student ${student.email} already exists, fetching user...`);
                    
                    const getStudentResponse = await fetch(`/api/users/email/${encodeURIComponent(student.email)}`);
                    const getStudentResult = await getStudentResponse.json();
                    console.log(`Get student response for ${student.email}:`, getStudentResult);
                    
                    if (getStudentResult.success && getStudentResult.user) {
                        studentUserId = getStudentResult.user.user_id;
                        console.log(`✅ Found existing student with ID: ${studentUserId}`);
                    } else {
                        console.error(`❌ Failed to find student: ${student.email}`);
                        failedStudents.push(`${student.firstName} ${student.lastName} (${student.email})`);
                        failCount++;
                        continue;
                    }
                } else if (userResult.success) {
                    studentUserId = userResult.user.user_id;
                    console.log(`✅ Created new student with ID: ${studentUserId}`);
                } else {
                    console.error(`❌ Failed to create student: ${student.email}`, userResult.message);
                    failedStudents.push(`${student.firstName} ${student.lastName} (${student.email})`);
                    failCount++;
                    continue;
                }

                console.log(`Enrolling student ${student.email} in class ${classId}...`);
                const enrollResponse = await fetch('/api/classes/enroll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        classId: classId,
                        studentEmail: student.email,
                        studentClassId: student.id
                    })
                });

                const enrollResult = await enrollResponse.json();
                console.log(`Enrollment response for ${student.email}:`, enrollResult);
                
                if (enrollResult.success) {
                    console.log(`✅ Successfully enrolled ${student.email} in class`);
                    successCount++;
                } else {
                    console.error(`❌ Failed to enroll student: ${student.email}`, enrollResult.message);
                    failedStudents.push(`${student.firstName} ${student.lastName} (${student.email})`);
                    failCount++;
                }
                
            } catch (error) {
                console.error(`❌ Error processing student ${student.email}:`, error);
                failedStudents.push(`${student.firstName} ${student.lastName} (${student.email})`);
                failCount++;
            }
        }
        
        console.log(`Final result: ${successCount} succeeded, ${failCount} failed`);
        
        if (failCount === 0) {
            successMessage.innerHTML = `<i class="fas fa-check-circle"></i> Class "${className}" created successfully! All ${successCount} students added.`;
            successMessage.style.background = '#2ecc71';
        } else if (successCount > 0) {
            successMessage.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                Class "${className}" created! ${successCount} students added successfully, ${failCount} failed.
                ${failedStudents.length > 0 ? '<br><small>Failed: ' + failedStudents.join(', ') + '</small>' : ''}
            `;
            successMessage.style.background = '#f39c12';
        } else {
            successMessage.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                Class "${className}" created but failed to add students. Please add them manually from the teacher dashboard.
            `;
            successMessage.style.background = '#e74c3c';
        }
        
        successMessage.classList.add('show');
        
        document.getElementById('class-form').reset();
        students = [];
        updateStudentList();
        
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            window.location.href = 'teacher_dashboard.html';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error creating class:', error);
        alert('Error creating class: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Create Class';
    }
});

function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        info: '#3498db',
        warning: '#f39c12'
    };
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    
    toast.style.cssText = `
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    toast.innerHTML = `
        <i class="fas fa-${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        
        .success-message.show {
            display: block;
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Teacher Create Class script loaded successfully');
console.log('📊 Debug Info:');
console.log('  - localStorage keys:', Object.keys(localStorage));
console.log('  - Teacher ID:', getTeacherId());
console.log('  - Current students:', students.length);