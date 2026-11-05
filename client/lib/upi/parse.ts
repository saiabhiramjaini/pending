export const MIN_AMOUNT_RUPEES = 1;
export const MAX_AMOUNT_RUPEES = 100_000;

export type ParsedUpiQr = {
  vpa: string;
  merchantName: string;
  amount?: string;
  currency: string;
  note?: string;
  tr?: string;
  qr?: string;
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

// Whole rupees, written either way a QR may carry them: 100, 100.0 or 100.00.
function wholeRupees(amount: string): string | null {
  return /^[0-9]+(\.0{1,2})?$/.test(amount) ? amount.split(".")[0] : null;
}

export function parseUpiQr(raw: string): ParsedUpiQr {
  const params = readParams(raw);
  const vpa = params.get("pa")?.trim() ?? "";
  if (!vpa) {
    throw new UpiParseError("UPI ID missing");
  }
  const rawAmount = params.get("am")?.trim();
  let amount: string | undefined;
  if (rawAmount) {
    const whole = wholeRupees(rawAmount);
    if (!whole) {
      throw new UpiParseError("Amount must be whole rupees");
    }
    amount = whole;
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
    qr: raw.trim().toLowerCase().startsWith("upi://pay") ? raw.trim() : undefined,
  };
}

export function buildUpiPayUri(input: {
  vpa: string;
  merchantName: string;
  amount: string;
  note?: string;
  qr?: string;
}): string {
  const amount = `${input.amount}.00`;
  if (input.qr) {
    // UPI apps use fields we don't read, such as tr, mc and sign, so a scanned link goes out as scanned.
    const query = input.qr.indexOf("?") >= 0 ? input.qr.slice(input.qr.indexOf("?") + 1) : "";
    const original = new URLSearchParams(query).get("am")?.trim();
    if (original && wholeRupees(original) === input.amount) return input.qr;
    // A changed amount would invalidate a merchant's signature, so it can't be kept.
    const kept = query.split("&").filter((part) => part && !/^(am|sign)=/i.test(part));
    if (!kept.some((part) => /^cu=/i.test(part))) kept.push("cu=INR");
    return `upi://pay?${[...kept, `am=${amount}`].join("&")}`;
  }
  const parts = [
    `pa=${encodeURIComponent(input.vpa).replace(/%40/g, "@")}`,
    `pn=${encodeURIComponent(input.merchantName)}`,
    `am=${amount}`,
    "cu=INR",
  ];
  if (input.note) {
    parts.push(`tn=${encodeURIComponent(input.note)}`);
  }
  return `upi://pay?${parts.join("&")}`;
}
