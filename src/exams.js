const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('./database');
const { verifyToken } = require('./auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `exam_example_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// POST: Create class
router.post('/classes', verifyToken, (req, res) => {
  const { name, academicYear, section } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  db.createClass(name, academicYear, section, req.user.id, (err, classId) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create class: ' + err.message });
    }
    res.json({ success: true, id: classId, message: 'Class created successfully' });
  });
});

// GET: Get all classes for teacher
router.get('/classes', verifyToken, (req, res) => {
  db.getClassesByTeacher(req.user.id, (err, classes) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }
    res.json(classes || []);
  });
});

// GET: Get class by ID
router.get('/classes/:id', verifyToken, (req, res) => {
  db.getClassById(req.params.id, (err, classData) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch class' });
    }
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classData);
  });
});

// PUT: Update class
router.put('/classes/:id', verifyToken, (req, res) => {
  const { name, academicYear, section } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Class name is required' });
  }

  db.updateClass(req.params.id, name, academicYear, section, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update class' });
    }
    res.json({ success: true, message: 'Class updated successfully' });
  });
});

// DELETE: Delete class
router.delete('/classes/:id', verifyToken, (req, res) => {
  db.deleteClass(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete class' });
    }
    res.json({ success: true, message: 'Class deleted successfully' });
  });
});

// ============ EXAM TEMPLATES ============

// POST: Create exam template
router.post('/templates', verifyToken, (req, res) => {
  const { name, description, settings } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Template name is required' });
  }

  const settingsJson = settings ? JSON.stringify(settings) : JSON.stringify({});

  db.createTemplate(name, description, req.user.id, settingsJson, (err, templateId) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create template: ' + err.message });
    }
    res.json({ success: true, id: templateId, message: 'Template created successfully' });
  });
});

// GET: Get all templates for teacher
router.get('/templates', verifyToken, (req, res) => {
  db.getTemplatesByTeacher(req.user.id, (err, templates) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    const formattedTemplates = (templates || []).map(t => ({
      ...t,
      settings: t.settings ? JSON.parse(t.settings) : {}
    }));

    res.json(formattedTemplates);
  });
});

// GET: Get template by ID with questions
router.get('/templates/:id', verifyToken, (req, res) => {
  db.getTemplateById(req.params.id, (err, template) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch template' });
    }
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get questions for this template
    db.getQuestionsByTemplate(req.params.id, (err, questions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch questions' });
      }

      const formattedQuestions = (questions || []).map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }));

      res.json({
        ...template,
        settings: template.settings ? JSON.parse(template.settings) : {},
        questions: formattedQuestions
      });
    });
  });
});

// PUT: Update template
router.put('/templates/:id', verifyToken, (req, res) => {
  const { name, description, settings } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Template name is required' });
  }

  const settingsJson = settings ? JSON.stringify(settings) : JSON.stringify({});

  db.updateTemplate(req.params.id, name, description, settingsJson, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update template' });
    }
    res.json({ success: true, message: 'Template updated successfully' });
  });
});

// DELETE: Delete template
router.delete('/templates/:id', verifyToken, (req, res) => {
  db.deleteTemplate(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete template' });
    }
    res.json({ success: true, message: 'Template deleted successfully' });
  });
});

// POST: Upload example file for template
router.post('/templates/upload-example/:templateId', verifyToken, upload.single('file'), (req, res) => {
  const { templateId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileData = JSON.stringify({
    filename: req.file.originalname,
    filepath: `/uploads/${req.file.filename}`,
    mimetype: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  });

  db.updateTemplate(templateId, { exampleFile: fileData }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to upload file: ' + err.message });
    }
    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      file: JSON.parse(fileData)
    });
  });
});

// ============ QUESTIONS ============

// POST: Create question
router.post('/questions', verifyToken, (req, res) => {
  const { templateId, examId, type, text, options, correctAnswer, marks, difficulty, topic } = req.body;

  if (!text || !type) {
    return res.status(400).json({ error: 'Question text and type are required' });
  }

  const optionsJson = options ? JSON.stringify(options) : null;

  db.createQuestion(
    templateId,
    examId,
    type,
    text,
    optionsJson,
    correctAnswer,
    marks || 1,
    difficulty || 'medium',
    topic,
    (err, questionId) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create question: ' + err.message });
      }
      res.json({ success: true, id: questionId, message: 'Question created successfully' });
    }
  );
});

// GET: Get questions by template
router.get('/templates/:id/questions', verifyToken, (req, res) => {
  db.getQuestionsByTemplate(req.params.id, (err, questions) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    const formattedQuestions = (questions || []).map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : []
    }));

    res.json(formattedQuestions);
  });
});

