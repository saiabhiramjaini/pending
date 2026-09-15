import { create } from "zustand";

export type PaymentDraft = {
  vpa: string;
  merchantName: string;
  amount: string;
  note?: string;
  upiApp?: string;
  upiAppName?: string;
  localId?: string;
  remoteId?: string;
};

type DraftState = {
  draft: PaymentDraft | null;
  setDraft: (draft: PaymentDraft) => void;
  clearDraft: () => void;
};

export const usePaymentDraft = create<DraftState>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
