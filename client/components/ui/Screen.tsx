import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, type ViewProps } from "react-native";

// The tab bar already sits above the phone's bottom inset.
const TAB_EDGES = ["top", "left", "right"] as const;

type Props = ViewProps & {
  className?: string;
  edgeToEdge?: boolean;
  scroll?: boolean;
  tabbed?: boolean;
};

export function Screen({ children, className = "", edgeToEdge = false, scroll = false, tabbed = false, ...rest }: Props) {
  const padding = edgeToEdge ? "" : "px-4 py-4";
  return (
    <SafeAreaView className="flex-1 bg-paper" edges={tabbed ? TAB_EDGES : undefined} {...rest}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`flex-grow ${padding} ${className}`}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${padding} ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
