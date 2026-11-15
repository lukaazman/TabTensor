import React, { useEffect, useState } from 'react';
import {
  DimensionValue,
  Image,
  ImageSourcePropType,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { ActionButton } from '@/components/ActionButton';
import { AppHeader } from '@/components/AppHeader';
import { ModalSheet } from '@/components/ModalSheet';
import { RangeSlider } from '@/components/RangeSlider';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, font, layout, pressed, radius, size, type } from '@/theme';
import { InstrumentDefinition, InstrumentId, TuningDefinition } from '@/types';
import {
  allTunings,
  findTuning,
  INSTRUMENTS,
  instrumentForId,
  midiFromNoteName,
  noteNameForMidi,
} from '@/tuner/tunings';
import { useTuner } from '@/tuner/hooks/useTuner';

const INSTRUMENT_PHOTOS: Record<InstrumentId, ImageSourcePropType> = {
  'acoustic-guitar': require('../../assets/instruments/acoustic-guitar.png'),
  'electric-guitar': require('../../assets/instruments/electric-strat.png'),
  'classical-guitar': require('../../assets/instruments/classical-guitar.png'),
  'guitar-7': require('../../assets/instruments/acoustic-guitar.png'),
  'guitar-8': require('../../assets/instruments/acoustic-guitar.png'),
  ukulele: require('../../assets/instruments/ukulele.png'),
  'bass-4': require('../../assets/instruments/bass.png'),
  'bass-5': require('../../assets/instruments/bass.png'),
  mandolin: require('../../assets/instruments/mandolin.png'),
  violin: require('../../assets/instruments/violin.png'),
  banjo: require('../../assets/instruments/banjo.png'),
};

