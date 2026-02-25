const BASE_URL = 'http://localhost:3000/api';
let currentFilePreview = null;
let uploadedFilepath = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupDragDrop();
  loadImportHistory();
  
  document.getElementById('fileInput').addEventListener('change', handleFileSelect);

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    loadImportHistory();
  });
});

// Setup drag and drop
function setupDragDrop() {
  const uploadArea = document.getElementById('uploadArea');
  
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });
  
  uploadArea.addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });
}

// Handle file select
function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

// Handle file upload
async function handleFile(file) {
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  
  if (!validTypes.some(type => file.type.includes(type)) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
    alert('Please upload a CSV or Excel file');
    return;
  }

  // Upload and preview file
  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/imports/preview`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    currentFilePreview = result;
    uploadedFilepath = result.filepath;
    showPreview(result);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Show file preview
function showPreview(data) {
  // Hide upload area, show preview section
  document.getElementById('uploadArea').style.display = 'none';
  document.getElementById('previewSection').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';

  // Show file info
  document.getElementById('fileInfo').innerHTML = `
    File: <strong>${escapeHtml(data.filename)}</strong> | 
    Rows: <strong>${data.totalRows}</strong>
  `;

  // Create mapping form
  createMappingForm(data.columns);

  // Show preview table
  showPreviewTable(data.columns, data.preview);

  // Scroll to preview
  document.getElementById('previewSection').scrollIntoView({ behavior: 'smooth' });
}

// Create mapping form
function createMappingForm(columns) {
  const container = document.getElementById('mappingForm');
  const studentFields = ['fullName', 'email', 'phone', 'age', 'grade'];
  
  container.innerHTML = '';
  
  studentFields.forEach(field => {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    
    const select = document.createElement('select');
    select.id = `map_${field}`;
    select.className = 'mapping-select';
    select.innerHTML = '<option value="">Select column...</option>' + 
      columns.map(col => `<option value="${col}">${escapeHtml(col)}</option>`).join('');
    
    // Auto-select matching columns
    const match = columns.find(col => col.toLowerCase().includes(field.toLowerCase()));
    if (match) {
      select.value = match;
    }
    
    row.innerHTML = `<div class="mapping-label">${field}</div>
                     <div class="mapping-arrow">→</div>`;
    row.appendChild(select);
    
    container.appendChild(row);
  });
}

// Show preview table
function showPreviewTable(columns, preview) {
  const thead = document.getElementById('previewTableHead');
  const tbody = document.getElementById('previewTableBody');
  
  thead.innerHTML = `<tr>${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}</tr>`;
  
  tbody.innerHTML = preview.map(row => `
    <tr>
      ${columns.map(col => `<td>${escapeHtml(row[col] || '')}</td>`).join('')}
    </tr>
  `).join('');
}

// Import file
async function importFile() {
  if (!uploadedFilepath) {
    alert('No file selected');
    return;
  }

  // Build mapping
  const mapping = {};
  ['fullName', 'email', 'phone', 'age', 'grade'].forEach(field => {
    const select = document.getElementById(`map_${field}`);
    if (select.value) {
      mapping[select.value] = field;
    }
  });

  if (!mapping['email'] && !Object.values(mapping).includes('email')) {
    alert('Please map Email column - it is required');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/imports/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filepath: uploadedFilepath,
        mapping
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Import failed');
    }

    const result = await response.json();
    showResults(result);
    
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// Show results
function showResults(result) {
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'block';

  let html = `
    <div class="result-item result-success">
      <strong>✓ Import Completed</strong><br>
      Successfully imported: <strong>${result.successCount}</strong> students<br>
      Errors: <strong>${result.failureCount}</strong>
    </div>
  `;

  if (result.errors && result.errors.length > 0) {
    html += '<h3 style="margin-top: 20px;">Errors:</h3>';
    result.errors.forEach(error => {
      html += `<div class="result-item result-error">${escapeHtml(error)}</div>`;
    });
  }

  html += `<button onclick="resetUpload()" class="btn btn-primary" style="margin-top: 20px;">Import Another File</button>`;

  document.getElementById('resultsContent').innerHTML = html;
  
  // Reload history
  loadImportHistory();
}

// Reset upload
function resetUpload() {
  document.getElementById('uploadArea').style.display = 'block';
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('resultsSection').style.display = 'none';
  document.getElementById('fileInput').value = '';
  currentFilePreview = null;
  uploadedFilepath = null;
}

// Load import history
async function loadImportHistory() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/imports/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to load history');
    
    const imports = await response.json();
    renderImportHistory(imports);
  } catch (error) {
    console.error('Error loading import history:', error);
    document.getElementById('historyList').innerHTML = '<p class="error">Error loading history</p>';
  }
}

// Render import history
function renderImportHistory(imports) {
  const container = document.getElementById('historyList');
  
  if (imports.length === 0) {
    container.innerHTML = '<p class="loading">No imports yet</p>';
    return;
  }

  container.innerHTML = imports.map(imp => `
    <div class="history-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(imp.filename)}</h3>
      </div>
      <p class="card-meta">Uploaded: ${new Date(imp.uploadedAt).toLocaleString()}</p>
      <p class="card-meta">Status: <strong>${imp.status}</strong></p>
      <p class="card-meta">Rows Processed: ${imp.rowsProcessed || 0}</p>
      ${imp.errors && imp.errors.length > 0 ? `
        <details style="margin-top: 10px;">
          <summary style="cursor: pointer;">View Errors (${imp.errors.length})</summary>
          <div style="margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 4px;">
            ${imp.errors.map(err => `<p style="margin: 5px 0; color: #c62828;">${escapeHtml(err)}</p>`).join('')}
          </div>
        </details>
      ` : ''}
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
