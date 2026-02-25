// AI Exam Generator - Frontend Logic
let generatedExam = null;

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    setupLanguageSelector();
    initializeTranslations();
    loadCoursesAndExamples();
    setupFormHandlers();
    checkAuthentication();
});

// Load courses and exam examples
async function loadCoursesAndExamples() {
    try {
        // Fetch courses
        const coursesResponse = await fetch('/api/exam-examples/courses', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            displayCourseCheckboxes(coursesData.courses || []);
        }

        // Fetch exam examples
        const examplesResponse = await fetch('/api/exam-examples', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (examplesResponse.ok) {
            const examplesData = await examplesResponse.json();
            displayExampleCheckboxes(examplesData.examples || []);
        }
    } catch (error) {
        console.error('Error loading courses and examples:', error);
    }
}

// Display course checkboxes
function displayCourseCheckboxes(courses) {
    const container = document.getElementById('coursesList');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;" data-i18n="aiExam.noCourses">No courses uploaded. Upload courses first in Exam Examples Manager.</p>';
        return;
    }

    let html = '<style>.checkbox-list { display: flex; flex-direction: column; gap: 10px; }</style>';
    html += '<div class="checkbox-list">';
    
    courses.forEach(course => {
        html += `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                <input type="checkbox" name="selectedCourses" value="${course.id}" data-course-name="${course.courseName}">
                <span><strong>${course.courseName}</strong></span>
            </label>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Apply translations
    applyLanguageTranslations();
}

// Display exam example checkboxes
function displayExampleCheckboxes(examples) {
    const container = document.getElementById('examplesList');
    
    if (!examples || examples.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;" data-i18n="aiExam.noExamples">No exam examples uploaded. Upload examples first in Exam Examples Manager.</p>';
        return;
    }

    let html = '<style>.checkbox-list { display: flex; flex-direction: column; gap: 10px; }</style>';
    html += '<div class="checkbox-list">';
    
    examples.forEach(example => {
        html += `
            <label style="display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                <input type="checkbox" name="selectedExamples" value="${example.id}" data-example-name="${example.fileName}">
                <span><strong>${example.fileName}</strong> <small>(${example.questionCount} Q)</small></span>
            </label>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Apply translations
    applyLanguageTranslations();
}

// Setup form handlers
function setupFormHandlers() {
    const form = document.getElementById('aiExamForm');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await generateExamWithAI();
    });
}

// Generate exam with AI
async function generateExamWithAI() {
    // Get form data
    const subject = document.getElementById('examSubject').value.trim();
    const numQuestions = parseInt(document.getElementById('numQuestions').value);
    const difficulty = document.getElementById('difficulty').value;
    const examTitle = document.getElementById('examTitle').value.trim();
    const description = document.getElementById('examDescription').value.trim();
    
    // Get selected courses
    const selectedCourseCheckboxes = document.querySelectorAll('input[name="selectedCourses"]:checked');
    const selectedCourses = Array.from(selectedCourseCheckboxes).map(cb => ({
        id: cb.value,
        name: cb.getAttribute('data-course-name')
    }));

    // Get selected exam examples
    const selectedExamplesCheckboxes = document.querySelectorAll('input[name="selectedExamples"]:checked');
    const selectedExamples = Array.from(selectedExamplesCheckboxes).map(cb => ({
        id: cb.value,
        name: cb.getAttribute('data-example-name')
    }));
    
    // Get selected question types
    const questionTypeCheckboxes = document.querySelectorAll('input[name="questionTypes"]:checked');
    const questionTypes = Array.from(questionTypeCheckboxes).map(cb => cb.value);

    // Validate form
    if (!subject || !numQuestions || !difficulty || !examTitle) {
        showAlert(translations.aiExam.fillRequired || 'Please fill in all required fields', 'error');
        return;
    }

    if (questionTypes.length === 0) {
        showAlert(translations.aiExam.selectQuestionType || 'Please select at least one question type', 'error');
        return;
    }

    // Show progress section
    document.getElementById('aiExamForm').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('previewSection').style.display = 'none';

    try {
        // Call backend API
        const response = await fetch('/api/ai/generate-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                subject,
                numQuestions,
                difficulty,
                examTitle,
                description,
                questionTypes: questionTypes.join(','),
                selectedCourses: selectedCourses.map(c => c.id),
                selectedExamples: selectedExamples.map(e => e.id)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate exam');
        }

        const data = await response.json();
        generatedExam = data;

        // Show preview
        displayExamPreview(data);
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'block';

    } catch (error) {
        console.error('Error generating exam:', error);
        showAlert(error.message || 'Failed to generate exam with AI', 'error');
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('aiExamForm').style.display = 'block';
    }
}

