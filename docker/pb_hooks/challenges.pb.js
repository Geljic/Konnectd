// Fires after a new challenge record is created.
// If the challenge has a directed recipient, sends them a push notification via Expo.
onRecordCreate((e) => {
  const record = e.record;
  if (!record) return;

  const recipientId = record.getString("recipient");
  if (!recipientId) return;

  try {
    const recipientUser = $app.findRecordById("users", recipientId);
    const pushToken = recipientUser.getString("push_token");
    if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) return;

    const challengerName = record.getString("challenger_name") || "Someone";
    const puzzleLabel = record.getString("puzzle_label") || "a puzzle";
    const challengeId = record.getId();

    $http.send({
      url: "https://exp.host/--/api/v2/push/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        sound: "default",
        title: `⚡ ${challengerName} challenged you!`,
        body: `Can you beat them at ${puzzleLabel}?`,
        data: { challengeId },
      }),
    });
  } catch (err) {
    console.log("[challenges hook] push notification failed:", err);
  }
}, "challenges");
