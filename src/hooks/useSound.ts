import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';

const SOUND_FILES = {
  tap:       require('../../assets/sounds/tap.mp3'),
  deselect:  require('../../assets/sounds/deselect.mp3'),
  wrong:     require('../../assets/sounds/wrong.mp3'),
  oneaway:   require('../../assets/sounds/oneaway.mp3'),
  correct_1: require('../../assets/sounds/correct_1.mp3'),
  correct_2: require('../../assets/sounds/correct_2.mp3'),
  correct_3: require('../../assets/sounds/correct_3.mp3'),
  correct_4: require('../../assets/sounds/correct_4.mp3'),
  win:       require('../../assets/sounds/win.mp3'),
  lose:      require('../../assets/sounds/lose.mp3'),
} as const;

export type SoundName = keyof typeof SOUND_FILES;

// Category colour → correct sound (ascending pitch per difficulty)
const CATEGORY_SOUND: Record<string, SoundName> = {
  yellow: 'correct_1',
  green:  'correct_2',
  blue:   'correct_3',
  purple: 'correct_4',
};

export function useSound(enabled = true) {
  const players = useRef<Partial<Record<SoundName, ReturnType<typeof useAudioPlayer>>>>({});

  // Preload all players
  const tap      = useAudioPlayer(SOUND_FILES.tap);
  const deselect = useAudioPlayer(SOUND_FILES.deselect);
  const wrong    = useAudioPlayer(SOUND_FILES.wrong);
  const oneaway  = useAudioPlayer(SOUND_FILES.oneaway);
  const c1       = useAudioPlayer(SOUND_FILES.correct_1);
  const c2       = useAudioPlayer(SOUND_FILES.correct_2);
  const c3       = useAudioPlayer(SOUND_FILES.correct_3);
  const c4       = useAudioPlayer(SOUND_FILES.correct_4);
  const win      = useAudioPlayer(SOUND_FILES.win);
  const lose     = useAudioPlayer(SOUND_FILES.lose);

  useEffect(() => {
    players.current = { tap, deselect, wrong, oneaway, correct_1: c1, correct_2: c2, correct_3: c3, correct_4: c4, win, lose };
  }, [tap, deselect, wrong, oneaway, c1, c2, c3, c4, win, lose]);

  function play(name: SoundName) {
    if (!enabled) return;
    const player = players.current[name];
    if (!player) return;
    player.seekTo(0);
    player.play();
  }

  function playCorrect(colour: string) {
    play((CATEGORY_SOUND[colour] ?? 'correct_1') as SoundName);
  }

  return { play, playCorrect };
}
