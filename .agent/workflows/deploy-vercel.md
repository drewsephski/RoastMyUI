---
description: Deploy to Vercel without losing functionality
---

# Deploy Roast My UI to Vercel

This workflow ensures your app deploys properly to Vercel with full Puppeteer screenshot functionality.

## Prerequisites

1. **Environment Variables**: Make sure you have your API key ready
   - `GEMINI_API_KEY` or `API_KEY` - Your Google Gemini API key

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Set Environment Variables

You have two options:

**Option A: Via Vercel Dashboard**
- Go to your project settings on vercel.com
- Navigate to Settings → Environment Variables
- Add `GEMINI_API_KEY` with your API key value
- Make sure it's available for Production, Preview, and Development

**Option B: Via CLI**

```bash
vercel env add GEMINI_API_KEY
```

When prompted:
- Select "Production"
- Paste your API key
- Repeat for "Preview" and "Development" if needed

### 4. Deploy to Vercel

**First deployment:**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? Yes
- Which scope? (select your account)
- Link to existing project? No (or Yes if you already created one)
- What's your project's name? roast-my-ui
- In which directory is your code located? ./
- Want to override the settings? No

**Subsequent deployments:**
```bash
vercel --prod
```

## What We Changed for Vercel Compatibility

### 1. **Puppeteer Dependencies**
- Replaced `puppeteer` with `puppeteer-core` + `@sparticuz/chromium`
- This uses a pre-built Chromium binary optimized for serverless environments
- Keeps bundle size under Vercel's 50MB limit

### 2. **Next.js Configuration** (`next.config.ts`)
- Added `serverExternalPackages` to prevent bundling Puppeteer
- This ensures the packages work correctly in the serverless environment

### 3. **Environment Detection** (`app/actions.ts`)
- Production: Uses `@sparticuz/chromium` (lightweight, Vercel-compatible)
- Development: Uses local `puppeteer` (full browser for testing)

### 4. **Vercel Function Settings** (`vercel.json`)
- Increased memory to 3008MB (maximum for Pro tier, 1024MB for Hobby)
- Set timeout to 30 seconds (maximum for Hobby tier, can go to 60s on Pro)
- These settings ensure screenshots don't timeout

## Troubleshooting

### Issue: "Function exceeded maximum size"
- **Solution**: Make sure `serverExternalPackages` is in `next.config.ts`
- Verify `puppeteer-core` is used, not full `puppeteer` in production

### Issue: "Screenshot capture failed" in production
- **Solution**: Check Vercel function logs
- Ensure memory is set to at least 1024MB in `vercel.json`
- Some websites may block headless browsers - this is expected

### Issue: "API_KEY is not defined"
- **Solution**: Verify environment variables are set in Vercel dashboard
- Redeploy after adding environment variables

### Issue: Function timeout
- **Solution**: Increase `maxDuration` in `vercel.json` (max 30s on Hobby, 60s on Pro)
- Consider reducing screenshot timeout in `actions.ts` if needed

## Verifying Deployment

1. After deployment, Vercel will give you a URL
2. Visit the URL and test the roast functionality
3. Check Vercel function logs if anything fails:
   ```bash
   vercel logs
   ```

## Local Testing Before Deploy

Test the production build locally:

```bash
bun run build
bun run start
```

This ensures everything works before deploying to Vercel.

## Notes

- **Hobby Plan Limits**: 1024MB memory, 10s timeout (can request up to 30s)
- **Pro Plan Limits**: 3008MB memory, 60s timeout
- The app will work on Hobby tier but may occasionally timeout on slow websites
- Screenshots are cached as base64 in the response, so they persist after function execution
