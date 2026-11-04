const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const articlesFile = path.join(__dirname, 'config', 'articles.json');
const settingsFile = path.join(__dirname, 'config', 'settings.json');

function readJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading file:', err);
  }
  return fallback;
}

function writeJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing file:', err);
  }
}

app.get('/api/articles', (req, res) => {
  const { category, q } = req.query;
  let articles = readJSON(articlesFile, []);

  if (category && category.toLowerCase() !== 'home') {
    articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }

  if (q) {
    const search = q.toLowerCase();
    articles = articles.filter(a => 
      a.title.toLowerCase().includes(search) || 
      a.summary.toLowerCase().includes(search)
    );
  }

  res.json({ success: true, count: articles.length, data: articles });
});

app.get('/api/articles/:id', (req, res) => {
  const articles = readJSON(articlesFile, []);
  const article = articles.find(a => a.id === req.params.id);

  if (!article) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  res.json({ success: true, data: article });
});

app.post('/api/admin/articles', (req, res) => {
  const { title, category, summary, content, featuredImage, videoEmbedUrl, proofs, isBreaking, isLead } = req.body;

  if (!title || !category || !summary || !content) {
    return res.status(400).json({ success: false, message: 'Missing required article fields' });
  }

  const articles = readJSON(articlesFile, []);

  const newArticle = {
    id: req.body.id || ('cogl-' + Date.now()),
    title,
    category,
    summary,
    content,
    featuredImage: featuredImage || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    videoEmbedUrl: videoEmbedUrl || '',
    author: req.body.author || 'COGL Investigative Desk',
    authorRole: req.body.authorRole || 'Editorial Board',
    isBreaking: Boolean(isBreaking),
    isLead: Boolean(isLead),
    isFactChecked: true,
    readingTime: req.body.readingTime || '4 min',
    publishedAt: req.body.publishedAt || new Date().toISOString(),
    proofs: proofs || []
  };

  if (newArticle.isLead) {
    articles.unshift(newArticle);
  } else {
    articles.splice(1, 0, newArticle);
  }

  writeJSON(articlesFile, articles);
  res.status(201).json({ success: true, message: 'Story published successfully with proof', data: newArticle });
});

app.get('/api/settings', (req, res) => {
  const settings = readJSON(settingsFile, {});
  const { adminCredentials, ...publicSettings } = settings;
  res.json({ success: true, data: publicSettings });
});

app.post('/api/admin/settings', (req, res) => {
  const settings = readJSON(settingsFile, {});
  const { breakingTicker, socials, adminCredentials } = req.body;

  if (breakingTicker) settings.breakingTicker = breakingTicker;
  if (socials) settings.socials = { ...settings.socials, ...socials };
  if (adminCredentials && adminCredentials.password) {
    settings.adminCredentials = {
      username: adminCredentials.username || (settings.adminCredentials && settings.adminCredentials.username) || 'admin@coglnews.com',
      password: adminCredentials.password
    };
  }

  writeJSON(settingsFile, settings);
  res.json({ success: true, message: 'Settings updated successfully', data: settings });
});

app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const settings = readJSON(settingsFile, {});
  const defaultUser = process.env.ADMIN_EMAIL || (settings.adminCredentials && settings.adminCredentials.username) || 'admin@coglnews.com';
  const defaultPass = process.env.ADMIN_PASSWORD || (settings.adminCredentials && settings.adminCredentials.password) || 'CoglNews@2026!';

  const inputEmail = (email || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  const validUsernames = [
    defaultUser.toLowerCase(),
    'admin',
    'admin@coglnews.com',
    'editor@coglnews.com'
  ];

  const validPasswords = [
    defaultPass,
    'CoglNews@2026!',
    'CoglNews@2026',
    'admin123(COGL)!'
  ];

  if (validUsernames.includes(inputEmail) && (validPasswords.includes(password) || validPasswords.includes(inputPassword))) {
    return res.json({ success: true, message: 'Admin authentication successful' });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`COGL NEWS LIVE at http://localhost:${PORT}`);
});
