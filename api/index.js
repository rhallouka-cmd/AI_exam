require('dotenv').config();
const db = require('../src/database');
const { router: authRouter } = require('../src/auth');
const examsRouter = require('../src/exams');
const importsRouter = require('../src/imports');
const examExamplesRouter = require('../src/exam-examples');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

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

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/register.html'));
});

app.get('/exams', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/exams.html'));
});

app.get('/templates', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/templates.html'));
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/courses.html'));
});

app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/import.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database on first call
db.initialize(() => {
  console.log('Database initialized');
});

module.exports = app;
