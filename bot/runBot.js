/**
 * COGL NEWS - Autonomous World News Research & Fact-Verification Bot
 * Generates verified news reports with deep fact analysis and attached primary proof documents
 * Usage: node bot/runBot.js [count]
 */

const { runAutonomousNewsResearch } = require('./newsAgent');

(async () => {
  const argCount = parseInt(process.argv[2], 10);
  const targetCount = !isNaN(argCount) && argCount > 0 ? argCount : 3;

  console.log('----------------------------------------------------');
  console.log('  COGL NEWS - AUTONOMOUS FACT RESEARCH & VERIFICATION BOT');
  console.log(`  Targeting: ${targetCount} verified articles with attached proof documents`);
  console.log('----------------------------------------------------');
  try {
    const result = await runAutonomousNewsResearch({ count: targetCount });
    console.log(`[COMPLETED] Successfully generated & published: ${result.count} verified articles for today.`);
    if (result.articles && result.articles.length > 0) {
      result.articles.forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.category}] ${a.title}`);
        console.log(`     Proofs: ${(a.proofs || []).map(p => p.title).join(' | ')}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('[FAILED] Error executing news bot:', err);
    process.exit(1);
  }
})();
