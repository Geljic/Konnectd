/// <reference path="../pb_data/types.d.ts" />
// Give curated Groups/Konnect puzzles a human-friendly name (theme / pun) instead
// of "Puzzle #N". Optional text field; existing rows simply have no title and fall
// back to the numbered label in the UI. Curated titles are written by
// scripts/import_curated_puzzles.ts from each seed's `title`.
migrate((app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");

  if (!puzzles.fields.getByName("title")) {
    puzzles.fields.add(new TextField({
      id: "text_title",
      name: "title",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      max: 80,
      min: 0,
    }));
  }

  app.save(puzzles);
}, (app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");
  puzzles.fields.removeByName("title");
  app.save(puzzles);
});
