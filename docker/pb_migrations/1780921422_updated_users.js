/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text3578368839")

  // remove field
  collection.fields.removeById("number735658010")

  // add field
  collection.fields.addAt(1, new Field({
    "help": "",
    "hidden": false,
    "id": "number3114084184",
    "max": null,
    "min": 0,
    "name": "puzzles_played",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "number4248441249",
    "max": null,
    "min": 0,
    "name": "puzzles_won",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "number4185958002",
    "max": null,
    "min": 0,
    "name": "streak_current",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "number3426987249",
    "max": null,
    "min": 0,
    "name": "streak_best",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2795492638",
    "max": 0,
    "min": 0,
    "name": "last_win_date",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text3578368839",
    "max": 32,
    "min": 0,
    "name": "display_name",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "number735658010",
    "max": 9999,
    "min": 1000,
    "name": "username_tag",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("number3114084184")

  // remove field
  collection.fields.removeById("number4248441249")

  // remove field
  collection.fields.removeById("number4185958002")

  // remove field
  collection.fields.removeById("number3426987249")

  // remove field
  collection.fields.removeById("text2795492638")

  return app.save(collection)
})