// PUT: Update question
router.put('/questions/:id', verifyToken, (req, res) => {
  const { type, text, options, correctAnswer, marks, difficulty } = req.body;

  if (!text || !type) {
    return res.status(400).json({ error: 'Question text and type are required' });
  }

  const optionsJson = options ? JSON.stringify(options) : null;

  db.updateQuestion(req.params.id, type, text, optionsJson, correctAnswer, marks || 1, difficulty || 'medium', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update question' });
    }
    res.json({ success: true, message: 'Question updated successfully' });
  });
});

// DELETE: Delete question
router.delete('/questions/:id', verifyToken, (req, res) => {
  db.deleteQuestion(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete question' });
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  });
});

// ============ EXAMS ============

// POST: Create exam
router.post('/', verifyToken, (req, res) => {
  const { title, templateId, classId, dateScheduled, durationMinutes, status, totalMarks } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Exam title is required' });
  }

  db.createExam(
    title,
    templateId,
    classId,
    req.user.id,
    dateScheduled,
    durationMinutes || 60,
    status || 'draft',
    totalMarks || 100,
    (err, examId) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create exam: ' + err.message });
      }

      // If template is provided, copy questions from template to exam
      if (templateId) {
        db.getQuestionsByTemplate(templateId, (err, questions) => {
          if (!err && questions) {
            questions.forEach(q => {
              db.createQuestion(null, examId, q.type, q.text, q.options, q.correctAnswer, q.marks, q.difficulty, q.topic, () => {});
            });
          }
        });
      }

      res.json({ success: true, id: examId, message: 'Exam created successfully' });
    }
  );
});

// GET: Get all exams for teacher
router.get('/', verifyToken, (req, res) => {
  db.getExamsByTeacher(req.user.id, (err, exams) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch exams' });
    }
    res.json(exams || []);
  });
});

// GET: Get exam by ID with questions and grades
router.get('/:id', verifyToken, (req, res) => {
  db.getExamById(req.params.id, (err, exam) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch exam' });
    }
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get questions and grades
    db.getQuestionsByExam(req.params.id, (err, questions) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch questions' });
      }

      db.getGradesByExam(req.params.id, (err, grades) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to fetch grades' });
        }

        const formattedQuestions = (questions || []).map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : []
        }));

        res.json({
          ...exam,
          questions: formattedQuestions,
          grades: grades || []
        });
      });
    });
  });
});

// PUT: Update exam
router.put('/:id', verifyToken, (req, res) => {
  const { title, status, dateScheduled, durationMinutes, totalMarks } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Exam title is required' });
  }

  db.updateExam(req.params.id, title, status, dateScheduled, durationMinutes, totalMarks, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update exam' });
    }
    res.json({ success: true, message: 'Exam updated successfully' });
  });
});

// DELETE: Delete exam
router.delete('/:id', verifyToken, (req, res) => {
  db.deleteExam(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete exam' });
    }
    res.json({ success: true, message: 'Exam deleted successfully' });
  });
});

// ============ GRADING ============

// POST: Add/Update grade
router.post('/grades/:examId/:studentId', verifyToken, (req, res) => {
  const { questionId, score, total, feedback } = req.body;

  if (score === undefined || total === undefined) {
    return res.status(400).json({ error: 'Score and total are required' });
  }

  db.createGrade(
    req.params.examId,
    req.params.studentId,
    questionId,
    score,
    total,
    feedback,
    req.user.id,
    (err, gradeId) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save grade: ' + err.message });
      }
      res.json({ success: true, id: gradeId, message: 'Grade saved successfully' });
    }
  );
});

// GET: Get grades for exam
router.get('/:examId/grades', verifyToken, (req, res) => {
  db.getGradesByExam(req.params.examId, (err, grades) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch grades' });
    }
    res.json(grades || []);
  });
});

// GET: Get student grades
router.get('/student/:studentId/grades', verifyToken, (req, res) => {
  db.getGradesByStudent(req.params.studentId, (err, grades) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch grades' });
    }
    res.json(grades || []);
  });
});

// PUT: Update grade
router.put('/grades/:gradeId', verifyToken, (req, res) => {
  const { score, total, feedback } = req.body;

  if (score === undefined || total === undefined) {
    return res.status(400).json({ error: 'Score and total are required' });
  }

  db.updateGrade(req.params.gradeId, score, total, feedback, req.user.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update grade' });
    }
    res.json({ success: true, message: 'Grade updated successfully' });
  });
});

module.exports = router;
