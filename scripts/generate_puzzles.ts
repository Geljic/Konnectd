/**
 * Batch puzzle generator using Claude API.
 * Run: npx ts-node scripts/generate_puzzles.ts --count 10
 *
 * Env required:
 *   ANTHROPIC_API_KEY
 *   POCKETBASE_URL  (default: http://localhost:8094)
 *   POCKETBASE_ADMIN_EMAIL
 *   POCKETBASE_ADMIN_PASSWORD
 */

import Anthropic from '@anthropic-ai/sdk';
import PocketBase from 'pocketbase';

const COUNT = parseInt(process.argv.find(a => a.startsWith('--count='))?.split('=')[1] ?? '10');
const PB_URL = process.env.POCKETBASE_URL ?? 'http://localhost:8092';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pb = new PocketBase(PB_URL);

interface GeneratedCategory {
  name: string;
  colour: 'yellow' | 'green' | 'blue' | 'purple';
  words: [string, string, string, string];
  connection_explanation: string;
}

interface GeneratedPuzzle {
  categories: GeneratedCategory[];
}

const SYSTEM_PROMPT = `You are an expert puzzle designer for a word connection game.
You create clever, challenging puzzles in the style of NYT Connections.

Rules:
- Each puzzle has exactly 4 categories, each with exactly 4 words/phrases
- Yellow (easiest): direct, obvious shared theme — e.g. "Types of pasta"
- Green (medium): requires some lateral thinking — e.g. "Words that follow FIRE"
- Blue (hard): tricky, domain-specific or double meanings — e.g. "___ BALL" where the blank is non-obvious
- Purple (hardest): wordplay, homophones, very indirect — e.g. "Sounds like a number + ___"
- Include deliberate "trap" words that seem to fit multiple categories (this is what makes it fun)
- Words must be unambiguous WITHIN the puzzle — each word belongs to exactly one category
- Avoid proper nouns unless they're very well-known
- Words should be single words or short phrases (max 3 words)`;

const USER_PROMPT = `Generate one Connections puzzle. Be creative and challenging — aim for NYT difficulty.

Return ONLY valid JSON in this exact schema, no commentary:
{
  "categories": [
    {
      "name": "Category display name (short, revealed after solve)",
      "colour": "yellow",
      "words": ["WORD1", "WORD2", "WORD3", "WORD4"],
      "connection_explanation": "Why these 4 words connect (for editor review)"
    },
    { "colour": "green", ... },
    { "colour": "blue", ... },
    { "colour": "purple", ... }
  ]
}

All words in UPPERCASE. Make sure the puzzle is solvable but the purple category especially should require lateral thinking.`;

async function generatePuzzle(): Promise<GeneratedPuzzle | null> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON from response (handles markdown code fences if present)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in response:', text);
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]) as GeneratedPuzzle;
  } catch (e) {
    console.error('JSON parse failed:', e);
    return null;
  }
}

function validatePuzzle(puzzle: GeneratedPuzzle): boolean {
  if (puzzle.categories.length !== 4) return false;
  const colours = puzzle.categories.map(c => c.colour);
  const required = ['yellow', 'green', 'blue', 'purple'];
  if (!required.every(c => colours.includes(c as GeneratedCategory['colour']))) return false;

  const allWords = puzzle.categories.flatMap(c => c.words);
  if (allWords.length !== 16) return false;

  // Check for duplicate words across categories
  const unique = new Set(allWords);
  if (unique.size !== 16) return false;

  return true;
}

const DIFFICULTY_ORDER: Record<string, number> = { yellow: 0, green: 1, blue: 2, purple: 3 };

function buildPocketBaseRecord(puzzle: GeneratedPuzzle) {
  const allWords = puzzle.categories.flatMap(c => c.words);
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  const difficultyMin = puzzle.categories.reduce((min, c) =>
    DIFFICULTY_ORDER[c.colour] < DIFFICULTY_ORDER[min] ? c.colour : min,
    puzzle.categories[0].colour,
  );

  return {
    words: shuffled,
    categories: puzzle.categories.map(c => ({
      name: c.name,
      colour: c.colour,
      words: c.words,
    })),
    difficulty_min: difficultyMin,
    difficulty_order: DIFFICULTY_ORDER[difficultyMin],
    status: 'draft',
    daily_date: null,
    play_count: 0,
  };
}

async function main() {
  console.log(`Generating ${COUNT} puzzles...`);

  // Auth to PocketBase as admin
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL ?? '',
    process.env.POCKETBASE_ADMIN_PASSWORD ?? ''
  );

  let created = 0;
  let attempts = 0;

  while (created < COUNT && attempts < COUNT * 3) {
    attempts++;
    process.stdout.write(`Attempt ${attempts}... `);

    try {
      const puzzle = await generatePuzzle();
      if (!puzzle || !validatePuzzle(puzzle)) {
        console.log('invalid, skipping');
        continue;
      }

      const record = buildPocketBaseRecord(puzzle);
      await pb.collection('puzzles').create(record);
      created++;
      console.log(`✓ Puzzle ${created}/${COUNT} created (id saved as draft)`);
    } catch (e) {
      console.error('Error:', e);
    }

    // Rate limit: ~1 req/sec
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\nDone. ${created} puzzles saved as draft in PocketBase.`);
  console.log(`Review them at ${PB_URL}/_/ and set status=published to go live.`);
}

main().catch(console.error);
