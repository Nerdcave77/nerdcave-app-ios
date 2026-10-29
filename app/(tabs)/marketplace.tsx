import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useTheme } from '@/lib/theme';
import { useIsWideLandscape } from '@/hooks/useIsWide';
import DuoHome from '@/components/DuoHome';
import MarketList from '@/components/MarketList';

export default function MarketplaceScreen() {
  const { colors } = useTheme();
  const split = useIsWideLandscape();

  if (split) {
    return <DuoHome initialRight="market" />;
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <MarketList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
