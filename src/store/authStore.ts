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
  isGuest?: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
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
    try {
      await pb.collection('users').authRefresh();
      const model = pb.authStore.model;
      if (model) {
        const profile = mapModel(model as unknown as Record<string, unknown>);
        set({ user: profile });
        // Backfill tag for pre-migration accounts — refreshProfile handles it
        if (!profile.usernameTag) {
          const store = useAuthStore.getState();
          store.refreshProfile();
        }
        registerPushToken();
      }
    } catch {
      pb.authStore.clear();
    }
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
      // Delete all play sessions first
      const sessions = await pb.collection('play_sessions').getFullList({
        filter: `user = '${userId}'`,
      });
      await Promise.all(sessions.map(s => pb.collection('play_sessions').delete(s.id)));
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
  };
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}
