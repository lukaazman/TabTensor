/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
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
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label ?? 'Adjust value'}
        accessibilityValue={{ min, max, now: value, text: valueLabel ?? String(value) }}
        accessibilityHint="Swipe up or down to adjust"
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const step = (max - min || 1) / 20;
          if (event.nativeEvent.actionName === 'increment') onChange(Math.min(max, Number((value + step).toFixed(3))));
          if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(min, Number((value - step).toFixed(3))));
        }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={styles.touchArea}
        {...responder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
          <View style={[styles.thumb, { left: `${fraction * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  touchArea: { height: 44, justifyContent: 'center' },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.paperSoft, position: 'relative' },
  fill: { height: 5, borderRadius: 3, backgroundColor: colors.accent },
  thumb: { position: 'absolute', top: -7, width: 19, height: 19, marginLeft: -9.5, borderRadius: 10, backgroundColor: colors.ink, borderWidth: 3, borderColor: colors.accent },
});
