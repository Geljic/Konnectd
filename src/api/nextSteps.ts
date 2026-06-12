import AsyncStorage from '@react-native-async-storage/async-storage';
import pb from './pb';
import { NEXT_STEPS_PUZZLES, type NextStepsPuzzle } from '@/data/nextStepsPuzzles';

/**
 * Next Steps (word_trails) puzzles, served from PocketBase with the bundled
 * static file as offline fallback. Content lives in the DB (add/schedule without
 * an app rebuild), but access stays synchronous via getNextSteps() so the game
 * screen can resolve a puzzle at render time. Call loadNextSteps() once at boot
 * (and when entering the archive) to refresh the cache.
 */

const CACHE_KEY = 'word_trails_cache_v1';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6h

// null until first load; getNextSteps() falls back to the bundled set meanwhile.
let loaded: NextStepsPuzzle[] | null = null;

/** Synchronous accessor — DB copy if loaded, else the bundled static set. */
export function getNextSteps(): NextStepsPuzzle[] {
  return loaded && loaded.length ? loaded : NEXT_STEPS_PUZZLES;
}

function mapRecord(r: any): NextStepsPuzzle {
  return {
    id: r.slug || r.id,            // keep the wt-001 slug so completion/sessions stay stable
    title: r.title,
    difficulty: r.difficulty as NextStepsPuzzle['difficulty'],
    trails: r.trails as NextStepsPuzzle['trails'],
  };
}

async function fetchFromDb(): Promise<NextStepsPuzzle[]> {
  const records = await pb.collection('word_trails').getFullList({
    sort: 'slug',
    fields: 'slug,title,difficulty,trails',
    requestKey: null,
  });
  return (records as any[]).map(mapRecord).filter(p => Array.isArray(p.trails) && p.trails.length === 4);
}

async function readCache(): Promise<NextStepsPuzzle[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, puzzles } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return puzzles as NextStepsPuzzle[];
  } catch {
    return null;
  }
}

/**
 * Hydrate from cache (fast/offline), then refresh from the DB. Safe to call
 * repeatedly; resolves to the best available set. Never throws.
 */
export async function loadNextSteps(): Promise<NextStepsPuzzle[]> {
  if (!loaded) {
    const cached = await readCache();
    if (cached?.length) loaded = cached;
  }
  try {
    const fresh = await fetchFromDb();
    if (fresh.length) {
      loaded = fresh;
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), puzzles: fresh })).catch(() => {});
    }
  } catch {
    // offline / backend down — keep cache or static fallback
  }
  return getNextSteps();
}

export function findNextStepsTrail(id: string): NextStepsPuzzle | undefined {
  return getNextSteps().find(p => p.id === id);
}
