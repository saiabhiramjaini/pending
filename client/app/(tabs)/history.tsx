import { useMemo, useState } from "react";
import { ScrollView, SectionList, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { BucketSheet } from "../../components/ui/BucketSheet";
import { Chip } from "../../components/ui/Chip";
import { PaymentRow } from "../../components/ui/PaymentRow";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { EmptyState, ErrorState, ScreenSkeleton } from "../../components/ui/States";
import { usePayments } from "../../hooks/usePayments";
import { bucketLabel, normalizeBucket } from "../../lib/payments/buckets";
import { formatRupees, groupByDay } from "../../lib/payments/format";
import type { LocalPayment } from "../../lib/storage/payments";

const ALL = "All";

export default function HistoryScreen() {
  const { items, bucketChoices, setBucket, loading, error, refresh, refreshing } = usePayments();
  const [filter, setFilter] = useState(ALL);
  const [editing, setEditing] = useState<LocalPayment | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>();

  const used = useMemo(() => [...new Set(items.map((row) => bucketLabel(row.category)))], [items]);
  const active = used.includes(filter) ? filter : ALL;
  const sections = useMemo(
    () => groupByDay(active === ALL ? items : items.filter((row) => bucketLabel(row.category) === active)),
    [items, active],
  );

  const move = async (name: string) => {
    if (!editing) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await setBucket(editing, normalizeBucket(name));
      setEditing(null);
    } catch {
      setSaveError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const header = <ScreenHeader title="History" />;
  if (loading) {
    return (
      <Screen tabbed>
        {header}
        <ScreenSkeleton />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen tabbed>
        {header}
        <ErrorState onRetry={() => void refresh()} />
      </Screen>
    );
  }
  if (items.length === 0) {
    return (
      <Screen tabbed>
        {header}
        <EmptyState title="Nothing recorded." />
      </Screen>
    );
  }
  return (
    <Screen tabbed>
      {header}
      <View className="mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {[ALL, ...used].map((name) => (
            <Chip key={name} label={name} selected={name === active} onPress={() => setFilter(name)} />
          ))}
        </ScrollView>
      </View>
      <SectionList
        className="flex-1"
        sections={sections}
        keyExtractor={(row) => row.id}
        onRefresh={() => void refresh()}
        refreshing={refreshing}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderSectionHeader={({ section }) => (
          <Text className="type-label mt-4 mb-2 text-ink-muted">{section.title}</Text>
        )}
        renderItem={({ item: row }) => (
          <PaymentRow
            merchantName={row.merchantName}
            bucket={bucketLabel(row.category)}
            detail={row.vpa}
            amount={formatRupees(row.amount)}
            status={row.status}
            onPress={() => {
              setSaveError(undefined);
              setEditing(row);
            }}
          />
        )}
      />
      {editing ? (
        <BucketSheet
          title={`${editing.merchantName} · ${formatRupees(editing.amount)}`}
          options={bucketChoices}
          selected={editing.category}
          error={saveError}
          busy={saving}
          onSelect={(name) => void move(name)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Screen>
  );
}
