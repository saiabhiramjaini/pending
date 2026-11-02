import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  onPress: () => void;
};

export function Chip({ label, selected = false, disabled = false, leading, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-tap flex-row items-center gap-2 rounded-full border px-4 ${selected ? "border-lime bg-lime" : "border-line bg-surface"} ${disabled ? "opacity-disabled" : ""}`}
    >
      {leading}
      <Text className={`type-label ${selected ? "text-on-lime" : "text-ink"}`}>{label}</Text>
    </Pressable>
  );
}
