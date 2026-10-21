import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { COLORS } from '@/constants/theme';
import { useShowsSideRail } from '@/hooks/useIsWide';
import AppTabBar from '@/components/AppTabBar';

function TabIcon({
  name,
  color,
}: {
  name: 'newspaper' | 'bookmark' | 'chart.line.uptrend.xyaxis' | 'gearshape' | 'calendar';
  color: ColorValue;
}) {
  return <SymbolView name={name} tintColor={color} size={26} />;
}

export default function TabLayout() {
  const rail = useShowsSideRail();

  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // The Duo (open or folded) and iPad: the tab buttons live on the
        // right side as a vertical rail. Regular iPhones keep the
        // standard bottom bar.
        tabBarPosition: rail ? 'right' : 'bottom',
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: { backgroundColor: COLORS.cardDeep },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <TabIcon name="newspaper" color={color} />,
        }}
      />
      <Tabs.Screen
        name="drops"
        options={{
          title: 'Drops',
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarIcon: ({ color }) => <TabIcon name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <TabIcon name="bookmark" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="gearshape" color={color} />,
        }}
      />
    </Tabs>
  );
}
