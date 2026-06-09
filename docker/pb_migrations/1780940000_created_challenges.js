/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "name": "challenges",
    "type": "base",
    // Challenger and accepted opponent can list their challenges
    "listRule": "@request.auth.id = challenger || @request.auth.id = opponent",
    // Any logged-in user with the ID can view (needed before accepting)
    "viewRule": "@request.auth.id != ''",
    // Any logged-in user can create a challenge
    "createRule": "@request.auth.id != ''",
    // Any logged-in user with the ID can update (accept + submit result)
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id = challenger",
    "fields": [
      {
        "type": "text", "id": "text_primary_id", "name": "id",
        "primaryKey": true, "required": true, "system": true,
        "autogeneratePattern": "[a-z0-9]{15}", "max": 15, "min": 15,
        "pattern": "^[a-z0-9]+$", "presentable": false, "hidden": false
      },
      {
        "type": "relation", "id": "relation_challenger", "name": "challenger",
        "required": true, "presentable": false, "hidden": false, "system": false,
        "collectionId": "_pb_users_auth_", "cascadeDelete": false,
        "minSelect": null, "maxSelect": 1
      },
      {
        "type": "text", "id": "text_challenger_name", "name": "challenger_name",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 100, "min": 0, "pattern": ""
      },
      {
        "type": "number", "id": "number_challenger_mistakes", "name": "challenger_mistakes",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "min": 0, "max": null, "onlyInt": true
      },
      {
        "type": "number", "id": "number_challenger_duration", "name": "challenger_duration",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "min": 0, "max": null, "onlyInt": true
      },
      {
        "type": "json", "id": "json_challenger_solved_order", "name": "challenger_solved_order",
        "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0
      },
      {
        "type": "text", "id": "text_puzzle_id", "name": "puzzle_id",
        "required": true, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 50, "min": 0, "pattern": ""
      },
      {
        "type": "text", "id": "text_puzzle_collection", "name": "puzzle_collection",
        "required": true, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 20, "min": 0, "pattern": ""
      },
      {
        "type": "text", "id": "text_puzzle_label", "name": "puzzle_label",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 100, "min": 0, "pattern": ""
      },
      {
        "type": "relation", "id": "relation_opponent", "name": "opponent",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "collectionId": "_pb_users_auth_", "cascadeDelete": false,
        "minSelect": null, "maxSelect": 1
      },
      {
        "type": "text", "id": "text_opponent_name", "name": "opponent_name",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 100, "min": 0, "pattern": ""
      },
      {
        "type": "number", "id": "number_opponent_mistakes", "name": "opponent_mistakes",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "min": 0, "max": null, "onlyInt": true
      },
      {
        "type": "number", "id": "number_opponent_duration", "name": "opponent_duration",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "min": 0, "max": null, "onlyInt": true
      },
      {
        "type": "json", "id": "json_opponent_solved_order", "name": "opponent_solved_order",
        "required": false, "presentable": false, "hidden": false, "system": false, "maxSize": 0
      },
      {
        "type": "text", "id": "text_status", "name": "status",
        "required": true, "presentable": false, "hidden": false, "system": false,
        "autogeneratePattern": "", "max": 20, "min": 0, "pattern": ""
      },
      {
        "type": "date", "id": "date_expires_at", "name": "expires_at",
        "required": false, "presentable": false, "hidden": false, "system": false,
        "min": "", "max": ""
      },
      {
        "type": "autodate", "id": "autodate_created", "name": "created",
        "onCreate": true, "onUpdate": false, "presentable": false, "system": false, "hidden": false
      },
      {
        "type": "autodate", "id": "autodate_updated", "name": "updated",
        "onCreate": true, "onUpdate": true, "presentable": false, "system": false, "hidden": false
      }
    ]
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  return app.delete(collection);
});
