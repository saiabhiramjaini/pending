import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primary", disabled }: Props) {
  const styles =
    variant === "primary"
      ? "bg-lime"
      : variant === "danger"
        ? "bg-danger"
        : "bg-surface border border-line";
  const text = variant === "primary" ? "text-ink" : variant === "danger" ? "text-paper" : "text-ink";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-tap items-center justify-center rounded-md px-4 ${styles} ${disabled ? "opacity-disabled" : ""}`}
    >
      <Text className={`type-body font-semibold ${text}`}>{label}</Text>
    </Pressable>
  );
}
