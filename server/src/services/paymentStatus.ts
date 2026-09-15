import type { PaymentStatus } from "@pending/api-contract";

const allowed: Record<PaymentStatus, PaymentStatus[]> = {
  created: ["upi_app_launched", "returned", "success", "failed", "unknown"],
  upi_app_launched: ["returned", "success", "failed", "unknown"],
  returned: ["success", "failed", "unknown"],
  success: [],
  failed: [],
  unknown: ["success", "failed"],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  return allowed[from].includes(to);
}
