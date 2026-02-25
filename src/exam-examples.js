// Exam Examples Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const db = require('./database');
const { verifyToken } = require('./auth');

// Configure multer for exam files
const uploadExam = multer({
  dest: path.join(__dirname, '../uploads/exam-examples'),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedMimes.includes(file.mimetype) || /\.(pdf|jpg|jpeg|png|tif|tiff|ppt|pptx)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, image, and PowerPoint files are allowed.'));
    }
  }
});

// Configure multer for course materials
const uploadCourse = multer({
  dest: path.join(__dirname, '../uploads/course-materials'),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedMimes.includes(file.mimetype) || /\.(pdf|doc|docx|txt|jpg|jpeg|png|ppt|pptx)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, PowerPoint, and text files are allowed.'));
    }
  }
});

// Ensure uploads directories exist
const examsUploadsDir = path.join(__dirname, '../uploads/exam-examples');
if (!fs.existsSync(examsUploadsDir)) {
  fs.mkdirSync(examsUploadsDir, { recursive: true });
}
const coursesUploadsDir = path.join(__dirname, '../uploads/course-materials');
if (!fs.existsSync(coursesUploadsDir)) {
  fs.mkdirSync(coursesUploadsDir, { recursive: true });
}

// Extract questions from text (simple pattern matching)
function extractQuestions(text) {
  const questions = [];
  
  // Pattern for MCQ questions (Q1. ... A) B) C) D))
  const mcqPattern = /(?:Q\d+\.?\s*|^\d+\.?\s*|^[A-Z]\.\s*)([^A-D]*?)(?=\n\s*[A-D]\)|\n\s*$)/gim;
  
  // Pattern for numbered questions
  const numberedPattern = /^\d+[\.\)]\s*(.+?)(?=\n\d+[\.\)]|\n$)/gm;
  
  const lines = text.split('\n').filter(l => l.trim());
  let currentQuestion = null;

  lines.forEach((line, index) => {
    // Check if line starts a new question
    if (/^[0-9]+[\.\)\:]|^Q[0-9]+[\.\)]/i.test(line.trim())) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: line.replace(/^[0-9]+[\.\)\:]|^Q[0-9]+[\.\)]/i, '').trim(),
        type: 'mcq',
        options: []
      };
    }
    // Check if line is an option (A) B) C) D))
    else if (/^[A-D]\)|^[A-D]\s*\)/.test(line.trim()) && currentQuestion) {
      const option = line.replace(/^[A-D]\)\s*|^[A-D]\s*\)\s*/, '').trim();
      currentQuestion.options.push(option);
    }
  });

  if (currentQuestion && currentQuestion.text.length > 5) {
    questions.push(currentQuestion);
  }

  return questions;
}

// Upload exam examples (handle multiple files)
router.post('/upload', verifyToken, uploadExam.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    let totalQuestionsExtracted = 0;
    let uploadedCount = 0;

    const uploadPromises = [];

    for (const file of req.files) {
      const filePath = file.path;
      const fileName = file.originalname;
      const courseName = req.body.courseName || '';
      let extractedText = '';

      // Extract text from PDF
      if (file.mimetype === 'application/pdf') {
        try {
          const pdf = fs.readFileSync(filePath);
          const pdfData = await pdfParse(pdf);
          extractedText = pdfData.text;
        } catch (pdfErr) {
          console.warn('Could not extract PDF text:', pdfErr.message);
          extractedText = '';
        }
      } else if (/\.(ppt|pptx)$/i.test(file.originalname)) {
        extractedText = `PowerPoint file: ${fileName}. Slides will be reviewed manually.`;
      } else {
        extractedText = `File: ${fileName}. Manual review recommended.`;
      }

      // Extract questions from text
      const extractedQuestions = extractQuestions(extractedText);
      totalQuestionsExtracted += extractedQuestions.length;

      // Analyze patterns
      const patterns = analyzeExamPatterns({
        questions: extractedQuestions,
        textLength: extractedText.length
      });

      // Create a promise for each upload
      const uploadPromise = new Promise((resolve) => {
        db.createExamExample(
          req.userId,
          fileName,
          courseName,
          {
            questions: extractedQuestions,
            fullText: extractedText.substring(0, 5000),
            extractedAt: new Date()
          },
          patterns,
          (err) => {
            // Clean up uploaded file
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });

            if (!err) uploadedCount++;
            resolve();
          }
        );
      });
      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    await Promise.all(uploadPromises);

    // Update teacher exam style
    db.getTeacherExamStyle(req.userId, (styleErr, existingStyle) => {
      if (uploadedCount > 0) {
        const newStyle = {
          avgQuestionCount: totalQuestionsExtracted / (uploadedCount || 1),
          preferredDifficulty: 'medium',
          questionTypes: {},
          patterns: {}
        };

        db.updateTeacherExamStyle(
          req.userId,
          newStyle.avgQuestionCount,
          newStyle.preferredDifficulty,
          JSON.stringify(newStyle.questionTypes),
          JSON.stringify(newStyle.patterns),
          () => {}
        );
      }
    });

    res.json({
      message: `${uploadedCount} file(s) uploaded successfully`,
      filesUploaded: uploadedCount,
      questionsExtracted: totalQuestionsExtracted
    });

  } catch (error) {
    console.error('Error uploading exam examples:', error);
    res.status(500).json({ error: 'Failed to process exam examples: ' + error.message });
  }
});

