/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  if (!collection.fields.getByName("challenger_score")) {
    collection.fields.add(new NumberField({
      id: "number_challenger_score",
      name: "challenger_score",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
    }));
  }
  if (!collection.fields.getByName("opponent_score")) {
    collection.fields.add(new NumberField({
      id: "number_opponent_score",
      name: "opponent_score",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
    }));
  }
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("challenges");
  collection.fields.removeByName("challenger_score");
  collection.fields.removeByName("opponent_score");
  return app.save(collection);
});
