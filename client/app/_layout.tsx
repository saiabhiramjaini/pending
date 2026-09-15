import "../global.css";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ApiSessionProvider } from "../lib/api/session";
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
  const scheme = useColorScheme();
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
    <GestureHandlerRootView className={`flex-1 ${scheme === "dark" ? "dark" : ""}`}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ApiSessionProvider queryClient={queryClient}>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="payment" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </ApiSessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
