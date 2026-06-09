/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("puzzles");

  collection.fields.addAt(collection.fields.length, new Field({
    "help": "",
    "hidden": false,
    "id": "number_difficulty_order",
    "max": null,
    "min": null,
    "name": "difficulty_order",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("puzzles");
  const field = collection.fields.getByName("difficulty_order");
  collection.fields.remove(field.id);
  return app.save(collection);
});
