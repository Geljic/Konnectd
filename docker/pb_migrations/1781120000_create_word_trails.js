/// <reference path="../pb_data/types.d.ts" />
// Next Steps (word_trails) puzzles currently live only in the static file
// src/data/wordTrailsPuzzles.ts. This creates a DB collection so they can be
// managed alongside Connections puzzles. The static `wt-001` id is kept as `slug`
// (PB generates its own 15-char id). Publicly readable so the app can fetch them.
migrate((app) => {
  const collection = new Collection({
    name: "word_trails",
    type: "base",
    listRule: "status = 'published'",
    viewRule: "status = 'published'",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        type: "text", id: "text_primary_id", name: "id",
        primaryKey: true, required: true, system: true,
        autogeneratePattern: "[a-z0-9]{15}", max: 15, min: 15,
        pattern: "^[a-z0-9]+$", presentable: false, hidden: false,
      },
      {
        type: "text", id: "text_slug", name: "slug",
        required: false, presentable: true, hidden: false, system: false,
        autogeneratePattern: "", max: 40, min: 0, pattern: "",
      },
      {
        type: "text", id: "text_title", name: "title",
        required: false, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 100, min: 0, pattern: "",
      },
      {
        type: "number", id: "number_difficulty", name: "difficulty",
        required: false, presentable: false, hidden: false, system: false,
        onlyInt: true, min: 1, max: 5,
      },
      {
        type: "json", id: "json_trails", name: "trails",
        required: true, presentable: false, hidden: false, system: false, maxSize: 0,
      },
      {
        type: "text", id: "text_status", name: "status",
        required: false, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 30, min: 0, pattern: "",
      },
      {
        type: "text", id: "text_source", name: "source",
        required: false, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 30, min: 0, pattern: "",
      },
      {
        type: "number", id: "number_play_count", name: "play_count",
        required: false, presentable: false, hidden: false, system: false,
        onlyInt: true,
      },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_word_trails_slug ON word_trails (slug)",
    ],
  });

  return app.save(collection);
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("word_trails"));
});
