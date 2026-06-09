/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "name": "play_sessions",
    "type": "base",
    "listRule": "@request.auth.id = user",
    "viewRule": "@request.auth.id = user",
    "createRule": "@request.auth.id != ''",
    "updateRule": null,
    "deleteRule": null,
    "fields": [
      {
        "type": "text",
        "id": "text3208210256",
        "name": "id",
        "primaryKey": true,
        "required": true,
        "system": true,
        "autogeneratePattern": "[a-z0-9]{15}",
        "max": 15,
        "min": 15,
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "hidden": false
      },
      {
        "type": "relation",
        "id": "relation_user",
        "name": "user",
        "required": true,
        "presentable": false,
        "hidden": false,
        "system": false,
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "minSelect": null,
        "maxSelect": 1
      },
      {
        "type": "text",
        "id": "text_puzzle",
        "name": "puzzle",
        "required": true,
        "presentable": false,
        "hidden": false,
        "system": false,
        "autogeneratePattern": "",
        "max": 50,
        "min": 0,
        "pattern": ""
      },
      {
        "type": "bool",
        "id": "bool_completed",
        "name": "completed",
        "required": false,
        "presentable": false,
        "hidden": false,
        "system": false
      },
      {
        "type": "number",
        "id": "number_mistakes",
        "name": "mistakes",
        "required": false,
        "presentable": false,
        "hidden": false,
        "system": false,
        "min": 0,
        "max": null,
        "onlyInt": true
      },
      {
        "type": "number",
        "id": "number_duration_seconds",
        "name": "duration_seconds",
        "required": false,
        "presentable": false,
        "hidden": false,
        "system": false,
        "min": 0,
        "max": null,
        "onlyInt": true
      },
      {
        "type": "json",
        "id": "json_solved_order",
        "name": "solved_order",
        "required": false,
        "presentable": false,
        "hidden": false,
        "system": false,
        "maxSize": 0
      },
      {
        "type": "autodate",
        "id": "autodate_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "type": "autodate",
        "id": "autodate_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "hidden": false
      }
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  return app.delete(collection);
});