export function TunerScreen() {
  useKeepAwake('tabtensor-tuner');
  const { width } = useWindowDimensions();
  const compact = width <= 360;
  const tuner = useTuner();
  const [instrumentPickerVisible, setInstrumentPickerVisible] = useState(false);
  const [tuningPickerVisible, setTuningPickerVisible] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);
  const [calibrationVisible, setCalibrationVisible] = useState(false);

  const instrument = instrumentForId(tuner.preferences.instrumentId);
  const tuning = tuner.tuning;
  const selectedIndex =
    tuner.detection?.stringIndex ?? Math.min(tuner.preferences.manualStringIndex, tuning.strings.length - 1);
  const cents = tuner.detection?.cents ?? 0;
  const inTune = Boolean(tuner.detection && Math.abs(cents) <= 5);
  const statusText = !tuner.detection ? 'Play a string' : inTune ? 'On target' : cents > 0 ? 'Tune down' : 'Tune up';
  const statusColor = !tuner.detection ? colors.faint : inTune ? colors.positive : colors.accent;
  const targetNote = tuner.detection?.targetNote ?? tuning.strings[selectedIndex] ?? tuning.strings[0];
  const half = Math.ceil(tuning.strings.length / 2);

  const chooseInstrument = (selected: InstrumentDefinition) => {
    tuner.setInstrument(selected.id);
    setInstrumentPickerVisible(false);
  };
  const chooseTuning = (selected: TuningDefinition) => {
    tuner.setTuning(selected.id);
    setTuningPickerVisible(false);
  };
  const openCustom = () => {
    setTuningPickerVisible(false);
    setCustomVisible(true);
  };
  const saveCustom = (custom: TuningDefinition) => {
    const otherInstrumentTunings = tuner.preferences.customTunings.filter(
      (candidate) => !candidate.instrumentIds?.includes(instrument.id),
    );
    tuner.updatePreferences({ customTunings: [...otherInstrumentTunings, custom], tuningId: 'custom' });
    setCustomVisible(false);
  };
  const saveCalibration = (value: number) => {
    tuner.updatePreferences({ calibration: value });
    setCalibrationVisible(false);
  };

  return (
    <ScreenShell contentStyle={styles.screenContent}>
      <AppHeader />

      <View style={styles.pageHeading}>
        <View style={styles.pageHeadingCopy}>
          <Text style={type.title}>Tune</Text>
          <Text style={[type.caption, styles.headingDetail]}>
            {instrument.shortName} · {tuning.shortName}
          </Text>
        </View>
        <Text style={[type.label, { color: statusColor }]} accessibilityLiveRegion="polite">
          {statusText}
        </Text>
      </View>

      <View style={[styles.selectionRow, compact && styles.selectionRowCompact]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Choose instrument, ${instrument.name}`}
          onPress={() => setInstrumentPickerVisible(true)}
          style={({ pressed }) => [styles.instrumentTrigger, pressed && styles.pressed]}
        >
          <View style={styles.triggerCopy}>
            <Text style={type.caption}>{instrument.family}</Text>
            <Text numberOfLines={1} style={styles.triggerTitle}>
              {instrument.name}
            </Text>
            <Text numberOfLines={1} style={[type.meta, styles.triggerDetail]}>
              {tuning.name} · {instrument.stringCount} strings
            </Text>
          </View>
        </Pressable>
        <AutoToggle active={tuner.preferences.autoMode} compact={compact} onPress={tuner.toggleAuto} />
      </View>

      <View style={styles.tunerSurface}>
        <View style={[styles.tuningPanel, compact && styles.tuningPanelCompact]}>
          <PitchGrid
            cents={tuner.detection?.cents}
            noteName={tuner.detection?.noteName}
            detection={Boolean(tuner.detection)}
            inTune={inTune}
            statusColor={statusColor}
          />

          <View style={[styles.instrumentStage, compact && styles.instrumentStageCompact]}>
            <StringColumn
              strings={tuning.strings.slice(0, half)}
              startIndex={0}
              selectedIndex={selectedIndex}
              onSelect={tuner.selectString}
            />
            <InstrumentIllustration instrument={instrument} stringCount={tuning.strings.length} compact={compact} />
            <StringColumn
              strings={tuning.strings.slice(half)}
              startIndex={half}
              selectedIndex={selectedIndex}
              onSelect={tuner.selectString}
              align="right"
            />
          </View>
        </View>

        <View style={styles.surfaceBottomline}>
          <View style={styles.bottomReadout}>
            <Text style={type.caption}>
              String {selectedIndex + 1} of {tuning.strings.length}
            </Text>
            <Text style={styles.targetNote}>{targetNote}</Text>
          </View>
          <View style={styles.bottomReadoutRight}>
            <Text style={[type.meta, styles.centsReadout, { color: statusColor }]}>
              {tuner.detection ? `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢` : '—¢'}
            </Text>
            <Text style={[type.meta, styles.frequencyReadout]}>
              {tuner.detection ? `${tuner.detection.frequency.toFixed(1)} Hz` : 'Waiting'}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.actionLedger, compact && styles.actionLedgerCompact]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose tuning"
          onPress={() => setTuningPickerVisible(true)}
          style={({ pressed }) => [styles.ledgerAction, pressed && styles.pressed]}
        >
          <Text style={type.caption}>Tuning</Text>
          <Text numberOfLines={1} style={styles.ledgerValue}>
            {tuning.name}
          </Text>
          <Text numberOfLines={1} style={[type.meta, styles.ledgerDetail]}>
            {tuning.shortName}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adjust reference pitch"
          onPress={() => setCalibrationVisible(true)}
          style={({ pressed }) => [styles.ledgerAction, styles.ledgerActionRight, pressed && styles.pressed]}
        >
          <Text style={type.caption}>Reference pitch</Text>
          <Text style={styles.ledgerValue}>{tuner.preferences.calibration} Hz</Text>
          <Text style={[type.meta, styles.ledgerDetail]}>Adjust</Text>
        </Pressable>
      </View>

      {tuner.status === 'denied' || tuner.status === 'error' || tuner.status === 'unavailable' ? (
        <View style={styles.notice}>
          <Text style={[type.section, styles.noticeTitle]}>
            {tuner.status === 'denied'
              ? 'Microphone access'
              : tuner.status === 'unavailable'
                ? 'Native build required'
                : 'Tuner unavailable'}
          </Text>
          <Text style={type.caption}>
            {tuner.error ?? 'The tuner needs the TabTensor native development client to access PCM microphone data.'}
          </Text>
          <View style={styles.noticeActions}>
            {tuner.status === 'denied' ? (
              <ActionButton variant="secondary" onPress={() => void Linking.openSettings()}>
                Open settings
              </ActionButton>
            ) : null}
            <ActionButton variant="quiet" onPress={tuner.retry}>
              Retry
            </ActionButton>
          </View>
        </View>
      ) : null}

      <InstrumentPicker
        visible={instrumentPickerVisible}
        selectedId={instrument.id}
        onClose={() => setInstrumentPickerVisible(false)}
        onSelect={chooseInstrument}
      />
      <TuningPicker
        instrument={instrument}
        visible={tuningPickerVisible}
        customTunings={tuner.preferences.customTunings}
        selectedId={tuner.preferences.tuningId}
        onClose={() => setTuningPickerVisible(false)}
        onSelect={chooseTuning}
        onCustom={openCustom}
      />
      <CustomTuningModal
        key={`${instrument.id}-${tuning.id}`}
        visible={customVisible}
        instrument={instrument}
        initial={findTuning('custom', tuner.preferences.customTunings, instrument.id)}
        onClose={() => setCustomVisible(false)}
        onSave={saveCustom}
      />
      <CalibrationModal
        visible={calibrationVisible}
        value={tuner.preferences.calibration}
        onClose={() => setCalibrationVisible(false)}
        onSave={saveCalibration}
      />
    </ScreenShell>
  );
}

function AutoToggle({ active, compact, onPress }: { active: boolean; compact: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Toggle automatic string target selection"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.autoToggle,
        compact && styles.autoToggleCompact,
        active && styles.autoToggleActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[type.meta, styles.autoLabel, active && styles.autoLabelActive]}>Auto</Text>
      <View style={[styles.autoTrack, active && styles.autoTrackActive]}>
        <View style={[styles.autoKnob, active && styles.autoKnobActive]} />
      </View>
    </Pressable>
  );
}

function PitchGrid({
  cents,
  noteName,
  detection,
  inTune,
  statusColor,
}: {
  cents?: number;
  noteName?: string;
  detection: boolean;
  inTune: boolean;
  statusColor: string;
}) {
  const clamped = Math.min(50, Math.max(-50, cents ?? 0));
  const markerPosition: DimensionValue = `${((clamped + 50) / 100) * 100}%`;
  const leftActive = detection && clamped < -5;
  const rightActive = detection && clamped > 5;

  return (
    <View style={styles.pitchGrid}>
      <View style={styles.directionRow}>
        <View style={[styles.directionBlock, leftActive && styles.directionActive]}>
          <Text style={[styles.directionArrow, leftActive && styles.directionTextActive]}>←</Text>
          <Text style={[type.meta, styles.directionLabel, leftActive && styles.directionTextActive]}>Tune up</Text>
        </View>
        <View style={[styles.directionBlock, styles.directionBlockRight, rightActive && styles.directionActive]}>
          <Text style={[type.meta, styles.directionLabel, rightActive && styles.directionTextActive]}>Tune down</Text>
          <Text style={[styles.directionArrow, rightActive && styles.directionTextActive]}>→</Text>
        </View>
      </View>
      <View style={styles.pitchReadout}>
        <View style={styles.pitchNoteBlock}>
          <Text style={[styles.pitchNote, { color: inTune ? colors.positive : colors.ink }]}>{noteName ?? '—'}</Text>
          <Text style={[type.meta, styles.pitchState, { color: statusColor }]}>
            {detection ? (inTune ? 'In tune' : `${clamped > 0 ? '+' : ''}${clamped.toFixed(1)} cents`) : 'Listening'}
          </Text>
        </View>
      </View>
      <View style={styles.pitchTrack}>
        <View style={styles.pitchTrackCenter} />
        <View
          style={[
            styles.pitchMarker,
            { left: markerPosition, backgroundColor: inTune ? colors.positive : statusColor },
          ]}
        />
      </View>
    </View>
  );
}

function StringColumn({
  strings,
  startIndex,
  selectedIndex,
  onSelect,
  align = 'left',
}: {
  strings: string[];
  startIndex: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  align?: 'left' | 'right';
}) {
  return (
    <View
      style={[
        styles.stringColumn,
        strings.length === 2 && styles.stringColumnPair,
        strings.length === 1 && styles.stringColumnSingle,
        align === 'right' && styles.stringColumnRight,
      ]}
    >
      {strings.map((stringName, index) => {
        const actualIndex = startIndex + index;
        const selected = selectedIndex === actualIndex;
        return (
          <Pressable
            key={`${stringName}-${actualIndex}`}
            accessibilityRole="button"
            accessibilityLabel={`Tune string ${actualIndex + 1}, ${stringName}`}
            onPress={() => onSelect(actualIndex)}
            hitSlop={4}
            style={({ pressed }) => [
              styles.stringBadge,
              align === 'right' && styles.stringBadgeRight,
              selected && styles.stringBadgeSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.stringBadgeNote, selected && styles.stringBadgeNoteSelected]}>
              {stringName.replace(/-?\d+$/, '')}
            </Text>
            <Text style={[type.meta, styles.stringBadgeOctave, selected && styles.stringBadgeOctaveSelected]}>
              {stringName.match(/-?\d+$/)?.[0]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function InstrumentIllustration({
  instrument,
  stringCount,
  compact,
}: {
  instrument: InstrumentDefinition;
  stringCount: number;
  compact: boolean;
}) {
  const source = instrumentPhotoFor(instrument);
  return (
    <View
      style={[styles.instrumentIllustration, compact && styles.instrumentIllustrationCompact]}
      accessibilityLabel={instrument.name + ', ' + stringCount + ' strings, tuning machines photo'}
    >
      <Image
        source={source}
        style={styles.instrumentPhoto}
        resizeMode="contain"
        resizeMethod="resize"
        fadeDuration={0}
      />
    </View>
  );
}

function instrumentPhotoFor(instrument: InstrumentDefinition): ImageSourcePropType {
  return INSTRUMENT_PHOTOS[instrument.id];
}
function InstrumentPicker({
  visible,
  selectedId,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selectedId: InstrumentId;
  onClose: () => void;
  onSelect: (instrument: InstrumentDefinition) => void;
}) {
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text style={type.title}>Choose instrument</Text>
      <Text style={[type.caption, styles.modalIntro]}>
        The tuner adapts targets and common tunings to the selected string layout.
      </Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
        {INSTRUMENTS.map((instrument) => {
          const selected = selectedId === instrument.id;
          return (
            <Pressable
              key={instrument.id}
              accessibilityRole="radio"
              accessibilityLabel={instrument.name}
              accessibilityState={{ selected }}
              onPress={() => onSelect(instrument)}
              style={({ pressed }) => [styles.optionRow, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <View style={styles.optionCopy}>
                <Text style={[type.body, selected && styles.selectedText]}>{instrument.name}</Text>
                <Text style={type.meta}>
                  {instrument.family} · {instrument.stringCount} strings
                </Text>
              </View>
              {selected ? <Text style={[type.meta, styles.selectedText]}>Selected</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </ModalSheet>
  );
}

function TuningPicker({
  instrument,
  visible,
  customTunings,
  selectedId,
  onClose,
  onSelect,
  onCustom,
}: {
  instrument: InstrumentDefinition;
  visible: boolean;
  customTunings: TuningDefinition[];
  selectedId: string;
  onClose: () => void;
  onSelect: (tuning: TuningDefinition) => void;
  onCustom: () => void;
}) {
  const options = allTunings(instrument.id, customTunings);
  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <View style={styles.modalHeader}>
        <Text style={type.title}>Choose tuning</Text>
        <Text style={type.caption}>
          {instrument.name} · {instrument.stringCount} strings
        </Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
        {options.map((tuning, index) => {
          const selected = selectedId === tuning.id;
          return (
            <Pressable
              key={`${tuning.id}-${index}`}
              accessibilityRole="radio"
              accessibilityLabel={`${tuning.name}, ${tuning.shortName}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(tuning)}
              hitSlop={2}
              style={({ pressed }) => [styles.optionRow, selected && styles.optionSelected, pressed && styles.pressed]}
            >
              <View style={styles.optionCopy}>
                <Text style={[type.body, selected && styles.selectedText]}>{tuning.name}</Text>
                <Text style={type.meta}>{tuning.shortName}</Text>
              </View>
              {selected ? <Text style={[type.meta, styles.selectedText]}>Selected</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <ActionButton variant="secondary" onPress={onCustom}>
        Edit custom tuning
      </ActionButton>
    </ModalSheet>
  );
}

