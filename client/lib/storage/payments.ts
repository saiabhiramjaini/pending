export type PaymentStatus =
  | "created"
  | "upi_app_launched"
  | "returned"
  | "success"
  | "failed"
  | "unknown";

export type LocalPayment = {
  id: string;
  vpa: string;
  merchantName: string;
  amount: string;
  currency: "INR";
  upiApp: string | null;
  note: string | null;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

const KEY = "pending.payments.v1";

function loadRaw(): LocalPayment[] {
  try {
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const storage = new MMKV({ id: "pending" });
    const raw = storage.getString(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalPayment[];
  } catch {
    return [];
  }
}

function saveRaw(rows: LocalPayment[]) {
  const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
  const storage = new MMKV({ id: "pending" });
  storage.set(KEY, JSON.stringify(rows));
}

export function listLocalPayments(): LocalPayment[] {
  return loadRaw().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function upsertLocalPayment(row: LocalPayment) {
  const next = loadRaw().filter((item) => item.id !== row.id);
  next.push(row);
  saveRaw(next);
}

export function discardLocalPayments() {
  try {
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const storage = new MMKV({ id: "pending" });
    storage.delete(KEY);
  } catch {
    /* native store unavailable in tests */
  }
}

export function monthTotalIst(now = new Date()): string {
  const thisMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  })
    .format(now)
    .slice(0, 7);
  let sum = 0;
  for (const row of listLocalPayments()) {
    if (row.status !== "success") continue;
    const rowMonth = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    })
      .format(new Date(row.createdAt))
      .slice(0, 7);
    if (rowMonth === thisMonth) {
      sum += Number(row.amount);
    }
  }
  return String(sum);
}
