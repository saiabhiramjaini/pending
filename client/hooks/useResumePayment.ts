import { useEffect } from "react";
import { useRouter } from "expo-router";
import { usePaymentDraft } from "../stores/paymentDraft";

export function useResumePayment() {
  const router = useRouter();
  useEffect(() => {
    // A payment recorded before the app was killed still needs its outcome confirmed.
    if (usePaymentDraft.getState().draft?.localId) router.push("/payment");
  }, [router]);
}
