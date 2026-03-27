import React from 'react';
import { View } from 'react-native';
import Svg, { Ellipse, Circle, Path } from 'react-native-svg';
import { GameColors } from '@/constants/colors';

interface Props {
  size: number;
  isGliding: boolean;
  velocity: number;
}

export default React.memo(function DragonSprite({ size, isGliding, velocity }: Props) {
  const wingY = isGliding ? 5 : velocity < -3 ? 3 : 12;
  const wingY2 = isGliding ? 9 : velocity < -3 ? 7 : 14;

  return (
    <View style={{ width: size * 1.4, height: size }}>
      <Svg width={size * 1.4} height={size} viewBox="0 0 70 50">
        <Circle cx={4} cy={30} r={4} fill="#ff6b35" opacity={0.5} />
        <Circle cx={-1} cy={28} r={3} fill="#ff3300" opacity={0.35} />
        <Circle cx={-5} cy={30} r={2.5} fill="#ff0000" opacity={0.2} />

        <Path d="M 12,28 Q 5,22 8,14 Q 11,20 15,24" fill={GameColors.dragon.dark} />

        <Ellipse cx={32} cy={28} rx={17} ry={10} fill={GameColors.dragon.body} />

        <Ellipse cx={32} cy={33} rx={13} ry={5} fill={GameColors.dragon.belly} opacity={0.5} />

        <Path
          d="M 18,19 L 20,12 L 22,19 M 25,18 L 27,11 L 29,18 M 32,19 L 34,12 L 36,19"
          fill={GameColors.dragon.wing}
        />

        <Path
          d={`M 22,20 L 17,${wingY} L 30,${wingY2} L 38,19`}
          fill={GameColors.dragon.dark}
          opacity={0.85}
        />
        <Path
          d={`M 25,20 L 27,${wingY + 4} L 34,${wingY2 + 2}`}
          fill={GameColors.dragon.wing}
          opacity={0.35}
        />

        <Circle cx={48} cy={24} r={8} fill={GameColors.dragon.body} />

        <Path d="M 54,22 L 63,20 L 56,27" fill="#00dd77" />

        <Circle cx={51} cy={22} r={2.5} fill={GameColors.dragon.eye} />
        <Circle cx={51.5} cy={21.5} r={1.2} fill="#1a0500" />
        <Circle cx={52} cy={21} r={0.5} fill="#ffffff" />

        <Circle cx={61} cy={21} r={1.5} fill={GameColors.dragon.eye} opacity={0.6} />

        <Path d="M 45,17 L 43,9 L 48,16" fill={GameColors.dragon.wing} />
        <Path d="M 42,18 L 41,12 L 44,17" fill={GameColors.dragon.wing} opacity={0.6} />
      </Svg>
    </View>
  );
});
