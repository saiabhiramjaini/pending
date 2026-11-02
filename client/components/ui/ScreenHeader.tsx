import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { icon } from "../../lib/design/tokens";
import { useChrome } from "../../lib/design/useChrome";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: Props) {
  const palette = useChrome();
  return (
    <View className="mb-6 flex-row items-center justify-between gap-3">
      <View className="flex-1 flex-row items-center gap-2">
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            className="min-h-tap min-w-tap items-center justify-center rounded-full bg-surface"
          >
            <ChevronLeft size={icon.size} strokeWidth={icon.stroke} color={palette.ink} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text numberOfLines={1} className="type-title text-ink">{title}</Text>
          {subtitle ? <Text className="type-caption text-ink-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
