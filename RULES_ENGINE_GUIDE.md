# Rules Engine Exam Generator - Setup & Usage Guide

## Overview

The Student Management System now uses a **Rules Engine Exam Generator** that learns from your previous exams and creates new ones matching your teaching style. **No API keys required - everything works locally!**

## How It Works

### 1. **Upload Exam Examples**
   - Teachers upload their previous exam papers (PDF/Images)
   - The system automatically extracts questions and patterns
   - Patterns learned: question types, difficulty, structure, length

### 2. **System Analyzes Your Style**
   - Question distribution (MCQ vs Short Answer vs Essay)
   - Difficulty levels used
   - Average question length
   - Topic areas covered
   - Preferred question formats

### 3. **Generate New Exams**
   - Based on the patterns learned from your examples
   - Generates questions matching your teaching style
   - Can specify subject, difficulty, question count, types
   - No external API needed - all processing is local!

## Features

✅ **Pattern-Based Generation**
- Learns from your exam examples
- Generates exams in your style
- Completely customizable

✅ **Multi-Source Support**
- Upload PDF exam papers
- Upload scanned exam images (JPG, PNG)
- System extracts questions automatically

✅ **Smart Question Bank**
- Builds a question bank from your examples
- Organizes by course, difficulty, type
- Can filter by course when generating

✅ **No Subscriptions or API Keys**
- Completely free
- No ChatGPT charges
- Everything runs on your server

✅ **Privacy**
- Your exam data stays on your server
- No data sent to external services

## Getting Started

### Step 1: Open Exam Examples Manager

Navigate to: **http://localhost:3000/exam-examples**

Or use the navigation menu:
- Dashboard → **Exam Examples** link
- Or any page navbar

### Step 2: Upload Previous Exam Papers

1. Click the upload area or drag & drop
2. Select PDF files or images of past exams
3. (Optional) Select the course name
4. Click "Upload & Analyze"
5. System extracts questions automatically

### Step 3: Generate Exams with AI

Navigate to: **http://localhost:3000/ai-exam-generator**

1. Fill in exam details:
   - **Subject/Topic**: What to generate questions about
   - **Number of Questions**: 5-100
   - **Difficulty**: Easy/Medium/Hard/Mixed
   - **Exam Title**: Name your exam
   - **Question Types**: MCQ, Short Answer, Essay
   - **Instructions** (Optional): Specific focus areas

2. Click "Generate Exam with AI"
3. The system uses your uploaded examples as inspiration
4. Review the generated questions
5. Click "Save Exam"

## How the Rules Engine Works

### Without Exam Examples
If you haven't uploaded any examples yet:
- System uses **template questions**
- Follows your default teaching preferences
- Still creates customized exams

### With Exam Examples
If you've uploaded previous exams:
- System **learns your question patterns**
- Extracts **real questions** from your examples
- Generates new questions **in your style**
- More authentic and personalized

### Quality Improvement
More examples = Better generation:
- 1-2 exams: Basic pattern recognition
- 3-5 exams: Good style learning
- 5+ exams: Excellent customization
- 10+ exams: Highly personalized

## Supported File Formats

### Recommended
- **PDF files** (.pdf) - Best results, automatic text extraction
- **Images** (.jpg, .jpeg, .png) - Visual exam papers

### File Requirements
- Maximum 10MB per file
- PDF: Searchable (text-based) works best
- Images: Must be readable/clear

## Database Schema

New tables created automatically:

```sql
-- Stores uploaded exam examples
exam_examples: id, teacherId, fileName, courseName, extractedData, patterns, uploadedAt

-- Stores extracted course materials
course_materials: id, teacherId, courseName, fileName, extractedTopics, uploadedAt

-- Stores teacher preferences
teacher_exam_style: id, teacherId, avgQuestionCount, preferredDifficulty, questionTypes, patterns
```

## Statistics Tracked

