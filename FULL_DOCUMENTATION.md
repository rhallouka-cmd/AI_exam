# Teacher Exam & Student Management System

A complete full-stack web application designed for teachers to create exams instantly from templates, manage student lists, import bulk student data, and efficiently grade students.

## 🎯 Key Features

### 1. **Exam Management**
- Create exams from scratch or use reusable templates
- Build question banks with multiple question types (MCQ, Short Answer, Long Answer, Essay)
- Organize exams by classes
- Set exam duration and total marks
- Track exam status (Draft, Published, Completed)
- Auto-grading for MCQ questions
- Manual grading interface for subjective questions

### 2. **Exam Templates**
- Build reusable exam templates with pre-defined questions
- Assign difficulty levels (Easy, Medium, Hard) to questions
- Tag questions by topic for easy organization
- Copy templates to create new exams instantly
- Edit and manage question banks
- Support for different question types

### 3. **Student Management**
- Add students individually with details (Name, Email, Phone, Age, Grade)
- View and search all students in a table format
- Edit student information
- Delete student records
- Organized student profiles

### 4. **Bulk Student Import**
- Import students from CSV or Excel files
- Column mapping UI to match your file format with student fields
- File preview before import to verify data
- Automatic data validation
- Error reporting for failed imports
- Import history tracking

### 5. **Class Management**
- Create multiple classes
- Assign academic year and section to classes
- Organize exams by classes
- View all classes in a dashboard

### 6. **Grading System**
- Grade students on completed exams
- MCQ auto-grading support
- Manual grading for subjective questions
- Add feedback for each graded question
- View student performance
- Track grading history

### 7. **Authentication & Authorization**
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcryptjs
- Password reset functionality
- Role-based access control (Teacher, Admin)

### 8. **Responsive Dashboard**
- Welcome dashboard with quick stats
- Quick action links to major features
- Recent exams and templates display
- Class and student counts
- Modern, user-friendly interface

## 📋 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer
- **CSV Parsing**: csv-parse
- **Excel Parsing**: xlsx (SheetJS)
- **Validation**: Joi

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Responsive design with modern styling
- **JavaScript**: Vanilla JS (no framework for simplicity)
- **Client Features**: Drag-and-drop file upload, real-time search, dynamic tables

### Database Schema

