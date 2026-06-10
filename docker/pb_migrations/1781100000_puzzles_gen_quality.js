/// <reference path="../pb_data/types.d.ts" />
// Quality metadata for AI-generated puzzles so the curation queue can surface
// the best candidates first. `gen_score` is the self-critique grade (0-10),
// `gen_review` holds the structured critique (per-axis scores + notes).
migrate((app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");

  puzzles.fields.add(new NumberField({
    id: "number_gen_score",
    name: "gen_score",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
  }));

  puzzles.fields.add(new JSONField({
    id: "json_gen_review",
    name: "gen_review",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
    maxSize: 0,
  }));

  app.save(puzzles);
}, (app) => {
  const puzzles = app.findCollectionByNameOrId("puzzles");
  puzzles.fields.removeByName("gen_score");
  puzzles.fields.removeByName("gen_review");
  app.save(puzzles);
});