The system displays:
- **Exam Examples Uploaded**: Number of exam papers processed
- **Courses Analyzed**: Unique courses identified
- **Questions Extracted**: Total questions in your question bank

## API Endpoints

### Exam Examples Management
```
POST /api/exam-examples/upload
GET /api/exam-examples
GET /api/exam-examples/:id
DELETE /api/exam-examples/:id
```

### Exam Generation
```
POST /api/ai/generate-exam
- Now uses Rules Engine (not ChatGPT)
- Requires: subject, numQuestions, difficulty, examTitle, questionTypes
- Optional: description, courseName
```

## Translation Support

Available in all three languages:
- **English** (EN)
- **Français** (FR)
- **العربية** (AR)

## Best Practices

### For Best Results:

1. **Upload 3-5 Sample Exams**
   - Gives system good examples
   - Better pattern recognition
   - More customized output

2. **Include Multiple Courses**
   - If you teach multiple subjects
   - System can filter by course
   - More diverse question bank

3. **Use Consistent Formatting**
   - Clearer PDF files
   - Better text extraction
   - More accurate patterns

4. **Be Specific with Parameters**
   - Clear subject names
   - Specific difficulty levels
   - Select relevant question types

5. **Review & Edit**
   - Questions are suggestions
   - Edit as needed
   - Improve for next generation

## Troubleshooting

### "No exam examples uploaded yet"
- Upload some example exams first
- Use PDFs or clear images
- System will use templates if no examples exist

### "Questions extracted is 0"
- PDF might not have readable text
- Try converting image-based PDFs to searchable PDFs
- Or upload as image files instead

### "Generated questions seem generic"
- Upload more examples (3-5+ helps)
- System needs pattern samples
- More examples = better personalization

### Questions not saving
- Check browser console for errors
- Verify MongoDB/SQLite connection
- Ensure user is logged in

## Advanced Features (Future)

Planned enhancements:
- OCR for image-based exams
- AI-powered difficulty estimation
- Question quality scoring
- Automatic syllabus extraction
- Exam template suggestions

## Architecture

```
Student App
├── Public Pages
│   ├── exam-examples.html (Upload & manage)
│   ├── exam-examples.js (Frontend logic)
│   └── ai-exam-generator.html (Generate exams)
│
├── Backend Routes
│   ├── /api/exam-examples/* (Upload, retrieve, delete)
│   └── /api/ai/generate-exam (Rules engine)
│
├── Core Logic
│   ├── database.js (Tables for examples, materials, style)
│   ├── exam-examples.js (API routes)
│   └── rules-engine.js (Question generation)
│
└── Database
    ├── exam_examples (Uploaded papers)
    ├── course_materials (Extracted topics)
    └── teacher_exam_style (Learned preferences)
```

## No More ChatGPT Dependency

Previous system required:
- ❌ OpenAI API key
- ❌ Monthly API costs
- ❌ Internet/API calls
- ❌ Rate limiting concerns

New Rules Engine system:
- ✅ No external API
- ✅ Completely free
- ✅ Works offline
- ✅ Unlimited generations
- ✅ Privacy-focused

## Getting Started Checklist

- [ ] User logs in as teacher
- [ ] Navigates to Exam Examples page
- [ ] Uploads 2-3 previous exam papers
- [ ] System extracts questions (auto)
- [ ] Goes to AI Exam Generator
- [ ] Fills in exam parameters
- [ ] Generates exam (uses uploaded examples)
- [ ] Reviews and saves exam

## Support

For issues:
1. Check exam file quality (clear PDFs work best)
2. Verify upload was successful (check "Exam Examples Uploaded" count)
3. Review generated questions before saving
4. Upload more examples for better customization

## Summary

You now have a **completely self-contained, rules-based exam generator** that:
- 🎓 Learns from YOUR exams
- 📚 Matches YOUR teaching style
- 💰 Costs NOTHING
- 🔒 Keeps data PRIVATE
- ⚡ No API delays
- 🚀 Unlimited generations

Upload your exams and start generating in minutes!