// Get all exam examples for teacher with stats
router.get('/', verifyToken, (req, res) => {
  db.getExamExamplesByTeacher(req.userId, (err, examples) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Parse extractedData for each example
    const parsedExamples = (examples || []).map(ex => ({
      id: ex.id,
      fileName: ex.fileName,
      courseName: ex.courseName,
      uploadedAt: ex.uploadedAt,
      questionCount: ex.extractedData ? JSON.parse(ex.extractedData).questions.length : 0,
      extractedData: ex.extractedData ? JSON.parse(ex.extractedData) : null,
      patterns: ex.patterns ? JSON.parse(ex.patterns) : null
    }));

    // Calculate statistics for exam examples
    let totalQuestions = 0;
    
    parsedExamples.forEach(ex => {
      totalQuestions += ex.questionCount || 0;
    });

    // Now get course materials count
    db.getCourseMaterialsByTeacher(req.userId, (courseErr, courses) => {
      const coursesCount = (courses || []).length;

      res.json({
        examples: parsedExamples,
        statistics: {
          examplesCount: parsedExamples.length,
          coursesCount: coursesCount,
          questionsCount: totalQuestions
        }
      });
    });
  });
});

// Get courses for teacher
router.get('/courses', verifyToken, (req, res) => {
  db.getCourseMaterialsByTeacher(req.userId, (err, courses) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const parsedCourses = (courses || []).map(course => ({
      id: course.id,
      courseName: course.courseName,
      fileName: course.fileName,
      uploadedAt: course.uploadedAt,
      topicCount: course.extractedTopics ? JSON.parse(course.extractedTopics).length : 0
    }));

    res.json({
      courses: parsedCourses
    });
  });
});

// Get specific exam example
router.get('/:id', verifyToken, (req, res) => {
  db.db.get(
    'SELECT * FROM exam_examples WHERE id = ? AND teacherId = ?',
    [req.params.id, req.userId],
    (err, example) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!example) {
        return res.status(404).json({ error: 'Exam example not found' });
      }

      example.extractedData = example.extractedData ? JSON.parse(example.extractedData) : null;
      example.patterns = example.patterns ? JSON.parse(example.patterns) : null;

      res.json({ example: example });
    }
  );
});

// Delete exam example
router.delete('/:id', verifyToken, (req, res) => {
  db.db.get(
    'SELECT * FROM exam_examples WHERE id = ? AND teacherId = ?',
    [req.params.id, req.userId],
    (err, example) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!example) {
        return res.status(404).json({ error: 'Exam example not found' });
      }

      db.deleteExamExample(req.params.id, (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        res.json({ message: 'Exam example deleted successfully' });
      });
    }
  );
});

