import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { ActionButton } from '@/components/ActionButton';
import { ModalSheet } from '@/components/ModalSheet';
import { RangeSlider } from '@/components/RangeSlider';
import { ScreenShell } from '@/components/ScreenShell';
import { SectionHeader } from '@/components/SectionHeader';
import { TunerGauge } from '@/components/TunerGauge';
import { colors, layout, type } from '@/theme';
import { TuningDefinition } from '@/types';
import { allTunings, findTuning, midiFromNoteName, noteNameForMidi, PRESET_TUNINGS } from '@/tuner/tunings';
import { useTuner } from '@/tuner/hooks/useTuner';

export function TunerScreen() {
  useKeepAwake('tabtensor-tuner');
  const tuner = useTuner();
  const [tuningPickerVisible, setTuningPickerVisible] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);
  const [calibrationVisible, setCalibrationVisible] = useState(false);

  const tuning = tuner.tuning;
  const cents = tuner.detection?.cents ?? 0;
  const inTune = Boolean(tuner.detection && Math.abs(cents) <= 5);
  const statusText = !tuner.detection
    ? 'PLAY A STRING'
    : inTune
      ? 'IN TUNE'
      : cents > 0
        ? 'TUNE LOWER'
        : 'TUNE HIGHER';

  const statusColor = !tuner.detection ? colors.textMuted : inTune ? colors.green : colors.redBright;

  return (
    <ScreenShell>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>TABTENSOR</Text>
        <Text style={type.mono}>A4 {tuner.preferences.calibration} HZ</Text>
      </View>
      <SectionHeader eyebrow="01 / TUNER" title="Guitar tuner" detail="LOCAL AUDIO" />

      <View style={styles.selectorRow}>
        <View style={styles.selectorCopy}>
          <Text style={type.caption}>TUNING</Text>
          <Text style={type.body}>{tuning.name}</Text>
          <Text style={type.mono}>{tuning.shortName}</Text>
        </View>
        <ActionButton onPress={() => setTuningPickerVisible(true)} variant="secondary" accessibilityLabel="Choose guitar tuning">CHANGE</ActionButton>
      </View>

      <View style={styles.tunerPanel}>
        <View style={styles.readingTop}>
          <View>
            <Text style={type.caption}>DETECTED NOTE</Text>
            <Text style={[styles.note, { color: inTune ? colors.green : colors.white }]}>{tuner.detection?.noteName ?? '—'}</Text>
          </View>
          <View style={styles.readingMeta}>
            <Text style={type.mono}>{tuner.detection ? `${tuner.detection.frequency.toFixed(1)} Hz` : '— Hz'}</Text>
            <Text style={[type.mono, { color: statusColor }]}>{tuner.detection ? `${tuner.detection.cents > 0 ? '+' : ''}${tuner.detection.cents.toFixed(1)} cents` : 'WAITING'}</Text>
          </View>
        </View>
        <TunerGauge cents={tuner.detection?.cents} active={Boolean(tuner.detection)} />
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          {tuner.detection ? <Text style={type.mono}>TARGET {tuner.detection.targetNote}</Text> : null}
        </View>
      </View>

      <View style={styles.modeRow}>
        <View>
          <Text style={type.caption}>STRING MODE</Text>
          <Text style={type.body}>{tuner.preferences.autoMode ? 'Automatic target selection' : `Locked to string ${tuner.preferences.manualStringIndex + 1}`}</Text>
        </View>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: tuner.preferences.autoMode }} onPress={tuner.toggleAuto} style={[styles.autoToggle, tuner.preferences.autoMode && styles.autoToggleActive]}>
          <Text style={[type.mono, tuner.preferences.autoMode && styles.autoText]}>{tuner.preferences.autoMode ? 'AUTO ON' : 'AUTO OFF'}</Text>
        </Pressable>
      </View>

      <Text style={[type.section, styles.subsection]}>STRINGS</Text>
      <View style={styles.stringGrid}>
        {tuning.strings.map((stringName, index) => {
          const selected = tuner.detection?.stringIndex === index || (!tuner.preferences.autoMode && tuner.preferences.manualStringIndex === index);
          return (
            <Pressable key={`${stringName}-${index}`} accessibilityRole="button" accessibilityLabel={`Tune string ${index + 1}, ${stringName}`} onPress={() => tuner.selectString(index)} style={[styles.stringCell, selected && styles.stringCellSelected]}>
              <Text style={[styles.stringNumber, selected && styles.selectedText]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={[styles.stringName, selected && styles.selectedText]}>{stringName.replace(/-?\d+$/, '')}</Text>
              <Text style={[type.mono, selected && styles.selectedText]}>{stringName.match(/-?\d+$/)?.[0]}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.settingsRow}>
        <View style={styles.settingCopy}><Text style={type.caption}>REFERENCE PITCH</Text><Text style={type.body}>A4 = {tuner.preferences.calibration} Hz</Text></View>
        <ActionButton variant="quiet" onPress={() => setCalibrationVisible(true)} accessibilityLabel="Adjust reference pitch">CALIBRATE</ActionButton>
      </View>

      {(tuner.status === 'denied' || tuner.status === 'error' || tuner.status === 'unavailable') ? (
        <View style={styles.notice}>
          <Text style={[type.section, styles.noticeTitle]}>{tuner.status === 'denied' ? 'MICROPHONE ACCESS NEEDED' : tuner.status === 'unavailable' ? 'NATIVE BUILD REQUIRED' : 'TUNER UNAVAILABLE'}</Text>
          <Text style={type.caption}>{tuner.error ?? 'The tuner needs the TabTensor native development client to access PCM microphone data.'}</Text>
          <View style={styles.noticeActions}>
            {tuner.status === 'denied' ? <ActionButton variant="secondary" onPress={() => void Linking.openSettings()}>OPEN SETTINGS</ActionButton> : null}
            <ActionButton variant="quiet" onPress={tuner.retry}>RETRY</ActionButton>
          </View>
        </View>
      ) : null}

      <TuningPicker visible={tuningPickerVisible} customTunings={tuner.preferences.customTunings} selectedId={tuner.preferences.tuningId} onClose={() => setTuningPickerVisible(false)} onSelect={(selected) => { tuner.setTuning(selected.id); setTuningPickerVisible(false); }} onCustom={() => { setTuningPickerVisible(false); setCustomVisible(true); }} />
      <CustomTuningModal visible={customVisible} initial={findTuning('custom', tuner.preferences.customTunings)} onClose={() => setCustomVisible(false)} onSave={(custom) => { tuner.updatePreferences({ customTunings: [custom], tuningId: 'custom' }); setCustomVisible(false); }} />
      <CalibrationModal visible={calibrationVisible} value={tuner.preferences.calibration} onClose={() => setCalibrationVisible(false)} onSave={(value) => { tuner.updatePreferences({ calibration: value }); setCalibrationVisible(false); }} />
    </ScreenShell>
  );
}

function TuningPicker({ visible, customTunings, selectedId, onClose, onSelect, onCustom }: { visible: boolean; customTunings: TuningDefinition[]; selectedId: string; onClose: () => void; onSelect: (tuning: TuningDefinition) => void; onCustom: () => void }) {
  const options = allTunings(customTunings);
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}><Text style={type.screenTitle}>Choose tuning</Text><Text style={type.caption}>Six-string presets</Text></View>
      {options.map((tuning, index) => (
        <Pressable key={`${tuning.id}-${index}`} onPress={() => onSelect(tuning)} style={[styles.optionRow, selectedId === tuning.id && styles.optionSelected]}>
          <View><Text style={[type.body, selectedId === tuning.id && styles.selectedText]}>{tuning.name}</Text><Text style={type.mono}>{tuning.shortName}</Text></View>
          {selectedId === tuning.id ? <Text style={styles.check}>●</Text> : null}
        </Pressable>
      ))}
      <ActionButton variant="secondary" onPress={onCustom}>EDIT CUSTOM TUNING</ActionButton>
    </ModalSheet>
  );
}

