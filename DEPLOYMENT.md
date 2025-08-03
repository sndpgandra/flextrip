# FlexiTrip Deployment Guide

This guide covers deploying FlexiTrip to production using Vercel and Supabase.

## Prerequisites

Before deployment, ensure you have:
- ✅ FlexiTrip application working locally
- ✅ Supabase project with database schema deployed
- ✅ OpenRouter.ai account with API key
- ✅ GitHub repository with latest code pushed
- ✅ All environment variables working in `.env.local`

## Production Deployment Steps

### Step 1: Prepare for Deployment

1. **Ensure all changes are committed and pushed to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

2. **Verify your environment variables from `.env.local`:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`

### Step 2: Deploy to Vercel

1. **Sign up/Login to Vercel:**
   - Go to https://vercel.com
   - Sign up using your GitHub account (recommended)
   - This will automatically connect your GitHub repositories

2. **Create New Project:**
   - Click "New Project" button
   - Find and select your `flextrip` repository
   - Click "Import"

3. **Configure Project Settings:**
   - **Project Name:** `flextrip` (or your preferred name)
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### Step 3: Configure Environment Variables

1. **In Vercel Project Settings:**
   - Go to "Settings" tab
   - Click "Environment Variables" in sidebar

2. **Add the following environment variables:**

   | Name | Value | Environment |
   |------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Production, Preview, Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Production, Preview, Development |
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` | Production, Preview, Development |
   | `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |

   > **Security Note:** Never expose service role keys in client-side code. They should only be used in API routes.

3. **For `NEXT_PUBLIC_APP_URL`:**
   - After first deployment, update this with your actual Vercel URL
   - Example: `https://flextrip-abc123.vercel.app`

### Step 4: Deploy and Verify

1. **Initial Deployment:**
   - Click "Deploy" button
   - Wait for build process (usually 2-3 minutes)
   - Vercel will provide a deployment URL

2. **Update App URL:**
   - Copy your deployment URL
   - Go back to Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with the real URL
   - Redeploy to apply changes

3. **Test Production Deployment:**
   - Visit your deployment URL
   - Test complete user flow:
     - ✅ Homepage loads
     - ✅ Onboarding wizard works
     - ✅ Family profile creation
     - ✅ AI chat functionality
     - ✅ Trip saving

### Step 5: Configure Custom Domain (Optional)

1. **Purchase Domain:**
   - Use Vercel Domains, Namecheap, Google Domains, etc.

2. **Add Custom Domain in Vercel:**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Update Environment Variables:**
   - Update `NEXT_PUBLIC_APP_URL` to your custom domain
   - Redeploy to apply changes

## Post-Deployment Configuration

### Database Maintenance

1. **Set up automatic session cleanup:**
   ```sql
   -- Run this in Supabase SQL Editor to create a scheduled job
   SELECT cron.schedule(
     'cleanup-old-sessions',
     '0 2 * * *', -- Daily at 2 AM
     'SELECT cleanup_old_sessions();'
   );
   ```

2. **Monitor database usage:**
   - Check Supabase dashboard for storage usage
   - Free tier: 500MB database limit
   - Monitor active sessions and trips

### Performance Monitoring

1. **Enable Vercel Analytics:**
   - Go to Project Settings > Analytics
   - Enable Web Analytics
   - Add `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` if needed

2. **Monitor API Usage:**
   - Check OpenRouter.ai dashboard for token usage
   - Monitor costs and usage patterns
   - Set up billing alerts

### Security Checklist

- ✅ Environment variables properly configured
- ✅ No sensitive data in client-side code
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Row Level Security enabled in Supabase
- ✅ Rate limiting active on API routes
- ✅ CORS headers configured properly

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy when you push to `main` branch
- Run builds for preview deployments on PRs
- Provide preview URLs for testing

### Making Updates

1. **Development workflow:**
   ```bash
   # Make changes locally
   git add .
   git commit -m "Description of changes"
   git push origin main
   # Vercel automatically deploys
   ```

2. **Preview deployments:**
   - Create feature branch
   - Push to GitHub
   - Vercel creates preview deployment
   - Test before merging to main

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are listed in `package.json`
   - Verify TypeScript compilation locally

2. **Environment Variable Issues:**
   - Double-check variable names (case-sensitive)
   - Ensure all required variables are set
   - Redeploy after adding new variables

3. **Database Connection Issues:**
   - Verify Supabase project is not paused
   - Check if API keys are correct
   - Test connection from Vercel functions

4. **OpenRouter.ai Issues:**
   - Check API key validity
   - Verify account has sufficient credits
   - Monitor rate limits and usage

### Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Supabase Documentation:** https://supabase.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **FlexiTrip Issues:** https://github.com/sndpgandra/flextrip/issues

## Cost Monitoring

### Expected Monthly Costs

- **Vercel:** $0 (Free tier: 100GB bandwidth, unlimited deployments)
- **Supabase:** $0 (Free tier: 500MB database, 2GB bandwidth)
- **OpenRouter.ai:** $10-30 (depends on usage)
- **Custom Domain:** $10-15/year (optional)

**Total estimated cost: $10-30/month**

### Cost Optimization Tips

1. **Monitor OpenRouter.ai usage:**
   - Use GPT-4o mini for simpler queries
   - Implement client-side caching
   - Set up usage alerts

2. **Database optimization:**
   - Regular cleanup of old sessions
   - Monitor storage usage
   - Optimize query performance

3. **Vercel optimization:**
   - Monitor bandwidth usage
   - Use Next.js image optimization
   - Enable compression

---

**Deployment Complete!** 🚀

Your FlexiTrip application should now be live and accessible to users worldwide. Remember to test all functionality in production and monitor performance metrics.