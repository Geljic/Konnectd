/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new Field({
    "type": "number",
    "id": "number_puzzles_played",
    "name": "puzzles_played",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "min": 0,
    "max": null,
    "onlyInt": true
  }));

  collection.fields.add(new Field({
    "type": "number",
    "id": "number_puzzles_won",
    "name": "puzzles_won",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "min": 0,
    "max": null,
    "onlyInt": true
  }));

  collection.fields.add(new Field({
    "type": "number",
    "id": "number_streak_current",
    "name": "streak_current",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "min": 0,
    "max": null,
    "onlyInt": true
  }));

  collection.fields.add(new Field({
    "type": "number",
    "id": "number_streak_best",
    "name": "streak_best",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "min": 0,
    "max": null,
    "onlyInt": true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeById("number_puzzles_played");
  collection.fields.removeById("number_puzzles_won");
  collection.fields.removeById("number_streak_current");
  collection.fields.removeById("number_streak_best");
  return app.save(collection);
});
