import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Line, Rect } from 'react-native-svg';

export type FaceExpression = 'idle' | 'selected' | 'sad';

export function faceIndexFor(word: string) {
  let h = 0;
  for (let i = 0; i < word.length; i++) h = (h * 31 + word.charCodeAt(i)) & 0xff;
  return h % 16;
}

export function KonnectFace({
  expression,
  faceIndex,
  blink,
  color,
  stateOverride,
  width = 64,
  height = 32,
}: {
  expression: 'idle' | 'selected' | 'sad';
  faceIndex: number;
  blink: boolean;
  color: string;
  stateOverride?: number | null;
  width?: number;
  height?: number;
}) {
  const state =
    stateOverride != null
      ? stateOverride
      : expression === 'sad'
        ? [8, 10, 12][faceIndex % 3]
        : expression === 'selected'
          ? [2, 11, 13, 14, 15][faceIndex % 5]
          : faceIndex % 16;

  const ink = color;
  const cheek = '#F49A8B';
  const tooth = '#FFF7D8';

  function Cheeks({ strong = false }: { strong?: boolean }) {
    return (
      <G opacity={strong ? 0.82 : 0.72}>
        <Rect x="13" y="22" width={strong ? 10 : 9} height={strong ? 4.3 : 4} rx={2} fill={cheek} />
        <Rect x="58" y="22" width={strong ? 10 : 9} height={strong ? 4.3 : 4} rx={2} fill={cheek} />
      </G>
    );
  }

  function OpenEyes({ y = 17, small = false }: { y?: number; small?: boolean }) {
    const rx = small ? 3.7 : 4.1;
    const ry = small ? 5.3 : 5.9;
    return (
      <G>
        <Ellipse cx="27" cy={y} rx={rx} ry={ry} fill={ink} />
        <Ellipse cx="53" cy={y} rx={rx} ry={ry} fill={ink} />
        <Circle cx="25.8" cy={y - 2.2} r={small ? 1.15 : 1.35} fill="#FFFFFF" opacity="0.9" />
        <Circle cx="51.8" cy={y - 2.2} r={small ? 1.15 : 1.35} fill="#FFFFFF" opacity="0.9" />
      </G>
    );
  }

  function BlinkEyes() {
    return (
      <G>
        <Path d="M22 18 Q27 14 32 18" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        <Path d="M48 18 Q53 14 58 18" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      </G>
    );
  }

  function Smile() {
    return <Path d="M33 26 Q40 31 47 26" stroke={ink} strokeWidth="2.7" fill="none" strokeLinecap="round" />;
  }

  function BigMouth({ wide = false }: { wide?: boolean }) {
    return (
      <G>
        <Path d={wide ? 'M27 25 Q40 36 53 25 Z' : 'M29 25 Q40 35 51 25 Z'} fill={ink} />
        <Path d={wide ? 'M30 25 Q40 29 50 25' : 'M32 25 Q40 28 48 25'} fill={tooth} />
        <Path d="M35 31 Q40 28.5 45 31 Q42 34 40 34 Q38 34 35 31 Z" fill={cheek} />
      </G>
    );
  }

  function TalkO() {
    return (
      <G>
        <Ellipse cx="40" cy="28" rx="4.4" ry="5.6" fill={ink} />
        <Ellipse cx="40" cy="31" rx="2.2" ry="1.2" fill={cheek} />
      </G>
    );
  }

  const eyes = blink ? <BlinkEyes /> : null;

  return (
    <Svg width={width} height={height} viewBox="0 0 80 40">
      {(() => {
        switch (state) {
          case 2:
            return <>
              <Cheeks />
              <Path d="M22 18 Q27 12 32 18" stroke={ink} strokeWidth="3.1" fill="none" strokeLinecap="round" />
              <Path d="M48 18 Q53 12 58 18" stroke={ink} strokeWidth="3.1" fill="none" strokeLinecap="round" />
              <BigMouth wide />
            </>;
          case 3:
            return <>
              <Cheeks />
              {eyes ?? <OpenEyes y={16} />}
              <TalkO />
            </>;
          case 4:
            return <>
              <Cheeks />
              <Path d="M22 18 Q27 21 32 18" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <Path d="M48 18 Q53 21 58 18" stroke={ink} strokeWidth="2.8" fill="none" strokeLinecap="round" />
              <TalkO />
            </>;
          case 5:
            return <>
              <Cheeks />
              <BlinkEyes />
              <Line x1="36" y1="27" x2="44" y2="27" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
            </>;
          case 6:
            return <>
              <Cheeks />
              {blink ? <BlinkEyes /> : <>
                <Ellipse cx="27" cy="17" rx="4" ry="5.8" fill={ink} />
                <Circle cx="25.8" cy="14.8" r="1.35" fill="#FFFFFF" opacity="0.9" />
                <Path d="M48 17 Q53 21 58 17" stroke={ink} strokeWidth="2.9" fill="none" strokeLinecap="round" />
              </>}
              <Smile />
            </>;
          case 7:
            return <>
              <Cheeks strong />
              <Path d="M22 11 Q27 8 32 11" stroke={ink} strokeWidth="2.3" fill="none" strokeLinecap="round" />
              <Path d="M48 11 Q53 8 58 11" stroke={ink} strokeWidth="2.3" fill="none" strokeLinecap="round" />
              {eyes ?? <OpenEyes y={18} />}
              <Smile />
            </>;
          case 8:
            return <>
              <Cheeks />
              <Path d="M20 12 L32 16" stroke={ink} strokeWidth="3" strokeLinecap="round" />
              <Path d="M48 16 L60 12" stroke={ink} strokeWidth="3" strokeLinecap="round" />
              {eyes ?? <OpenEyes y={19} small />}
              <Path d="M31 31 Q40 25 49 31" stroke={ink} strokeWidth="2.7" fill="none" strokeLinecap="round" />
            </>;
          case 9:
            return <>
              <Cheeks />
              <Path d="M22 15 L32 20" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
              <Path d="M32 15 L22 20" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
              <Line x1="48" y1="18" x2="58" y2="18" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
              <Smile />
            </>;
          case 10:
            return <>
              <Cheeks />
              <Path d="M28 12 C20 12 20 24 28 24 C35 24 35 14 28 14 C23 14 23 21 28 21" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <Path d="M54 12 C46 12 46 24 54 24 C61 24 61 14 54 14 C49 14 49 21 54 21" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <TalkO />
            </>;
          case 11:
            return <>
              <Cheeks />
              <Path d="M23 15 L31 19 L23 23" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M57 15 L49 19 L57 23" stroke={ink} strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <BigMouth />
            </>;
          case 12:
            return <>
              <Cheeks />
              <Path d="M22 12 Q27 8 32 12" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <Path d="M48 12 Q53 8 58 12" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              {eyes ?? <OpenEyes y={18} />}
              <Path d="M34 30 Q37 26 40 30 Q43 34 46 30" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>;
          case 13:
            return <>
              <Cheeks />
              {eyes ?? <OpenEyes />}
              <Path d="M34 25 Q40 33 46 25 Z" fill={ink} />
              <Path d="M36 25 Q40 27 44 25" fill={tooth} />
              <Ellipse cx="40" cy="31" rx="3" ry="1.5" fill={cheek} />
            </>;
          case 14:
            return <>
              <Cheeks />
              {eyes ?? <OpenEyes />}
              <TalkO />
            </>;
          case 15:
            return <>
              <Cheeks />
              <Path d="M22 17 Q27 21.5 32 17" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
              <Path d="M48 17 Q53 21.5 58 17" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
              <Smile />
            </>;
          case 1:
            return <>
              <Cheeks />
              {eyes ?? <OpenEyes />}
              <Smile />
            </>;
          case 0:
          default:
            return <>
              <Cheeks />
              {eyes ?? <OpenEyes />}
              <Path d="M35 27 Q40 29 45 27" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </>;
        }
      })()}
    </Svg>
  );
}
