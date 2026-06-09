/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  collection.fields.add(new Field({
    "type": "text",
    "id": "text_last_win_date",
    "name": "last_win_date",
    "required": false,
    "presentable": false,
    "hidden": false,
    "system": false,
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": ""
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.fields.removeById("text_last_win_date");
  return app.save(collection);
});