```
Users
├── id (INTEGER, PRIMARY KEY)
├── username (TEXT, UNIQUE)
├── email (TEXT, UNIQUE)
├── password (TEXT, hashed)
├── role (TEXT, default: 'teacher')
├── resetToken (TEXT)
├── resetTokenExpiry (INTEGER)
└── createdAt (DATETIME)

Classes
├── id (INTEGER, PRIMARY KEY)
├── name (TEXT)
├── academicYear (TEXT)
├── section (TEXT)
├── teacherId (FOREIGN KEY -> Users)
└── createdAt, updatedAt (DATETIME)

ExamTemplates
├── id (INTEGER, PRIMARY KEY)
├── name (TEXT)
├── description (TEXT)
├── settings (JSON)
├── createdBy (FOREIGN KEY -> Users)
└── createdAt, updatedAt (DATETIME)

Questions
├── id (INTEGER, PRIMARY KEY)
├── templateId (FOREIGN KEY -> ExamTemplates)
├── examId (FOREIGN KEY -> Exams)
├── type (TEXT: mcq, short, long, essay)
├── text (TEXT)
├── options (JSON)
├── correctAnswer (TEXT)
├── marks (REAL)
├── difficulty (TEXT: easy, medium, hard)
├── topic (TEXT)
└── createdAt (DATETIME)

Exams
├── id (INTEGER, PRIMARY KEY)
├── title (TEXT)
├── templateId (FOREIGN KEY -> ExamTemplates)
├── classId (FOREIGN KEY -> Classes)
├── teacherId (FOREIGN KEY -> Users)
├── dateScheduled (DATETIME)
├── durationMinutes (INTEGER)
├── status (TEXT: draft, published, completed)
├── totalMarks (REAL)
└── createdAt, updatedAt (DATETIME)

Students
├── id (INTEGER, PRIMARY KEY)
├── fullName (TEXT)
├── email (TEXT, UNIQUE)
├── phone (TEXT)
├── age (INTEGER)
├── grade (TEXT)
├── classId (INTEGER)
├── rollNumber (TEXT)
├── metadata (JSON)
└── createdAt, updatedAt (DATETIME)

Grades
├── id (INTEGER, PRIMARY KEY)
├── examId (FOREIGN KEY -> Exams)
├── studentId (FOREIGN KEY -> Students)
├── questionId (FOREIGN KEY -> Questions)
├── score (REAL)
├── total (REAL)
├── feedback (TEXT)
├── gradedBy (FOREIGN KEY -> Users)
├── gradedAt (DATETIME)
└── createdAt (DATETIME)

Imports
├── id (INTEGER, PRIMARY KEY)
├── filename (TEXT)
├── uploaderId (FOREIGN KEY -> Users)
├── status (TEXT: pending, completed)
├── rowsProcessed (INTEGER)
├── mapping (JSON)
├── errors (JSON)
├── uploadedAt, processedAt (DATETIME)
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### Step 1: Install Dependencies
```bash
npm install
```

This installs:
- express (web framework)
- sqlite3 (database)
- body-parser (request parsing)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- multer (file uploads)
- csv-parse (CSV parsing)
- xlsx (Excel parsing)
- puppeteer (PDF export)
- joi (validation)

### Step 2: Start the Server
```bash
npm start
```

The server will start on **http://localhost:3000**

### Step 3: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 📱 Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Student Management - Add, edit, view all students |
| `/dashboard` | Teacher Dashboard - Quick stats and recent items |
| `/templates` | Exam Templates - Create and manage question templates |
| `/exams` | Exam Management - Create exams and grade students |
| `/import` | Bulk Import - Upload and import students from CSV/Excel |
| `/login` | User Login |
| `/register` | User Registration |
| `/forgot-password` | Password Recovery |
| `/reset-password` | Reset Password |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get single student
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Classes
- `POST /api/exams/classes` - Create class
- `GET /api/exams/classes` - Get classes for teacher
- `GET /api/exams/classes/:id` - Get class details
- `PUT /api/exams/classes/:id` - Update class
- `DELETE /api/exams/classes/:id` - Delete class

### Exam Templates
- `POST /api/exams/templates` - Create template
- `GET /api/exams/templates` - Get all templates for teacher
- `GET /api/exams/templates/:id` - Get template with questions
- `PUT /api/exams/templates/:id` - Update template
- `DELETE /api/exams/templates/:id` - Delete template

### Questions
- `POST /api/exams/questions` - Create question
- `GET /api/exams/templates/:id/questions` - Get questions by template
- `PUT /api/exams/questions/:id` - Update question
- `DELETE /api/exams/questions/:id` - Delete question

### Exams
- `POST /api/exams` - Create exam
- `GET /api/exams` - Get all exams for teacher
- `GET /api/exams/:id` - Get exam with questions and grades
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

### Grading
- `POST /api/exams/grades/:examId/:studentId` - Create/update grade
- `GET /api/exams/:examId/grades` - Get grades for exam
- `GET /api/exams/student/:studentId/grades` - Get student grades
- `PUT /api/exams/grades/:gradeId` - Update grade

### Imports
- `POST /api/imports/preview` - Preview uploaded file
- `POST /api/imports/import` - Import students from file
- `GET /api/imports/history` - Get import history for user
- `GET /api/imports/:id` - Get import details

## 📋 CSV/Excel Import Format

Your CSV or Excel file should have these columns (header row required):

```
fullName, email, phone, age, grade
John Doe, john@example.com, 1234567890, 18, A
Jane Smith, jane@example.com, 0987654321, 17, B
```

**Required Fields:**
- fullName
- email

**Optional Fields:**
- phone
- age
- grade

## 🔐 Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs
- **JWT Authentication**: Secure token-based authentication
- **HTTPS Ready**: Can be deployed with HTTPS
- **SQL Injection Protection**: Using parameterized queries
- **XSS Protection**: HTML escaping in frontend
- **CORS Ready**: Can be configured for production

## 📊 Use Cases

### For Teachers
1. **Quickly Create Exams**: Use templates to generate exams in seconds
2. **Organize Questions**: Build question banks by difficulty and topic
3. **Manage Classes**: Organize students into classes
4. **Grade Efficiently**: Grade exams and provide feedback
5. **Track Progress**: View student performance metrics

### For Administrators
1. **Bulk Import**: Import all students at once from Excel/CSV
2. **Class Management**: Create and manage multiple classes
3. **Template Library**: Build reusable templates for the institution
4. **Report Generation**: Export grades and exam results

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern Gradient UI**: Purple gradient theme with smooth animations
- **Drag-and-Drop**: File upload with drag-and-drop support
- **Data Validation**: Client and server-side validation
- **Real-time Search**: Instant filtering of students and data
- **Modal Dialogs**: Pop-up forms for better UX
- **Loading States**: Visual feedback during API calls
- **Error Handling**: User-friendly error messages

## 🚢 Deployment Guide

### To deploy to production:

1. **Update JWT_SECRET** in `src/auth.js` with a secure random string
2. **Configure Database**: Move to production database if needed
3. **Enable HTTPS**: Use nginx or similar for SSL/TLS
4. **Set Environment Variables**: Configure with .env file
5. **Use PM2**: Run `npm install -g pm2` and `pm2 start src/server.js`
6. **Nginx Configuration**: Set up reverse proxy

### Environment Variables (optional)
```bash
PORT=3000
JWT_SECRET=your_secret_key_here
NODE_ENV=production
```

## 🔧 Troubleshooting

**Issue: "Port 3000 already in use"**
```bash
# Use a different port
PORT=3001 npm start
```

**Issue: "Database locked"**
- Ensure only one server instance is running
- Check that no other processes have the database file open

**Issue: "Import file not found"**
- Ensure uploads directory exists
- Check file permissions

**Issue: "Template/Exam not loading"**
- Check browser console for errors
- Verify JWT token is valid
- Check server logs for API errors

## 📝 Sample Workflows

### Workflow 1: Create Exam from Template
1. Go to Templates → Create a template with questions
2. Go to Exams → Create exam using the template
3. Add additional questions if needed
4. Publish the exam
5. Students take the exam
6. Grade the exam in the Grading interface

### Workflow 2: Import Students & Create Class Exam
1. Go to Import → Upload CSV file with students
2. Map columns and import students
3. Go to Exams → Create Class
4. Create Exam for that Class
5. Add questions
6. Assign exam to class
7. Grade when students complete

### Workflow 3: Build Reusable Template Library
1. Create templates for different subjects
2. Add questions at different difficulty levels
3. Tag questions by topic
4. Use templates for multiple exams throughout the year

## 🎓 Future Enhancements

Potential features to add:
1. **Student Portal**: Students can view their grades and feedback
2. **Email Notifications**: Notify students of exam schedules
3. **Analytics Dashboard**: Student performance analytics and charts
4. **PDF Export**: Export exams as PDF for printing
5. **Scheduled Exams**: Automated exam scheduling and reminders
6. **Mobile App**: React Native or Flutter mobile application
7. **Video Proctoring**: Integration with video proctoring services
8. **AI Question Generation**: Auto-generate questions using OpenAI
9. **Plagiarism Detection**: For essay-type questions
10. **Parent Portal**: Parents can view student performance

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API endpoints documentation
3. Check browser console for JavaScript errors
4. Check server logs for backend errors

## 📄 License

MIT License - Free to use and modify

## 👨‍💻 Developer Notes

### Project Structure
```
├── src/
│   ├── server.js          # Express server setup
│   ├── database.js        # SQLite operations
│   ├── auth.js            # Authentication routes
│   ├── exams.js           # Exam management routes
│   └── imports.js         # File upload routes
├── public/
│   ├── index.html         # Student management
│   ├── dashboard.html     # Teacher dashboard
│   ├── templates.html     # Exam templates
│   ├── exams.html         # Exam management
│   ├── import.html        # Bulk import
│   ├── login.html         # Login page
│   ├── register.html      # Registration page
│   ├── script.js          # Student page logic
│   ├── templates.js       # Template page logic
│   ├── exams.js           # Exam page logic
│   ├── import.js          # Import page logic
│   ├── dashboard.js       # Dashboard logic
│   └── styles.css         # All styling
├── db/
│   └── students.db        # SQLite database
└── package.json           # Dependencies

```

### Code Guidelines
- Use arrow functions in callbacks
- Escape all HTML output to prevent XSS
- Validate input on both client and server
- Use descriptive variable and function names
- Add comments for complex logic
- Follow REST API conventions

## 🎉 Getting Started Checklist

- [x] Install Node.js and npm
- [x] Download/clone the project
- [x] Run `npm install`
- [x] Run `npm start`
- [x] Open http://localhost:3000
- [x] Register as a teacher
- [x] Create templates with questions
- [x] Import students from CSV
- [x] Create classes and exams
- [x] Grade student exams

**Congratulations! You're ready to use the Teacher Exam & Student Management System!** 🎓

---

**Version**: 1.0.0  
**Last Updated**: February 14, 2026  
**Status**: Production Ready ✅
