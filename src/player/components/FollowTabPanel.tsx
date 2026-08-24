/* Hallmark · genre: modern-minimal · macrostructure: Workbench · design-system: design.md · designed-as-app */
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { RangeSlider } from '@/components/RangeSlider';
import { colors, layout, type } from '@/theme';
import { toUserFacingPlayerError } from '@/player/playerError';
import { ConfirmationMode, PitchToleranceMode } from '../followTab/NoteMatcher';
import { FollowTabController } from '../followTab/useFollowTab';
import { midiToNoteName } from '../followTab/pitch';

const TOLERANCE_MODES: PitchToleranceMode[] = ['strict', 'normal', 'relaxed'];
const CONFIRMATION_MODES: ConfirmationMode[] = ['fast', 'normal', 'stable'];

type FollowTabPanelProps = {
  follow: FollowTabController;
  onToggle?: () => void;
  onOpenSettings: () => void;
  showSettings?: boolean;
};

export function FollowTabPanel({ follow, onToggle, onOpenSettings, showSettings = true }: FollowTabPanelProps) {
  const expected = follow.expectedStep;
  const expectedLabel = expected
    ? expected.notes.map((note) => midiToNoteName(note.midi)).join(' + ')
    : '--';
  const expectedPositionLabel = expected
    ? expected.notes.map((note) => note.stringNumber === null || note.fret === null ? 'MIDI ' + note.midi : 'S' + (note.stringNumber + 1) + ' · F' + note.fret).join(' + ')
    : '--';
  const detectedLabel = follow.detection?.noteName ?? '--';
  const centsLabel = follow.detection?.cents === null || follow.detection?.cents === undefined
    ? '--'
    : (follow.detection.cents > 0 ? '+' : '') + follow.detection.cents.toFixed(0) + ' cents';
  const statusLabel = getStatusLabel(follow);
  const feedbackLabel = follow.feedback === 'correct'
    ? '✓ Correct'
    : follow.feedback === 'wrong'
      ? 'Wrong note · keep trying'
      : follow.status === 'listening'
        ? 'Listening for the expected pitch'
        : statusLabel;
  const settingsSummary = `${capitalize(follow.settings.toleranceMode)} tolerance · ${Math.round(follow.settings.sensitivity * 100)}% sensitivity · ${capitalize(follow.settings.confirmationMode)} confirmation`;
  const visibleError = follow.error
    ? toUserFacingPlayerError(
      follow.error,
      follow.status === 'denied'
        ? 'Microphone permission is required for Follow Tab. Open microphone settings and try again.'
        : 'Follow Tab could not start. Try again.',
    )
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={type.section}>Follow tab</Text>
          <Text style={type.caption}>Hold the cursor on each note until the pitch is correct.</Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Toggle Follow Tab"
          accessibilityState={{ checked: follow.enabled }}
          onPress={onToggle ?? follow.toggle}
          style={({ pressed }) => [styles.toggle, follow.enabled && styles.toggleActive, pressed && styles.pressed]}
        >
          <Text style={[type.mono, follow.enabled && styles.toggleTextActive]}>{follow.enabled ? 'On' : 'Off'}</Text>
        </Pressable>
      </View>

      {follow.enabled ? (
        <>
          <View style={styles.readout}>
            <View style={styles.readoutCell}>
              <Text style={type.caption}>Expected</Text>
              <Text style={styles.expected} numberOfLines={1}>{expectedLabel}</Text>
              <Text style={type.mono} numberOfLines={1}>{expectedPositionLabel}</Text>
              <Text style={type.mono} numberOfLines={1}>{expected?.isChord ? 'Chord · manual advance' : 'Step ' + follow.stepNumber + ' of ' + follow.sequenceLength}</Text>
            </View>
            <View style={[styles.readoutCell, styles.detectedCell]}>
              <Text style={type.caption}>Detected</Text>
              <Text style={[styles.detected, follow.feedback === 'correct' && styles.detectedCorrect]} numberOfLines={1}>{detectedLabel}</Text>
              <Text style={type.mono}>{centsLabel}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, follow.feedback === 'correct' && styles.statusDotCorrect, follow.feedback === 'wrong' && styles.statusDotWrong]} />
            <Text style={[type.caption, follow.feedback === 'correct' && styles.statusCorrect, follow.feedback === 'wrong' && styles.statusWrong]} numberOfLines={2}>{feedbackLabel}</Text>
          </View>

          {follow.status === 'count-in' ? <Text style={styles.countIn}>Count-in · {follow.countInRemaining ?? '--'} beats</Text> : null}

          {follow.error ? (
            <View style={styles.error}>
              <Text style={[type.section, styles.errorTitle]}>{follow.status === 'denied' ? 'Microphone permission needed' : 'Follow tab unavailable'}</Text>
              <Text style={type.caption}>{visibleError}</Text>
              {follow.status === 'denied' ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Open microphone settings" onPress={() => void Linking.openSettings()} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
                  <Text style={[type.mono, styles.settingsButtonText]}>Open settings</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {expected?.isChord && follow.status !== 'complete' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Manually advance past chord" onPress={() => void follow.advance()} style={({ pressed }) => [styles.advanceButton, pressed && styles.pressed]}>
              <Text style={[type.section, styles.advanceText]}>Manual advance</Text>
            </Pressable>
          ) : null}

          {showSettings ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open Follow Tab practice settings" accessibilityHint="Opens pitch tolerance, sensitivity and confirmation settings" onPress={onOpenSettings} style={({ pressed }) => [styles.settingsTrigger, pressed && styles.pressed]}>
              <View style={styles.settingsTriggerCopy}>
                <Text style={[type.section, styles.settingsTriggerTitle]}>Practice settings</Text>
                <Text style={type.caption} numberOfLines={2}>{settingsSummary}</Text>
              </View>
              <Text style={styles.settingsChevron}>›</Text>
            </Pressable>
          ) : null}
        </>
      ) : (
        <Text style={[type.caption, styles.disabledCopy]}>Turn on Follow Tab to let the microphone hold the cursor on each expected note.</Text>
      )}
    </View>
  );
}

