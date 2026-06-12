import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import pb from '@/api/pb';

const CHALLENGE_NOTIFICATIONS_KEY = 'setting_challenge_notifications';

// expo-notifications is native only — no-op on web
async function getNotifications() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function registerPushToken(force = false): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!pb.authStore.isValid) return;
  if (!force) {
    const challengeNotifications = await AsyncStorage.getItem(CHALLENGE_NOTIFICATIONS_KEY);
    if (challengeNotifications === 'false') return;
  }
  const N = await getNotifications();
  if (!N) return;
  try {
    const { status } = await N.getPermissionsAsync();
    if (status !== 'granted') return;
    const tokenData = await N.getExpoPushTokenAsync();
    await pb.collection('users').update(pb.authStore.model!.id, {
      push_token: tokenData.data,
    });
  } catch (err) {
    // Requires EAS project setup for production builds
    console.log('[registerPushToken]', err);
  }
}

export async function clearPushToken(): Promise<void> {
  if (!pb.authStore.isValid) return;
  try {
    await pb.collection('users').update(pb.authStore.model!.id, { push_token: '' });
  } catch {
    // non-critical — the user can still disable notifications at OS level
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyStreakReminder(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  await N.cancelAllScheduledNotificationsAsync();

  await N.scheduleNotificationAsync({
    content: {
      title: '🔥 Keep your streak alive!',
      body: "Today's Konnectd puzzle is waiting for you.",
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelDailyStreakReminder(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}
