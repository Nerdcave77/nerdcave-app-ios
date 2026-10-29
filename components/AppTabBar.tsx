import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs';
import { COLORS } from '@/constants/theme';
import { useShowsSideRail } from '@/hooks/useIsWide';

// App tab bar. On regular iPhones this renders the standard bottom bar,
// unchanged. On the iPhone Duo (open or folded) and iPad the tab buttons
// move to a vertical rail on the right side of the screen, paired with
// tabBarPosition: 'right' in the tabs layout so the content sits to the
// left of the rail instead of underneath it.
export default function AppTabBar(props: BottomTabBarProps) {
  const rail = useShowsSideRail();

  if (!rail) {
    return <BottomTabBar {...props} />;
  }

  const { state, descriptors, insets } = props;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.rail,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const options = descriptors[route.key].options;
        // SDK 58 narrowed the descriptor navigation type; at runtime it is
        // the full tab navigation object with emit/navigate.
        const navigation = descriptors[route.key].navigation as unknown as {
          emit: (event: {
            type: string;
            target?: string;
            canPreventDefault?: boolean;
          }) => { defaultPrevented: boolean };
          navigate: (name: string, params?: object) => void;
        };
        const focused = state.index === index;
        const color = focused
          ? options.tabBarActiveTintColor ?? COLORS.yellow
          : options.tabBarInactiveTintColor ?? 'rgba(255,255,255,0.55)';
        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            testID={options.tabBarButtonTestID}
            style={styles.button}
          >
            {options.tabBarIcon?.({ focused, color, size: 26 })}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 88,
    backgroundColor: COLORS.cardDeep,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 3,
  },
  label: {
    fontSize: 11,
  },
});
