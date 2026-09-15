import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState, ErrorState, ScreenSkeleton } from "../../components/ui/States";
import { usePayments } from "../../hooks/usePayments";
import { useApiSession } from "../../lib/api/session";

export default function HomeScreen() {
  const router = useRouter();
  const { items, total, loading, error, refresh } = usePayments();
  const session = useApiSession();
  const recent = items.slice(0, 5);

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Text className="type-title text-ink">Pending</Text>
        {session.status === "signed_out" ? (
          <Button label="Sign in" variant="secondary" onPress={() => router.push("/(auth)/signin")} />
        ) : (
          <Button label="Sign out" variant="secondary" onPress={() => session.actions.signOut()} />
        )}
      </View>
      <Card className="mt-6">
        <Text className="type-caption text-ink-muted">This month</Text>
        <Text className="type-display mt-1 text-ink">₹{Number(total).toLocaleString("en-IN")}</Text>
      </Card>
      <View className="mt-6">
        <Button label="Scan & Pay" onPress={() => router.push("/(tabs)/scan")} />
      </View>
      <Text className="type-body mt-8 font-semibold text-ink">Recent</Text>
      {loading ? <ScreenSkeleton /> : null}
      {error ? <ErrorState onRetry={() => void refresh()} /> : null}
      {!loading && !error && recent.length === 0 ? (
        <EmptyState title="No payments yet. Scan a UPI QR to start." actionLabel="Scan" onAction={() => router.push("/(tabs)/scan")} />
      ) : (
        <View className="mt-3 gap-3">
          {recent.map((row) => (
            <Card key={row.id} className="flex-row items-center justify-between">
              <View>
                <Text className="type-body font-medium text-ink">{row.merchantName}</Text>
                <Text className="type-caption type-amount text-ink-muted">₹{row.amount}</Text>
              </View>
              <StatusBadge status={row.status} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
