import PostHog from "posthog-react-native";

let client: PostHog | null = null;

export function getPosthog() {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, { host: "https://us.i.posthog.com" });
  }
  return client;
}

export function track(
  event:
    | "scan_opened"
    | "qr_parsed"
    | "upi_app_selected"
    | "upi_launched"
    | "payment_returned"
    | "status_confirmed"
    | "transaction_recorded",
  props?: Record<string, string | number | boolean>,
) {
  getPosthog()?.capture(event, props);
}
