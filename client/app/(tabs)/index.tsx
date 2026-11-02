import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { BucketBars } from "../../components/ui/BucketBars";
import { PaymentRow } from "../../components/ui/PaymentRow";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { EmptyState, ErrorState, ScreenSkeleton } from "../../components/ui/States";
import { usePayments } from "../../hooks/usePayments";
import { useApiSession } from "../../lib/api/session";
import { bucketLabel } from "../../lib/payments/buckets";
import { formatDay, formatRupees } from "../../lib/payments/format";

export default function HomeScreen() {
  const router = useRouter();
  const { items, total, buckets, loading, error, refresh } = usePayments();
  const session = useApiSession();
  const recent = items.slice(0, 5);

  return (
    <Screen tabbed scroll>
      <ScreenHeader
        title="Pending"
        right={
          session.status === "signed_out" ? (
            <Button label="Sign in" variant="secondary" onPress={() => router.push("/(auth)/signin")} />
          ) : (
            <Button label="Sign out" variant="secondary" onPress={() => session.actions.signOut()} />
          )
        }
      />
      <Card className="gap-4">
        <View className="gap-1">
          <Text className="type-caption text-ink-muted">This month</Text>
          <Text className="type-display type-amount text-ink">{formatRupees(total)}</Text>
        </View>
        {buckets.length > 0 ? (
          <BucketBars
            bars={buckets.map((bucket) => ({ name: bucket.name, amount: formatRupees(bucket.total), share: bucket.share }))}
          />
        ) : null}
      </Card>
      <View className="mt-4">
        <Button label="Scan & Pay" onPress={() => router.push("/(tabs)/scan")} />
      </View>
      <View className="mt-8 mb-2 min-h-tap flex-row items-center justify-between">
        <Text className="type-body font-semibold text-ink">Recent</Text>
        {items.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all"
            className="min-h-tap justify-center"
            onPress={() => router.push("/(tabs)/history")}
          >
            <Text className="type-label text-ink-muted">See all</Text>
          </Pressable>
        ) : null}
      </View>
      {loading ? <ScreenSkeleton /> : null}
      {error ? <ErrorState onRetry={() => void refresh()} /> : null}
      {!loading && !error && recent.length === 0 ? (
        <EmptyState title="No payments yet. Scan a UPI QR to start." actionLabel="Scan" onAction={() => router.push("/(tabs)/scan")} />
      ) : null}
      {!loading && !error && recent.length > 0 ? (
        <View className="gap-3">
          {recent.map((row) => (
            <PaymentRow
              key={row.id}
              merchantName={row.merchantName}
              bucket={bucketLabel(row.category)}
              detail={formatDay(row.createdAt)}
              amount={formatRupees(row.amount)}
              status={row.status}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
