import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { type ColorTheme } from '@/constants/colors';
import { Tile } from './Tile';
import { CategoryReveal } from './CategoryReveal';
import { useGameStore } from '@/store/gameStore';
import type { PuzzleCategory } from '@/api/puzzles';

interface GameBoardProps {
  shakeWords?: string[];
  onShakeDone?: () => void;
  shuffleSignal?: number;
}

export function GameBoard({ shakeWords = [], onShakeDone, shuffleSignal = 0 }: GameBoardProps) {
  const colors = useColors();
  const { height: windowHeight } = useWindowDimensions();
  const maxRowHeight = Math.round(Math.max(130, Math.min(260, windowHeight * 0.23)));
  const styles = useMemo(() => makeStyles(colors, maxRowHeight), [colors, maxRowHeight]);

  const boardWords = useGameStore(s => s.boardWords);
  const selectedWords = useGameStore(s => s.selectedWords);
  const solvedCategories = useGameStore(s => s.solvedCategories);
  const pendingCategory = useGameStore(s => s.pendingCategory);
  const toggleWord = useGameStore(s => s.toggleWord);

  function faceIndexFor(word: string) {
    let h = 0;
    for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xff;
    return h % 16;
  }

  const rows = [];
  for (let i = 0; i < boardWords.length; i += 4) {
    rows.push(boardWords.slice(i, i + 4));
  }

  return (
    <View style={styles.container}>
      {solvedCategories.map((cat: PuzzleCategory, i: number) => (
        <CategoryReveal key={cat.name} category={cat} index={i} />
      ))}

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((word, colIdx) => {
            const isSolving = !!pendingCategory?.words.includes(word);
            return (
              <Tile
                key={word}
                word={word}
                selected={selectedWords.includes(word)}
                onPress={() => toggleWord(word)}
                shake={shakeWords.includes(word)}
                onShakeDone={onShakeDone}
                faceIndex={faceIndexFor(word)}
                shuffleSignal={shuffleSignal}
                shuffleDelay={(rowIdx * 4 + colIdx) * 12}
                solving={isSolving}
                solvingDelay={colIdx * 55}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function makeStyles(c: ColorTheme, maxRowHeight: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: c.bgBase,
      borderRadius: 16,
      marginHorizontal: 8,
      overflow: 'visible',
    },
    row: {
      flex: 1,
      maxHeight: maxRowHeight,
      flexDirection: 'row',
      marginVertical: 2,
      overflow: 'visible',
    },
  });
}
