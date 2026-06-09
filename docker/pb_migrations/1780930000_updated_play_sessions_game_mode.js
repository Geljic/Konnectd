/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");

  collection.fields.add(new Field({
    "type": "text",
    "id": "text_game_mode",
    "name": "game_mode",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "autogeneratePattern": "",
    "max": 10,
    "min": 0,
    "pattern": ""
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  collection.fields.remove("text_game_mode");
  return app.save(collection);
});
