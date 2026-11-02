import { useState } from "react";
import { View } from "react-native";
import { Plus } from "lucide-react-native";
import { MAX_BUCKET_LENGTH } from "@pending/api-contract";
import { icon } from "../../lib/design/tokens";
import { useChrome } from "../../lib/design/useChrome";
import { BucketGlyph } from "./BucketIcon";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Input } from "./Input";

type Props = {
  options: string[];
  selected?: string | null;
  disabled?: boolean;
  onSelect: (name: string) => void;
};

export function BucketPicker({ options, selected, disabled = false, onSelect }: Props) {
  const palette = useChrome();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const add = () => {
    if (!name.trim()) return;
    onSelect(name);
    setName("");
    setAdding(false);
  };

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <Chip
              key={option}
              label={option}
              selected={isSelected}
              disabled={disabled}
              leading={<BucketGlyph name={option} color={isSelected ? palette["on-lime"] : palette.ink} />}
              onPress={() => onSelect(option)}
            />
          );
        })}
        <Chip
          label="New bucket"
          disabled={disabled}
          leading={<Plus size={icon.small} strokeWidth={icon.stroke} color={palette.ink} />}
          onPress={() => setAdding(!adding)}
        />
      </View>
      {adding ? (
        <View className="gap-3">
          <Input label="Bucket name" value={name} maxLength={MAX_BUCKET_LENGTH} onChangeText={setName} />
          <Button label="Add bucket" variant="secondary" disabled={!name.trim()} onPress={add} />
        </View>
      ) : null}
    </View>
  );
}
