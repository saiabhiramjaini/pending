function configuredUrl() {
  return (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function lanHost(): string | null {
  try {
    const Constants = require("expo-constants") as { default?: { expoConfig?: { hostUri?: string } }; expoConfig?: { hostUri?: string } };
    const hostUri = Constants.default?.expoConfig?.hostUri ?? Constants.expoConfig?.hostUri ?? "";
    const host = hostUri.split(":")[0];
    if (!host || host === "localhost" || host === "127.0.0.1") return null;
    return host;
  } catch {
    return null;
  }
}

/** Physical devices cannot reach the Mac via localhost. Use Metro's LAN host. */
export function apiBaseUrl(): string {
  const configured = configuredUrl();
  const loopback = /localhost|127\.0\.0\.1/.test(configured);
  if (!loopback) return configured;
  const host = lanHost();
  if (!host) return configured;
  try {
    const url = new URL(configured);
    url.hostname = host;
    return url.origin;
  } catch {
    return configured;
  }
}
