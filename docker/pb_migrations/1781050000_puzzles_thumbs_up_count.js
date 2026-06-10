/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("puzzles");
  if (!collection.fields.getByName("thumbs_up_count")) {
    collection.fields.add(new NumberField({
      id: "number_thumbs_up_count",
      name: "thumbs_up_count",
      required: false,
      hidden: false,
      presentable: false,
      system: false,
      onlyInt: true,
    }));
    app.save(collection);
  }

  const puzzles = app.findRecordsByFilter("puzzles", "id != ''", "", 0, 0);
  for (const puzzle of puzzles) {
    const sessions = app.findRecordsByFilter(
      "play_sessions",
      `puzzle = '${puzzle.id}' && game_type = 'connections' && rating = 1`,
      "",
      0,
      0,
    );
    puzzle.set("thumbs_up_count", sessions.length);
    app.save(puzzle);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("puzzles");
  collection.fields.removeByName("thumbs_up_count");
  return app.save(collection);
});
