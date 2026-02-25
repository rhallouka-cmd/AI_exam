const BASE_URL = 'http://localhost:3000/api';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    loadDashboardData();
  });
});

// Load dashboard data
async function loadDashboardData() {
  try {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    // Update welcome message with translation and username
    const welcomeMsg = t('dashboard.welcomeUser', { name: username || 'Teacher' });
    document.getElementById('welcomeMsg').textContent = welcomeMsg;

    // Load all data in parallel
    const [classesRes, templatesRes, examsRes, studentsRes] = await Promise.all([
      fetch(`${BASE_URL}/exams/classes`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${BASE_URL}/exams/templates`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${BASE_URL}/exams`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${BASE_URL}/students`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    if (!classesRes.ok || !templatesRes.ok || !examsRes.ok || !studentsRes.ok) {
      throw new Error('Failed to load data');
    }

    const classes = await classesRes.json();
    const templates = await templatesRes.json();
    const exams = await examsRes.json();
    const students = await studentsRes.json();

    // Update stats
    document.getElementById('classCount').textContent = classes.length;
    document.getElementById('templateCount').textContent = templates.length;
    document.getElementById('examCount').textContent = exams.length;
    document.getElementById('studentCount').textContent = students.length;

    // Show recent items
    showRecentExams(exams);
    showRecentTemplates(templates);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Show recent exams
function showRecentExams(exams) {
  const container = document.getElementById('recentExams');
  const recent = exams.slice(0, 3);

  if (recent.length === 0) {
    container.innerHTML = '<p class="loading">No exams yet</p>';
    return;
  }

  container.innerHTML = recent.map(exam => `
    <div class="exam-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(exam.title)}</h3>
      </div>
      <p class="card-meta">Marks: ${exam.totalMarks}</p>
      <p class="card-meta">Duration: ${exam.durationMinutes} mins</p>
      <div class="card-status status-${exam.status}">${exam.status}</div>
      <a href="/exams" class="btn btn-primary" style="margin-top: 15px; display: block; text-align: center; text-decoration: none;">Manage</a>
    </div>
  `).join('');
}

// Show recent templates
function showRecentTemplates(templates) {
  const container = document.getElementById('recentTemplates');
  const recent = templates.slice(0, 3);

  if (recent.length === 0) {
    container.innerHTML = '<p class="loading">No templates yet</p>';
    return;
  }

  container.innerHTML = recent.map(template => `
    <div class="template-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(template.name)}</h3>
      </div>
      <p class="card-meta">${template.description || 'No description'}</p>
      <p class="card-meta">Questions: ${template.questions ? template.questions.length : 0}</p>
      <a href="/templates" class="btn btn-primary" style="margin-top: 15px; display: block; text-align: center; text-decoration: none;">Edit</a>
    </div>
  `).join('');
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