// Delete course material
router.delete('/course/:id', verifyToken, (req, res) => {
  db.db.get(
    'SELECT * FROM course_materials WHERE id = ? AND teacherId = ?',
    [req.params.id, req.userId],
    (err, course) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!course) {
        return res.status(404).json({ error: 'Course material not found' });
      }

      db.deleteCourseMaterial(req.params.id, (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        res.json({ message: 'Course material deleted successfully' });
      });
    }
  );
});

// Upload course materials
router.post('/upload-course', verifyToken, uploadCourse.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const courseName = req.body.courseName;
  if (!courseName || !courseName.trim()) {
    return res.status(400).json({ error: 'Course name is required' });
  }

  try {
    let uploadedCount = 0;
    const topicsSet = new Set();
    const uploadPromises = [];

    for (const file of req.files) {
      const filePath = file.path;
      const fileName = file.originalname;
      let extractedText = '';

      // Extract text from PDF
      if (file.mimetype === 'application/pdf') {
        try {
          const pdf = fs.readFileSync(filePath);
          const pdfData = await pdfParse(pdf);
          extractedText = pdfData.text;
        } catch (pdfErr) {
          console.warn('Could not extract PDF text:', pdfErr.message);
          extractedText = '';
        }
      } else if (/\.(ppt|pptx|doc|docx)$/i.test(file.originalname)) {
        extractedText = `Document file: ${fileName}. Content will be reviewed.`;
      }

      // Extract topics/keywords from text
      const topics = extractTopics(extractedText);
      topics.forEach(t => topicsSet.add(t));

      // Create a promise for each upload
      const uploadPromise = new Promise((resolve) => {
        db.createCourseMaterial(
          req.userId,
          courseName,
          fileName,
          JSON.stringify(topics),
          (err) => {
            // Clean up uploaded file
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });

            if (!err) uploadedCount++;
            resolve();
          }
        );
      });
      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete before responding
    await Promise.all(uploadPromises);

    res.json({
      message: `${uploadedCount} course material file(s) uploaded successfully`,
      filesUploaded: uploadedCount,
      topicsExtracted: topicsSet.size
    });

  } catch (error) {
    console.error('Error uploading course materials:', error);
    res.status(500).json({ error: 'Failed to process course materials: ' + error.message });
  }
});

// Helper function to extract topics from text
function extractTopics(text) {
  const topics = [];
  if (!text) return topics;

  // Extract capitalized phrases (likely topics)
  const topicPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
  const matches = text.match(topicPattern) || [];
  
  // Get unique topics, limit to 50
  const uniqueTopics = [...new Set(matches)].slice(0, 50);
  
  return uniqueTopics;
}

// Helper function to analyze exam patterns
function analyzeExamPatterns(examData) {
  const patterns = {
    questionCount: examData.questions.length,
    questionTypes: {
      mcq: 0,
      shortanswer: 0,
      essay: 0
    },
    avgQuestionLength: 0,
    optionsPerMCQ: 0,
    difficultyDistribution: 'medium',
    topicsIdentified: [],
    estimatedDifficulty: 'medium'
  };

  if (examData.questions.length === 0) {
    return patterns;
  }

  // Count question types
  examData.questions.forEach(q => {
    if (q.options && q.options.length > 0) {
      patterns.questionTypes.mcq++;
      patterns.optionsPerMCQ = q.options.length;
    } else if (q.text.length < 100) {
      patterns.questionTypes.shortanswer++;
    } else {
      patterns.questionTypes.essay++;
    }
  });

  // Calculate average question length
  patterns.avgQuestionLength = Math.round(
    examData.questions.reduce((sum, q) => sum + q.text.length, 0) / examData.questions.length
  );

  // Estimate difficulty based on question length and complexity
  if (patterns.avgQuestionLength < 80) {
    patterns.estimatedDifficulty = 'easy';
  } else if (patterns.avgQuestionLength < 150) {
    patterns.estimatedDifficulty = 'medium';
  } else {
    patterns.estimatedDifficulty = 'hard';
  }

  patterns.difficultyDistribution = patterns.estimatedDifficulty;

  return patterns;
}

module.exports = router;
