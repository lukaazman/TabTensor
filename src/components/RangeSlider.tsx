import React, { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, type } from '@/theme';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  valueLabel?: string;
};

export function RangeSlider({ value, min = 0, max = 1, onChange, label, valueLabel }: Props) {
  const [width, setWidth] = useState(1);
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const updateFromX = (x: number) => {
    const next = min + Math.min(1, Math.max(0, x / width)) * (max - min);
    onChange(Number(next.toFixed(3)));
  };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateFromX(event.nativeEvent.locationX),
    onPanResponderMove: (event) => updateFromX(event.nativeEvent.locationX),
  }), [max, min, onChange, width]);

  return (
    <View style={styles.wrap}>
      {label || valueLabel ? <View style={styles.meta}><Text style={type.caption}>{label}</Text><Text style={type.mono}>{valueLabel}</Text></View> : null}
      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={styles.touchArea} {...responder.panHandlers}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
          <View style={[styles.thumb, { left: `${fraction * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  touchArea: { height: 28, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, position: 'relative' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.red },
  thumb: { position: 'absolute', top: -6, width: 16, height: 16, marginLeft: -8, borderRadius: 8, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.red },
});
