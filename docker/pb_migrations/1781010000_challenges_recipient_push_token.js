/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Add push_token text field to the users auth collection
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new TextField({
    id: "text_push_token",
    name: "push_token",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
  }));
  app.save(users);

  // 2. Add recipient relation field to challenges + expand listRule
  const challenges = app.findCollectionByNameOrId("challenges");
  challenges.fields.add(new RelationField({
    id: "relation_recipient",
    name: "recipient",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1,
  }));
  challenges.listRule = "@request.auth.id = challenger || @request.auth.id = opponent || @request.auth.id = recipient";
  app.save(challenges);
}, (app) => {
  // Rollback: remove push_token from users
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("push_token");
  app.save(users);

  // Rollback: remove recipient from challenges, restore listRule
  const challenges = app.findCollectionByNameOrId("challenges");
  challenges.fields.removeByName("recipient");
  challenges.listRule = "@request.auth.id = challenger || @request.auth.id = opponent";
  app.save(challenges);
});
