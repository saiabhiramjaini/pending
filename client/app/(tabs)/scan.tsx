import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useScanUpi } from "../../hooks/useScanUpi";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { error, onBarcodeScanned, scanning } = useScanUpi();

  if (!permission) return <Screen />;
  if (!permission.granted) {
    return (
      <Screen className="items-center justify-center gap-4">
        <Text className="text-center type-body text-ink-muted">
          Camera access is needed to scan UPI QR codes. Enable it in Settings if this was denied.
        </Text>
        <Button label="Allow camera" onPress={() => void requestPermission()} />
      </Screen>
    );
  }

  return (
    <Screen className="px-0 py-0">
      <CameraView
        className="flex-1"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanning ? onBarcodeScanned : undefined}
      />
      {error ? (
        <View className="absolute bottom-8 left-4 right-4 rounded-md bg-surface p-4">
          <Text className="type-body text-danger">{error}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