// Display exam preview
function displayExamPreview(exam) {
    const previewDiv = document.getElementById('examPreview');
    let html = `
        <div style="margin-bottom: 20px;">
            <h4>${escapeHtml(exam.title)}</h4>
            <p><strong>Subject:</strong> ${escapeHtml(exam.subject)}</p>
            <p><strong>Difficulty:</strong> ${escapeHtml(exam.difficulty)}</p>
            <p><strong>Total Questions:</strong> ${exam.questions.length}</p>
            ${exam.description ? `<p><strong>Instructions:</strong> ${escapeHtml(exam.description)}</p>` : ''}
        </div>
        <hr>
    `;

    exam.questions.forEach((question, index) => {
        html += `
            <div style="margin-bottom: 20px; padding: 15px; background: white; border-left: 4px solid #4CAF50; border-radius: 3px;">
                <p><strong>Question ${index + 1} (${question.type.toUpperCase()})</strong></p>
                <p>${escapeHtml(question.question)}</p>
        `;

        if (question.type === 'mcq') {
            html += '<p><strong>Options:</strong></p><ul>';
            question.options.forEach(opt => {
                html += `<li>${escapeHtml(opt)}</li>`;
            });
            html += '</ul>';
            html += `<p><strong>Answer:</strong> ${escapeHtml(question.answer)}</p>`;
        } else if (question.type === 'shortanswer') {
            html += `<p><strong>Model Answer:</strong> ${escapeHtml(question.answer)}</p>`;
        } else if (question.type === 'essay') {
            html += `<p><strong>Rubric Points:</strong> ${escapeHtml(question.answer)}</p>`;
        }

        html += '</div>';
    });

    previewDiv.innerHTML = html;
}

// Save generated exam
async function saveGeneratedExam() {
    if (!generatedExam) {
        showAlert('No exam to save', 'error');
        return;
    }

    const generateBtn = document.querySelector('button[onclick="saveGeneratedExam()"]');
    generateBtn.disabled = true;
    generateBtn.textContent = translations.msg.saving || 'Saving...';

    try {
        const response = await fetch('/api/exams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                title: generatedExam.title,
                subject: generatedExam.subject,
                description: generatedExam.description,
                difficulty: generatedExam.difficulty,
                totalQuestions: generatedExam.questions.length,
                totalMarks: generatedExam.questions.length, // 1 mark per question
                questions: generatedExam.questions
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save exam');
        }

        const data = await response.json();
        showAlert(translations.aiExam.examSaved || 'Exam saved successfully!', 'success');
        
        // Redirect to exams page after 2 seconds
        setTimeout(() => {
            window.location.href = '/exams';
        }, 2000);

    } catch (error) {
        console.error('Error saving exam:', error);
        showAlert(error.message || 'Failed to save exam', 'error');
        generateBtn.disabled = false;
        generateBtn.textContent = translations.aiExam.save || 'Save Exam';
    }
}

// Reset form
function resetForm() {
    generatedExam = null;
    document.getElementById('aiExamForm').style.display = 'block';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('aiExamForm').reset();
}

// Helper function - escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

// Check authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
}

// Setup language selector
function setupLanguageSelector() {
    const container = document.querySelector('.language-selector');
    if (!container) return;

    const currentLang = localStorage.getItem('language') || 'en';
    
    container.innerHTML = `
        <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
        <button class="lang-btn ${currentLang === 'fr' ? 'active' : ''}" data-lang="fr">FR</button>
        <button class="lang-btn ${currentLang === 'ar' ? 'active' : ''}" data-lang="ar">AR</button>
    `;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            localStorage.setItem('language', lang);
            location.reload();
        });
    });
}

// Initialize translations
function initializeTranslations() {
    const lang = localStorage.getItem('language') || 'en';
    document.documentElement.lang = lang;
    if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.body.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
        document.body.dir = 'ltr';
    }

    // Translate data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = translations;
        
        for (let k of keys) {
            value = value[k];
            if (!value) break;
        }

        if (value) {
            el.textContent = value;
        }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-attr="placeholder"]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = translations;
        
        for (let k of keys) {
            value = value[k];
            if (!value) break;
        }

        if (value) {
            el.placeholder = value;
        }
    });
}
