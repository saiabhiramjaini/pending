import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { BucketPicker } from "../components/ui/BucketPicker";
import { BucketIcon } from "../components/ui/BucketIcon";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { usePayHandoff } from "../hooks/usePayHandoff";
import { bucketLabel } from "../lib/payments/buckets";
import { formatRupees } from "../lib/payments/format";

export default function PaymentScreen() {
  const router = useRouter();
  const {
    draft, setDraft, apps, busy, confirm, pendingStatus, amountError, bucketChoices, bucketError, chooseBucket, payError, pay, confirmStatus,
  } = usePayHandoff();

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

  const locked = !!draft.localId;

  return (
    <Screen scroll>
      <ScreenHeader title="Pay" onBack={locked ? undefined : () => router.back()} />
      <Card className="flex-row items-center gap-3">
        <BucketIcon name={bucketLabel(draft.bucket ?? null)} />
        <View className="flex-1">
          <Text numberOfLines={1} className="type-body font-medium text-ink">{draft.merchantName}</Text>
          <Text numberOfLines={1} className="type-caption text-ink-muted">{draft.vpa}</Text>
        </View>
        {locked ? <Text className="type-title type-amount text-ink">{formatRupees(draft.amount)}</Text> : null}
      </Card>
      {locked ? null : (
        <>
          <View className="mt-4">
            <Input
              label="Amount (₹)"
              value={draft.amount}
              editable={!busy}
              keyboardType="numeric"
              error={amountError}
              onChangeText={(amount) => setDraft({ ...draft, amount })}
            />
          </View>
          <Text className="type-body mt-6 mb-3 font-semibold text-ink">What is this for?</Text>
          <BucketPicker options={bucketChoices} selected={draft.bucket} disabled={busy} onSelect={chooseBucket} />
          {bucketError ? <Text className="mt-3 type-caption text-danger">{bucketError}</Text> : null}
        </>
      )}
      {payError ? <Text className="mt-3 type-caption text-danger">{payError}</Text> : null}
      {pendingStatus ? (
        <View className="mt-6 gap-3">
          <Text className="type-body text-ink">Save the payment result before continuing.</Text>
          <Button label="Retry saving" disabled={busy} onPress={() => void confirmStatus(pendingStatus)} />
        </View>
      ) : confirm ? (
        <View className="mt-6 gap-3">
          <Text className="type-body font-semibold text-ink">Confirm in your UPI app</Text>
          <Button label="Paid" disabled={busy} onPress={() => void confirmStatus("success")} />
          <Button label="Failed" disabled={busy} variant="danger" onPress={() => void confirmStatus("failed")} />
          <Button label="Cancelled" disabled={busy} variant="secondary" onPress={() => void confirmStatus("unknown")} />
        </View>
      ) : (
        <View className="mt-6 gap-3">
          <Text className="type-body font-semibold text-ink">Pay with</Text>
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
