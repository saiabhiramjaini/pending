import { SafeAreaView } from "react-native-safe-area-context";
import { View, type ViewProps } from "react-native";

export function Screen({ children, className = "", ...rest }: ViewProps & { className?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-paper" {...rest}>
      <View className={`flex-1 px-4 py-4 ${className}`}>{children}</View>
    </SafeAreaView>
  );
}
