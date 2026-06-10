/// <reference path="../pb_data/types.d.ts" />
// Gate the NYT puzzle archive behind a per-user `nyt_access` flag.
// Until now nyt_puzzles was fully public (listRule/viewRule = ""), so anyone —
// including guests and direct API callers — could pull every NYT board.
// This adds an opt-in flag on users and locks the collection to flag-holders,
// so the archive is private to the owner + invited friends.
migrate((app) => {
  // 1. Add the access flag to users (default false / unset = no access)
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new BoolField({
    id: "bool_nyt_access",
    name: "nyt_access",
    required: false,
    presentable: false,
    hidden: false,
    system: false,
  }));
  app.save(users);

  // 2. Lock the NYT collection to accounts that hold the flag
  const nyt = app.findCollectionByNameOrId("pbc_585993128");
  unmarshal({
    "listRule": "@request.auth.nyt_access = true",
    "viewRule": "@request.auth.nyt_access = true",
  }, nyt);
  app.save(nyt);
}, (app) => {
  // Rollback: reopen the collection and drop the flag
  const nyt = app.findCollectionByNameOrId("pbc_585993128");
  unmarshal({ "listRule": "", "viewRule": "" }, nyt);
  app.save(nyt);

  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("nyt_access");
  app.save(users);
});
