import { StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useScanUpi } from "../../hooks/useScanUpi";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { error, focused, onBarcodeScanned, scanning } = useScanUpi();

  if (!permission) return <Screen tabbed />;
  if (!permission.granted) {
    return (
      <Screen tabbed className="items-center justify-center gap-4">
        <Text className="type-title text-center text-ink">Scan to pay</Text>
        <Text className="text-center type-body text-ink-muted">
          Camera access is needed to scan UPI QR codes. Enable it in Settings if this was denied.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
      </Screen>
    );
  }

  return (
    <Screen tabbed edgeToEdge>
      {/* Tabs stay mounted, so the camera must not outlive this tab being focused. */}
      {focused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
        />
      ) : null}
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View className="h-frame w-frame rounded-lg border-2 border-lime" />
      </View>
      <View className="absolute bottom-8 left-4 right-4 rounded-md bg-surface p-4">
        {error ? (
          <Text className="type-body text-center text-danger">{error}</Text>
        ) : (
          <Text className="type-body text-center text-ink">Point your camera at a UPI QR code</Text>
        )}
      </View>
    </Screen>
  );
}
