# Student Management System - Project Setup Instructions

## Project Overview
A complete full-stack Student Management Application with Express backend, SQLite database, and HTML/CSS/JavaScript frontend.

## Completed Setup Steps

### 1. ✅ Clarified Project Requirements
- Full-stack Student Management Application
- Backend: Express.js with Node.js
- Database: SQLite
- Frontend: HTML/CSS/JavaScript
- CRUD operations for managing students

### 2. ✅ Scaffolded the Project
- Created directory structure:
  - `public/` - Frontend files (HTML, CSS, JavaScript)
  - `src/` - Backend files (server.js, database.js)
  - `db/` - SQLite database directory
  - `.github/` - Configuration files

### 3. ✅ Created Project Files
- `package.json` - Project metadata and dependencies
- `src/server.js` - Express server with API routes
- `src/database.js` - SQLite database management
- `public/index.html` - Frontend HTML with form and table
- `public/styles.css` - Responsive CSS styling
- `public/script.js` - Frontend JavaScript with CRUD functionality
- `README.md` - Complete project documentation

### 4. Next Steps - Install Dependencies
Run the following command to install required packages:
```bash
npm install
```

This will install:
- express (web framework)
- sqlite3 (database)
- body-parser (request parsing)

### 5. Start the Application
After dependencies are installed, run:
```bash
npm start
```

The server will start on http://localhost:3000

## Project Structure

```
├── public/
│   ├── index.html      - Main application page
│   ├── styles.css      - Responsive styling
│   └── script.js       - Frontend logic
├── src/
│   ├── server.js       - Express server & API routes
│   └── database.js     - SQLite operations
├── db/
│   └── students.db     - SQLite database (auto-created)
├── package.json        - Dependencies
└── README.md          - Documentation
```

## Key Features

1. **Complete CRUD Operations**
   - Create new students
   - Read/view all students
   - Update student information
   - Delete students

2. **Responsive Design**
   - Works on desktop, tablet, and mobile
   - Modern gradient UI with animations
   - Smooth transitions and hover effects

3. **Search Functionality**
   - Real-time search by name, email, or roll number
   - Case-insensitive filtering

4. **Data Validation**
   - Required fields: Name, Email, Roll Number
   - Unique constraints on Email and Roll Number
   - GPA validation (0-4.0)

5. **RESTful API**
   - GET /api/students - Get all students
   - GET /api/students/:id - Get single student
   - POST /api/students - Create student
   - PUT /api/students/:id - Update student
   - DELETE /api/students/:id - Delete student

## Database Schema

```sql
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    rollNumber TEXT NOT NULL UNIQUE,
    course TEXT,
    gpa REAL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Installation and Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   Navigate to http://localhost:3000

## Form Fields

- **Name** - Student's full name (required)
- **Email** - Student's email address (required, unique)
- **Phone** - Student's phone number (optional)
- **Roll Number** - Student's roll number (required, unique)
- **Course** - Course enrolled in (optional)
- **GPA** - Grade Point Average (optional, 0-4.0)

## Technologies

- **Backend**: Node.js, Express.js, SQLite3, Body Parser
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: SQLite

## Validation Rules

- Name: Required, non-empty string
- Email: Required, valid email format, unique in database
- Phone: Optional, any format
- Roll Number: Required, unique in database
- Course: Optional, any string
- GPA: Optional, numeric value between 0 and 4.0

## API Response Examples

### Success Response
```json
{
  "id": 1,
  "message": "Student created successfully"
}
```

### Error Response
```json
{
  "error": "Email already exists"
}
```

## Troubleshooting

1. **Port already in use**: Change PORT in server.js or environment variable
2. **Database locked**: Ensure no other processes are accessing students.db
3. **Missing dependencies**: Run `npm install` again
4. **Form validation errors**: Check browser console for details

## Next Actions

1. Run `npm install` to install all dependencies
2. Run `npm start` to start the development server
3. Open http://localhost:3000 in your browser
4. Start adding students using the form
