const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();
const db = require('./database');
const { router: authRouter, verifyToken } = require('./auth');
const examsRouter = require('./exams');
const importsRouter = require('./imports');
const examExamplesRouter = require('./exam-examples');
const ExamRulesEngine = require('./rules-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedMimes.includes(file.mimetype) || /\.(pdf|doc|docx|txt|ppt|pptx)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, PPT, and PPTX files are allowed.'));
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth Routes
app.use('/api/auth', authRouter);

// Exam Routes
app.use('/api/exams', examsRouter);

// Import Routes
app.use('/api/imports', importsRouter);

// Exam Examples Routes
app.use('/api/exam-examples', examExamplesRouter);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

app.get('/exams', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/exams.html'));
});

app.get('/exam-examples', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/exam-examples.html'));
});

app.get('/templates', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/templates.html'));
});

app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/import.html'));
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/courses.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/ai-exam-generator', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ai-exam-generator.html'));
});

// API Routes
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
  
  // Validation
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

// Get all courses
app.get('/api/courses', verifyToken, (req, res) => {
  db.db.all('SELECT * FROM courses ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// Get single course
app.get('/api/courses/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.db.get('SELECT * FROM courses WHERE id = ?', [id], (err, course) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  });
});

// Create a new course
app.post('/api/courses', verifyToken, (req, res) => {
  const { name, description, instructor, semester } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Course name is required' });
  }

  db.db.run(
    'INSERT INTO courses (name, description, instructor, semester, createdBy) VALUES (?, ?, ?, ?, ?)',
    [name, description, instructor, semester, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Course created successfully' });
    }
  );
});

// Update a course
app.put('/api/courses/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, description, instructor, semester } = req.body;
  
  db.db.run(
    'UPDATE courses SET name=?, description=?, instructor=?, semester=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
    [name, description, instructor, semester, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Course updated successfully' });
    }
  );
});

// Delete a course
app.delete('/api/courses/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.db.run('DELETE FROM courses WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Course deleted successfully' });
  });
});

// Bulk upload courses
app.post('/api/courses/bulk-upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const fileName = req.file.originalname.toLowerCase();
    const fileSize = req.file.size;

    // Create a course entry for the uploaded document
    const courseName = req.file.originalname.replace(/\.[^.]+$/, '').trim();
    
    if (!courseName) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return res.status(400).json({ error: 'Invalid file name' });
    }

    db.db.run(
      'INSERT INTO courses (name, description, instructor, semester, createdBy) VALUES (?, ?, ?, ?, ?)',
      [courseName, `Document: ${req.file.originalname} (${(fileSize / 1024).toFixed(2)} KB)`, '', '', req.userId],
      function(err) {
        if (err) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
          return res.status(500).json({ error: err.message });
        }

        // Clean up uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });

        res.json({
          message: 'Course created from document successfully!',
          count: 1
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error processing file: ' + err.message });
  }
});

// AI Exam Generation Endpoint
app.post('/api/ai/generate-exam', verifyToken, async (req, res) => {
  const { subject, numQuestions, difficulty, examTitle, description, questionTypes, selectedCourses, selectedExamples } = req.body;

  // Validate inputs
  if (!subject || !numQuestions || !difficulty || !examTitle || !questionTypes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get teacher's exam examples and style
    db.getExamExamplesByTeacher(req.userId, (err, examples) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      db.getTeacherExamStyle(req.userId, (styleErr, teacherStyle) => {
        try {
          // Parse the examples data
          let parsedExamples = (examples || []).map(ex => ({
            ...ex,
            extractedData: ex.extractedData ? JSON.parse(ex.extractedData) : null,
            patterns: ex.patterns ? JSON.parse(ex.patterns) : null
          }));

          // Filter examples if specific ones were selected
          if (selectedExamples && selectedExamples.length > 0) {
            parsedExamples = parsedExamples.filter(ex => 
              selectedExamples.includes(ex.id)
            );
          }

          // Initialize Rules Engine with teacher's style and selected examples
          const rulesEngine = new ExamRulesEngine(teacherStyle, parsedExamples);

          // Get selected courses list for context
          const selectedCoursesList = selectedCourses && selectedCourses.length > 0 ? selectedCourses : null;

          // Generate exam using rules engine
          const generatedExam = rulesEngine.generateExam({
            subject,
            numQuestions: parseInt(numQuestions),
            difficulty,
            examTitle,
            description,
            questionTypes: questionTypes.split(','),
            selectedCourses: selectedCoursesList
          });

          // Return the generated exam
          res.json({
            title: generatedExam.title,
            subject: generatedExam.subject,
            difficulty: generatedExam.difficulty,
            description: generatedExam.description,
            questions: generatedExam.questions,
            totalQuestions: generatedExam.totalQuestions,
            generatedFrom: 'rules-engine',
            message: `Exam generated using ${generatedExam.questions.length > 0 && parsedExamples.length > 0 ? 'your teaching style and examples' : 'system templates'}`
          });

        } catch (error) {
          console.error('Error generating exam:', error);
          res.status(500).json({ error: 'Failed to generate exam: ' + error.message });
        }
      });
    });

  } catch (error) {
    console.error('Error generating exam:', error);
    res.status(500).json({ error: 'Failed to generate exam: ' + error.message });
  }
});

// Initialize database and start server
db.initialize(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Student Management Application started successfully!');
  });
});