function CustomTuningModal({
  visible,
  instrument,
  initial,
  onClose,
  onSave,
}: {
  visible: boolean;
  instrument: InstrumentDefinition;
  initial: TuningDefinition;
  onClose: () => void;
  onSave: (tuning: TuningDefinition) => void;
}) {
  const [name, setName] = useState(initial.name === 'Custom' ? 'My tuning' : initial.name);
  const [strings, setStrings] = useState(initial.strings);

  useEffect(() => {
    if (visible) {
      setName(initial.name === 'Custom' ? 'My tuning' : initial.name);
      setStrings(initial.strings);
    }
  }, [initial, visible]);

  const updateString = (index: number, delta: number) => {
    try {
      const next = noteNameForMidi(midiFromNoteName(strings[index]) + delta, strings[index].includes('b'));
      setStrings((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)));
    } catch {
      // Keep the row unchanged if a malformed custom value was persisted.
    }
  };

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text style={type.title}>Custom tuning</Text>
      <Text style={[type.caption, styles.modalIntro]}>
        Adjust each target by semitone. This {instrument.shortName.toLowerCase()} tuning stays on this device.
      </Text>
      <Text style={type.caption}>Tuning name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="My tuning"
        placeholderTextColor={colors.faint}
        style={styles.input}
        accessibilityLabel="Custom tuning name"
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.customList}>
        {strings.map((stringName, index) => (
          <View key={`${index}-${stringName}`} style={styles.customRow}>
            <Text style={styles.customIndex}>{index + 1}</Text>
            <Text style={styles.customNote}>{stringName}</Text>
            <Pressable
              onPress={() => updateString(index, -1)}
              hitSlop={2}
              style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
              accessibilityLabel={`Lower string ${index + 1}`}
            >
              <Text style={type.body}>−</Text>
            </Pressable>
            <Pressable
              onPress={() => updateString(index, 1)}
              hitSlop={2}
              style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
              accessibilityLabel={`Raise string ${index + 1}`}
            >
              <Text style={type.body}>+</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <ActionButton
        variant="primary"
        onPress={() =>
          onSave({
            id: 'custom',
            name: name.trim() || 'My tuning',
            shortName: strings.map((value) => value.replace(/-?\d+$/, '')).join(' '),
            strings,
            instrumentIds: [instrument.id],
            isCustom: true,
          })
        }
      >
        Save custom tuning
      </ActionButton>
    </ModalSheet>
  );
}

function CalibrationModal({
  visible,
  value,
  onClose,
  onSave,
}: {
  visible: boolean;
  value: number;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [next, setNext] = useState(value);
  useEffect(() => {
    if (visible) setNext(value);
  }, [value, visible]);

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text style={type.title}>Reference pitch</Text>
      <Text style={[type.caption, styles.modalIntro]}>
        Calibrate A4 for instruments that sit above or below concert pitch.
      </Text>
      <View style={styles.calibrationValueRow}>
        <Text style={styles.calibrationValue}>{next}</Text>
        <Text style={[type.body, styles.calibrationUnit]}>Hz</Text>
      </View>
      <RangeSlider
        min={430}
        max={450}
        value={next}
        onChange={(current) => setNext(Math.round(current))}
        valueLabel="430 — 450 Hz"
      />
      <ActionButton variant="primary" onPress={() => onSave(next)}>
        Save calibration
      </ActionButton>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 40 },
  pageHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 },
  pageHeadingCopy: { gap: 4, flex: 1, minWidth: 0 },
  headingDetail: { color: colors.faint },
  selectionRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8, marginBottom: 12 },
  selectionRowCompact: { gap: 6 },
  instrumentTrigger: {
    flex: 1,
    minHeight: 68,
    padding: 10,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  triggerCopy: { flex: 1, minWidth: 0, gap: 2 },
  triggerTitle: { color: colors.ink, fontSize: size.caption, fontFamily: font.semibold },
  triggerDetail: { color: colors.muted, fontSize: size.meta },
  autoToggle: {
    width: 78,
    minHeight: 68,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.control,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  autoToggleCompact: { width: 70 },
  autoToggleActive: { borderColor: colors.control },
  autoLabel: { color: colors.muted, fontSize: size.meta },
  autoLabelActive: { color: colors.ink },
  autoTrack: {
    width: 34,
    height: 18,
    borderRadius: radius.pill,
    padding: 2,
    justifyContent: 'center',
    backgroundColor: colors.control,
  },
  autoTrackActive: { backgroundColor: colors.accent },
  autoKnob: { width: 14, height: 14, borderRadius: radius.pill, backgroundColor: colors.muted },
  autoKnobActive: { alignSelf: 'flex-end', backgroundColor: colors.ink },
  tunerSurface: { paddingTop: 2, overflow: 'visible' },
  tuningPanel: {
    height: 468,
    borderRadius: radius.control,
    backgroundColor: colors.ground,
    borderWidth: 1,
    borderColor: colors.rule,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  tuningPanelCompact: { height: 438 },
  pitchGrid: {
    height: 188,
    borderRadius: radius.bar,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  pitchReadout: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
    transform: [{ translateY: -8 }],
  },
  pitchNoteBlock: { alignItems: 'center', gap: 1 },
  pitchNote: { fontSize: size.readout, lineHeight: 59, fontFamily: font.semibold },
  pitchState: { fontSize: size.meta },
  pitchTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    position: 'relative',
    zIndex: 1,
    transform: [{ translateY: -8 }],
  },
  pitchTrackCenter: {
    position: 'absolute',
    left: '50%',
    top: -4,
    bottom: -4,
    width: 1,
    backgroundColor: colors.ink,
    opacity: 0.7,
  },
  pitchMarker: { position: 'absolute', top: -3, bottom: -3, width: 3, marginLeft: -1.5, borderRadius: radius.pill },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    gap: 6,
    marginBottom: 4,
  },
  directionBlock: { minWidth: 66, flexDirection: 'row', alignItems: 'center', gap: 4 },
  directionBlockRight: { justifyContent: 'flex-end' },
  directionActive: { opacity: 1 },
  directionArrow: { color: colors.faint, fontSize: size.section, lineHeight: 23 },
  directionLabel: { color: colors.faint, fontSize: size.meta },
  directionTextActive: { color: colors.accent },
  instrumentStage: {
    height: 330,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
    marginTop: -50,
    paddingTop: 0,
    position: 'relative',
    zIndex: 2,
  },
  instrumentStageCompact: { height: 294, marginTop: -44 },
  stringColumn: {
    width: 39,
    height: 154,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 0,
    marginTop: 32,
  },
  stringColumnPair: { height: 98, marginTop: 88 },
  stringColumnSingle: { height: 50, marginTop: 108 },
  stringColumnRight: { alignItems: 'flex-end' },
  stringBadge: {
    minWidth: 38,
    minHeight: 42,
    paddingHorizontal: 3,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 1,
  },
  stringBadgeRight: { alignItems: 'flex-end' },
  stringBadgeSelected: { backgroundColor: colors.accentTint, borderColor: colors.accent },
  stringBadgeNote: { color: colors.muted, fontSize: size.title, lineHeight: 32, fontFamily: font.semibold },
  stringBadgeNoteSelected: { color: colors.accent },
  stringBadgeOctave: { color: colors.faint, fontSize: size.meta },
  stringBadgeOctaveSelected: { color: colors.accent },
  instrumentIllustration: {
    width: 176,
    height: 330,
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  instrumentIllustrationCompact: { width: 158, height: 294 },
  instrumentPhoto: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' },

  surfaceBottomline: {
    borderTopWidth: 1,
    borderColor: colors.rule,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomReadout: { gap: 2, flex: 1, minWidth: 0 },
  targetNote: { color: colors.ink, fontSize: size.title, lineHeight: 32, fontFamily: font.semibold },
  bottomReadoutRight: { alignItems: 'flex-end', gap: 3 },
  centsReadout: { fontFamily: font.semibold, fontSize: size.section, fontVariant: ['tabular-nums'] },
  frequencyReadout: { color: colors.faint, fontSize: size.meta, fontVariant: ['tabular-nums'] },
  actionLedger: {
    marginTop: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.rule,
    flexDirection: 'row',
  },
  actionLedgerCompact: { flexDirection: 'column' },
  ledgerAction: { flex: 1, minHeight: 78, paddingVertical: 12, paddingRight: 10, gap: 3 },
  ledgerActionRight: { paddingLeft: 14, borderLeftWidth: 1, borderColor: colors.rule },
  ledgerValue: { color: colors.ink, fontSize: size.caption, fontFamily: font.semibold },
  ledgerDetail: { color: colors.muted, fontSize: size.meta },
  notice: {
    marginTop: 18,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.accentTint,
    gap: 9,
  },
  noticeTitle: { color: colors.accent },
  noticeActions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  modalHeader: { gap: 5, marginBottom: 10 },
  modalIntro: { marginTop: 8, marginBottom: 16 },
  modalList: { paddingBottom: 12 },
  optionRow: {
    minHeight: 60,
    borderTopWidth: 1,
    borderColor: colors.rule,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionSelected: { backgroundColor: colors.accentTint, borderTopColor: colors.accent },
  optionCopy: { flex: 1, minWidth: 0, gap: 2 },
  selectedText: { color: colors.accent },
  input: {
    minHeight: layout.controlHeight,
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: radius.control,
    backgroundColor: colors.ground,
    paddingHorizontal: 12,
    color: colors.ink,
    fontFamily: font.regular,
    fontSize: size.body,
    marginTop: 6,
    marginBottom: 12,
  },
  customList: { paddingBottom: 14 },
  customRow: {
    minHeight: 52,
    borderTopWidth: 1,
    borderColor: colors.rule,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customIndex: { ...type.meta, width: 22 },
  customNote: { flex: 1, color: colors.ink, fontSize: size.section, fontFamily: font.semibold },
  stepButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.control,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calibrationValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 18 },
  calibrationValue: { color: colors.accent, fontSize: size.readout, lineHeight: 59, fontFamily: font.semibold },
  calibrationUnit: { color: colors.muted, fontSize: size.body, lineHeight: 21 },
  pressed,
});
