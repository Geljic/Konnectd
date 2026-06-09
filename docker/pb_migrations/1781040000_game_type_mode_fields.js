/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const sessions = app.findCollectionByNameOrId("play_sessions");
  if (!sessions.fields.getByName("game_type")) {
    sessions.fields.add(new TextField({
      id: "text_game_type",
      name: "game_type",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      max: 30,
      min: 0,
    }));
  }
  app.save(sessions);

  const challenges = app.findCollectionByNameOrId("challenges");
  if (!challenges.fields.getByName("game_type")) {
    challenges.fields.add(new TextField({
      id: "text_game_type",
      name: "game_type",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      max: 30,
      min: 0,
    }));
  }
  if (!challenges.fields.getByName("game_mode")) {
    challenges.fields.add(new TextField({
      id: "text_game_mode",
      name: "game_mode",
      required: false,
      presentable: false,
      hidden: false,
      system: false,
      max: 30,
      min: 0,
    }));
  }
  app.save(challenges);

  const sessionRecords = app.findRecordsByFilter("play_sessions", "game_type = ''", "", 0, 0);
  for (const record of sessionRecords) {
    record.set("game_type", "connections");
    if (!record.get("game_mode")) record.set("game_mode", "normal");
    app.save(record);
  }

  const challengeRecords = app.findRecordsByFilter("challenges", "game_type = ''", "", 0, 0);
  for (const record of challengeRecords) {
    record.set("game_type", "connections");
    if (!record.get("game_mode")) record.set("game_mode", "normal");
    app.save(record);
  }
}, (app) => {
  const sessions = app.findCollectionByNameOrId("play_sessions");
  sessions.fields.removeByName("game_type");
  app.save(sessions);

  const challenges = app.findCollectionByNameOrId("challenges");
  challenges.fields.removeByName("game_type");
  challenges.fields.removeByName("game_mode");
  app.save(challenges);
});
