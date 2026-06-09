import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useAuthStore } from '@/store/authStore';
import { useGuestGuard } from '@/hooks/useGuestGuard';
import { KonnectLogo } from '@/components/KonnectLogo';
import { AdBanner } from '@/components/BannerAd';
import { fetchMyChallenges, subscribeToChallengeChanges, isMine } from '@/api/challenges';
import type { AppStackParamList } from '../App';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Home'> };
type HomeGameType = 'connections' | 'word_trails';

function BarChartIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Path d="M1 13 L1 8 L4 8 L4 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M6 13 L6 5 L9 5 L9 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M11 13 L11 2 L14 2 L14 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Line x1="0.5" y1="13.5" x2="15.5" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="8" cy="8" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M8 1.5 L8 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M8 13 L8 14.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M1.5 8 L3 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M13 8 L14.5 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M3.5 3.5 L4.6 4.6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M11.4 11.4 L12.5 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M12.5 3.5 L11.4 4.6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <Path d="M4.6 11.4 L3.5 12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M2 14 C2 11 4.7 9 8 9 C11.3 9 14 11 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16">
      <Circle cx="6" cy="5" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M1 14 C1 11.2 3.2 9 6 9 C8.8 9 11 11.2 11 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Circle cx="11.5" cy="4.5" r="2" stroke={color} strokeWidth="1.3" fill="none"/>
      <Path d="M13 9 C14.7 9.5 15.5 11 15.5 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

