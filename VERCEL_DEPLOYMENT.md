# Vercel Deployment Setup

## Environment Variables

For Vercel deployment, add these variables in your Vercel project settings:

```
# Required for AI Exam Generation
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server Configuration
NODE_ENV=production
PORT=3000

# Optional: JWT Secret (auto-generated if not provided)
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

### How to Add Environment Variables to Vercel:

1. Go to your project settings: `https://vercel.com/dashboard/project/[project-name]/settings`
2. Navigate to "Environment Variables"
3. Add each variable name and value
4. Re-deploy your project for changes to take effect

## Vercel Configuration

The `vercel.json` file is already configured for serverless deployment:

- **Entry point**: `api/index.js` (Express app)
- **Build command**: `npm install`
- **Dev command**: `npm start`
- **Node version**: 18.x (default)

## Database Configuration

For Vercel deployment, SQLite database will be created in `/tmp` (ephemeral storage).
For production, consider using a cloud database (PostgreSQL, MongoDB, etc.).

## Important Notes

1. **File Uploads**: Vercel has a 50MB request limit. Large file uploads may need optimization.
2. **Database Persistence**: SQLite is ephemeral in Vercel. Use a persistent database service for production.
3. **Environment Variables**: Add all `.env` variables to Vercel project settings.

## Deployment Steps

1. **Connect GitHub Repository**:
   - Go to https://vercel.com/new
   - Import your GitHub repository: `https://github.com/rhallouka-cmd/AI_exam.git`
   - Select your GitHub account

2. **Configure Project**:
   - Framework: Node.js
   - Build Command: `npm install`
   - Output Directory: (leave empty)

3. **Add Environment Variables**:
   - Add all variables from `.env` or `.env.production`

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

5. **View Deployment**:
   - Your app will be available at: `https://your-project-name.vercel.app`

## Testing After Deployment

- Test login: `https://your-project.vercel.app/login`
- Test API: `https://your-project.vercel.app/api/students`
- Test dashboard: `https://your-project.vercel.app/dashboard`

## Troubleshooting

If you encounter issues:

1. Check Vercel logs: https://vercel.com/dashboard
2. Verify environment variables are set correctly
3. Check database initialization (see logs)
4. Ensure all dependencies are in package.json

## Next Steps for Production

For a production-ready application:

1. **Database**: Migrate to a cloud database (PostgreSQL on Railway, Render, or similar)
2. **File Storage**: Use cloud storage (AWS S3, Cloudinary, or similar)
3. **Security**: 
   - Update JWT_SECRET in production
   - Enable HTTPS (automatic on Vercel)
   - Add rate limiting
   - Add input validation and sanitization

4. **Monitoring**: Set up error tracking (Sentry, Rollbar)
5. **Backups**: Implement database backup strategy
