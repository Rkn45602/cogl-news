# COGL NEWS - Full Stack News Website & CMS with Autonomous News Bot

Complete web platform for COGL News with news categories (Home, News, Politics, Sport, Business, Technology, Health, Culture, Arts, Travel, Earth), proof & verification drawers, video embeds, social links, breaking news ticker, full Admin CMS, and an **Autonomous World News Research & Publishing Bot**.

## Autonomous News Bot Features
- **Researches 20 Trending Stories Daily**: Researches 1 story in each of the 10 categories for Global audience and 1 story in each category for Indian audience (Total 20 stories daily across News, Politics, Sport, Business, Technology, Health, Culture, Arts, Travel, Earth).
- **Traffic & Trending Intelligence**: Targeted at high-traffic trending search topics to maximize visitor engagement and organic search reach.
- **Proof & Evidence Verification**: Every news article is automatically cross-referenced with primary wire dispatches, source bureau citations, and direct evidence links.
- **Topical Photo Evidence**: High-resolution, context-matched journalistic photos assigned automatically with guaranteed 100% uniqueness (zero duplicate images across the site).
- **SEO Hashtags Engine**: Auto-generates 5–7 high-traffic trending hashtags per story tailored to each category and audience (e.g. `#IndiaNews`, `#IndiaTrending`, `#WorldNews`, `#BreakingNews`, `#COGLNews`).
- **Autonomous Daily Schedule**: Configured to run automatically every day between **12:00 PM and 2:00 PM** without human intervention.
- **Cloud Automation via GitHub Actions**: Automated cron workflow in `.github/workflows/daily-news-bot.yml` runs daily at 12:15 PM IST (06:45 UTC), commits verified news, and auto-deploys to production even if your computer is off.

## Admin CMS Features (Edit, Delete & Hashtags for Corrections)
- **Edit News Story**: Correct any fact, update headline, revise summaries, body content, or attached proof sources.
- **SEO Hashtags Management**: Add, edit, or remove hashtags on any story to fix SEO or target specific keywords.
- **Delete News Story**: Permanently remove inaccurate or outdated stories with 1 click.
- **Quick-Correction Toolbar**: Chief Editors viewing any article can edit or delete it directly from the story reader view.
- **Autonomous Bot Control Panel**: View bot armed status, daily 12pm–2pm schedule, recent execution logs, and click **"⚡ Run Wire Bot (20 Stories: 10 Global + 10 India)"** to instantly generate & publish 20 fresh trending stories on demand.

## Quick Start
1. Double click `public/index.html` to run in any browser immediately with local storage.
2. OR run with Node.js:
   ```bash
   npm install
   npm start
   ```
   Open `http://localhost:3000`

3. To run the Autonomous News Bot manually anytime:
   ```bash
   npm run bot
   ```
   Or double-click `run-bot.bat` on Windows.

## Deployment

### 1. GitHub Pages (Static Web Deployment)
This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`.
1. Push the code to `https://github.com/Rkn45602/cogl-news`.
2. In your GitHub repository, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The site will automatically build and publish at `https://rkn45602.github.io/cogl-news/`.

### 2. Full-Stack Node.js Deployment (Render / Railway / Vercel)
To deploy the backend API with persistent JSON/database storage:
- **Render / Railway / Vercel**: Connect this GitHub repository and deploy.
- Environment variables (optional):
  - `PORT`: Server port (default: 3000)
  - `ADMIN_EMAIL`: Admin email ID (default: admin@coglnews.com)
  - `ADMIN_PASSWORD`: Admin secret password (default: CoglNews@2026!)

## Admin CMS Credentials
- **Editor Email / ID**: `admin@coglnews.com` (or simply `admin`)
- **Secret Password**: `CoglNews@2026!`

### How to Access the Admin CMS
- The Admin Panel button and red logo triple-click triggers have been removed from the website for maximum discretion and security.
- To reveal the Admin CMS login prompt, press `Ctrl + Shift + A + E` anywhere on the website.
- The Admin Panel cannot be accessed without valid Editor Email/ID and Password.
