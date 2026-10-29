import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { usePayHandoff } from "../hooks/usePayHandoff";

export default function PaymentScreen() {
  const router = useRouter();
  const { draft, setDraft, apps, busy, confirm, pendingStatus, amountError, payError, pay, confirmStatus } =
    usePayHandoff();

  if (!draft) {
    return (
      <Screen className="items-center justify-center">
        <Text className="type-body text-ink-muted">Scan a QR first.</Text>
        <View className="mt-4">
          <Button label="Scan" onPress={() => router.replace("/(tabs)/scan")} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text className="type-title text-ink">Pay</Text>
      <Card className="mt-4 gap-1">
        <Text className="type-body font-medium text-ink">{draft.merchantName}</Text>
        <Text className="type-caption text-ink-muted">{draft.vpa}</Text>
      </Card>
      <View className="mt-4">
        <Input
          label="Amount (₹)"
          value={draft.amount}
          editable={!draft.localId && !busy}
          keyboardType="numeric"
          error={amountError}
          onChangeText={(amount) => setDraft({ ...draft, amount })}
        />
      </View>
      {payError ? <Text className="mt-3 type-caption text-danger">{payError}</Text> : null}
      {pendingStatus ? (
        <View className="mt-6 gap-3">
          <Text className="type-body text-ink">Save the payment result before continuing.</Text>
          <Button label="Retry saving" disabled={busy} onPress={() => void confirmStatus(pendingStatus)} />
        </View>
      ) : confirm ? (
        <View className="mt-6 gap-3">
          <Text className="type-body text-ink">Confirm in your UPI app</Text>
          <Button label="Paid" disabled={busy} onPress={() => void confirmStatus("success")} />
          <Button label="Failed" disabled={busy} variant="danger" onPress={() => void confirmStatus("failed")} />
          <Button label="Cancelled" disabled={busy} variant="secondary" onPress={() => void confirmStatus("unknown")} />
        </View>
      ) : (
        <View className="mt-6 gap-3">
          <Text className="type-caption text-ink-muted">Choose UPI app</Text>
          {apps.length === 0 ? (
            <Text className="type-body text-ink-muted">No UPI apps found. Use a dev build on a real device.</Text>
          ) : (
            apps.map((app) => (
              <Button key={app.packageName} disabled={busy} label={app.name} onPress={() => void pay(app)} />
            ))
          )}
        </View>
      )}
    </Screen>
  );
}
