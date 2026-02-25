// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    loadCourses();
    setupFormHandlers();
    setupFileUpload();
});

// Load all courses
function loadCourses() {
    fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(courses => {
        const tbody = document.getElementById('coursesTableBody');
        if (!Array.isArray(courses)) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No courses yet. Create one to get started!</td></tr>`;
            return;
        }
        if (courses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;" data-i18n="courses.noCourses">No courses yet. Create one to get started!</td></tr>`;
            // Translate the message
            const elem = tbody.querySelector('[data-i18n]');
            if (elem) elem.textContent = t('courses.noCourses');
            return;
        }

        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${escapeHtml(course.name)}</td>
                <td>${escapeHtml(course.instructor || '-')}</td>
                <td>${escapeHtml(course.semester || '-')}</td>
                <td>
                    <button class="btn btn-small" onclick="editCourse(${course.id})" data-i18n="btn.edit">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteCourse(${course.id})" data-i18n="btn.delete">Delete</button>
                </td>
            </tr>
        `).join('');
        
        // Apply translations to action buttons
        document.querySelectorAll('[data-i18n="btn.edit"]').forEach(el => {
            el.textContent = t('btn.edit');
        });
        document.querySelectorAll('[data-i18n="btn.delete"]').forEach(el => {
            el.textContent = t('btn.delete');
        });
    })
    .catch(err => showAlert('Error loading courses: ' + err.message, 'error'));
}

// Setup form handlers
function setupFormHandlers() {
    document.getElementById('courseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const courseData = {
            name: document.getElementById('courseName').value,
            description: document.getElementById('courseDescription').value,
            instructor: document.getElementById('instructor').value,
            semester: document.getElementById('semester').value
        };

        fetch('/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(courseData)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'error');
            } else {
                showAlert(t('courses.courseAdded'), 'success');
                document.getElementById('courseForm').reset();
                loadCourses();
            }
        })
        .catch(err => showAlert('Error adding course: ' + err.message, 'error'));
    });

    document.getElementById('editCourseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('editCourseId').value;
        const courseData = {
            name: document.getElementById('editName').value,
            description: document.getElementById('editDescription').value,
            instructor: document.getElementById('editInstructor').value,
            semester: document.getElementById('editSemester').value
        };

        fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(courseData)
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data.error) {
                showAlert(data.error, 'error');
            } else {
                showAlert(t('courses.courseUpdated'), 'success');
                closeEditModal();
                loadCourses();
            }
        })
        .catch(err => showAlert('Error updating course: ' + err.message, 'error'));
    });
}

// Edit course
function editCourse(courseId) {
    fetch(`/api/courses/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(course => {
        if (!course) {
            throw new Error('Course not found');
        }
        document.getElementById('editCourseId').value = course.id;
        document.getElementById('editName').value = course.name;
        document.getElementById('editDescription').value = course.description || '';
        document.getElementById('editInstructor').value = course.instructor || '';
        document.getElementById('editSemester').value = course.semester || '';
        
        document.getElementById('editModal').style.display = 'block';
    })
    .catch(err => showAlert('Error loading course: ' + err.message, 'error'));
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Delete course
function deleteCourse(courseId) {
    if (!confirm(t('msg.deleteConfirm'))) return;

    fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            showAlert(t('courses.courseDeleted'), 'success');
            loadCourses();
        }
    })
    .catch(err => showAlert('Error deleting course: ' + err.message, 'error'));
}

// Setup file upload
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    if (!uploadArea || !fileInput) {
        console.error('Upload elements not found');
        return;
    }
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
}

// Handle file upload
function handleFileUpload(file) {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|txt|ppt|pptx)$/i)) {
        showAlert(t('courses.invalidFileType') || 'Invalid file type. Please upload PDF, DOC, DOCX, TXT, PPT, or PPTX file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showAlert(t('msg.uploading') || 'Uploading...', 'info');
    
    fetch('/api/courses/bulk-upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, 'error');
        } else {
            showAlert((data.message || t('courses.uploadSuccess')) + ` (${data.count} courses)`, 'success');
            loadCourses();
        }
    })
    .catch(err => showAlert('Error uploading file: ' + err.message, 'error'));
}

// Logout function
function logout() {
    if (confirm(t('msg.confirm'))) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
    }
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = 'padding: 15px; margin: 10px 0; border-radius: 5px; animation: slideIn 0.3s ease-in-out;';
    
    if (type === 'error') alert.style.backgroundColor = '#f8d7da';
    if (type === 'success') alert.style.backgroundColor = '#d4edda';
    if (type === 'info') alert.style.backgroundColor = '#d1ecf1';
    
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => alert.remove(), 4000);
}

// Listen for language changes to reload translations
window.addEventListener('languageChanged', () => {
    loadCourses();
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });
});
