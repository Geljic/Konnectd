// Keeps puzzles.thumbs_up_count in sync with play_sessions.rating.
//
// The mobile/web client is allowed to update its own play_sessions rows, but the
// puzzles collection remains read-only to clients. Recounting here avoids
// opening puzzle writes just for a denormalised sort field.
function syncPuzzleThumbsUpCount(puzzleId) {
  if (!puzzleId) return;

  try {
    const puzzle = $app.findRecordById("puzzles", puzzleId);
    const thumbsUpSessions = $app.findRecordsByFilter(
      "play_sessions",
      `puzzle = '${puzzleId}' && game_type = 'connections' && rating = 1`,
      "",
      0,
      0,
    );
    puzzle.set("thumbs_up_count", thumbsUpSessions.length);
    $app.save(puzzle);
  } catch (err) {
    // NYT puzzles and deleted puzzles do not have curated thumbs_up_count rows.
  }
}

onRecordAfterUpdateSuccess((e) => {
  const record = e.record;
  if (!record) return;
  if (record.getString("game_type") !== "connections") return;

  syncPuzzleThumbsUpCount(record.getString("puzzle"));
}, "play_sessions");
