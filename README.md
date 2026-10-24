# COGL NEWS - Full Stack News Website & CMS

Complete web platform for COGL News with news categories (Home, News, Politics, Sport, Business, Technology, Health, Culture, Arts, Travel, Earth), proof & verification drawers, video embeds, social links, breaking news ticker, and full Admin CMS.

## Quick Start
1. Double click `public/index.html` to run in any browser immediately with local storage.
2. OR run with Node.js:
   ```bash
   npm install
   npm start
   ```
   Open `http://localhost:3000`

## Deployment

### 1. GitHub Pages (Static Web Deployment)
This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`.
1. Push the code to `https://github.com/Rkn45602/cogl-news`.
2. In your GitHub repository, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The site will automatically build and publish at `https://rkn45602.github.io/cogl-news/`.

### 2. Full-Stack Node.js Deployment (Render / Railway / Vercel)
To deploy the backend API with persistent JSON/database storage:
- **Render / Railway**: Connect this GitHub repository and set the start command to `npm start` (port 3000 or `$PORT`).

## Admin CMS Credentials
- Email: `admin@coglnews.com`
- Password: `admin123(COGL)!`
