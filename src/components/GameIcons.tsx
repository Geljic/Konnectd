import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

export function ShuffleIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Path d="M2 4 H5 L13 14 H16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 14 H5 L13 4 H16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 2 L16 4 L13.5 6" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 12 L16 14 L13.5 16" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ScanIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Circle cx="9" cy="9" r="6" stroke={color} strokeWidth="1.6" fill="none" />
      <Circle cx="9" cy="9" r="2" fill={color} />
      <Line x1="9" y1="0.5" x2="9" y2="3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="9" y1="15" x2="9" y2="17.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="0.5" y1="9" x2="3" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="15" y1="9" x2="17.5" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Path d="M3 9.5 L7 13.5 L15 4.5" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DeselectIcon({ color }: { color: string }) {
  return (
    <Svg width="18" height="18" viewBox="0 0 18 18">
      <Line x1="5" y1="5" x2="13" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="13" y1="5" x2="5" y2="13" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}
