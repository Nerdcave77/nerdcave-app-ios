import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';
import { COLORS } from '@/constants/theme';

function TabIcon({
  name,
  color,
}: {
  name: 'newspaper' | 'bookmark' | 'bag' | 'gearshape' | 'calendar';
  color: ColorValue;
}) {
  return <SymbolView name={name} tintColor={color} size={26} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.yellow,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: { backgroundColor: COLORS.cardDeep },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Articles',
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
          tabBarIcon: ({ color }) => <TabIcon name="bag" color={color} />,
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
