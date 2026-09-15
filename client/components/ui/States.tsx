import { Text, View } from "react-native";
import { Button } from "./Button";

export function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="text-center type-body text-ink-muted">{title}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="text-center type-body text-ink-muted">Something went wrong. Try again.</Text>
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </View>
  );
}

export function ScreenSkeleton() {
  return (
    <View className="gap-3">
      <View className="h-skeleton-lg rounded-md bg-line" />
      <View className="h-skeleton rounded-md bg-line" />
      <View className="h-skeleton rounded-md bg-line" />
    </View>
  );
}
