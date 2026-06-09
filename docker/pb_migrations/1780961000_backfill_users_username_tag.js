/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Assign username_tag and copy name → display_name for any user missing them
  // username_tag field has min=1000; any value below that (including 0/unset) means not yet assigned
  const records = app.findRecordsByFilter("users", "username_tag < 1000");
  for (const record of records) {
    const tag = Math.floor(1000 + Math.random() * 9000);
    record.set("username_tag", tag);
    // Copy name → display_name if display_name is blank
    if (!record.get("display_name")) {
      record.set("display_name", record.get("name") || record.get("email"));
    }
    app.save(record);
  }
}, (app) => {
  // no-op: can't undo random tag assignment
});
