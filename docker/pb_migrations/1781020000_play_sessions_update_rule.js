/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  collection.updateRule = "@request.auth.id = user";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  collection.updateRule = null;
  return app.save(collection);
});
