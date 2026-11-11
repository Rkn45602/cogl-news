/**
 * COGL NEWS - Autonomous Daily Bot Scheduler
 * 
 * Manages daily execution of the autonomous news agent between 4:00 PM and 6:00 PM daily.
 * Handles cron scheduling, interval catch-ups, and on-demand triggers.
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { runAutonomousNewsResearch } = require('./newsAgent');

const botLogFile = path.join(__dirname, '..', 'config', 'bot-log.json');
const settingsFile = path.join(__dirname, '..', 'config', 'settings.json');

let cronJob = null;
let intervalCheck = null;
let isRunning = false;
let lastExecutionTime = null;

function readJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

/**
 * Checks if the bot has already successfully executed today
 */
function hasRunToday() {
  const logs = readJSON(botLogFile, []);
  if (!logs || logs.length === 0) return false;

  const todayStr = new Date().toISOString().slice(0, 10);
  return logs.some(entry => entry.runAt && entry.runAt.startsWith(todayStr) && entry.articlesPublished > 0);
}

/**
 * Checks if current local time is within the 4:00 PM to 6:00 PM daily window (16:00 - 18:00)
 */
function isWithinScheduleWindow() {
  const now = new Date();
  const currentHour = now.getHours(); // 0 - 23
  return currentHour >= 16 && currentHour < 18;
}

/**
 * Executes the autonomous bot safely with status tracking
 */
async function executeBotJob(reason = 'Daily Schedule (4:00 PM - 6:00 PM)', options = { count: 3 }) {
  if (isRunning) {
    console.log('[COGL Scheduler] Bot is already running a research cycle. Skipping duplicate trigger.');
    return { success: false, message: 'Research cycle already in progress.' };
  }

  isRunning = true;
  console.log(`[COGL Scheduler] Triggering autonomous news research (${reason})...`);

  try {
    const opts = typeof options === 'number' ? { count: options } : (options || { count: 3 });
    const result = await runAutonomousNewsResearch(opts);
    lastExecutionTime = new Date().toISOString();
    isRunning = false;
    return result;
  } catch (error) {
    isRunning = false;
    console.error('[COGL Scheduler] Autonomous cycle encountered an error:', error.message);
    throw error;
  }
}

/**
 * Starts the automated daily scheduler
 */
function initScheduler() {
  console.log('[COGL Scheduler] Initializing Daily News Bot (Schedule: 4:00 PM - 6:00 PM Daily)...');

  // Load last execution from log
  const logs = readJSON(botLogFile, []);
  if (logs.length > 0 && logs[0].runAt) {
    lastExecutionTime = logs[0].runAt;
  }

  // 1. Cron Job: Runs at 4:15 PM (16:15) daily
  cronJob = cron.schedule('15 16 * * *', async () => {
    console.log('[COGL Scheduler] 16:15 Cron Alarm triggered.');
    if (!hasRunToday()) {
      await executeBotJob('Cron 16:15');
    }
  });

  // 2. Interval Catch-up Monitor: Checks every 15 minutes.
  // If current time is between 16:00 and 18:00 (4pm - 6pm) and bot hasn't run today yet, it runs!
  intervalCheck = setInterval(async () => {
    if (isWithinScheduleWindow() && !hasRunToday() && !isRunning) {
      console.log('[COGL Scheduler] Time window 16:00 - 18:00 active and no run today. Auto-initiating...');
      try {
        await executeBotJob('Window Catch-Up (16:00 - 18:00)');
      } catch (err) {
        console.error('[COGL Scheduler] Window catch-up error:', err.message);
      }
    }
  }, 15 * 60 * 1000);

  // Check immediately upon server boot: if server booted between 4pm-6pm and hasn't run today, run now!
  if (isWithinScheduleWindow() && !hasRunToday()) {
    console.log('[COGL Scheduler] Boot detected within 4pm-6pm window. Starting news research in 10 seconds...');
    setTimeout(async () => {
      try {
        await executeBotJob('Server Startup Window Trigger');
      } catch (err) {
        console.error('[COGL Scheduler] Startup window trigger error:', err.message);
      }
    }, 10000);
  }

  console.log('[COGL Scheduler] Autonomous Agent is ACTIVE & ARMED for 4:00 PM – 6:00 PM daily.');
}

/**
 * Get current scheduler status for admin dashboard
 */
function getStatus() {
  const logs = readJSON(botLogFile, []);
  const todayRun = hasRunToday();
  const inWindow = isWithinScheduleWindow();

  // Calculate next run
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(16, 0, 0, 0);
  if (now.getTime() > nextRun.getTime()) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return {
    schedulerActive: Boolean(cronJob || intervalCheck),
    isExecutingNow: isRunning,
    scheduleWindow: '4:00 PM – 6:00 PM Daily',
    targetHour: '16:00 - 18:00 (Local Time)',
    hasRunToday: todayRun,
    isCurrentlyInWindow: inWindow,
    lastExecution: lastExecutionTime || (logs[0]?.runAt) || 'None recorded yet',
    nextScheduledRun: nextRun.toLocaleString(),
    recentLogs: logs.slice(0, 10)
  };
}

module.exports = {
  initScheduler,
  executeBotJob,
  getStatus
};
