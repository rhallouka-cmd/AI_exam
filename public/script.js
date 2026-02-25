// Student Management System - Frontend JavaScript

let currentEditingId = null;
let authToken = null;

// DOM Elements
const studentForm = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const fullNameInput = document.getElementById('fullName');
const ageInput = document.getElementById('age');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const gradeInput = document.getElementById('grade');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const studentsTable = document.getElementById('studentsTable');
const studentsTableBody = document.getElementById('studentsTableBody');
const noStudentsMsg = document.getElementById('noStudents');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    authToken = localStorage.getItem('token');
    
    if (!authToken) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
    }

    loadStudents();
    studentForm.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    searchInput.addEventListener('input', handleSearch);
    refreshBtn.addEventListener('click', loadStudents);

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
        loadStudents();
    });
});

// Load all students
async function loadStudents() {
    try {
        const response = await fetch('/api/students', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to load students');
        }
        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        console.error('Error loading students:', error);
        showAlert('Error loading students. Please try again.', 'error');
    }
}

// Display students in table
function displayStudents(students) {
    studentsTableBody.innerHTML = '';

    if (students.length === 0) {
        studentsTable.style.display = 'none';
        noStudentsMsg.style.display = 'block';
        return;
    }

    studentsTable.style.display = 'table';
    noStudentsMsg.style.display = 'none';

    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${escapeHtml(student.fullName)}</td>
            <td>${student.age || '-'}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${student.phone || '-'}</td>
            <td>${student.grade || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-edit" onclick="editStudent(${student.id})">Edit</button>
                    <button class="btn btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
                </div>
            </td>
        `;
        studentsTableBody.appendChild(row);
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        fullName: fullNameInput.value.trim(),
        age: ageInput.value ? parseInt(ageInput.value) : null,
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        grade: gradeInput.value.trim()
    };

    // Validate required fields
    if (!formData.fullName || !formData.email) {
        showAlert('Please fill in all required fields (Full Name, Email)', 'error');
        return;
    }

    try {
        let response;
        let successMsg;

        if (currentEditingId) {
            // Update existing student
            response = await fetch(`/api/students/${currentEditingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(formData)
            });
            successMsg = 'Student updated successfully!';
        } else {
            // Create new student
            response = await fetch('/api/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(formData)
            });
            successMsg = 'Student added successfully!';
        }

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            const error = await response.json();
            throw new Error(error.error || 'Failed to save student');
        }

        showAlert(successMsg, 'success');
        resetForm();
        loadStudents();
    } catch (error) {
        console.error('Error saving student:', error);
        showAlert(error.message || 'Error saving student. Please try again.', 'error');
    }
}

// Edit student
async function editStudent(id) {
    try {
        const response = await fetch(`/api/students/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to load student');
        }
        const student = await response.json();

        // Populate form with student data
        studentIdInput.value = student.id;
        fullNameInput.value = student.fullName;
        ageInput.value = student.age || '';
        emailInput.value = student.email;
        phoneInput.value = student.phone || '';
        gradeInput.value = student.grade || '';

        currentEditingId = id;
        submitBtn.textContent = 'Update Student';
        submitBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';

        // Scroll to form
        studentForm.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading student:', error);
        showAlert('Error loading student details. Please try again.', 'error');
    }
}

// Delete student
async function deleteStudent(id) {
    const confirmed = confirm('Are you sure you want to delete this student?');
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/students/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error(data.error || 'Failed to delete student');
        }

        showAlert('Student deleted successfully!', 'success');
        loadStudents();
    } catch (error) {
        console.error('Error deleting student:', error);
        showAlert(error.message || 'Error deleting student. Please try again.', 'error');
    }
}

// Reset form
function resetForm() {
    studentForm.reset();
    studentIdInput.value = '';
    currentEditingId = null;
    submitBtn.textContent = 'Add Student';
    submitBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// Search students
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        loadStudents();
        return;
    }

    const rows = studentsTableBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const fullName = row.cells[1].textContent.toLowerCase();
        const email = row.cells[3].textContent.toLowerCase();
        const phone = row.cells[4].textContent.toLowerCase();

        if (fullName.includes(searchTerm) || email.includes(searchTerm) || phone.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    if (visibleCount === 0 && studentsTableBody.children.length > 0) {
        noStudentsMsg.style.display = 'block';
        noStudentsMsg.querySelector('p').textContent = 'No students match your search.';
    } else {
        noStudentsMsg.style.display = 'none';
    }
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const formSection = document.querySelector('.form-section');
    formSection.insertBefore(alertDiv, formSection.firstChild);

    // Auto-remove alert after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
}
