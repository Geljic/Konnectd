/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Guard: only add display_name if it doesn't already exist (earlier migrations may have added it)
  if (!collection.fields.getByName("display_name")) {
    collection.fields.addAt(collection.fields.length, new Field({
      "type": "text",
      "id": "text_display_name",
      "name": "display_name",
      "required": false,
      "presentable": true,
      "hidden": false,
      "system": false,
      "autogeneratePattern": "",
      "max": 32,
      "min": 0,
      "pattern": ""
    }));
  }

  // Guard: only add username_tag if it doesn't already exist
  if (!collection.fields.getByName("username_tag")) {
    collection.fields.addAt(collection.fields.length, new Field({
      "type": "number",
      "id": "number_username_tag",
      "name": "username_tag",
      "required": false,
      "presentable": false,
      "hidden": false,
      "system": false,
      "onlyInt": true,
      "max": 9999,
      "min": 1000
    }));
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const dn = collection.fields.getByName("display_name");
  const ut = collection.fields.getByName("username_tag");
  if (dn) collection.fields.removeById(dn.id);
  if (ut) collection.fields.removeById(ut.id);
  return app.save(collection);
});
