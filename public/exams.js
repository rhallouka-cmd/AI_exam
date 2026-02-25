const BASE_URL = 'http://localhost:3000/api';
let allClasses = [];
let allTemplates = [];
let allExams = [];
let currentExamFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadClasses();
  loadTemplates();
  loadExams();
  
  document.getElementById('classForm').addEventListener('submit', createClass);
  document.getElementById('examForm').addEventListener('submit', createExam);
  document.getElementById('examQuestionForm').addEventListener('submit', addExamQuestion);

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    loadClasses();
    loadTemplates();
    loadExams();
  });
});

// Load classes
async function loadClasses() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/classes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load classes');
    
    allClasses = await response.json();
    renderClasses();
    populateClassDropdown();
  } catch (error) {
    console.error('Error loading classes:', error);
    document.getElementById('classList').innerHTML = '<p class="error">Error loading classes</p>';
  }
}

// Render classes
function renderClasses() {
  const container = document.getElementById('classList');
  
  if (allClasses.length === 0) {
    container.innerHTML = '<p class="loading">No classes yet. Create one to get started!</p>';
    return;
  }

  container.innerHTML = allClasses.map(cls => `
    <div class="class-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(cls.name)}</h3>
        <button onclick="deleteClass('${cls.id}')" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.85em;">Delete</button>
      </div>
      <p class="card-meta">Year: ${cls.academicYear || 'N/A'}</p>
      <p class="card-meta">Section: ${cls.section || 'N/A'}</p>
    </div>
  `).join('');
}

// Create class
async function createClass(e) {
  e.preventDefault();
  
  const name = document.getElementById('className').value;
  const academicYear = document.getElementById('academicYear').value;
  const section = document.getElementById('section').value;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/classes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, academicYear, section })
    });

    if (!response.ok) throw new Error('Failed to create class');
    
    document.getElementById('classForm').reset();
    await loadClasses();
    alert('Class created successfully!');
  } catch (error) {
    console.error('Error creating class:', error);
    alert('Error: ' + error.message);
  }
}

// Delete class
async function deleteClass(classId) {
  if (!confirm('Delete this class?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/classes/${classId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete class');
    await loadClasses();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Populate class dropdown
function populateClassDropdown() {
  const select = document.getElementById('classId');
  select.innerHTML = '<option value="">Select Class</option>' + 
    allClasses.map(cls => `<option value="${cls.id}">${escapeHtml(cls.name)}</option>`).join('');
}

// Load templates
async function loadTemplates() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load templates');
    
    allTemplates = await response.json();
    populateTemplateDropdown();
  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

// Populate template dropdown
function populateTemplateDropdown() {
  const select = document.getElementById('templateId');
  select.innerHTML = '<option value="">Create from Scratch</option>' + 
    allTemplates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

// Load exams
async function loadExams() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load exams');
    
    allExams = await response.json();
    filterExams('all');
  } catch (error) {
    console.error('Error loading exams:', error);
    document.getElementById('examsList').innerHTML = '<p class="error">Error loading exams</p>';
  }
}

// Filter exams
function filterExams(status) {
  currentExamFilter = status;
  
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const filtered = status === 'all' ? allExams : allExams.filter(e => e.status === status);
  renderExams(filtered);
}

// Render exams
function renderExams(exams) {
  const container = document.getElementById('examsList');
  
  if (exams.length === 0) {
    container.innerHTML = '<p class="loading">No exams found</p>';
    return;
  }

  container.innerHTML = exams.map(exam => `
    <div class="exam-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(exam.title)}</h3>
      </div>
      <p class="card-meta">Total Marks: ${exam.totalMarks}</p>
      <p class="card-meta">Duration: ${exam.durationMinutes} mins</p>
      <div class="card-status status-${exam.status}">${exam.status.toUpperCase()}</div>
      <div class="card-actions" style="margin-top: 15px;">
        <button onclick="editExam('${exam.id}')" class="btn btn-primary">Manage</button>
        <button onclick="gradeExam('${exam.id}')" class="btn btn-success">Grade</button>
        <button onclick="deleteExam('${exam.id}')" class="btn btn-danger">Delete</button>
      </div>
    </div>
  `).join('');
}

// Create exam
async function createExam(e) {
  e.preventDefault();
  
  const title = document.getElementById('examTitle').value;
  const classId = document.getElementById('classId').value;
  const templateId = document.getElementById('templateId').value;
  const totalMarks = document.getElementById('totalMarks').value;
  const dateScheduled = document.getElementById('examDate').value;
  const durationMinutes = document.getElementById('duration').value;

  if (!classId) {
    alert('Please select a class');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        templateId: templateId || null,
        classId,
        dateScheduled: dateScheduled || null,
        durationMinutes: parseInt(durationMinutes),
        status: 'draft',
        totalMarks: parseInt(totalMarks)
      })
    });

    if (!response.ok) throw new Error('Failed to create exam');
    
    const result = await response.json();
    document.getElementById('examForm').reset();
    await loadExams();
    await editExam(result.id);
    alert('Exam created! Add questions now.');
  } catch (error) {
    console.error('Error creating exam:', error);
    alert('Error: ' + error.message);
  }
}

