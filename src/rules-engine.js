// Rules Engine for Exam Generation
// Generates exams based on teacher's style and uploaded exam examples

class ExamRulesEngine {
  constructor(teacherStyle, examExamples) {
    this.teacherStyle = teacherStyle || this.defaultStyle();
    this.examExamples = examExamples || [];
    this.questionBank = this.buildQuestionBank();
  }

  defaultStyle() {
    return {
      avgQuestionCount: 10,
      preferredDifficulty: 'medium',
      questionTypes: ['mcq', 'shortanswer'],
      patterns: {
        questionCount: 10,
        questionTypes: {
          mcq: 6,
          shortanswer: 4,
          essay: 0
        },
        optionsPerMCQ: 4,
        estimatedDifficulty: 'medium'
      }
    };
  }

  // Build question bank from exam examples
  buildQuestionBank() {
    const questions = [];

    this.examExamples.forEach(example => {
      if (example.extractedData && example.extractedData.questions) {
        example.extractedData.questions.forEach(q => {
          const question = {
            originalText: q.text,
            type: q.type || 'mcq',
            options: q.options || [],
            course: example.courseName,
            source: example.fileName,
            patterns: {
              length: q.text.length,
              complexity: this.estimateComplexity(q.text)
            }
          };
          questions.push(question);
        });
      }
    });

    return questions;
  }

  // Estimate question complexity
  estimateComplexity(text) {
    // Simple heuristic: word count and sentence structure
    const words = text.split(/\s+/).length;
    const sentences = (text.match(/[.!?]/g) || []).length || 1;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence < 8) {
      return 'easy';
    } else if (avgWordsPerSentence < 15) {
      return 'medium';
    } else {
      return 'hard';
    }
  }

  // Generate exam based on parameters
  generateExam(params) {
    const {
      subject,
      numQuestions,
      difficulty,
      examTitle,
      description,
      questionTypes,
      courseName
    } = params;

    if (!subject || !numQuestions || !difficulty || !examTitle) {
      throw new Error('Missing required parameters');
    }

    // Get questions from bank
    const selectedQuestions = this.selectQuestions(
      numQuestions,
      difficulty,
      questionTypes,
      courseName
    );

    // If not enough questions from examples, generate synthetic ones
    if (selectedQuestions.length < numQuestions) {
      const syntheticQuestions = this.generateSyntheticQuestions(
        subject,
        numQuestions - selectedQuestions.length,
        difficulty,
        questionTypes
      );
      selectedQuestions.push(...syntheticQuestions);
    }

    // Shuffle questions
    const shuffled = this.shuffleArray(selectedQuestions);

    // Build exam
    const exam = {
      title: examTitle,
      subject: subject,
      difficulty: difficulty,
      description: description || '',
      questions: shuffled.slice(0, numQuestions),
      totalQuestions: Math.min(numQuestions, shuffled.length),
      generatedFrom: 'rules-engine',
      baseStyle: this.teacherStyle.patterns || {}
    };

    return exam;
  }

  // Select questions from the question bank
  selectQuestions(numQuestions, difficulty, questionTypes, courseName) {
    let filtered = [...this.questionBank];

    // Filter by course if specified
    if (courseName) {
      filtered = filtered.filter(q => !q.course || q.course === courseName);
    }

    // Filter by difficulty
    if (difficulty !== 'mixed') {
      filtered = filtered.filter(q => q.patterns.complexity === difficulty);
    }

    // Filter by question types
    const types = typeof questionTypes === 'string' ? questionTypes.split(',') : questionTypes;
    filtered = filtered.filter(q => types.includes(q.type));

    // If we have enough, return them; otherwise return all we have
    if (filtered.length >= numQuestions) {
      return this.shuffleArray(filtered).slice(0, numQuestions);
    }

    return filtered;
  }

  // Generate synthetic questions based on patterns
  generateSyntheticQuestions(subject, count, difficulty, questionTypes) {
    const questions = [];
    const types = typeof questionTypes === 'string' ? questionTypes.split(',') : questionTypes;

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const question = this.createSyntheticQuestion(subject, type, difficulty, i + 1);
      questions.push(question);
    }

    return questions;
  }

  // Create a synthetic question based on style
  createSyntheticQuestion(subject, type, difficulty, questionNumber) {
    const templates = {
      easy: {
        mcq: [
          `What is the basic definition of ${subject}?`,
          `Which of the following best describes ${subject}?`,
          `What does ${subject} refer to?`
        ],
        shortanswer: [
          `Define ${subject} in your own words.`,
          `What is the meaning of ${subject}?`,
          `Explain ${subject} briefly.`
        ],
        essay: [
          `Explain the concept of ${subject} and its importance.`,
          `Discuss the fundamentals of ${subject}.`,
          `What do you understand by ${subject}? Provide examples.`
        ]
      },
      medium: {
        mcq: [
          `How does ${subject} relate to modern applications?`,
          `Which principle of ${subject} is most commonly used?`,
          `What are the key characteristics of ${subject}?`
        ],
        shortanswer: [
          `Explain how ${subject} is applied in practice.`,
          `What are the main components of ${subject}?`,
          `How would you analyze a problem using ${subject}?`
        ],
        essay: [
          `Analyze the role of ${subject} in solving real-world problems.`,
          `Discuss the advantages and disadvantages of ${subject}.`,
          `How has the application of ${subject} evolved over time?`
        ]
      },
      hard: {
        mcq: [
          `What is the most complex aspect of ${subject} in advanced scenarios?`,
          `How do different approaches to ${subject} compare in efficiency?`,
          `When would you NOT use ${subject}? Why?`
        ],
        shortanswer: [
          `Critically evaluate the limitations of ${subject}.`,
          `How would you improve the current understanding of ${subject}?`,
          `Design a solution using ${subject} for a complex scenario.`
        ],
        essay: [
          `Critically analyze the evolution and future of ${subject}.`,
          `How does ${subject} integrate with other disciplines?`,
          `Design a comprehensive experiment to test principles of ${subject}.`
        ]
      }
    };

    const selectedTemplates = templates[difficulty] || templates.medium;
    const templateArray = selectedTemplates[type] || selectedTemplates.mcq;
    const template = templateArray[Math.floor(Math.random() * templateArray.length)];

    if (type === 'mcq') {
      return {
        question: template,
        type: 'mcq',
        options: [
          'Option A - Answer',
          'Option B - Answer',
          'Option C - Correct Answer',
          'Option D - Answer'
        ],
        answer: 'Option C - Correct Answer'
      };
    } else if (type === 'shortanswer') {
      return {
        question: template,
        type: 'shortanswer',
        answer: `Model answer for Question ${questionNumber}: A comprehensive response explaining the key concepts.`
      };
    } else {
      return {
        question: template,
        type: 'essay',
        answer: `Essay rubric for Question ${questionNumber}:\n1. Understanding (4 points)\n2. Analysis (4 points)\n3. Synthesis (2 points)`
      };
    }
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get teacher's preferred styles
  getTeacherPreferences() {
    return {
      avgQuestionCount: this.teacherStyle.avgQuestionCount || 10,
      preferredDifficulty: this.teacherStyle.preferredDifficulty || 'medium',
      questionTypes: this.teacherStyle.questionTypes || ['mcq', 'shortanswer'],
      hasExamples: this.questionBank.length > 0,
      examplesCount: this.examExamples.length,
      uniqueCourses: [...new Set(this.questionBank.map(q => q.course))].filter(c => c)
    };
  }
}

module.exports = ExamRulesEngine;
