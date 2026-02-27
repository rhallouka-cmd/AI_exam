# 🚀 Quick Start: Deploy to Vercel

## Prerequisites
✅ Verified:
- [x] Node.js v24.13.0 installed
- [x] Git v2.53.0 installed
- [x] Code pushed to GitHub: https://github.com/rhallouka-cmd/AI_exam.git
- [x] All tests PASSED (see TEST_REPORT.md)

---

## Deployment Steps (2 Minutes)

### Step 1: Create Vercel Account (If Needed)
1. Visit: **https://vercel.com/signup**
2. Sign up with GitHub account
3. Authorize Vercel to access your GitHub

### Step 2: Create New Project
1. Go to: **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/rhallouka-cmd/AI_exam.git`
4. Click **Import**

### Step 3: Configure Project
**Framework:** Node.js (detected automatically)
**Build Command:** `npm install` (leave as default)
**Output Directory:** (leave empty)
**Environment:** Keep as is

### Step 4: Add Environment Variables
1. Scroll to **"Environment Variables"** section
2. Add the following:

```
Key: OPENAI_API_KEY
Value: sk-your-actual-api-key-here
Scope: Production, Preview, Development
```

**Note:** Get your OpenAI API key from: https://platform.openai.com/account/api-keys

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait for deployment (usually 2-3 minutes)
3. Once done, you'll see: **"Congratulations! Your site is now live"**

### Step 6: Verify Live Deployment
Your app is now live at: `https://your-project-name.vercel.app`

Test these URLs:
- [ ] Main: https://your-project.vercel.app
- [ ] Login: https://your-project.vercel.app/login
- [ ] Register: https://your-project.vercel.app/register
- [ ] Dashboard: https://your-project.vercel.app/dashboard

---

## Troubleshooting

### Issue: Deployment Failed
**Solution:**
1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Ensure `package.json` exists
4. Check `vercel.json` configuration

### Issue: OPENAI_API_KEY Errors
**Solution:**
1. Get key from: https://platform.openai.com/account/api-keys
2. Verify key starts with `sk-`
3. Add to Vercel Settings → Environment Variables
4. Redeploy after adding key

### Issue: Database not persisting
**Solution:**
SQLite is ephemeral on Vercel. For production:
- Use PostgreSQL (Render, Railway)
- Use MongoDB (MongoDB Atlas)
- Use Supabase (PostgreSQL + Auth)

### Issue: 404 Errors
**Solution:**
Verify `vercel.json` routes are correct:
```json
{
  "version": 2,
  "builds": [...],
  "routes": [...]
}
```

---

## Post-Deployment Checklist

- [ ] App loads on Vercel URL
- [ ] Login page displays
- [ ] Registration works
- [ ] Can create new users
- [ ] Dashboard accessible after login
- [ ] API endpoints respond
- [ ] No console errors

---

## Environment Variables Reference

### Required
```
OPENAI_API_KEY=sk-your-api-key
```

### Optional
```
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_PATH=./db/students.db
PORT=3000
```

---

## Support Resources

| Resource | Link |
|----------|------|
| Vercel Docs | https://vercel.com/docs |
| OpenAI API | https://platform.openai.com/docs |
| GitHub Repo | https://github.com/rhallouka-cmd/AI_exam.git |
| Node.js Docs | https://nodejs.org/docs/ |

---

## Important Notes

⚠️ **For Production Deployment:**

1. **Database**: Migrate from SQLite to cloud database
   ```
   Recommended: PostgreSQL on Railway.app or Render.com
   ```

2. **File Storage**: Move uploads to cloud
   ```
   Recommended: AWS S3 or Cloudinary
   ```

3. **Email**: Setup email service for notifications
   ```
   Recommended: SendGrid or Mailgun
   ```

4. **Security**: Update secrets
   ```
   - Change JWT_SECRET
   - Use strong passwords
   - Enable 2FA on Vercel
   ```

---

## Monitoring

Once deployed, monitor:
- Vercel Analytics: https://vercel.com/analytics
- Error logs: https://vercel.com/dashboard/[project-name]/deployments
- Performance metrics
- API response times

---

## Redeployment

To redeploy after code changes:
1. Push code to GitHub `main` branch
2. Vercel automatically redeeploys
3. Changes live in ~2-3 minutes

---

## Rollback

If deployment has issues:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Select previous working deployment
4. Click "Promote to Production"

---

## Next Steps

After successful deployment:

1. ✅ Test all features on live URL
2. ✅ Setup monitoring and alerts
3. ✅ Configure custom domain (optional)
4. ✅ Setup database (optional, for persistence)
5. ✅ Configure file storage (optional, for uploads)
6. ✅ Setup error tracking (Sentry)
7. ✅ Monitor performance

---

## Success Message

🎉 **Application is now live on Vercel!**

Your AI Exam Generator is accessible worldwide at:
```
https://your-project-name.vercel.app
```

Share this URL with your team and users!

---

*Last Updated: February 27, 2026*
*Status: Ready for Production Deployment ✅*
