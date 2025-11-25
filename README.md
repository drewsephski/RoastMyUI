# 🔥 Roast My UI

## *Because Your Website Probably Deserves It*

Ever looked at a website and thought "this looks like it was designed in Microsoft Word"? Yeah, us too. That's why we built an AI that will absolutely **demolish** your UI with the brutal honesty of a Gen Z design critic who's had too much cold brew.

This isn't your grandma's design feedback tool. This is an AI-powered roasting machine that uses Google's Gemini AI to deliver savage, no-holds-barred critiques of website designs. Think Gordon Ramsay meets a design school dropout meets your brutally honest friend who won't let you leave the house in Crocs.

**Built with:** Next.js (because we're not animals), Puppeteer (for stalking your website), and the Google Generative AI SDK (for the cyber-bullying).

## ✨ Features (aka What Makes This Thing Tick)

- **AI-Powered Roasts**: Uses Gemini 2.0 Flash with Google Search grounding because we want our insults to be *accurate* and *contextual*. No cap.
- **Screenshot Analysis**: Captures live screenshots of websites using Puppeteer (it's like paparazzi for your homepage)
- **Visual Design Critique**: Analyzes spacing, typography, colors, layout, and overall UX with the precision of a designer who's had 4 espressos
- **Gen Z Personality**: Delivers roasts with authentic Gen Z slang and humor. It's giving constructive criticism but make it ✨spicy✨
- **Shareable Results**: Get a roast score (0-10, and yes it can be brutal), a tagline, strengths (we're not *completely* mean), weaknesses (okay maybe we are), and a tweet-ready share text for maximum embarrassment
- **Production Ready**: Optimized for deployment on Vercel with serverless functions because we actually know what we're doing (unlike your designer apparently)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd roast-my-ui
```

2. Install dependencies:

```bash
bun install
# or
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```bash
GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:

```bash
bun dev
# or
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Tech Stack (The Good Stuff)

- **Framework**: Next.js 16 (App Router) - because we like living on the edge
- **Runtime**: React 19 - fresh out of the oven
- **AI**: Google Generative AI SDK (Gemini 2.0 Flash) - the brain behind the burns
- **Screenshot**: Puppeteer (dev) / Puppeteer Core + @sparticuz/chromium (production) - one for local, one for the cloud
- **Styling**: Tailwind CSS 4 - utility classes go brrr
- **Language**: TypeScript - because we're not savages who use `any` everywhere

## 🏗️ Architecture

### Development vs Production

The app uses different Puppeteer configurations for local development and production:

- **Development**: Uses full `puppeteer` package with local Chromium
- **Production**: Uses `puppeteer-core` with `@sparticuz/chromium` for Vercel compatibility

This ensures the bundle stays under Vercel's 50MB serverless function limit while maintaining full functionality locally.

### Key Files

- `app/page.tsx` - Main UI component
- `app/actions.ts` - Server actions for screenshot capture and AI roasting
- `components/RoastResult.tsx` - Results display component
- `next.config.ts` - Next.js configuration with serverless optimizations
- `vercel.json` - Vercel function configuration (memory, timeout)

## 🌐 Deploying to Vercel

We've created a comprehensive deployment workflow. Run:

```bash
cat .agent/workflows/deploy-vercel.md
```

Or follow these quick steps:

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Login and deploy:

```bash
vercel login
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Add `GEMINI_API_KEY` with your API key
   - Make sure it's available for Production, Preview, and Development

4. Deploy to production:

```bash
vercel --prod
```

### Important Notes for Vercel

- **Memory**: Set to 3008MB (max for Pro) or 1024MB (Hobby tier)
- **Timeout**: 30s (Hobby) or 60s (Pro tier)
- **Environment Variables**: Must set `GEMINI_API_KEY` in Vercel dashboard
- **Bundle Size**: Optimized to stay under 50MB limit

## 🎨 How It Works (The Roasting Pipeline™)

1. **User Input**: You paste in a website URL (preferably one you're emotionally prepared to see destroyed)
2. **Screenshot Capture**: Puppeteer sneaks onto the site like a digital ninja and takes a screenshot (your website can't hide from us)
3. **AI Analysis**: We send the screenshot + URL to Gemini 2.0 Flash along with:
   - Google Search grounding so the AI knows what your site is *supposed* to do
   - Custom system instructions that basically say "be savage but educational"
   - Visual analysis prompts ("roast this design like your career depends on it")
4. **Roast Generation**: The AI returns a comprehensive drag session including:
   - Score (0-10 with decimals, because 5.3 hits different than 5.0)
   - Tagline (3-7 words of pure pain)
   - Roast paragraph (50-90 words of constructive destruction)
   - Strengths (2 things you didn't completely mess up)
   - Weaknesses (2 things that made the AI cry)
   - Share text (perfectly formatted for Twitter so everyone can witness your humiliation)
5. **Display**: Results shown with your screenshot and all the gory details. Screenshots don't lie, bestie.

## 🛠️ Development

### Build for Production

```bash
bun run build
```

### Run Production Build Locally

```bash
bun run build
bun run start
```

### Lint

```bash
bun run lint
```

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` or `API_KEY` | Yes | Google Gemini API key |
| `NODE_ENV` | Auto | Set to `production` by Vercel |

## 🐛 Troubleshooting (When Things Go Wrong, As They Do)

### Screenshot Capture Fails in Production

- Check Vercel function logs: `vercel logs` (it's like reading your diary but sadder)
- Ensure memory is set to at least 1024MB in `vercel.json` (Chromium is THICC)
- Some websites block headless browsers - this is expected behavior (they're scared of being roasted, honestly)

### "API_KEY is not defined" Error

- Verify environment variables are set in Vercel dashboard (did you actually set them though?)
- Redeploy after adding environment variables (turn it off and on again, but make it professional)

### Function Timeout

- Increase `maxDuration` in `vercel.json` (max 30s on Hobby, 60s on Pro) - some websites are just slow, it's not you
- Consider reducing screenshot timeout in `actions.ts` (or accept that some sites aren't worth the wait)

### Build Fails with "Module not found"

- Ensure all dependencies are installed: `bun install` (the classic "did you try installing it?")
- Check that `serverExternalPackages` is in `next.config.ts` (it should be, we put it there)

## ⚠️ Disclaimer

**This tool is for educational and entertainment purposes.** If you're genuinely hurt by the roasts, remember:

1. It's an AI, not a person (though sometimes it feels personal)
2. All feedback is meant to be constructive (even if it's delivered with the energy of a disappointed design professor)
3. Your website probably isn't *that* bad (okay, maybe it is, but you can fix it!)
4. We believe in you (but also, maybe hire a designer)

**Pro tip:** If the AI gives your site a 9+, it's either lying or you're a design god. There is no in-between.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Powered by [Google Gemini AI](https://ai.google.dev)
- Chromium for serverless by [@sparticuz/chromium](https://github.com/Sparticuz/chromium)
