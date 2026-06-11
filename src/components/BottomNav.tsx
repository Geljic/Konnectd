import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { FONTS } from '@/constants/fonts';
import { useGuestGuard } from '@/hooks/useGuestGuard';
import { fetchMyChallenges, isMine } from '@/api/challenges';
import type { AppStackParamList } from '../App';

export type NavTab = 'home' | 'stats' | 'friends' | 'profile';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 16 16">
      <Path d="M2 7 L8 2 L14 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M3.2 6.2 L3.2 13.5 L12.8 13.5 L12.8 6.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </Svg>
  );
}

function BarChartIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 16 16">
      <Path d="M1 13 L1 8 L4 8 L4 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M6 13 L6 5 L9 5 L9 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Path d="M11 13 L11 2 L14 2 L14 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <Line x1="0.5" y1="13.5" x2="15.5" y2="13.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </Svg>
  );
}

function PeopleIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 16 16">
      <Circle cx="6" cy="5" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M1 14 C1 11.2 3.2 9 6 9 C8.8 9 11 11.2 11 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <Circle cx="11.5" cy="4.5" r="2" stroke={color} strokeWidth="1.3" fill="none"/>
      <Path d="M13 9 C14.7 9.5 15.5 11 15.5 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 16 16">
      <Circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.5" fill="none"/>
      <Path d="M2 14 C2 11 4.7 9 8 9 C11.3 9 14 11 14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </Svg>
  );
}

export function BottomNav({ active, onHomePress }: { active: NavTab; onHomePress?: () => void }) {
  const colors = useColors();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isGuest, guardAction } = useGuestGuard();
  const [openChallengeCount, setOpenChallengeCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (isGuest) { setOpenChallengeCount(0); return; }
      let alive = true;
      fetchMyChallenges().then(cs => {
        if (alive) setOpenChallengeCount(cs.filter(c => c.status !== 'complete' && !isMine(c)).length);
      });
      return () => { alive = false; };
    }, [isGuest]),
  );

  const go = (tab: NavTab, action: () => void) => {
    if (active === tab) { if (tab === 'home') onHomePress?.(); return; }
    action();
  };

  return (
    <View style={styles.bar}>
      <NavItem styles={styles} label="Home" activeColor={colors.green} idleColor={colors.text2}
        isActive={active === 'home'}
        onPress={() => go('home', () => navigation.navigate('Home'))}
        icon={(c) => <HomeIcon color={c} />} />
      <NavItem styles={styles} label="Stats" activeColor={colors.green} idleColor={colors.text2}
        isActive={active === 'stats'}
        onPress={() => go('stats', () => navigation.navigate('Stats'))}
        icon={(c) => <BarChartIcon color={c} />} />
      <NavItem styles={styles} label="Friends" activeColor={colors.green} idleColor={colors.text2}
        isActive={active === 'friends'}
        badge={openChallengeCount > 0 && !isGuest}
        onPress={() => go('friends', () => guardAction(() => navigation.navigate('Friends')))}
        icon={(c) => <PeopleIcon color={c} />} />
      <NavItem styles={styles} label="Profile" activeColor={colors.green} idleColor={colors.text2}
        isActive={active === 'profile'}
        onPress={() => go('profile', () => navigation.navigate('Profile'))}
        icon={(c) => <PersonIcon color={c} />} />
    </View>
  );
}

function NavItem({
  styles, label, icon, isActive, activeColor, idleColor, badge, onPress,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  icon: (color: string) => React.ReactNode;
  isActive: boolean;
  activeColor: string;
  idleColor: string;
  badge?: boolean;
  onPress: () => void;
}) {
  const color = isActive ? activeColor : idleColor;
  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={6}>
      <View>
        {icon(color)}
        {badge && <View style={styles.badge} />}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorTheme) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
      paddingTop: 9, paddingBottom: 4, paddingHorizontal: 6,
      borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bgScreen,
    },
    item: { alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 6 },
    label: { fontSize: 11, fontFamily: FONTS.bold },
    badge: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: c.errorFlash },
  });
}
