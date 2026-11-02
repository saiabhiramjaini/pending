import "../global.css";
import { useColorScheme, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ApiSessionProvider } from "../lib/api/session";
import { chrome } from "../lib/design/tokens";
import * as Sentry from "@sentry/react-native";

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.Authorization;
      delete event.request.headers.authorization;
    }
    return event;
  },
});

const queryClient = new QueryClient();

function RootLayout() {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter: Inter_400Regular,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView>
      {/* NativeWind does not style GestureHandlerRootView, so the theme class lives here. */}
      <View className={`flex-1 ${scheme === "dark" ? "dark" : ""}`}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ApiSessionProvider queryClient={queryClient}>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: chrome(scheme).paper } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="payment" />
                <Stack.Screen name="(auth)" />
              </Stack>
            </ApiSessionProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
