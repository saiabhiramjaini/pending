import { Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
  error?: string;
  editable?: boolean;
};

export function Input({ label, value, onChangeText, keyboardType = "default", secureTextEntry, error, editable = true }: Props) {
  return (
    <View className="gap-2">
      <Text className="type-label text-ink-muted">{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        className={`min-h-tap rounded-md border border-line bg-surface px-3 type-body text-ink ${editable ? "" : "opacity-disabled"}`}
      />
      {error ? <Text className="type-caption text-danger">{error}</Text> : null}
    </View>
  );
}
