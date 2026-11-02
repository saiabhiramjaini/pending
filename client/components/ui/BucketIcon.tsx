import { View } from "react-native";
import {
  Car,
  Clapperboard,
  HeartPulse,
  ReceiptText,
  ShoppingBag,
  ShoppingBasket,
  Tag,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react-native";
import { icon } from "../../lib/design/tokens";
import { useChrome } from "../../lib/design/useChrome";

const icons: Record<string, LucideIcon> = {
  Food: Utensils,
  Groceries: ShoppingBasket,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: ReceiptText,
  Fun: Clapperboard,
  Health: HeartPulse,
  People: Users,
};

export function BucketGlyph({ name, color }: { name: string; color: string }) {
  const Glyph = icons[name] ?? Tag;
  return <Glyph size={icon.small} strokeWidth={icon.stroke} color={color} />;
}

export function BucketIcon({ name }: { name: string }) {
  const palette = useChrome();
  return (
    <View className="h-tap w-tap items-center justify-center rounded-full bg-line">
      <BucketGlyph name={name} color={palette.ink} />
    </View>
  );
}
