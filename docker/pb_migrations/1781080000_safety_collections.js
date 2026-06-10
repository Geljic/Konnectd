/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const blocks = new Collection({
    name: "user_blocks",
    type: "base",
    listRule: "@request.auth.id = blocker || @request.auth.id = blocked",
    viewRule: "@request.auth.id = blocker || @request.auth.id = blocked",
    createRule: "@request.auth.id != '' && @request.auth.id = blocker && blocker != blocked",
    updateRule: null,
    deleteRule: "@request.auth.id = blocker",
    fields: [
      {
        type: "text", id: "text_primary_id", name: "id",
        primaryKey: true, required: true, system: true,
        autogeneratePattern: "[a-z0-9]{15}", max: 15, min: 15,
        pattern: "^[a-z0-9]+$", presentable: false, hidden: false
      },
      {
        type: "relation", id: "relation_blocker", name: "blocker",
        required: true, presentable: false, hidden: false, system: false,
        collectionId: "_pb_users_auth_", cascadeDelete: true,
        minSelect: null, maxSelect: 1
      },
      {
        type: "relation", id: "relation_blocked", name: "blocked",
        required: true, presentable: false, hidden: false, system: false,
        collectionId: "_pb_users_auth_", cascadeDelete: true,
        minSelect: null, maxSelect: 1
      },
      {
        type: "autodate", id: "autodate_created", name: "created",
        onCreate: true, onUpdate: false, presentable: false, system: false, hidden: false
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_user_blocks_pair ON user_blocks (blocker, blocked)"
    ]
  });
  app.save(blocks);

  const reports = new Collection({
    name: "reports",
    type: "base",
    listRule: "@request.auth.id = reporter",
    viewRule: "@request.auth.id = reporter",
    createRule: "@request.auth.id != '' && @request.auth.id = reporter",
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        type: "text", id: "text_primary_id", name: "id",
        primaryKey: true, required: true, system: true,
        autogeneratePattern: "[a-z0-9]{15}", max: 15, min: 15,
        pattern: "^[a-z0-9]+$", presentable: false, hidden: false
      },
      {
        type: "relation", id: "relation_reporter", name: "reporter",
        required: true, presentable: false, hidden: false, system: false,
        collectionId: "_pb_users_auth_", cascadeDelete: true,
        minSelect: null, maxSelect: 1
      },
      {
        type: "text", id: "text_target_type", name: "target_type",
        required: true, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 30, min: 0, pattern: ""
      },
      {
        type: "text", id: "text_target_id", name: "target_id",
        required: true, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 100, min: 0, pattern: ""
      },
      {
        type: "relation", id: "relation_target_user", name: "target_user",
        required: false, presentable: false, hidden: false, system: false,
        collectionId: "_pb_users_auth_", cascadeDelete: true,
        minSelect: null, maxSelect: 1
      },
      {
        type: "text", id: "text_reason", name: "reason",
        required: true, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 120, min: 0, pattern: ""
      },
      {
        type: "text", id: "text_details", name: "details",
        required: false, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 1000, min: 0, pattern: ""
      },
      {
        type: "text", id: "text_status", name: "status",
        required: true, presentable: false, hidden: false, system: false,
        autogeneratePattern: "", max: 30, min: 0, pattern: ""
      },
      {
        type: "autodate", id: "autodate_created", name: "created",
        onCreate: true, onUpdate: false, presentable: false, system: false, hidden: false
      }
    ]
  });
  return app.save(reports);
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("reports"));
  } catch (_) {}
  try {
    app.delete(app.findCollectionByNameOrId("user_blocks"));
  } catch (_) {}
});
