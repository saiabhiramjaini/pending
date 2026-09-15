import { Text, View } from "react-native";
import type { PaymentStatus } from "../../lib/storage/payments";

const labels: Record<PaymentStatus, string> = {
  created: "Created",
  upi_app_launched: "Opened UPI",
  returned: "Returned",
  success: "Paid",
  failed: "Failed",
  unknown: "Unknown",
};

const tones: Record<PaymentStatus, { wrap: string; text: string }> = {
  created: { wrap: "bg-line", text: "text-ink" },
  upi_app_launched: { wrap: "bg-line", text: "text-ink" },
  returned: { wrap: "bg-warning/20", text: "text-warning" },
  success: { wrap: "bg-success/15", text: "text-success" },
  failed: { wrap: "bg-danger/15", text: "text-danger" },
  unknown: { wrap: "bg-warning/20", text: "text-warning" },
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const tone = tones[status];
  return (
    <View className={`rounded-full px-3 py-1 ${tone.wrap}`}>
      <Text className={`type-label ${tone.text}`}>{labels[status]}</Text>
    </View>
  );
}