// Edit exam (manage questions)
async function editExam(examId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load exam');
    
    const exam = await response.json();
    document.getElementById('editExamId').value = examId;
    
    // Show modal
    document.getElementById('examEditorModal').style.display = 'block';
    renderExamQuestions(exam.questions || []);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Add question to exam
async function addExamQuestion(e) {
  e.preventDefault();
  
  const examId = document.getElementById('editExamId').value;
  const type = document.getElementById('editQuestionType').value;
  const text = document.getElementById('editQuestionText').value;
  const marks = document.getElementById('editQuestionMarks').value;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        examId,
        type,
        text,
        marks: parseFloat(marks)
      })
    });

    if (!response.ok) throw new Error('Failed to add question');
    
    document.getElementById('examQuestionForm').reset();
    await editExam(examId);
    alert('Question added!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Render exam questions
function renderExamQuestions(questions) {
  const container = document.getElementById('examQuestionsContent');
  
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p class="loading">No questions yet</p>';
    return;
  }

  container.innerHTML = '<h3>Exam Questions</h3>' + questions.map(q => `
    <div class="question-item">
      <div class="question-item-header">
        <span class="question-type">${q.type.toUpperCase()}</span>
        <button onclick="deleteExamQuestion('${q.id}')" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.8em;">Delete</button>
      </div>
      <div class="question-text">${escapeHtml(q.text)}</div>
      <div class="question-meta">Marks: ${q.marks}</div>
    </div>
  `).join('');
}

// Delete exam question
async function deleteExamQuestion(questionId) {
  const examId = document.getElementById('editExamId').value;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete question');
    await editExam(examId);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Close exam editor
function closeExamEditor() {
  document.getElementById('examEditorModal').style.display = 'none';
  document.getElementById('examQuestionForm').reset();
}

// Grade exam
async function gradeExam(examId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load exam');
    
    const exam = await response.json();
    
    let content = `<h3>${escapeHtml(exam.title)}</h3>
      <p>Total Marks: ${exam.totalMarks}</p>
      <table class="preview-table" style="margin-top: 20px;">
      <thead>
        <tr>
          <th>Student</th>
          <th>Score</th>
          <th>Total</th>
          <th>Feedback</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>`;

    // Fetch students to grade
    const studentsResponse = await fetch(`${BASE_URL}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const students = await studentsResponse.json();

    students.forEach(student => {
      const grade = exam.grades.find(g => g.studentId === student.id);
      content += `
        <tr>
          <td>${escapeHtml(student.fullName)}</td>
          <td><input type="number" id="score_${student.id}" value="${grade?.score || ''}" min="0"></td>
          <td>${exam.totalMarks}</td>
          <td><input type="text" id="feedback_${student.id}" value="${grade?.feedback || ''}" style="width: 100%;"></td>
          <td><button onclick="saveGrade('${examId}', '${student.id}', ${exam.totalMarks})" class="btn btn-success" style="padding: 4px 10px; font-size: 0.8em;">Save</button></td>
        </tr>
      `;
    });

    content += `</tbody></table>`;
    document.getElementById('gradingContent').innerHTML = content;
    document.getElementById('gradingModal').style.display = 'block';
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Save grade
async function saveGrade(examId, studentId, totalMarks) {
  const score = document.getElementById(`score_${studentId}`).value;
  const feedback = document.getElementById(`feedback_${studentId}`).value;

  if (!score) {
    alert('Please enter score');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/grades/${examId}/${studentId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        score: parseFloat(score),
        total: totalMarks,
        feedback: feedback || null
      })
    });

    if (!response.ok) throw new Error('Failed to save grade');
    alert('Grade saved!');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Close grading modal
function closeGradingModal() {
  document.getElementById('gradingModal').style.display = 'none';
}

// Delete exam
async function deleteExam(examId) {
  if (!confirm('Delete this exam?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/${examId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete exam');
    await loadExams();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = '/login';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal on outside click
window.onclick = function(event) {
  const modal = document.getElementById('examEditorModal');
  if (event.target == modal) {
    closeExamEditor();
  }
  const gradingModal = document.getElementById('gradingModal');
  if (event.target == gradingModal) {
    closeGradingModal();
  }
}
