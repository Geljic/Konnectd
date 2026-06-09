/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Replace the earlier text-field friendships collection (created by 1780920876) with a
  // version that has the correct rules. If the collection already exists (from a prior run
  // or incremental apply), just update the rules via unmarshal — don't try to recreate it.
  let collection;
  let exists = false;
  try {
    collection = app.findCollectionByNameOrId("friendships");
    exists = true;
  } catch (_) {}

  if (exists) {
    unmarshal({
      "listRule":   "@request.auth.id = requester || @request.auth.id = addressee",
      "viewRule":   "@request.auth.id = requester || @request.auth.id = addressee",
      "createRule": "@request.auth.id != '' && @request.auth.id = requester",
      "updateRule": "@request.auth.id = addressee",
      "deleteRule": "@request.auth.id = requester || @request.auth.id = addressee",
    }, collection);
    return app.save(collection);
  }

  // Fresh install — create the collection with all fields and the unique index
  collection = new Collection({
    "name": "friendships",
    "type": "base",
    "listRule":   "@request.auth.id = requester || @request.auth.id = addressee",
    "viewRule":   "@request.auth.id = requester || @request.auth.id = addressee",
    "createRule": "@request.auth.id != '' && @request.auth.id = requester",
    "updateRule": "@request.auth.id = addressee",
    "deleteRule": "@request.auth.id = requester || @request.auth.id = addressee",
    "fields": [
      {
        "type": "text", "id": "text_primary_id", "name": "id",
        "primaryKey": true, "required": true, "system": true,
        "autogeneratePattern": "[a-z0-9]{15}", "max": 15, "min": 15,
        "pattern": "^[a-z0-9]+$", "presentable": false, "hidden": false
      },
      {
        "type": "text", "id": "text_requester", "name": "requester",
        "required": true, "presentable": false, "hidden": false,
        "system": false, "autogeneratePattern": "", "max": 0, "min": 0, "pattern": ""
      },
      {
        "type": "text", "id": "text_addressee", "name": "addressee",
        "required": true, "presentable": false, "hidden": false,
        "system": false, "autogeneratePattern": "", "max": 0, "min": 0, "pattern": ""
      },
      {
        "type": "text", "id": "text_status", "name": "status",
        "required": true, "presentable": false, "hidden": false,
        "system": false, "autogeneratePattern": "", "max": 0, "min": 0, "pattern": ""
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_friendship_pair ON friendships (requester, addressee)"
    ]
  });
  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("friendships");
    if (collection) app.delete(collection);
  } catch (_) {}
});
