import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useIsWideLandscape } from '@/hooks/useIsWide';
import DuoHome from '@/components/DuoHome';
import FeedList from '@/components/FeedList';

export default function FeedScreen() {
  const split = useIsWideLandscape();

  if (split) {
    return <DuoHome initialRight="market" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FeedList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
