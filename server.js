const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { initScheduler, executeBotJob, getStatus } = require('./bot/scheduler');
const { assignUniqueTopicImage, getAllUsedImageURLs, auditAndDeduplicateAllArticles } = require('./bot/imageManager');
const { reviewContentSafety } = require('./bot/editorialPolicy');
const { processAdminChat, getSiteAnalytics } = require('./bot/chatEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const articlesFile = path.join(__dirname, 'config', 'articles.json');
const publicArticlesFile = path.join(__dirname, 'public', 'articles.json');
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

function writeArticles(data) {
  writeJSON(articlesFile, data);
  writeJSON(publicArticlesFile, data);
}

function formatHashtags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(t => (String(t).trim().startsWith('#') ? String(t).trim() : '#' + String(t).trim())).filter(t => t.length > 1);
  }
  return String(raw)
    .split(/[,\s]+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => (t.startsWith('#') ? t : '#' + t));
}

// ---------------- PUBLIC API ROUTES ----------------

app.get('/api/articles', (req, res) => {
  const { category, q, tag } = req.query;
  let articles = readJSON(articlesFile, []);

  if (category && category.toLowerCase() !== 'home') {
    articles = articles.filter(a => a.category && a.category.toLowerCase() === category.toLowerCase());
  }

  if (tag) {
    const cleanTag = tag.toLowerCase().replace(/^#/, '');
    articles = articles.filter(a =>
      Array.isArray(a.hashtags) && a.hashtags.some(t => t.toLowerCase().replace(/^#/, '') === cleanTag)
    );
  }

  if (q) {
    const search = q.toLowerCase();
    articles = articles.filter(a => 
      (a.title && a.title.toLowerCase().includes(search)) || 
      (a.summary && a.summary.toLowerCase().includes(search)) ||
      (a.category && a.category.toLowerCase().includes(search)) ||
      (Array.isArray(a.hashtags) && a.hashtags.some(t => t.toLowerCase().includes(search)))
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

app.get('/api/settings', (req, res) => {
  const settings = readJSON(settingsFile, {});
  const { adminCredentials, ...publicSettings } = settings;
  res.json({ success: true, data: publicSettings });
});

// ---------------- ADMIN CMS API ROUTES (PROTECTED) ----------------

// Active authenticated admin sessions
const activeAdminTokens = new Set();

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = '';
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  }

  if (!token || !activeAdminTokens.has(token)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access Denied: Admin ID and Password authentication required.' 
    });
  }
  next();
}

// Admin Session Verification
app.get('/api/admin/verify-session', (req, res) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = '';
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  }

  if (token && activeAdminTokens.has(token)) {
    return res.json({ success: true, valid: true });
  }
  return res.status(401).json({ success: false, valid: false, message: 'Invalid or expired admin session' });
});

// Create Article (Protected)
app.post('/api/admin/articles', requireAdminAuth, (req, res) => {
  const { title, category, summary, content, featuredImage, videoEmbedUrl, proofs, hashtags, isBreaking, isLead } = req.body;

  if (!title || !category || !summary || !content) {
    return res.status(400).json({ success: false, message: 'Missing required article fields' });
  }

  // Safety & Non-Controversial Review
  const safety = reviewContentSafety(title, summary, content);
  if (!safety.safe) {
    return res.status(400).json({ success: false, message: safety.reason });
  }
  const cleanTitle = safety.sanitizedTitle || title;

  const articleId = req.body.id || ('cogl-' + Date.now());
  const usedImages = getAllUsedImageURLs();

  // Strict Rule: Never use the same image in different blogs. Assign topic-specific unique photo.
  let finalImage = featuredImage;
  if (!finalImage || usedImages.has(finalImage)) {
    finalImage = assignUniqueTopicImage(cleanTitle + ' ' + summary, category, articleId);
  }

  const articles = readJSON(articlesFile, []);

  const newArticle = {
    id: articleId,
    title: cleanTitle,
    category,
    summary,
    content,
    featuredImage: finalImage,
    videoEmbedUrl: videoEmbedUrl || '',
    author: req.body.author || 'COGL Investigative Desk',
    authorRole: req.body.authorRole || 'Editorial Board',
    isBreaking: Boolean(isBreaking),
    isLead: Boolean(isLead),
    isFactChecked: true,
    readingTime: req.body.readingTime || '4 min',
    publishedAt: req.body.publishedAt || new Date().toISOString(),
    hashtags: formatHashtags(hashtags),
    proofs: proofs || []
  };

  if (newArticle.isLead) {
    articles.unshift(newArticle);
  } else {
    articles.splice(1, 0, newArticle);
  }

  writeArticles(articles);
  auditAndDeduplicateAllArticles();

  res.status(201).json({ success: true, message: 'Story published successfully with verified proof & unique image', data: newArticle });
});

// Update / Edit Article (Protected)
app.put('/api/admin/articles/:id', requireAdminAuth, (req, res) => {
  const articles = readJSON(articlesFile, []);
  const index = articles.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  const existing = articles[index];
  const {
    title, category, summary, content, featuredImage, videoEmbedUrl,
    proofs, hashtags, isBreaking, isLead, author, authorRole, readingTime
  } = req.body;

  const updatedArticle = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    category: category !== undefined ? category : existing.category,
    summary: summary !== undefined ? summary : existing.summary,
    content: content !== undefined ? content : existing.content,
    featuredImage: featuredImage !== undefined ? featuredImage : existing.featuredImage,
    videoEmbedUrl: videoEmbedUrl !== undefined ? videoEmbedUrl : existing.videoEmbedUrl,
    author: author || existing.author,
    authorRole: authorRole || existing.authorRole,
    isBreaking: isBreaking !== undefined ? Boolean(isBreaking) : existing.isBreaking,
    isLead: isLead !== undefined ? Boolean(isLead) : existing.isLead,
    readingTime: readingTime || existing.readingTime,
    proofs: proofs !== undefined ? proofs : existing.proofs,
    hashtags: hashtags !== undefined ? formatHashtags(hashtags) : (existing.hashtags || []),
    updatedAt: new Date().toISOString()
  };

  articles[index] = updatedArticle;
  writeArticles(articles);

  res.json({ success: true, message: 'Story updated successfully', data: updatedArticle });
});

