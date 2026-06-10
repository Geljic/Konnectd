/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  collection.updateRule = [
    "@request.auth.id = challenger",
    "@request.auth.id = recipient",
    "@request.auth.id = opponent",
    "(recipient = '' && opponent = '')",
  ].join(" || ");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  collection.updateRule = "@request.auth.id != ''";
  return app.save(collection);
});
