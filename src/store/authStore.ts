import { create } from 'zustand';
import pb from '@/api/pb';
import { registerPushToken } from '@/utils/notifications';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  usernameTag: number | null;
  handle: string; // "DisplayName#1234"
  streakCurrent: number;
  streakBest: number;
  puzzlesPlayed: number;
  puzzlesWon: number;
  isPremium: boolean;
  nytAccess: boolean;
  isGuest?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (displayName: string) => Promise<void>;
  guestLogin: () => void;
  logout: () => void;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  async restoreSession() {
    if (!pb.authStore.isValid) return;
    // Show the app immediately from the cached token/profile; verify in the
    // background so a slow or offline network never blocks first render.
    const cached = pb.authStore.model;
    if (cached) {
      set({ user: mapModel(cached as unknown as Record<string, unknown>) });
    }
    pb.collection('users').authRefresh()
      .then(() => {
        const model = pb.authStore.model;
        if (!model) return;
        const profile = mapModel(model as unknown as Record<string, unknown>);
        set({ user: profile });
        // Backfill tag for pre-migration accounts — refreshProfile handles it
        if (!profile.usernameTag) {
          useAuthStore.getState().refreshProfile();
        }
        registerPushToken();
      })
      .catch((e: unknown) => {
        // Only log out on a definitive auth rejection (401/403/404) — a network
        // failure should not destroy a valid offline session.
        const status = (e as { status?: number })?.status ?? 0;
        if (status === 401 || status === 403 || status === 404) {
          pb.authStore.clear();
          set({ user: null });
        }
      });
  },

  async login(email, password) {
    set({ isLoading: true, error: null });
    try {
      await pb.collection('users').authWithPassword(email, password);
      // Fetch full record to ensure all fields (username_tag etc) are present
      const full = await pb.collection('users').getOne(pb.authStore.model?.id ?? '');
      const profile = mapModel(full as unknown as Record<string, unknown>);
      // Assign tag on-the-fly for pre-migration accounts
      if (!profile.usernameTag) {
        const tag = Math.floor(1000 + Math.random() * 9000);
        await pb.collection('users').update(full.id, { username_tag: tag });
        profile.usernameTag = tag;
        profile.handle = `${profile.displayName}#${tag}`;
      }
      set({ user: profile, isLoading: false });
      registerPushToken();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), isLoading: false });
    }
  },

  async signUp(email, password, displayName) {
    set({ isLoading: true, error: null });
    try {
      const usernameTag = Math.floor(1000 + Math.random() * 9000);
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name: displayName,
        display_name: displayName,
        username_tag: usernameTag,
      });
      await pb.collection('users').authWithPassword(email, password);
      // Fetch full record to confirm tag was saved
      const full = await pb.collection('users').getOne(pb.authStore.model?.id ?? '');
      set({ user: mapModel(full as unknown as Record<string, unknown>), isLoading: false });
      registerPushToken();
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), isLoading: false });
    }
  },

  async requestPasswordReset(email) {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      set({ error: 'Enter your email address first.' });
      throw new Error('Email is required');
    }
    set({ isLoading: true, error: null });
    try {
      await pb.collection('users').requestPasswordReset(trimmedEmail);
      set({ isLoading: false });
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  async changePassword(oldPassword, newPassword) {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('You need to be logged in to change your password.');
    if (newPassword.length < 8) {
      set({ error: 'New password must be at least 8 characters.' });
      throw new Error('Password is too short');
    }
    set({ isLoading: true, error: null });
    try {
      const updated = await pb.collection('users').update(userId, {
        oldPassword,
        password: newPassword,
        passwordConfirm: newPassword,
      });
      pb.authStore.save(pb.authStore.token, updated);
      set({ user: mapModel(updated as unknown as Record<string, unknown>), isLoading: false });
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  async updateProfile(displayName) {
    const userId = pb.authStore.model?.id;
    const name = displayName.trim();
    if (!userId) throw new Error('You need to be logged in to update your profile.');
    if (name.length < 2) {
      set({ error: 'Display name must be at least 2 characters.' });
      throw new Error('Display name is too short');
    }
    if (name.length > 32) {
      set({ error: 'Display name must be 32 characters or fewer.' });
      throw new Error('Display name is too long');
    }
    set({ isLoading: true, error: null });
    try {
      const updated = await pb.collection('users').update(userId, {
        name,
        display_name: name,
      });
      pb.authStore.save(pb.authStore.token, updated);
      set({ user: mapModel(updated as unknown as Record<string, unknown>), isLoading: false });
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  guestLogin() {
    set({
      user: {
        id: 'guest',
        email: '',
        displayName: 'Guest',
        usernameTag: null,
        handle: 'Guest',
        streakCurrent: 0,
        streakBest: 0,
        puzzlesPlayed: 0,
        puzzlesWon: 0,
        isPremium: false,
        nytAccess: false,
        isGuest: true,
      },
    });
  },

  logout() {
    pb.authStore.clear();
    set({ user: null });
  },

  async deleteAccount() {
    const userId = pb.authStore.model?.id;
    if (!userId) return;
    set({ isLoading: true, error: null });
    try {
      const [sessions, friendships, ownedChallenges] = await Promise.all([
        pb.collection('play_sessions').getFullList({ filter: `user = '${userId}'` }),
        pb.collection('friendships').getFullList({
          filter: `requester = '${userId}' || addressee = '${userId}'`,
        }),
        pb.collection('challenges').getFullList({ filter: `challenger = '${userId}'` }),
      ]);

      await Promise.all([
        ...sessions.map(s => pb.collection('play_sessions').delete(s.id)),
        ...friendships.map(f => pb.collection('friendships').delete(f.id)),
        ...ownedChallenges.map(c => pb.collection('challenges').delete(c.id)),
      ]);

      // Delete the user record
      await pb.collection('users').delete(userId);
      pb.authStore.clear();
      set({ user: null, isLoading: false });
    } catch (e: unknown) {
      set({ error: getErrorMessage(e), isLoading: false });
      throw e;
    }
  },

  clearError() {
    set({ error: null });
  },

  async refreshProfile() {
    try {
      const id = pb.authStore.model?.id ?? '';
      const record = await pb.collection('users').getOne(id);
      // Backfill username_tag for accounts created before the migration
      if (!record['username_tag']) {
        const tag = Math.floor(1000 + Math.random() * 9000);
        const updated = await pb.collection('users').update(id, { username_tag: tag });
        set({ user: mapModel(updated as unknown as Record<string, unknown>) });
        return;
      }
      set({ user: mapModel(record as unknown as Record<string, unknown>) });
    } catch {
      // silent
    }
  },
}));

function mapModel(record: Record<string, unknown>): UserProfile {
  const displayName = (record.display_name as string) || (record.name as string) || (record.email as string);
  const usernameTag = (record.username_tag as number) || null;
  return {
    id: record.id as string,
    email: record.email as string,
    displayName,
    usernameTag,
    handle: usernameTag ? `${displayName}#${usernameTag}` : displayName,
    streakCurrent: (record.streak_current as number) || 0,
    streakBest: (record.streak_best as number) || 0,
    puzzlesPlayed: (record.puzzles_played as number) || 0,
    puzzlesWon: (record.puzzles_won as number) || 0,
    isPremium: (record.is_premium as boolean) || false,
    nytAccess: (record.nyt_access as boolean) || false,
  };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}