function CustomTuningModal({ visible, initial, onClose, onSave }: { visible: boolean; initial: TuningDefinition; onClose: () => void; onSave: (tuning: TuningDefinition) => void }) {
  const [name, setName] = useState(initial.name === 'Custom' ? 'My tuning' : initial.name);
  const [strings, setStrings] = useState(initial.strings);
  const updateString = (index: number, delta: number) => {
    try {
      const next = noteNameForMidi(midiFromNoteName(strings[index]) + delta, strings[index].includes('b'));
      setStrings((current) => current.map((item, itemIndex) => itemIndex === index ? next : item));
    } catch {
      // Keep the row unchanged if a malformed custom value was persisted.
    }
  };
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text style={type.screenTitle}>Custom tuning</Text>
      <Text style={[type.caption, styles.modalIntro]}>Adjust each target by semitone. The tuning is stored locally.</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Tuning name" placeholderTextColor={colors.textDim} style={styles.input} accessibilityLabel="Custom tuning name" />
      {strings.map((stringName, index) => (
        <View key={index} style={styles.customRow}>
          <Text style={styles.customIndex}>{index + 1}</Text>
          <Text style={styles.customNote}>{stringName}</Text>
          <Pressable onPress={() => updateString(index, -1)} style={styles.stepButton} accessibilityLabel={`Lower string ${index + 1}`}><Text style={type.body}>−</Text></Pressable>
          <Pressable onPress={() => updateString(index, 1)} style={styles.stepButton} accessibilityLabel={`Raise string ${index + 1}`}><Text style={type.body}>+</Text></Pressable>
        </View>
      ))}
      <ActionButton variant="primary" onPress={() => onSave({ id: 'custom', name: name.trim() || 'My tuning', shortName: strings.map((value) => value.replace(/-?\d+$/, '')).join(' '), strings, isCustom: true })}>SAVE CUSTOM TUNING</ActionButton>
    </ModalSheet>
  );
}

