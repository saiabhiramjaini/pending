import { Text, View } from "react-native";
import { BucketGlyph } from "./BucketIcon";
import { useChrome } from "../../lib/design/useChrome";

type Bar = { name: string; amount: string; share: number };

export function BucketBars({ bars }: { bars: Bar[] }) {
  const palette = useChrome();
  return (
    <View className="gap-3">
      {bars.map((bar) => (
        <View key={bar.name} className="gap-1">
          <View className="flex-row items-center gap-2">
            <BucketGlyph name={bar.name} color={palette["ink-muted"]} />
            <Text numberOfLines={1} className="type-label flex-1 text-ink">{bar.name}</Text>
            <Text className="type-label type-amount text-ink">{bar.amount}</Text>
          </View>
          <View className="h-1 overflow-hidden rounded-full bg-line">
            <View className="h-1 rounded-full bg-lime" style={{ width: `${Math.round(bar.share * 100)}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}
