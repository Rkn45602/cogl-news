/**
 * COGL NEWS - Autonomous World & India News Research & Wire Bot
 * Generates 20 trending stories daily (10 Global + 10 India across all 10 categories)
 * Usage: node bot/runBot.js [count]
 */

const { runAutonomousNewsResearch } = require('./newsAgent');

(async () => {
  const argCount = parseInt(process.argv[2], 10);
  const targetCount = !isNaN(argCount) && argCount > 0 ? argCount : 20;

  console.log('------------------------------------------------------------------------');
  console.log('  COGL NEWS - AUTONOMOUS 20-STORY RESEARCH & WIRE BOT');
  console.log('  Target: 20 Trending Stories Daily (10 Global + 10 India across 10 Categories)');
  console.log('  Categories: News, Politics, Sport, Business, Technology, Health, Culture, Arts, Travel, Earth');
  console.log('------------------------------------------------------------------------');
  try {
    const result = await runAutonomousNewsResearch({ count: targetCount });
    console.log(`[COMPLETED] Successfully generated & published: ${result.count} trending articles for today.`);
    if (result.articles && result.articles.length > 0) {
      result.articles.forEach((a, i) => {
        console.log(`  ${i + 1}. [${a.audience || 'Global'}] [${a.category}] ${a.title}`);
        console.log(`     Image: ${a.featuredImage}`);
        console.log(`     Proofs: ${(a.proofs || []).map(p => p.agency || p.title).join(' | ')}`);
        console.log(`     Hashtags: ${(a.hashtags || []).join(' ')}`);
      });
    }
    process.exit(0);
  } catch (err) {
    console.error('[FAILED] Error executing news bot:', err);
    process.exit(1);
  }
})();
