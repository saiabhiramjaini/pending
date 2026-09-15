export const MIN_AMOUNT_RUPEES = 1;
export const MAX_AMOUNT_RUPEES = 100_000;

export type ParsedUpiQr = {
  vpa: string;
  merchantName: string;
  amount?: string;
  currency: string;
  note?: string;
  tr?: string;
};

export class UpiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpiParseError";
  }
}

function readParams(raw: string): URLSearchParams {
  const trimmed = raw.trim();
  const withoutScheme = trimmed.replace(/^upi:\/\/pay\??/i, "");
  if (trimmed.toLowerCase().startsWith("upi://pay")) {
    const qIndex = trimmed.indexOf("?");
    return new URLSearchParams(qIndex >= 0 ? trimmed.slice(qIndex + 1) : "");
  }
  if (withoutScheme.includes("=") && !trimmed.includes("://")) {
    return new URLSearchParams(withoutScheme);
  }
  throw new UpiParseError("Not a UPI payment QR");
}

export function parseUpiQr(raw: string): ParsedUpiQr {
  const params = readParams(raw);
  const vpa = params.get("pa")?.trim() ?? "";
  if (!vpa) {
    throw new UpiParseError("UPI ID missing");
  }
  const amount = params.get("am")?.trim();
  if (amount) {
    if (!/^[0-9]+$/.test(amount)) {
      throw new UpiParseError("Amount must be whole rupees");
    }
    const n = Number(amount);
    if (n < MIN_AMOUNT_RUPEES || n > MAX_AMOUNT_RUPEES) {
      throw new UpiParseError("Amount out of range");
    }
  }
  return {
    vpa,
    merchantName: params.get("pn")?.trim() || vpa,
    amount: amount || undefined,
    currency: (params.get("cu")?.trim() || "INR").toUpperCase(),
    note: params.get("tn")?.trim() || undefined,
    tr: params.get("tr")?.trim() || undefined,
  };
}

export function buildUpiPayUri(input: {
  vpa: string;
  merchantName: string;
  amount: string;
  note?: string;
}): string {
  const params = new URLSearchParams();
  params.set("pa", input.vpa);
  params.set("pn", input.merchantName);
  params.set("am", input.amount);
  params.set("cu", "INR");
  if (input.note) {
    params.set("tn", input.note);
  }
  return `upi://pay?${params.toString()}`;
}
