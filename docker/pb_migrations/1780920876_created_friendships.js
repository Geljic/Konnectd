/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && @request.auth.id = requester",
    "deleteRule": "@request.auth.id = requester || @request.auth.id = addressee",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1820765950",
        "max": 0,
        "min": 0,
        "name": "requester",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text2602483783",
        "max": 0,
        "min": 0,
        "name": "addressee",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text2063623452",
        "max": 0,
        "min": 0,
        "name": "status",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_274306238",
    "indexes": [],
    "listRule": "@request.auth.id = requester || @request.auth.id = addressee",
    "name": "friendships",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = addressee",
    "viewRule": "@request.auth.id = requester || @request.auth.id = addressee"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_274306238");

  return app.delete(collection);
})
