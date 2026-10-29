import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { parseUpiQr, UpiParseError } from "../lib/upi/parse";
import { usePaymentDraft } from "../stores/paymentDraft";
import { track } from "../lib/analytics";

export function useScanUpi() {
  const router = useRouter();
  const startDraft = usePaymentDraft((s) => s.startDraft);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    track("scan_opened");
  }, []);

  useFocusEffect(
    useCallback(() => {
      locked.current = false;
      setScanning(true);
      setError(null);
      return () => {
        locked.current = true;
        setScanning(false);
      };
    }, []),
  );

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (locked.current) return;
    try {
      const parsed = parseUpiQr(data);
      locked.current = true;
      setScanning(false);
      track("qr_parsed");
      startDraft({
        vpa: parsed.vpa,
        merchantName: parsed.merchantName,
        amount: parsed.amount ?? "",
        note: parsed.note,
      });
      router.push("/payment");
    } catch (err) {
      setError(err instanceof UpiParseError ? err.message : "Not a UPI payment QR");
    }
  };

  return { error, onBarcodeScanned, scanning };
}
