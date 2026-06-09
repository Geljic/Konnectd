/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  if (!collection.fields.getByName("rating")) {
    collection.fields.add(new NumberField({
      id: "number_rating",
      name: "rating",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
    }));
    return app.save(collection);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("play_sessions");
  collection.fields.removeByName("rating");
  return app.save(collection);
});
