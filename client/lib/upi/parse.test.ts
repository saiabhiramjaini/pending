import { describe, expect, test } from "bun:test";
import { buildUpiPayUri, parseUpiQr, UpiParseError } from "./parse";

describe("parseUpiQr", () => {
  test("reads pa pn am cu tn", () => {
    const parsed = parseUpiQr(
      "upi://pay?pa=shop@okaxis&pn=Cafe%20Noir&am=850&cu=INR&tn=lunch",
    );
    expect(parsed.vpa).toBe("shop@okaxis");
    expect(parsed.merchantName).toBe("Cafe Noir");
    expect(parsed.amount).toBe("850");
    expect(parsed.currency).toBe("INR");
    expect(parsed.note).toBe("lunch");
  });

  test("allows missing amount", () => {
    const parsed = parseUpiQr("upi://pay?pa=friend@upi&pn=Rahul");
    expect(parsed.amount).toBeUndefined();
  });

  test("rejects missing pa", () => {
    expect(() => parseUpiQr("upi://pay?pn=Nope")).toThrow(UpiParseError);
  });

  test.each([["100.00", "100"], ["100.0", "100"], ["100", "100"]])("reads am=%s as whole rupees", (am, whole) => {
    expect(parseUpiQr(`upi://pay?pa=a@b&am=${am}`).amount).toBe(whole);
  });

  test("rejects paise, because amounts are whole rupees", () => {
    expect(() => parseUpiQr("upi://pay?pa=a@b&am=10.50")).toThrow("whole rupees");
  });

  test("rejects am=0", () => {
    expect(() => parseUpiQr("upi://pay?pa=a@b&am=0")).toThrow(UpiParseError);
  });
});

describe("buildUpiPayUri", () => {
  test("encodes name", () => {
    const uri = buildUpiPayUri({ vpa: "a@ok", merchantName: "Cafe Noir", amount: "100" });
    expect(uri.startsWith("upi://pay?")).toBe(true);
    expect(uri).toContain("pa=a@ok");
    expect(uri).toContain("pn=Cafe%20Noir");
    expect(uri).toContain("am=100.00");
    expect(parseUpiQr(uri).merchantName).toBe("Cafe Noir");
    expect(parseUpiQr(uri).amount).toBe("100");
  });

  const merchant = "upi://pay?pa=shop@okaxis&pn=Cafe+Noir&mc=5812&tr=T123&mode=02&sign=abc%3D&am=100.00&cu=INR";

  test("sends a scanned QR unchanged when the amount matches", () => {
    expect(buildUpiPayUri({ vpa: "shop@okaxis", merchantName: "Cafe Noir", amount: "100", qr: merchant })).toBe(merchant);
  });

  test("keeps the QR's other fields when adding an amount it did not have", () => {
    const qr = "upi://pay?pa=friend@upi&pn=Rahul&mode=02&purpose=00";
    expect(buildUpiPayUri({ vpa: "friend@upi", merchantName: "Rahul", amount: "1", qr }))
      .toBe("upi://pay?pa=friend@upi&pn=Rahul&mode=02&purpose=00&cu=INR&am=1.00");
  });

  test("drops the signature when the user changes a signed amount", () => {
    const uri = buildUpiPayUri({ vpa: "shop@okaxis", merchantName: "Cafe Noir", amount: "50", qr: merchant });
    expect(uri).toContain("am=50.00");
    expect(uri).toContain("tr=T123");
    expect(uri).not.toContain("sign=");
    expect(uri).not.toContain("am=100.00");
  });
});
