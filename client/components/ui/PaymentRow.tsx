import { Pressable, Text, View } from "react-native";
import type { PaymentStatus } from "../../lib/storage/payments";
import { BucketIcon } from "./BucketIcon";
import { StatusBadge } from "./StatusBadge";

type Props = {
  merchantName: string;
  bucket: string;
  detail: string;
  amount: string;
  status: PaymentStatus;
  onPress?: () => void;
};

export function PaymentRow({ merchantName, bucket, detail, amount, status, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${merchantName}, ${amount}, ${bucket}`}
      disabled={!onPress}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-md bg-surface p-4"
    >
      <BucketIcon name={bucket} />
      <View className="flex-1">
        <Text numberOfLines={1} className="type-body font-medium text-ink">{merchantName}</Text>
        <Text numberOfLines={1} className="type-caption text-ink-muted">{bucket} · {detail}</Text>
      </View>
      <View className="items-end gap-1">
        <Text className="type-body type-amount font-semibold text-ink">{amount}</Text>
        <StatusBadge status={status} />
      </View>
    </Pressable>
  );
}
