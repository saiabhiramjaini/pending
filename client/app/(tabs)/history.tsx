import { Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, ScreenSkeleton } from "../../components/ui/States";
import { usePayments } from "../../hooks/usePayments";

export default function HistoryScreen() {
  const { items, loading, error, refresh } = usePayments();
  if (loading) {
    return (
      <Screen>
        <ScreenSkeleton />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen>
        <ErrorState onRetry={() => void refresh()} />
      </Screen>
    );
  }
  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState title="Nothing recorded." />
      </Screen>
    );
  }
  return (
    <Screen>
      <Text className="type-title mb-4 text-ink">History</Text>
      <View className="gap-3">
        {items.map((row) => (
          <Card key={row.id} className="flex-row items-center justify-between">
            <View>
              <Text className="type-body font-medium text-ink">{row.merchantName}</Text>
              <Text className="type-caption text-ink-muted">{row.vpa}</Text>
            </View>
            <View className="items-end gap-2">
              <Text className="type-body type-amount font-semibold text-ink">₹{row.amount}</Text>
              <StatusBadge status={row.status} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
