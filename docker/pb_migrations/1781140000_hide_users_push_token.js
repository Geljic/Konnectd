/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  const pushToken = users.fields.getByName("push_token");
  pushToken.hidden = true;
  pushToken.presentable = false;
  return app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  const pushToken = users.fields.getByName("push_token");
  pushToken.hidden = false;
  pushToken.presentable = false;
  return app.save(users);
});
