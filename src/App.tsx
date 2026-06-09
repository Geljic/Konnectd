import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { WelcomeScreen } from '@/screens/WelcomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { PuzzleSelectScreen } from '@/screens/PuzzleSelectScreen';
import { GameScreen } from '@/screens/GameScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { ChallengeScreen } from '@/screens/ChallengeScreen';
import { ChallengeResultScreen } from '@/screens/ChallengeResultScreen';
import { ChallengesInboxScreen } from '@/screens/ChallengesInboxScreen';
import { SocialScreen } from '@/screens/SocialScreen';
import { FriendDetailScreen } from '@/screens/FriendDetailScreen';
import { LeaderboardScreen } from '@/screens/LeaderboardScreen';
import { useColors } from '@/hooks/useColors';
import { WEB_BASE_URL } from '@/constants/config';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  PuzzleSelect: undefined;
  Game: {
    mode: 'daily' | 'freeplay' | 'nyt';
    puzzleId?: string;
    collection?: 'puzzles' | 'nyt_puzzles';
    challengeId?: string;
  };
  Result: undefined;
  Stats: undefined;
  Profile: undefined;
  Settings: undefined;
  Challenge: { challengeId: string };
  ChallengeResult: { challengeId: string };
  ChallengesInbox: undefined;
  Friends: undefined;
  FriendDetail: { friendshipId: string; friendId: string; friendHandle: string; friendDisplayName: string };
  Leaderboard: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  const colors = useColors();
  const screenOptions = {
    headerStyle: { backgroundColor: colors.bgScreen },
    headerTintColor: colors.text1,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
  };
  return (
    <AuthStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: true, title: 'Log In' }} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: true, title: 'Sign Up' }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const colors = useColors();
  const screenOptions = {
    headerStyle: { backgroundColor: colors.bgScreen },
    headerTintColor: colors.text1,
    headerTitleStyle: { fontWeight: '700' as const },
    headerShadowVisible: false,
  };
  return (
    <AppStack.Navigator screenOptions={screenOptions}>
      <AppStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="PuzzleSelect" component={PuzzleSelectScreen} options={{ title: 'Puzzles' }} />
      <AppStack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="Result" component={ResultScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="Stats" component={StatsScreen} options={{ title: 'Statistics' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <AppStack.Screen name="Challenge" component={ChallengeScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="ChallengeResult" component={ChallengeResultScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="ChallengesInbox" component={ChallengesInboxScreen} options={{ title: '⚡ Challenges' }} />
      <AppStack.Screen name="Friends" component={SocialScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="FriendDetail" component={FriendDetailScreen} options={({ route }) => ({ title: route.params.friendDisplayName })} />
      <AppStack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: '🏆 Leaderboard' }} />
    </AppStack.Navigator>
  );
}

const linking = {
  prefixes: ['konnectd://', WEB_BASE_URL],
  config: {
    screens: {
      Challenge: 'challenge/:challengeId',
    },
  },
};

export default function App() {
  const { user, restoreSession } = useAuthStore();
  const loadSettings = useSettingsStore(s => s.load);
  const [ready, setReady] = useState(false);
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [navRef, setNavRef] = useState<any>(null);

  const [fontsLoaded] = useFonts({
    'Nunito-Bold':      require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
  });

  // Parse challenge ID from a deep link URL
  function extractChallengeId(url: string): string | null {
    const match = url.match(/challenge\/([a-z0-9]+)/i);
    return match ? match[1] : null;
  }

  // Handle a deep link — navigate if ready, otherwise store as pending
  function handleDeepLink(url: string) {
    const challengeId = extractChallengeId(url);
    if (!challengeId) return;
    if (navRef && user) {
      navRef.navigate('Challenge', { challengeId });
    } else {
      setPendingChallengeId(challengeId);
    }
  }

  // Listen for deep links while the app is already open
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [navRef, user]);

  // Check for a deep link that launched the app
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    Promise.all([restoreSession(), loadSettings()]).finally(() => setReady(true));
  }, []);

  // Once the user is authenticated and a pending challenge exists, navigate to it
  useEffect(() => {
    if (user && pendingChallengeId && navRef) {
      navRef.navigate('Challenge', { challengeId: pendingChallengeId });
      setPendingChallengeId(null);
    }
  }, [user, pendingChallengeId, navRef]);

  const { width: windowWidth } = useWindowDimensions();

  if (!ready || !fontsLoaded) return null;

  const isWeb = Platform.OS === 'web';
  const webMaxWidth = windowWidth >= 900
    ? Math.min(Math.round(windowWidth * 0.44), 960)
    : 430;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: isWeb ? '#0A120D' : undefined }}>
      <SafeAreaProvider style={isWeb ? { alignItems: 'center' } : undefined}>
        <View style={isWeb ? { flex: 1, width: '100%', maxWidth: webMaxWidth } : { flex: 1 }}>
          <NavigationContainer ref={setNavRef} linking={linking}>
            {user ? <AppNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
