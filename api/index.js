try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available');
}

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

let db;
try {
  db = require('../src/database');
} catch (e) {
  console.error('Database error:', e.message);
}

let authRouter, examsRouter, importsRouter, examExamplesRouter, verifyToken;
try {
  const auth = require('../src/auth');
  authRouter = auth.router;
  verifyToken = auth.verifyToken;
  examsRouter = require('../src/exams');
  importsRouter = require('../src/imports');
  examExamplesRouter = require('../src/exam-examples');
} catch (e) {
  console.error('Router import error:', e.message);
}

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

const uploadsPath = path.join(__dirname, '../uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
} else {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    app.use('/uploads', express.static(uploadsPath));
  } catch (e) {
    console.log('Cannot create uploads directory');
  }
}

// Auth Routes
if (authRouter) app.use('/api/auth', authRouter);

// Exam Routes
if (examsRouter) app.use('/api/exams', examsRouter);

// Import Routes
if (importsRouter) app.use('/api/imports', importsRouter);

// Exam Examples Routes
if (examExamplesRouter) app.use('/api/exam-examples', examExamplesRouter);

// Student Management Routes
if (verifyToken && db && db.getAllStudents) {
  // Get all students
  app.get('/api/students', verifyToken, (req, res) => {
    db.getAllStudents((err, students) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(students);
    });
  });

  // Get a single student by ID
  app.get('/api/students/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    db.getStudentById(id, (err, student) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json(student);
    });
  });

  // Create a new student
  app.post('/api/students', verifyToken, (req, res) => {
    const { fullName, age, email, phone, grade } = req.body;
    
    if (!fullName || !email) {
      return res.status(400).json({ error: 'Full name and email are required' });
    }

    db.createStudent({ fullName, age, email, phone, grade }, (err, studentId) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: studentId, message: 'Student created successfully' });
    });
  });

  // Update a student
  app.put('/api/students/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const { fullName, age, email, phone, grade } = req.body;

    db.updateStudent(id, { fullName, age, email, phone, grade }, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Student updated successfully' });
    });
  });

  // Delete a student
  app.delete('/api/students/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    
    db.deleteStudent(id, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Student deleted successfully' });
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve HTML files
const serveHtml = (filename) => (req, res) => {
  const filepath = path.join(__dirname, '../public', filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
};

app.get('/', serveHtml('index.html'));
app.get('/dashboard', serveHtml('dashboard.html'));
app.get('/login', serveHtml('login.html'));
app.get('/register', serveHtml('register.html'));
app.get('/exams', serveHtml('exams.html'));
app.get('/templates', serveHtml('templates.html'));
app.get('/courses', serveHtml('courses.html'));
app.get('/import', serveHtml('import.html'));

// Catch-all for unmatched routes - serve index.html for SPA routing
app.get('*', (req, res) => {
  const filepath = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// API not found handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database on first call (non-blocking)
if (db && db.initialize) {
  try {
    db.initialize(() => {
      console.log('Database initialized');
    });
  } catch (e) {
    console.error('Database init error:', e.message);
  }
}

module.exports = app;
