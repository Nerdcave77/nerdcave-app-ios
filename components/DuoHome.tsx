import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import FeedList from '@/components/FeedList';
import MarketList from '@/components/MarketList';
import DropsList from '@/components/DropsList';

export type DuoRightPane = 'market' | 'drops';

const OPTIONS: { key: DuoRightPane; label: string }[] = [
  { key: 'market', label: 'Market' },
  { key: 'drops', label: 'Drops' },
];

// Two-pane "Duo home" for wide screens (unfolded iPhone Duo, iPad).
// Left pane is always the Feed; the right pane switches between Market
// and Drops with the toggle at its top. Each pane scrolls independently.
export default function DuoHome({
  initialRight = 'market',
}: {
  initialRight?: DuoRightPane;
}) {
  const [right, setRight] = useState<DuoRightPane>(initialRight);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.row}>
        <View style={styles.leftPane}>
          <FeedList compact />
        </View>
        <View style={styles.divider} />
        <View style={styles.rightPane}>
          <View style={styles.toggle}>
            {OPTIONS.map((o) => (
              <Pressable
                key={o.key}
                onPress={() => setRight(o.key)}
                style={[
                  styles.toggleButton,
                  right === o.key
                    ? styles.toggleButtonActive
                    : styles.toggleButtonInactive,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: right === o.key }}
              >
                <Text
                  style={
                    right === o.key
                      ? styles.toggleTextActive
                      : styles.toggleTextInactive
                  }
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {right === 'market' ? (
            <MarketList compact />
          ) : (
            <DropsList compact />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 58,
    minWidth: 0,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  rightPane: {
    flex: 42,
    minWidth: 0,
  },
  toggle: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  toggleButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.yellow,
  },
  toggleButtonInactive: {
    backgroundColor: COLORS.card,
  },
  toggleTextActive: {
    color: COLORS.cardDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleTextInactive: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
});
