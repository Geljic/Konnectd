/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new BoolField({
    id: "bool_is_premium",
    name: "is_premium",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
  }));
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("is_premium");
  app.save(users);
});
