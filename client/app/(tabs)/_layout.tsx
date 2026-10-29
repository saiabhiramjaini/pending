import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Home, History, ScanLine } from "lucide-react-native";
import { chrome, icon } from "../../lib/design/tokens";
import { useResumePayment } from "../../hooks/useResumePayment";

export default function TabsLayout() {
  useResumePayment();
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const palette = chrome(scheme);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.ink,
        tabBarInactiveTintColor: palette["ink-muted"],
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.line },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={icon.size} strokeWidth={icon.stroke} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => <ScanLine size={icon.size} strokeWidth={icon.stroke} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={icon.size} strokeWidth={icon.stroke} color={color} />,
        }}
      />
    </Tabs>
  );
}
