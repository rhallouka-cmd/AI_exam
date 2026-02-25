const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/students.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
const initialize = (callback) => {
  db.serialize(() => {
    // Create users table with role column
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        resetToken TEXT,
        resetTokenExpiry INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table initialized');
      }
    });

    // Create students table
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        age INTEGER,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        grade TEXT,
        classId INTEGER,
        rollNumber TEXT,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating students table:', err);
      } else {
        console.log('Students table initialized');
      }
    });

    // Create classes table
    db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        academicYear TEXT,
        section TEXT,
        teacherId INTEGER NOT NULL,
        metadata TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating classes table:', err);
      } else {
        console.log('Classes table initialized');
      }
    });

    // Create exam_templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS exam_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        createdBy INTEGER NOT NULL,
        settings TEXT,
        exampleFile TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating exam_templates table:', err);
      } else {
        console.log('Exam templates table initialized');
      }
    });

    // Create questions table
    db.run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        templateId INTEGER,
        examId INTEGER,
        type TEXT NOT NULL,
        text TEXT NOT NULL,
        options TEXT,
        correctAnswer TEXT,
        marks REAL DEFAULT 1,
        difficulty TEXT,
        topic TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (templateId) REFERENCES exam_templates(id),
        FOREIGN KEY (examId) REFERENCES exams(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating questions table:', err);
      } else {
        console.log('Questions table initialized');
      }
    });

    // Create exams table
    db.run(`
      CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        templateId INTEGER,
        classId INTEGER,
        teacherId INTEGER NOT NULL,
        dateScheduled DATETIME,
        durationMinutes INTEGER DEFAULT 60,
        status TEXT DEFAULT 'draft',
        totalMarks REAL DEFAULT 100,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (templateId) REFERENCES exam_templates(id),
        FOREIGN KEY (classId) REFERENCES classes(id),
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating exams table:', err);
      } else {
        console.log('Exams table initialized');
      }
    });

    // Create grades table
    db.run(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        examId INTEGER NOT NULL,
        studentId INTEGER NOT NULL,
        questionId INTEGER,
        score REAL,
        total REAL,
        feedback TEXT,
        gradedBy INTEGER,
        gradedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (examId) REFERENCES exams(id),
        FOREIGN KEY (studentId) REFERENCES students(id),
        FOREIGN KEY (questionId) REFERENCES questions(id),
        FOREIGN KEY (gradedBy) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating grades table:', err);
      } else {
        console.log('Grades table initialized');
      }
    });

    // Create imports table
    db.run(`
      CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        uploaderId INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        rowsProcessed INTEGER DEFAULT 0,
        mapping TEXT,
        errors TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        processedAt DATETIME,
        FOREIGN KEY (uploaderId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating imports table:', err);
      } else {
        console.log('Imports table initialized');
        initializeCoursesTable();
      }
    });
  });

  function initializeCoursesTable() {
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        instructor TEXT,
        semester TEXT,
        createdBy INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating courses table:', err);
      } else {
        console.log('Courses table initialized');
        initializeExamExamplesTable();
      }
    });
  }

  function initializeExamExamplesTable() {
    db.run(`
      CREATE TABLE IF NOT EXISTS exam_examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherId INTEGER NOT NULL,
        fileName TEXT,
        courseName TEXT,
        extractedData TEXT,
        patterns TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating exam_examples table:', err);
      } else {
        console.log('Exam examples table initialized');
        initializeCourseMaterialsTable();
      }
    });
  }

  function initializeCourseMaterialsTable() {
    db.run(`
      CREATE TABLE IF NOT EXISTS course_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherId INTEGER NOT NULL,
        courseName TEXT,
        fileName TEXT,
        extractedTopics TEXT,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating course_materials table:', err);
      } else {
        console.log('Course materials table initialized');
        initializeTeacherExamStyleTable();
      }
    });
  }

  function initializeTeacherExamStyleTable() {
    db.run(`
      CREATE TABLE IF NOT EXISTS teacher_exam_style (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacherId INTEGER NOT NULL,
        avgQuestionCount INTEGER DEFAULT 10,
        preferredDifficulty TEXT DEFAULT 'medium',
        questionTypes TEXT DEFAULT '["mcq","shortanswer"]',
        patterns TEXT,
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacherId),
        FOREIGN KEY (teacherId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating teacher_exam_style table:', err);
      } else {
        console.log('Teacher exam style table initialized');
        if (callback) callback(err);
      }
    });
  }
};

// Get all students
const getAllStudents = (callback) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', [], callback);
};

// Get a student by ID
const getStudentById = (id, callback) => {
  db.get('SELECT * FROM students WHERE id = ?', [id], callback);
};

// Create a new student
const createStudent = (student, callback) => {
  const { fullName, age, email, phone, grade } = student;
  const query = `
    INSERT INTO students (fullName, age, email, phone, grade)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [fullName, age, email, phone, grade], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, this.lastID);
    }
  });
};

