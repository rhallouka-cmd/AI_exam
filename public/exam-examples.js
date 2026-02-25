// Exam Examples & Courses Manager - Frontend Logic
document.addEventListener('DOMContentLoaded', function() {
    setupLanguageFromStorage();
    applyLanguageTranslations();
    setupDragDropExam();
    setupDragDropCourse();
    loadExamExamples();
    loadCourses();
});

// Language from storage
function setupLanguageFromStorage() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    window.currentLanguage = savedLanguage;
}

// Setup drag and drop for exam examples
function setupDragDropExam() {
    const uploadArea = document.getElementById('examUploadArea');
    const fileInput = document.getElementById('examFileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
        }
    });
}

// Setup drag and drop for courses
function setupDragDropCourse() {
    const uploadArea = document.getElementById('courseUploadArea');
    const fileInput = document.getElementById('courseFileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
        }
    });
}

// Upload exam examples
async function uploadExamExamples() {
    const fileInput = document.getElementById('examFileInput');
    const courseName = document.getElementById('examCourseName').value;
    const uploadBtn = document.getElementById('examUploadBtn');

    if (!fileInput.files.length) {
        showAlert(translate('examExamples.selectFiles'), 'error');
        return;
    }

    const formData = new FormData();
    for (let file of fileInput.files) {
        formData.append('files', file);
    }
    if (courseName) {
        formData.append('courseName', courseName);
    }

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> ' + translate('examExamples.uploading');

    try {
        const response = await fetch('/api/exam-examples/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(translate('examExamples.uploadSuccess'), 'success');
            fileInput.value = '';
            document.getElementById('examCourseName').value = '';
            loadExamExamples();
        } else {
            showAlert(data.error || translate('examExamples.uploadError'), 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert(translate('examExamples.uploadError'), 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = translate('examExamples.uploadButton');
    }
}

// Upload course materials
async function uploadCourseMaterials() {
    const fileInput = document.getElementById('courseFileInput');
    const courseName = document.getElementById('courseMaterialName').value;
    const uploadBtn = document.getElementById('courseUploadBtn');

    if (!fileInput.files.length) {
        showAlert(translate('examExamples.selectFiles'), 'error');
        return;
    }

    if (!courseName.trim()) {
        showAlert(translate('examExamples.courseName') + ' ' + translate('examExamples.required'), 'error');
        return;
    }

    const formData = new FormData();
    for (let file of fileInput.files) {
        formData.append('files', file);
    }
    formData.append('courseName', courseName);

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="loading-spinner"></span> ' + translate('examExamples.uploading');

    try {
        const response = await fetch('/api/exam-examples/upload-course', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(translate('examExamples.uploadSuccess'), 'success');
            fileInput.value = '';
            document.getElementById('courseMaterialName').value = '';
            loadCourses();
        } else {
            showAlert(data.error || translate('examExamples.uploadError'), 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert(translate('examExamples.uploadError'), 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = translate('examExamples.uploadButton');
    }
}

// Load exam examples
async function loadExamExamples() {
    try {
        const response = await fetch('/api/exam-examples', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        displayExamExamples(data.examples || []);
        updateStats(data.statistics || {});
    } catch (error) {
        console.error('Load error:', error);
    }
}

// Load courses
async function loadCourses() {
    try {
        const response = await fetch('/api/exam-examples/courses', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        displayCourses(data.courses || []);
    } catch (error) {
        console.error('Load error:', error);
    }
}

// Display exam examples
function displayExamExamples(examples) {
    const container = document.getElementById('examExamplesList');

    if (!examples || examples.length === 0) {
        container.innerHTML = '<div class="no-items" data-i18n="examExamples.noExamples">No exam examples uploaded yet.</div>';
        applyLanguageTranslations();
        return;
    }

    container.innerHTML = examples.map(exam => `
        <div class="item-card">
            <div class="item-info">
                <div class="item-name">📄 ${escapeHtml(exam.fileName)}</div>
                <div class="item-meta">
                    ${exam.courseName ? `<strong>${translate('examExamples.course')}:</strong> ${escapeHtml(exam.courseName)} | ` : ''}
                    <strong>${translate('examExamples.questions')}:</strong> ${exam.questionCount || 0} | 
                    <strong>${translate('examExamples.uploaded')}:</strong> ${new Date(exam.uploadedAt).toLocaleDateString()}
                </div>
            </div>
            <div class="btn-group">
                <button class="btn-small btn-view" onclick="viewExamDetails(${exam.id})" data-i18n="examExamples.view">View</button>
                <button class="btn-small btn-delete" onclick="deleteExamExample(${exam.id})" data-i18n="examExamples.delete">Delete</button>
            </div>
        </div>
    `).join('');
    applyLanguageTranslations();
}

// Display courses
function displayCourses(courses) {
    const container = document.getElementById('coursesList');

    if (!courses || courses.length === 0) {
        container.innerHTML = '<div class="no-items" data-i18n="examExamples.noCourses">No courses uploaded yet.</div>';
        applyLanguageTranslations();
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="item-card course">
            <div class="item-info">
                <div class="item-name">📚 ${escapeHtml(course.courseName)}</div>
                <div class="item-meta">
                    <strong>${translate('examExamples.file')}:</strong> ${escapeHtml(course.fileName)} | 
                    <strong>${translate('examExamples.topics')}:</strong> ${course.topicCount || 0} | 
                    <strong>${translate('examExamples.uploaded')}:</strong> ${new Date(course.uploadedAt).toLocaleDateString()}
                </div>
            </div>
            <div class="btn-group">
                <button class="btn-small btn-delete" onclick="deleteCourseMaterial(${course.id})" data-i18n="examExamples.delete">Delete</button>
            </div>
        </div>
    `).join('');
    applyLanguageTranslations();
}

// Update statistics
function updateStats(stats) {
    document.getElementById('examplesCount').textContent = stats.examplesCount || 0;
    document.getElementById('coursesCount').textContent = stats.coursesCount || 0;
    document.getElementById('questionsCount').textContent = stats.questionsCount || 0;
}

// View exam details
async function viewExamDetails(id) {
    try {
        const response = await fetch(`/api/exam-examples/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load');

        const data = await response.json();
        const exam = data.example;

        let detailsHtml = `
            <h3>${escapeHtml(exam.fileName)}</h3>
            <p><strong>${translate('examExamples.course')}:</strong> ${exam.courseName || 'N/A'}</p>
            <p><strong>${translate('examExamples.questionsExtracted')}:</strong> ${exam.questionCount || 0}</p>
        `;

        if (exam.extractedData && exam.extractedData.questions) {
            detailsHtml += '<h4>Questions Found:</h4><ul>';
            exam.extractedData.questions.slice(0, 5).forEach((q, i) => {
                detailsHtml += `<li>${i+1}. ${escapeHtml(q.substring(0, 100))}...</li>`;
            });
            if (exam.extractedData.questions.length > 5) {
                detailsHtml += `<li>... and ${exam.extractedData.questions.length - 5} more</li>`;
            }
            detailsHtml += '</ul>';
        }

        alert(detailsHtml);
    } catch (error) {
        console.error('Error:', error);
        showAlert(translate('examExamples.loadError'), 'error');
    }
}

// Delete exam example
async function deleteExamExample(id) {
    if (!confirm(translate('examExamples.deleteConfirm'))) return;

    try {
        const response = await fetch(`/api/exam-examples/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showAlert(translate('examExamples.deleteSuccess'), 'success');
            loadExamExamples();
        } else {
            showAlert(translate('examExamples.deleteError'), 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert(translate('examExamples.deleteError'), 'error');
    }
}

// Delete course material
async function deleteCourseMaterial(id) {
    if (!confirm(translate('examExamples.deleteConfirm'))) return;

    try {
        const response = await fetch(`/api/exam-examples/course/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            showAlert(translate('examExamples.deleteSuccess'), 'success');
            loadCourses();
        } else {
            showAlert(translate('examExamples.deleteError'), 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showAlert(translate('examExamples.deleteError'), 'error');
    }
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// Show alert
function showAlert(message, type = 'info') {
    const container = document.getElementById('alertContainer');
    const alertId = Date.now();
    
    const alert = document.createElement('div');
    alert.id = `alert-${alertId}`;
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') alert.style.background = '#4caf50';
    if (type === 'error') alert.style.background = '#f44336';
    if (type === 'info') alert.style.background = '#2196F3';
    
    alert.textContent = message;
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Translate
function translate(key) {
    const parts = key.split('.');
    let value = translations[window.currentLanguage || 'en'];
    
    for (let part of parts) {
        value = value?.[part];
    }
    
    return value || key;
}

// Apply language translations
function applyLanguageTranslations() {
    const currentLang = window.currentLanguage || 'en';
    const dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const parts = key.split('.');
        let value = translations[currentLang];
        
        for (let part of parts) {
            value = value?.[part];
        }
        
        if (value) {
            el.textContent = value;
        }
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        const parts = key.split('.');
        let value = translations[currentLang];
        
        for (let part of parts) {
            value = value?.[part];
        }
        
        if (value) {
            el.setAttribute(attr, value);
        }
    });
}