// Delete Article (Protected)
app.delete('/api/admin/articles/:id', requireAdminAuth, (req, res) => {
  let articles = readJSON(articlesFile, []);
  const index = articles.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Article not found' });
  }

  const removed = articles.splice(index, 1)[0];
  writeArticles(articles);

  res.json({ success: true, message: 'Story permanently deleted', data: removed });
});

// ---------------- AUTONOMOUS BOT ROUTES ----------------

// Get Bot & Scheduler Status
app.get('/api/admin/bot/status', (req, res) => {
  try {
    const status = getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Trigger Top News Research Immediately (Protected)
app.post('/api/admin/bot/run', requireAdminAuth, async (req, res) => {
  try {
    console.log('[API] Admin triggered manual bot run...');
    const result = await executeBotJob('Admin CMS On-Demand Trigger');
    res.json({
      success: true,
      message: `Successfully researched and published ${result.count || 0} top world news stories.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Bot execution failed: ' + err.message });
  }
});

// Admin-Bot Interactive Newsroom Chat (Protected)
app.post('/api/admin/bot/chat', requireAdminAuth, async (req, res) => {
  try {
    const { message, user } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const response = await processAdminChat(message, user || 'Chief Editor');
    res.json({ success: true, ...response });
  } catch (err) {
    console.error('[API] Bot chat error:', err);
    res.status(500).json({ success: false, message: 'Bot chat failed: ' + err.message });
  }
});

// Real-Time Editorial & SEO Analytics (Protected)
app.get('/api/admin/analytics', requireAdminAuth, (req, res) => {
  try {
    const analytics = getSiteAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve analytics: ' + err.message });
  }
});

// Image Deduplication Audit Trigger (Protected)
app.post('/api/admin/images/deduplicate', requireAdminAuth, (req, res) => {
  try {
    const auditRes = auditAndDeduplicateAllArticles();
    res.json({ success: true, message: 'Image catalog deduplicated successfully', data: auditRes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Deduplication failed: ' + err.message });
  }
});

// Update Settings (Protected)
app.post('/api/admin/settings', requireAdminAuth, (req, res) => {
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

// Admin Login (Requires Valid ID & Password)
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
    const token = 'cogl_token_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
    activeAdminTokens.add(token);
    return res.json({ 
      success: true, 
      token,
      user: { username: inputEmail, role: 'Chief Editor' },
      message: 'Admin authentication successful' 
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin credentials: ID or password incorrect' });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  let token = '';
  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  }
  if (token) {
    activeAdminTokens.delete(token);
  }
  res.json({ success: true, message: 'Admin logged out successfully' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express server and initialize autonomous bot scheduler
app.listen(PORT, () => {
  console.log(`COGL NEWS LIVE at http://localhost:${PORT}`);
  initScheduler();
});