export function HomeScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore(s => s.user);
  const { isGuest, guardAction } = useGuestGuard();
  const [openChallengeCount, setOpenChallengeCount] = useState(0);
  const [selectedGame, setSelectedGame] = useState<HomeGameType>('connections');
  const actionAnim = useRef(new Animated.Value(1)).current;

  const refreshOpenChallengeCount = useCallback(() => {
    fetchMyChallenges().then(cs =>
      setOpenChallengeCount(cs.filter(c => c.status !== 'complete' && !isMine(c)).length),
    );
  }, []);

  useEffect(() => {
    refreshOpenChallengeCount();
  }, [refreshOpenChallengeCount]);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    subscribeToChallengeChanges(refreshOpenChallengeCount).then(fn => {
      if (cancelled) fn();
      else unsubscribe = fn;
    });
    const interval = setInterval(refreshOpenChallengeCount, 10000);
    return () => {
      cancelled = true;
      unsubscribe?.();
      clearInterval(interval);
    };
  }, [isGuest, refreshOpenChallengeCount]);

  useEffect(() => {
    actionAnim.setValue(0);
    Animated.timing(actionAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [selectedGame, actionAnim]);

  const actionPanelStyle = {
    opacity: actionAnim,
    transform: [{
      translateY: actionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      }),
    }],
  };

  const gameAccent = selectedGame === 'connections' ? colors.tileStrip : colors.blue;
  const gamePrimaryBg = selectedGame === 'connections' ? colors.text1 : colors.blue;
  const gameSecondaryBg = selectedGame === 'connections' ? colors.bgBase : colors.bgSurface;

  function showWordlinesComingSoon() {
    Alert.alert(
      'Wordlines is next',
      'The first 50 curated Wordlines puzzles are in. The playable board is the next piece to wire up.',
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <KonnectLogo iconSize={120} />
          <Text style={styles.greeting}>Hey, {user?.displayName}</Text>
          {isGuest && (
            <Pressable style={styles.guestBanner} onPress={() => guardAction(() => {})}>
              <Text style={styles.guestBannerText}>Playing as guest — tap to create a free account</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.buttons}>
          <View style={styles.gameSwitch}>
            <Pressable
              style={[
                styles.gameSwitchBtn,
                selectedGame === 'connections' && styles.gameSwitchBtnActive,
              ]}
              onPress={() => setSelectedGame('connections')}
            >
              <Text style={[
                styles.gameSwitchText,
                selectedGame === 'connections' && styles.gameSwitchTextActive,
              ]}>
                Connections
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.gameSwitchBtn,
                selectedGame === 'word_trails' && styles.gameSwitchBtnWordlinesActive,
              ]}
              onPress={() => setSelectedGame('word_trails')}
            >
              <Text style={[
                styles.gameSwitchText,
                selectedGame === 'word_trails' && styles.gameSwitchTextActive,
              ]}>
                Wordlines
              </Text>
            </Pressable>
          </View>

          <Animated.View style={[styles.actionPanel, actionPanelStyle]}>
            <Pressable
              style={[styles.btnPrimary, { backgroundColor: gamePrimaryBg }]}
              onPress={() => selectedGame === 'connections'
                ? navigation.navigate('Game', { mode: 'daily' })
                : showWordlinesComingSoon()}
            >
              <Text style={[styles.btnLabel, { color: selectedGame === 'connections' ? colors.tileStrip : colors.bgScreen }]}>
                {selectedGame === 'connections' ? 'DAILY PUZZLE' : 'DAILY WORDLINE'}
              </Text>
              <Text style={styles.btnPrimaryText}>
                {selectedGame === 'connections' ? "Play today's puzzle" : "Untangle today's trail"}
              </Text>
            </Pressable>

            <View style={styles.btnRow}>
              <Pressable
                style={[styles.btnSecondary, { flex: 1, backgroundColor: gameSecondaryBg }]}
                onPress={() => selectedGame === 'connections'
                  ? navigation.navigate('Game', { mode: 'nyt' })
                  : showWordlinesComingSoon()}
              >
                <Text style={[styles.btnLabel, { color: selectedGame === 'connections' ? colors.text2 : gameAccent }]}>
                  {selectedGame === 'connections' ? 'NYT' : 'RANDOM'}
                </Text>
                <Text style={styles.btnSecondaryText}>Random puzzle</Text>
              </Pressable>
              <Pressable
                style={[styles.btnTertiary, { flex: 1, backgroundColor: gameSecondaryBg, borderColor: gameAccent }]}
                onPress={() => selectedGame === 'connections'
                  ? navigation.navigate('PuzzleSelect')
                  : showWordlinesComingSoon()}
              >
                <Text style={[styles.btnLabel, { color: selectedGame === 'connections' ? colors.text2 : gameAccent }]}>
                  FREE PLAY
                </Text>
                <Text style={styles.btnSecondaryText}>Choose puzzle</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.btnLeaderboard, selectedGame === 'word_trails' && { borderColor: gameAccent }]}
              onPress={() => selectedGame === 'connections'
                ? guardAction(() => navigation.navigate('Leaderboard'))
                : showWordlinesComingSoon()}
            >
              <Text style={styles.btnLeaderboardText}>
                {selectedGame === 'connections' ? '🏆  Leaderboard' : 'Stats coming soon'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerBtns}>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Stats')}>
            <BarChartIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Stats</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => guardAction(() => navigation.navigate('Friends'))}>
            <View style={{ position: 'relative' }}>
              <PeopleIcon color={colors.text2} />
              {openChallengeCount > 0 && !isGuest && (
                <View style={styles.badge} />
              )}
            </View>
            <Text style={styles.footerBtnText}>Friends</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Settings')}>
            <GearIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Settings</Text>
          </Pressable>
          <Pressable style={styles.footerBtn} onPress={() => navigation.navigate('Profile')}>
            <PersonIcon color={colors.text2} />
            <Text style={styles.footerBtnText}>Profile</Text>
          </Pressable>
        </View>
        <AdBanner />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgScreen },
    container: { flexGrow: 1, justifyContent: 'space-between', padding: 24 },
    header: { alignItems: 'center', paddingTop: 12, gap: 12 },
    greeting: { fontSize: 15, fontFamily: FONTS.bold, color: c.text2 },
    guestBanner: {
      backgroundColor: c.bgBase, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 8,
      borderWidth: 1, borderColor: c.border,
    },
    guestBannerText: { fontSize: 12, fontFamily: FONTS.bold, color: c.text2, textAlign: 'center' },
    buttons: { gap: 12 },
    gameSwitch: {
      flexDirection: 'row',
      backgroundColor: c.bgBase,
      borderRadius: 16,
      padding: 4,
      gap: 4,
    },
    gameSwitchBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameSwitchBtnActive: { backgroundColor: c.text1 },
    gameSwitchBtnWordlinesActive: { backgroundColor: c.blue },
    gameSwitchText: { fontSize: 14, fontFamily: FONTS.extraBold, color: c.text2 },
    gameSwitchTextActive: { color: c.bgScreen },
    actionPanel: { gap: 12 },
    btnPrimary: { backgroundColor: c.text1, borderRadius: 16, padding: 20, gap: 4 },
    btnLabel: { fontSize: 11, fontFamily: FONTS.extraBold, letterSpacing: 2 },
    btnPrimaryText: { color: c.bgScreen, fontSize: 18, fontFamily: FONTS.extraBold },
    btnRow: { flexDirection: 'row', gap: 12 },
    btnSecondary: { backgroundColor: c.bgBase, borderRadius: 16, padding: 20, gap: 4 },
    btnTertiary: { backgroundColor: c.bgBase, borderRadius: 16, padding: 20, gap: 4, opacity: 0.85, borderWidth: 1 },
    btnSecondaryText: { color: c.text1, fontSize: 16, fontFamily: FONTS.extraBold },
    btnLeaderboard: {
      backgroundColor: c.bgBase, borderRadius: 16,
      paddingVertical: 14, paddingHorizontal: 20,
      alignItems: 'center',
    },
    btnLeaderboardText: { fontSize: 16, fontFamily: FONTS.extraBold, color: c.text1 },
    footer: { gap: 12 },
    footerBtns: {
      flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', gap: 6,
    },
    footerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: c.bgBase, borderRadius: 20,
      paddingHorizontal: 11, paddingVertical: 9,
    },
    footerBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: c.text2 },
    badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: c.errorFlash },
  });
}
