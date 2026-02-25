const BASE_URL = 'http://localhost:3000/api';
let currentTemplateId = null;
let allTemplates = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
  document.getElementById('templateForm').addEventListener('submit', createTemplate);
  document.getElementById('questionForm').addEventListener('submit', addQuestion);
  document.getElementById('questionType').addEventListener('change', toggleQuestionFields);
  
  // File upload handlers
  const fileDropZone = document.getElementById('fileDropZone');
  const fileInput = document.getElementById('exampleFileInput');
  
  fileDropZone.addEventListener('click', () => fileInput.click());
  fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('drag-over');
  });
  fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('drag-over'));
  fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('drag-over');
    handleFileSelect(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
  
  // Re-render templates when language changes
  window.addEventListener('languageChanged', () => {
    renderTemplates();
  });
});

// Load all templates for teacher
async function loadTemplates() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/templates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load templates');
    
    allTemplates = await response.json();
    renderTemplates();
  } catch (error) {
    console.error('Error loading templates:', error);
    document.getElementById('templatesList').innerHTML = '<p class="error">Error loading templates</p>';
  }
}

// Render templates
function renderTemplates() {
  const container = document.getElementById('templatesList');
  
  if (allTemplates.length === 0) {
    container.innerHTML = '<p class="loading">No templates yet. Create one to get started!</p>';
    return;
  }

  container.innerHTML = allTemplates.map(template => {
    const hasFile = template.exampleFile && template.exampleFile.filename;
    const fileExtension = hasFile ? template.exampleFile.filename.split('.').pop().toUpperCase() : '';
    
    return `
      <div class="template-card">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(template.name)}</h3>
        </div>
        <p class="card-meta">${template.description ? escapeHtml(template.description) : 'No description'}</p>
        <p class="card-meta">Questions: ${template.questions ? template.questions.length : 0}</p>
        ${hasFile ? `
          <div class="template-file-section">
            <h4 class="file-label">📎 Exam Example:</h4>
            <div class="file-item">
              <span class="file-badge">${fileExtension}</span>
              <span class="file-name">${escapeHtml(template.exampleFile.filename)}</span>
              <a href="${template.exampleFile.filepath}" target="_blank" class="btn-file-download" title="Download">⬇️</a>
            </div>
          </div>
        ` : ''}
        <div class="card-actions">
          <button onclick="editTemplate('${template.id}')" class="btn btn-primary">Edit</button>
          <button onclick="deleteTemplate('${template.id}')" class="btn btn-danger">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Create template
async function createTemplate(e) {
  e.preventDefault();
  
  const name = document.getElementById('templateName').value;
  const description = document.getElementById('templateDescription').value;
  const totalMarks = document.getElementById('totalMarks').value;

  try {
    const token = localStorage.getItem('token');
    
    // First create the template
    const templateResponse = await fetch(`${BASE_URL}/exams/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        settings: { totalMarks: parseInt(totalMarks) }
      })
    });

    if (!templateResponse.ok) throw new Error('Failed to create template');
    
    const result = await templateResponse.json();
    const templateId = result.id;
    
    // If file is selected, upload it
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('templateId', templateId);
      
      const fileResponse = await fetch(`${BASE_URL}/exams/templates/upload-example/${templateId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!fileResponse.ok) {
        console.warn('File upload failed, but template created');
      }
    }
    
    // Clear form
    document.getElementById('templateForm').reset();
    removeFile();
    
    // Show question section
    currentTemplateId = templateId;
    document.getElementById('currentTemplateId').value = currentTemplateId;
    document.getElementById('questionSection').style.display = 'block';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // Reload templates
    await loadTemplates();
    alert('Template created! Now add questions.');
  } catch (error) {
    console.error('Error creating template:', error);
    alert('Error creating template: ' + error.message);
  }
}

// Edit template
async function editTemplate(templateId) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/templates/${templateId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load template');
    
    const template = await response.json();
    currentTemplateId = templateId;
    
    // Populate form
    document.getElementById('templateName').value = template.name;
    document.getElementById('templateDescription').value = template.description || '';
    document.getElementById('totalMarks').value = template.settings?.totalMarks || 100;
    document.getElementById('currentTemplateId').value = templateId;
    
    // Show question section
    document.getElementById('questionSection').style.display = 'block';
    renderQuestions(template.questions || []);
    
    // Scroll to form
    document.getElementById('questionSection').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error loading template:', error);
    alert('Error loading template: ' + error.message);
  }
}

// Toggle question fields based on type
function toggleQuestionFields() {
  const type = document.getElementById('questionType').value;
  document.getElementById('optionsDiv').style.display = type === 'mcq' ? 'block' : 'none';
  document.getElementById('correctAnswerDiv').style.display = type === 'mcq' ? 'block' : 'none';
}

// Add question to template
async function addQuestion(e) {
  e.preventDefault();
  
  const templateId = document.getElementById('currentTemplateId').value;
  const type = document.getElementById('questionType').value;
  const text = document.getElementById('questionText').value;
  const marks = document.getElementById('questionMarks').value;
  const difficulty = document.getElementById('questionDifficulty').value;
  const topic = document.getElementById('questionTopic').value;
  
  let options = null;
  let correctAnswer = null;

  if (type === 'mcq') {
    const optionInputs = document.querySelectorAll('.option-input');
    options = Array.from(optionInputs).map(inp => inp.value).filter(v => v);
    correctAnswer = document.getElementById('correctAnswer').value;
    
    if (options.length < 2) {
      alert('Please add at least 2 options for MCQ');
      return;
    }
    
    if (!correctAnswer) {
      alert('Please specify correct answer');
      return;
    }
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        templateId,
        type,
        text,
        options: options ? JSON.stringify(options) : null,
        correctAnswer,
        marks: parseFloat(marks),
        difficulty,
        topic: topic || null
      })
    });

    if (!response.ok) throw new Error('Failed to add question');
    
    // Clear form
    document.getElementById('questionForm').reset();
    document.getElementById('optionsDiv').style.display = 'none';
    
    // Reload template
    await editTemplate(templateId);
    alert('Question added successfully!');
  } catch (error) {
    console.error('Error adding question:', error);
    alert('Error adding question: ' + error.message);
  }
}

// Render questions list
function renderQuestions(questions) {
  const container = document.getElementById('questionsContent');
  
  if (!questions || questions.length === 0) {
    container.innerHTML = '<p class="loading">No questions yet</p>';
    return;
  }

  container.innerHTML = questions.map(q => `
    <div class="question-item">
      <div class="question-item-header">
        <span class="question-type">${q.type.toUpperCase()}</span>
        <button onclick="deleteQuestion('${q.id}')" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.8em;">Delete</button>
      </div>
      <div class="question-text">${escapeHtml(q.text)}</div>
      <div class="question-meta">
        <span>Marks: ${q.marks}</span>
        <span>Difficulty: ${q.difficulty}</span>
        ${q.topic ? `<span>Topic: ${escapeHtml(q.topic)}</span>` : ''}
      </div>
      ${q.options ? `<div class="question-meta">Options: ${JSON.parse(q.options).join(', ')}</div>` : ''}
    </div>
  `).join('');
}

// Delete question
async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete question');
    
    const templateId = document.getElementById('currentTemplateId').value;
    await editTemplate(templateId);
    alert('Question deleted successfully!');
  } catch (error) {
    console.error('Error deleting question:', error);
    alert('Error deleting question: ' + error.message);
  }
}

// Delete template
async function deleteTemplate(templateId) {
  if (!confirm('Are you sure? All questions will be deleted.')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/exams/templates/${templateId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete template');
    
    await loadTemplates();
    alert('Template deleted successfully!');
  } catch (error) {
    console.error('Error deleting template:', error);
    alert('Error deleting template: ' + error.message);
  }
}

// Close question section
function closeQuestionSection() {
  document.getElementById('questionSection').style.display = 'none';
  document.getElementById('questionForm').reset();
  currentTemplateId = null;
}

// Add option input
function addOptionInput() {
  const optionsDiv = document.getElementById('optionsDiv');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'option-input';
  input.placeholder = 'Option';
  optionsDiv.insertBefore(input, optionsDiv.lastElementChild);
}

// Handle file selection
let selectedFile = null;
function handleFileSelect(file) {
  if (!file) return;
  
  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size exceeds 10MB limit');
    return;
  }
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF');
    return;
  }
  
  selectedFile = file;
  
  // Show preview
  const previewContainer = document.getElementById('filePreviewContainer');
  const preview = document.getElementById('filePreview');
  
  const fileIcon = getFileIcon(file.type);
  preview.innerHTML = `
    <div class="file-item">
      <span class="file-badge">${file.name.split('.').pop().toUpperCase()}</span>
      <span class="file-name">${escapeHtml(file.name)}</span>
      <span class="file-size">${(file.size / 1024).toFixed(2)} KB</span>
      <button type="button" class="btn-file-remove" onclick="removeFile()">✕</button>
    </div>
  `;
  previewContainer.style.display = 'block';
}

function removeFile() {
  selectedFile = null;
  document.getElementById('exampleFileInput').value = '';
  document.getElementById('filePreviewContainer').style.display = 'none';
}

function getFileIcon(mimeType) {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('image')) return '🖼️';
  return '📎';
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
