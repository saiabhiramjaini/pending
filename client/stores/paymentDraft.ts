import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LocalPayment, PaymentStatus } from "../lib/storage/payments";
import { draftStorage } from "../lib/storage/draft";

export type PaymentDraft = {
  sessionId: string;
  vpa: string;
  merchantName: string;
  amount: string;
  note?: string;
  upiApp?: string;
  upiAppName?: string;
  localId?: string;
  remoteId?: string;
  record?: LocalPayment;
  pendingStatus?: PaymentStatus;
  handoffStarted?: boolean;
};

type DraftState = {
  draft: PaymentDraft | null;
  startDraft: (draft: Omit<PaymentDraft, "sessionId">) => void;
  setDraft: (draft: PaymentDraft) => void;
  updateSession: (draft: PaymentDraft) => boolean;
  clearSession: (sessionId: string) => boolean;
  clearDraft: () => void;
};

function newSessionId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export const usePaymentDraft = create<DraftState>()(
  persist(
    (set, get) => ({
      draft: null,
      startDraft: (draft) => set({ draft: { ...draft, sessionId: newSessionId() } }),
      setDraft: (draft) => set({ draft }),
      // A newer scan owns the draft; an older in-flight payment must never write over it.
      updateSession: (draft) => {
        if (get().draft?.sessionId !== draft.sessionId) return false;
        set({ draft });
        return true;
      },
      clearSession: (sessionId) => {
        if (get().draft?.sessionId !== sessionId) return false;
        set({ draft: null });
        return true;
      },
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: "pending.paymentDraft.v1",
      storage: createJSONStorage(() => draftStorage),
      partialize: (state) => ({ draft: state.draft }),
    },
  ),
);
