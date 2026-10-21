import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useIsWideLandscape } from '@/hooks/useIsWide';
import DuoHome from '@/components/DuoHome';
import MarketList from '@/components/MarketList';

export default function MarketplaceScreen() {
  const split = useIsWideLandscape();

  if (split) {
    return <DuoHome initialRight="market" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
