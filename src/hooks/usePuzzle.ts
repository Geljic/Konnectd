import { useEffect, useState } from 'react';
import { fetchDailyPuzzle, fetchPuzzleById, type Puzzle } from '@/api/puzzles';

export function useDailyPuzzle() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDailyPuzzle()
      .then(p => {
        if (!p) setError('No daily puzzle today');
        else setPuzzle(p);
      })
      .catch(() => setError('Failed to load puzzle'))
      .finally(() => setLoading(false));
  }, []);

  return { puzzle, loading, error };
}

export function usePuzzleById(id: string) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPuzzleById(id)
      .then(setPuzzle)
      .finally(() => setLoading(false));
  }, [id]);

  return { puzzle, loading };
}
