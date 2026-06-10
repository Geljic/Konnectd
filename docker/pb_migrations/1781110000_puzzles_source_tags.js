/// <reference path="../pb_data/types.d.ts" />
// Distinguish hand-authored curated puzzles from AI/batch-generated ones, and
// allow theme tagging (e.g. australian, classroom). `source` is 'curated' |
// 'generated'; `tags` is a JSON array of strings. Existing rows are backfilled
// to 'generated' by scripts/tag_curated_source.ts (kept out of the migration so
// the data pass is re-runnable and matches curated rows by word-set).
migrate((app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");

  if (!puzzles.fields.getByName("source")) {
    puzzles.fields.add(new TextField({
      id: "text_source",
      name: "source",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      max: 30,
      min: 0,
    }));
  }

  if (!puzzles.fields.getByName("tags")) {
    puzzles.fields.add(new JSONField({
      id: "json_tags",
      name: "tags",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      maxSize: 0,
    }));
  }

  app.save(puzzles);
}, (app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");
  puzzles.fields.removeByName("source");
  puzzles.fields.removeByName("tags");
  app.save(puzzles);
});
