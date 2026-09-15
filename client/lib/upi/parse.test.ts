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

  test("rejects am=0", () => {
    expect(() => parseUpiQr("upi://pay?pa=a@b&am=0")).toThrow(UpiParseError);
  });
});

describe("buildUpiPayUri", () => {
  test("encodes name", () => {
    const uri = buildUpiPayUri({ vpa: "a@ok", merchantName: "Cafe Noir", amount: "100" });
    expect(uri.startsWith("upi://pay?")).toBe(true);
    expect(uri).toContain("pa=a%40ok");
    expect(parseUpiQr(uri).merchantName).toBe("Cafe Noir");
    expect(parseUpiQr(uri).amount).toBe("100");
  });
});
