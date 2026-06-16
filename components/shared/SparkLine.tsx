import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SparkLineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  showFill?: boolean;
}

export function SparkLine({
  data,
  width = 120,
  height = 40,
  color = '#2DB87A',
  fillColor,
  strokeWidth = 2,
  showFill = true,
}: SparkLineProps) {
  if (!data || data.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth + 2;

  const points = data.map((val, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + ((max - val) / range) * (height - pad * 2),
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fillPath = showFill
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`
    : '';

  const gradId = `grad_${color.replace('#', '')}`;

  return (
    <Svg width={width} height={height}>
      {showFill && (
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={fillColor ?? color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={fillColor ?? color} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
      )}
      {showFill && fillPath && (
        <Path d={fillPath} fill={`url(#${gradId})`} />
      )}
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