function CalibrationModal({ visible, value, onClose, onSave }: { visible: boolean; value: number; onClose: () => void; onSave: (value: number) => void }) {
  const [next, setNext] = useState(value);
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text style={type.screenTitle}>Reference pitch</Text>
      <Text style={[type.caption, styles.modalIntro]}>Calibrate A4 for instruments that sit above or below concert pitch.</Text>
      <Text style={styles.calibrationValue}>{next} <Text style={type.body}>Hz</Text></Text>
      <RangeSlider min={430} max={450} value={next} onChange={(current) => setNext(Math.round(current))} valueLabel="430 — 450 Hz" />
      <ActionButton variant="primary" onPress={() => onSave(next)}>SAVE CALIBRATION</ActionButton>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { color: colors.redBright, fontSize: 13, fontWeight: '800', letterSpacing: 2.5 },
  selectorRow: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  selectorCopy: { flex: 1, gap: 4 },
  tunerPanel: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.borderStrong, padding: 18, gap: 20, marginBottom: 14 },
  readingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  note: { fontSize: 74, lineHeight: 78, fontWeight: '700', letterSpacing: -4 },
  readingMeta: { gap: 7, alignItems: 'flex-end', paddingTop: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  modeRow: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  autoToggle: { minHeight: 38, minWidth: 92, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderStrong, borderRadius: layout.radius },
  autoToggleActive: { borderColor: colors.red, backgroundColor: colors.redDim },
  autoText: { color: colors.redBright },
  subsection: { marginTop: 22, marginBottom: 10 },
  stringGrid: { flexDirection: 'row', gap: 7 },
  stringCell: { flex: 1, minHeight: 84, padding: 8, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, gap: 4 },
  stringCellSelected: { borderColor: colors.red, backgroundColor: colors.redDim },
  stringNumber: { ...type.mono, color: colors.textDim },
  stringName: { color: colors.white, fontSize: 23, fontWeight: '700' },
  selectedText: { color: colors.redBright },
  settingsRow: { marginTop: 20, paddingTop: 18, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  settingCopy: { flex: 1, gap: 4 },
  notice: { marginTop: 22, padding: 14, borderWidth: 1, borderColor: colors.red, backgroundColor: colors.redDim, gap: 8 },
  noticeTitle: { color: colors.redBright },
  noticeActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  modalHeader: { gap: 5, marginBottom: 10 },
  modalIntro: { marginTop: 8, marginBottom: 18 },
  optionRow: { minHeight: 58, borderTopWidth: 1, borderColor: colors.border, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { borderLeftWidth: 3, borderLeftColor: colors.red, paddingLeft: 10 },
  check: { color: colors.redBright, fontSize: 13 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: layout.radius, paddingHorizontal: 12, color: colors.white, fontSize: 16, marginBottom: 12 },
  customRow: { minHeight: 46, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 },
  customIndex: { ...type.mono, width: 22, color: colors.textDim },
  customNote: { flex: 1, color: colors.white, fontSize: 18, fontWeight: '700' },
  stepButton: { width: 38, height: 36, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  calibrationValue: { color: colors.redBright, fontSize: 48, fontWeight: '700', marginBottom: 18 },
});