export function FollowTabSettings({ follow }: { follow: FollowTabController }) {
  return (
    <View style={styles.settingsPanel}>
      <View style={styles.settingsHeader}>
        <Text style={type.screenTitle}>Practice settings</Text>
        <Text style={type.caption}>Fine-tune how TabTensor listens while Follow Tab is active.</Text>
      </View>

      <View style={styles.settingBlock}>
        <Text style={type.section}>Pitch tolerance</Text>
        <Text style={type.caption}>Accept notes within ±{follow.toleranceCents} cents.</Text>
        <View style={styles.optionRow}>
          {TOLERANCE_MODES.map((mode) => (
            <OptionButton
              key={mode}
              label={capitalize(mode)}
              selected={follow.settings.toleranceMode === mode}
              onPress={() => follow.updateSettings({ toleranceMode: mode })}
            />
          ))}
        </View>
      </View>

      <View style={styles.settingBlock}>
        <RangeSlider
          label="Input sensitivity"
          value={follow.settings.sensitivity}
          valueLabel={Math.round(follow.settings.sensitivity * 100) + '%'}
          onChange={(value) => follow.updateSettings({ sensitivity: value })}
        />
      </View>

      <View style={styles.settingBlock}>
        <Text style={type.section}>Correct note confirmation</Text>
        <Text style={type.caption}>Require {follow.confirmationFrames} matching audio frames before advancing.</Text>
        <View style={styles.optionRow}>
          {CONFIRMATION_MODES.map((mode) => (
            <OptionButton
              key={mode}
              label={capitalize(mode)}
              selected={follow.settings.confirmationMode === mode}
              onPress={() => follow.updateSettings({ confirmationMode: mode })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionActive, pressed && styles.pressed]}>
      <Text style={[type.mono, selected && styles.optionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function getStatusLabel(follow: FollowTabController): string {
  if (follow.status === 'count-in') return 'Count-in';
  if (follow.status === 'starting') return 'Starting microphone';
  if (follow.status === 'paused') return 'Paused · resume to continue';
  if (follow.status === 'complete') return 'Practice complete';
  if (follow.status === 'unavailable' || follow.status === 'denied' || follow.status === 'error') return 'Check microphone setup';
  if (follow.status === 'listening') return 'Listening';
  return 'Ready';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusCard, backgroundColor: colors.paperRaised },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 4, minWidth: 0 },
  toggle: { minWidth: 60, minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl },
  toggleActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  toggleTextActive: { color: colors.accentBright },
  readout: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.rule },
  readoutCell: { flex: 1, minHeight: 76, justifyContent: 'center', gap: 3, paddingVertical: 10, minWidth: 0 },
  detectedCell: { paddingLeft: 12, borderLeftWidth: 1, borderColor: colors.rule },
  expected: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  detected: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  detectedCorrect: { color: colors.success },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.neutral },
  statusDotCorrect: { backgroundColor: colors.success },
  statusDotWrong: { backgroundColor: colors.accentBright },
  statusCorrect: { color: colors.success },
  statusWrong: { color: colors.accentBright },
  countIn: { color: colors.accentBright, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  error: { padding: 12, gap: 7, borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentWash },
  errorTitle: { color: colors.accentBright },
  settingsButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: colors.accent, borderRadius: layout.radiusControl },
  settingsButtonText: { color: colors.accentBright },
  advanceButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.accentWash, borderRadius: layout.radiusControl },
  advanceText: { color: colors.accentBright },
  settingsTrigger: { minHeight: 58, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: layout.radiusControl, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsTriggerCopy: { flex: 1, minWidth: 0, gap: 3 },
  settingsTriggerTitle: { color: colors.ink },
  settingsChevron: { color: colors.accentBright, fontSize: 28, lineHeight: 30, fontWeight: '300' },
  settingsPanel: { gap: 18 },
  settingsHeader: { gap: 6 },
  settingBlock: { gap: 9, paddingTop: 13, borderTopWidth: 1, borderColor: colors.rule },
  optionRow: { flexDirection: 'row', gap: 7 },
  option: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.rule, borderRadius: layout.radiusControl },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentWash },
  optionTextActive: { color: colors.accentBright },
  disabledCopy: { paddingTop: 1 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
