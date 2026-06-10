/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  ["challenger", "opponent", "recipient"].forEach((name) => {
    try {
      collection.fields.getByName(name).cascadeDelete = true;
    } catch (_) {}
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  ["challenger", "opponent", "recipient"].forEach((name) => {
    try {
      collection.fields.getByName(name).cascadeDelete = false;
    } catch (_) {}
  });
  return app.save(collection);
});
