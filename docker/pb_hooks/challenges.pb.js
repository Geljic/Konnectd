function sendExpoPush(userId, title, body, data) {
  try {
    const user = $app.findRecordById("users", userId);
    const pushToken = user.getString("push_token");
    if (!pushToken || !pushToken.startsWith("ExponentPushToken[")) return;

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
        title,
        body,
        data: data || {},
      }),
    });
  } catch (err) {
    console.log("[challenges hook] push notification failed:", err);
  }
}

// Fires after a new challenge record is created.
// If the challenge has a directed recipient, sends them a push notification via Expo.
onRecordCreate((e) => {
  const record = e.record;
  if (!record) return;

  const recipientId = record.getString("recipient");
  if (!recipientId) return;

  const challengerName = record.getString("challenger_name") || "Someone";
  const puzzleLabel = record.getString("puzzle_label") || "a puzzle";

  sendExpoPush(
    recipientId,
    `⚡ ${challengerName} challenged you!`,
    `Can you beat them at ${puzzleLabel}?`,
    { challengeId: record.id }
  );
}, "challenges");

// Fires once when a challenge moves to complete, notifying the original challenger.
onRecordUpdate((e) => {
  const record = e.record;
  if (!record) return;

  const wasComplete = record.original().getString("status") === "complete";
  const isComplete = record.getString("status") === "complete";
  if (wasComplete || !isComplete) return;

  const challengerId = record.getString("challenger");
  const opponentId = record.getString("opponent");
  if (!challengerId || !opponentId || challengerId === opponentId) return;

  const opponentName = record.getString("opponent_name") || "Your opponent";
  sendExpoPush(
    challengerId,
    "Challenge completed!",
    `${opponentName} just finished your challenge. See who won!`,
    { screen: "ChallengesInbox", challengeId: record.id }
  );
}, "challenges");
