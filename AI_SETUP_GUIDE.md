# AI Exam Generator Setup Guide

## Overview
The Student Management System now includes an **AI-powered Exam Generator** that uses ChatGPT to automatically generate complete exams with questions, eliminating the need for manual question creation.

## Features

✅ **Automated Exam Generation**
- Generate full exams with multiple questions in seconds
- AI creates questions based on subject, difficulty level, and question types

✅ **Customizable Parameters**
- Subject/Topic specification
- Number of questions (5-100)
- Difficulty levels: Easy, Medium, Hard, Mixed
- Multiple question types: MCQ, Short Answer, Essay
- Additional instructions/focus areas

✅ **Quality Generated Content**
- Multiple choice questions with 4 options and correct answer
- Short answer questions with model answers
- Essay questions with rubric points
- Ready to save and use immediately

## Prerequisites

### 1. OpenAI API Key
You need an OpenAI API key to use the AI exam generator.

**Get Your API Key:**

1. Go to https://platform.openai.com/account/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again)

### 2. Node.js Dependencies
The application uses `dotenv` to manage environment variables. This has already been installed.

## Setup Instructions

### Step 1: Add Your API Key

1. Open the `.env` file in the project root:
   ```
   OPENAI_API_KEY=sk-your-api-key-here
   ```

2. Replace `sk-your-api-key-here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-1234567890abcdefghijk...
   ```

3. Save the file

### Step 2: Restart the Server

```bash
# If running
npm start
```

The server will automatically load the `.env` file.

### Step 3: Test the AI Exam Generator

1. Open http://localhost:3000/ai-exam-generator
2. Fill in the form:
   - **Subject/Topic**: Enter the topic (e.g., "Photosynthesis", "World War II")
   - **Number of Questions**: Enter between 5-100
   - **Difficulty Level**: Choose Easy, Medium, Hard, or Mixed
   - **Exam Title**: Give the exam a name
   - **Question Types**: Select at least one (MCQ, Short Answer, Essay)
   - **Instructions** (Optional): Add any special focus areas

3. Click "Generate Exam with AI"
4. Review the generated questions
5. Click "Save Exam" to store in database

## API Pricing

OpenAI uses a pay-as-you-go model:

- **GPT-3.5-turbo**: ~$0.001 per question (most cost-effective)
- Each exam typically costs $0.01-$0.05 depending on length

Free trial: OpenAI gives $5 in free credits for new accounts (valid 3 months).

## Environment Variables

The application uses these environment variables (in `.env` file):

```
# Required for AI Exam Generation
OPENAI_API_KEY=sk-your-api-key-here

# Optional
PORT=3000
NODE_ENV=development
```

## Navigation

The AI Exam Generator is accessible from:

1. **Main Navigation**: New "AI Exam Generator" link in the navbar
2. **Direct Access**: http://localhost:3000/ai-exam-generator
3. **All Pages**: Teachers can access it from Dashboard, Exams, or Courses pages

## File Structure

New files added:

```
public/
├── ai-exam-generator.html        # UI for AI exam generation
└── ai-exam-generator.js          # Frontend logic

src/
└── server.js                      # Updated with /api/ai/generate-exam endpoint

Configuration:
├── .env                           # Environment variables (add your API key here)
└── .env.example                  # Example template
```

## Troubleshooting

### "OpenAI API key not configured"
- **Solution**: Add your API key to the `.env` file
- Ensure the key starts with `sk-`
- Restart the server

### "Failed to generate exam"
- **Check API key validity**: Test at https://platform.openai.com/account/api-keys
- **Check billing**: Ensure your OpenAI account has active credits
- **Check network**: Ensure internet connection is working

### Slow exam generation
- AI processing typically takes 10-30 seconds
- Larger question counts or complex topics may take longer

### Generated questions have errors
- The AI quality depends on:
  - Clear subject specification
  - Reasonable difficulty level
  - Specific question types
  - Additional instructions (when needed)
- You can regenerate with different settings

## Best Practices

### For Best Results:

1. **Be Specific with Topics**: 
   - ✅ Good: "Photosynthesis - Electron Transport Chain"
   - ❌ Bad: "Science"

2. **Use Clear Instructions**:
   - Include chapters, focus areas
   - Specify any excluded topics
   - Example: "Focus on chapters 5-8, exclude math problems"

3. **Match Difficulty to Grade Level**:
   - Easy: Primary/Basic concepts
   - Medium: Standard curriculum
   - Hard: Advanced/Honours level

4. **Select Appropriate Question Types**:
   - MCQ: Knowledge/understanding check
   - Short Answer: Application of concepts
   - Essay: Critical thinking/analysis

5. **Start Small**: Generate 10-15 questions first to test quality

## Advanced Configuration

### Changing the AI Model

To use a different GPT model, edit `src/server.js` line ~180:

```javascript
model: 'gpt-3.5-turbo',  // Change to 'gpt-4' for more advanced questions
```

Models available:
- `gpt-3.5-turbo` (fast, cost-effective) ⭐ Default
- `gpt-4` (more accurate, higher cost)

### Adjusting AI Creativity

In `src/server.js`, modify the `temperature` parameter (currently 0.7):

```javascript
temperature: 0.7,  // Range: 0 (precise) to 1.5 (creative)
```

## Cost Estimate

Typical exam generation costs:

| Questions | Type | Est. Cost |
|-----------|------|-----------|
| 5 | Mixed | $0.01 |
| 10 | Mixed | $0.02 |
| 20 | Mixed | $0.04 |
| 50 | Mixed | $0.10 |
| 100 | Mixed | $0.20 |

*Costs are approximate and may vary based on question complexity.*

## API Monitoring

Monitor your API usage at: https://platform.openai.com/account/usage/overview

## Security

⚠️ **Important Security Notes:**

- **Never** commit `.env` file to version control
- The `.env` file is in `.gitignore` (not tracked)
- Keep your API key private
- If accidentally exposed, delete the key immediately from OpenAI dashboard

## Support

If you encounter issues:

1. Check that API key is correct at https://platform.openai.com/account/api-keys
2. Verify OpenAI account has available credits
3. Check browser console (F12) for JavaScript errors
4. Ensure server is running on port 3000

## Next Steps

After setting up the AI Exam Generator:

1. ✅ Add your OpenAI API key to `.env`
2. ✅ Restart the server
3. ✅ Navigate to AI Exam Generator page
4. ✅ Generate your first exam
5. ✅ Review and save questions to database

Enjoy automated exam generation! 🎓
