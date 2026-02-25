# Student Management System

A complete full-stack Student Management Application built with Node.js, Express, SQLite, and vanilla HTML/CSS/JavaScript.

## Features

- **Student CRUD Operations**: Create, Read, Update, and Delete student records
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Search**: Filter students by name, email, or roll number
- **Data Persistence**: SQLite database for reliable data storage
- **Validation**: Form validation and error handling on both frontend and backend
- **Modern UI**: Beautiful gradient design with smooth transitions and animations
- **RESTful API**: Clean API endpoints for all operations

## Project Structure

```
student-management-app/
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── styles.css         # CSS styles
│   └── script.js          # Frontend JavaScript
├── src/                    # Backend files
│   ├── server.js          # Express server setup
│   └── database.js        # SQLite database management
├── db/                    # Database files
│   └── students.db        # SQLite database (created on first run)
├── package.json           # Project dependencies
└── README.md             # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd "c:\Users\hp\Desktop\Dev en c\APP"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Start the server:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Usage

### Adding a Student
1. Fill in the form with student details:
   - **Name** (required)
   - **Email** (required, must be unique)
   - **Phone** (optional)
   - **Roll Number** (required, must be unique)
   - **Course** (optional)
   - **GPA** (optional, 0-4.0)
2. Click "Add Student" button
3. The student will appear in the table below

### Viewing Students
- All students are displayed in a table with their information
- The table shows: ID, Name, Email, Phone, Roll Number, Course, and GPA

### Searching for Students
- Use the search box to filter students by name, email, or roll number
- Search is case-insensitive and updates in real-time

### Editing a Student
1. Click the "Edit" button next to a student in the table
2. The form will populate with the student's current information
3. Modify the desired fields
4. Click "Update Student" button

### Deleting a Student
1. Click the "Delete" button next to a student in the table
2. Confirm the deletion when prompted
3. The student will be removed from the database

### Refreshing Data
- Click the "Refresh" button to reload all students from the database

## API Endpoints

### GET /api/students
- **Description**: Get all students
- **Response**: Array of student objects

### GET /api/students/:id
- **Description**: Get a specific student by ID
- **Parameters**: `id` - Student ID
- **Response**: Student object

### POST /api/students
- **Description**: Create a new student
- **Body**: 
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "rollNumber": "A001",
    "course": "Computer Science",
    "gpa": 3.8
  }
  ```
- **Response**: `{ id: <studentId>, message: "Student created successfully" }`

### PUT /api/students/:id
- **Description**: Update a student
- **Parameters**: `id` - Student ID
- **Body**: Same as POST request
- **Response**: `{ message: "Student updated successfully" }`

### DELETE /api/students/:id
- **Description**: Delete a student
- **Parameters**: `id` - Student ID
- **Response**: `{ message: "Student deleted successfully" }`

## Database Schema

### Students Table
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

## Technologies Used

- **Backend**: 
  - Node.js
  - Express.js
  - SQLite3
  - Body Parser

- **Frontend**: 
  - HTML5
  - CSS3 (with Flexbox and Grid)
  - Vanilla JavaScript (ES6+)

## Error Handling

- **Validation**: Required fields are validated both on frontend and backend
- **Unique Constraints**: Email and Roll Number must be unique in the database
- **Error Messages**: Clear error messages are displayed to the user
- **HTTP Status Codes**: Appropriate status codes are returned for different scenarios

## Features in Detail

### Form Validation
- Name, Email, and Roll Number are required
- Email must be in valid email format
- GPA must be between 0 and 4.0
- Roll Number must be unique
- Email must be unique

### Responsive Design
- Mobile-first approach
- Breakpoints for tablets (768px) and mobile (480px)
- Flexible layouts using CSS Flexbox and Grid
- Touch-friendly buttons and inputs

### Security
- Input sanitization to prevent XSS attacks
- SQL prepared statements to prevent SQL injection
- Server-side validation of all inputs

## Future Enhancements

- User authentication and authorization
- Student attendance tracking
- Grade management system
- Advanced reporting and analytics
- Export to CSV/PDF functionality
- Multiple user roles (admin, teacher, student)
- Student portal login
- Bulk import from CSV files

## License

MIT

## Author

Student Management System v1.0.0

## Support

For issues or questions, please refer to the application console for error messages and logs.
