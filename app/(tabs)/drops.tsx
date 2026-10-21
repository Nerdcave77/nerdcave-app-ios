import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { useIsWideLandscape } from '@/hooks/useIsWide';
import DuoHome from '@/components/DuoHome';
import DropsList from '@/components/DropsList';

export default function DropsScreen() {
  const split = useIsWideLandscape();

  if (split) {
    return <DuoHome initialRight="drops" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DropsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