// Update a student
const updateStudent = (id, student, callback) => {
  const { fullName, age, email, phone, grade } = student;
  const query = `
    UPDATE students
    SET fullName = ?, age = ?, email = ?, phone = ?, grade = ?, updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  db.run(query, [fullName, age, email, phone, grade, id], callback);
};

// Delete a student
const deleteStudent = (id, callback) => {
  db.run('DELETE FROM students WHERE id = ?', [id], callback);
};

// User authentication functions
const createUser = (username, email, hashedPassword, callback) => {
  const query = `
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `;
  db.run(query, [username, email, hashedPassword], function(err) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, this.lastID);
    }
  });
};

const getUserByUsername = (username, callback) => {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
};

const getUserByEmail = (email, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
};

const getUserById = (id, callback) => {
  db.get('SELECT id, username, email FROM users WHERE id = ?', [id], callback);
};

const updatePasswordReset = (email, resetToken, expiry, callback) => {
  db.run(
    'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
    [resetToken, expiry, email],
    callback
  );
};

const getUserByResetToken = (token, callback) => {
  db.get(
    'SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?',
    [token, Date.now()],
    callback
  );
};

const updatePassword = (userId, hashedPassword, callback) => {
  db.run(
    'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
    [hashedPassword, userId],
    callback
  );
};

module.exports = {
  db,
  initialize,
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUserById,
  updatePasswordReset,
  getUserByResetToken,
  updatePassword,
  // Classes
  createClass: (name, academicYear, section, teacherId, callback) => {
    const query = `INSERT INTO classes (name, academicYear, section, teacherId) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, academicYear, section, teacherId], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getClassesByTeacher: (teacherId, callback) => {
    db.all('SELECT * FROM classes WHERE teacherId = ? ORDER BY createdAt DESC', [teacherId], callback);
  },
  getClassById: (id, callback) => {
    db.get('SELECT * FROM classes WHERE id = ?', [id], callback);
  },
  updateClass: (id, name, academicYear, section, callback) => {
    const query = `UPDATE classes SET name = ?, academicYear = ?, section = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [name, academicYear, section, id], callback);
  },
  deleteClass: (id, callback) => {
    db.run('DELETE FROM classes WHERE id = ?', [id], callback);
  },
  // Exam Templates
  createTemplate: (name, description, createdBy, settings, callback) => {
    const query = `INSERT INTO exam_templates (name, description, createdBy, settings) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, description, createdBy, settings], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getTemplatesByTeacher: (teacherId, callback) => {
    db.all('SELECT * FROM exam_templates WHERE createdBy = ? ORDER BY createdAt DESC', [teacherId], (err, templates) => {
      if (err) return callback(err);
      const parsed = templates.map(t => ({
        ...t,
        exampleFile: t.exampleFile ? JSON.parse(t.exampleFile) : null
      }));
      callback(null, parsed);
    });
  },
  getTemplateById: (id, callback) => {
    db.get('SELECT * FROM exam_templates WHERE id = ?', [id], (err, template) => {
      if (err) return callback(err);
      if (template && template.exampleFile) {
        template.exampleFile = JSON.parse(template.exampleFile);
      }
      callback(null, template);
    });
  },
  updateTemplate: (id, updates, callback) => {
    // If updates is an object with exampleFile, handle specially
    if (typeof updates === 'object' && updates.exampleFile !== undefined) {
      const query = `UPDATE exam_templates SET exampleFile = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(query, [updates.exampleFile, id], callback);
    } else {
      // Handle old format: (id, name, description, settings)
      const name = arguments[1];
      const description = arguments[2];
      const settings = arguments[3];
      const query = `UPDATE exam_templates SET name = ?, description = ?, settings = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(query, [name, description, settings, id], callback);
    }
  },
  deleteTemplate: (id, callback) => {
    db.run('DELETE FROM exam_templates WHERE id = ?', [id], callback);
  },
  // Questions
  createQuestion: (templateId, examId, type, text, options, correctAnswer, marks, difficulty, topic, callback) => {
    const query = `INSERT INTO questions (templateId, examId, type, text, options, correctAnswer, marks, difficulty, topic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [templateId, examId, type, text, options, correctAnswer, marks, difficulty, topic], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getQuestionsByTemplate: (templateId, callback) => {
    db.all('SELECT * FROM questions WHERE templateId = ? ORDER BY createdAt', [templateId], callback);
  },
  getQuestionsByExam: (examId, callback) => {
    db.all('SELECT * FROM questions WHERE examId = ? ORDER BY createdAt', [examId], callback);
  },
  getQuestionById: (id, callback) => {
    db.get('SELECT * FROM questions WHERE id = ?', [id], callback);
  },
  updateQuestion: (id, type, text, options, correctAnswer, marks, difficulty, callback) => {
    const query = `UPDATE questions SET type = ?, text = ?, options = ?, correctAnswer = ?, marks = ?, difficulty = ? WHERE id = ?`;
    db.run(query, [type, text, options, correctAnswer, marks, difficulty, id], callback);
  },
  deleteQuestion: (id, callback) => {
    db.run('DELETE FROM questions WHERE id = ?', [id], callback);
  },
  // Exams
  createExam: (title, templateId, classId, teacherId, dateScheduled, durationMinutes, status, totalMarks, callback) => {
    const query = `INSERT INTO exams (title, templateId, classId, teacherId, dateScheduled, durationMinutes, status, totalMarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [title, templateId, classId, teacherId, dateScheduled, durationMinutes, status, totalMarks], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getExamsByTeacher: (teacherId, callback) => {
    db.all('SELECT * FROM exams WHERE teacherId = ? ORDER BY createdAt DESC', [teacherId], callback);
  },
  getExamById: (id, callback) => {
    db.get('SELECT * FROM exams WHERE id = ?', [id], callback);
  },
  updateExam: (id, title, status, dateScheduled, durationMinutes, totalMarks, callback) => {
    const query = `UPDATE exams SET title = ?, status = ?, dateScheduled = ?, durationMinutes = ?, totalMarks = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [title, status, dateScheduled, durationMinutes, totalMarks, id], callback);
  },
  deleteExam: (id, callback) => {
    db.run('DELETE FROM exams WHERE id = ?', [id], callback);
  },
  // Grades
  createGrade: (examId, studentId, questionId, score, total, feedback, gradedBy, callback) => {
    const query = `INSERT INTO grades (examId, studentId, questionId, score, total, feedback, gradedBy, gradedAt) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    db.run(query, [examId, studentId, questionId, score, total, feedback, gradedBy], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getGradesByExam: (examId, callback) => {
    db.all('SELECT * FROM grades WHERE examId = ? ORDER BY studentId', [examId], callback);
  },
  getGradesByStudent: (studentId, callback) => {
    db.all('SELECT * FROM grades WHERE studentId = ? ORDER BY createdAt DESC', [studentId], callback);
  },
  getGradeById: (id, callback) => {
    db.get('SELECT * FROM grades WHERE id = ?', [id], callback);
  },
  updateGrade: (id, score, total, feedback, gradedBy, callback) => {
    const query = `UPDATE grades SET score = ?, total = ?, feedback = ?, gradedBy = ?, gradedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [score, total, feedback, gradedBy, id], callback);
  },
  deleteGrade: (id, callback) => {
    db.run('DELETE FROM grades WHERE id = ?', [id], callback);
  },
  // Imports
  createImport: (filename, uploaderId, mapping, callback) => {
    const query = `INSERT INTO imports (filename, uploaderId, mapping) VALUES (?, ?, ?)`;
    db.run(query, [filename, uploaderId, mapping], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getImportById: (id, callback) => {
    db.get('SELECT * FROM imports WHERE id = ?', [id], callback);
  },
  updateImportStatus: (id, status, rowsProcessed, errors, callback) => {
    const query = `UPDATE imports SET status = ?, rowsProcessed = ?, errors = ?, processedAt = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [status, rowsProcessed, errors, id], callback);
  },
  getImportsByUser: (uploaderId, callback) => {
    db.all('SELECT * FROM imports WHERE uploaderId = ? ORDER BY uploadedAt DESC', [uploaderId], callback);
  },
  // Exam Examples
  createExamExample: (teacherId, fileName, courseName, extractedData, patterns, callback) => {
    const query = `INSERT INTO exam_examples (teacherId, fileName, courseName, extractedData, patterns) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [teacherId, fileName, courseName, JSON.stringify(extractedData), JSON.stringify(patterns)], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getExamExamplesByTeacher: (teacherId, callback) => {
    db.all('SELECT * FROM exam_examples WHERE teacherId = ? ORDER BY uploadedAt DESC', [teacherId], callback);
  },
  deleteExamExample: (id, callback) => {
    db.run('DELETE FROM exam_examples WHERE id = ?', [id], callback);
  },
  // Course Materials
  createCourseMaterial: (teacherId, courseName, fileName, extractedTopics, callback) => {
    const query = `INSERT INTO course_materials (teacherId, courseName, fileName, extractedTopics) VALUES (?, ?, ?, ?)`;
    // extractedTopics is already stringified from exam-examples.js, store as-is
    db.run(query, [teacherId, courseName, fileName, extractedTopics], function(err) {
      callback(err, err ? null : this.lastID);
    });
  },
  getCourseMaterialsByTeacher: (teacherId, callback) => {
    db.all('SELECT * FROM course_materials WHERE teacherId = ? ORDER BY uploadedAt DESC', [teacherId], callback);
  },
  deleteCourseMaterial: (id, callback) => {
    db.run('DELETE FROM course_materials WHERE id = ?', [id], callback);
  },
  getCourseMaterialsByCourse: (teacherId, courseName, callback) => {
    db.all('SELECT * FROM course_materials WHERE teacherId = ? AND courseName = ?', [teacherId, courseName], callback);
  },
  // Teacher Exam Style
  updateTeacherExamStyle: (teacherId, avgQuestionCount, preferredDifficulty, questionTypes, patterns, callback) => {
    const query = `
      INSERT INTO teacher_exam_style (teacherId, avgQuestionCount, preferredDifficulty, questionTypes, patterns, lastUpdated)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(teacherId) DO UPDATE SET
        avgQuestionCount = excluded.avgQuestionCount,
        preferredDifficulty = excluded.preferredDifficulty,
        questionTypes = excluded.questionTypes,
        patterns = excluded.patterns,
        lastUpdated = CURRENT_TIMESTAMP
    `;
    db.run(query, [teacherId, avgQuestionCount, preferredDifficulty, JSON.stringify(questionTypes), JSON.stringify(patterns)], callback);
  },
  getTeacherExamStyle: (teacherId, callback) => {
    db.get('SELECT * FROM teacher_exam_style WHERE teacherId = ?', [teacherId], callback);
  }
};
