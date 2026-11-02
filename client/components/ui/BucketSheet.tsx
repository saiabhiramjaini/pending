import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { BucketPicker } from "./BucketPicker";

type Props = {
  title: string;
  options: string[];
  selected: string | null;
  error?: string;
  busy?: boolean;
  onSelect: (name: string) => void;
  onClose: () => void;
};

export function BucketSheet({ title, options, selected, error, busy = false, onSelect, onClose }: Props) {
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-paper/80">
        <Pressable accessibilityLabel="Close" className="flex-1" onPress={onClose} />
        <View className="max-h-sheet rounded-t-lg border border-line bg-surface p-4">
          <Text className="type-title mb-1 text-ink">Move to a bucket</Text>
          <Text numberOfLines={1} className="type-caption mb-4 text-ink-muted">{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <BucketPicker options={options} selected={selected} disabled={busy} onSelect={onSelect} />
            {error ? <Text className="type-caption mt-3 text-danger">{error}</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
