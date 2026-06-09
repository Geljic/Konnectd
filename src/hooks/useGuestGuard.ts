import { Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';

export function useGuestGuard() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  function guardAction(onAllowed: () => void) {
    if (!user?.isGuest) {
      onAllowed();
      return;
    }
    Alert.alert(
      'Create an Account',
      'Friends, leaderboards and challenges require an account. It only takes 30 seconds!',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Sign Up',
          onPress: () => {
            // Clearing the user returns to AuthNavigator → Welcome
            logout();
          },
        },
      ],
    );
  }

  return { isGuest: !!user?.isGuest, guardAction };
}
