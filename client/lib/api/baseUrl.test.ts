import { describe, expect, test } from "bun:test";
import { apiBaseUrl } from "./baseUrl";

describe("apiBaseUrl", () => {
  test("uses EXPO_PUBLIC_API_URL when it is not loopback", () => {
    const previous = process.env.EXPO_PUBLIC_API_URL;
    process.env.EXPO_PUBLIC_API_URL = "http://192.168.1.10:3000";
    expect(apiBaseUrl()).toBe("http://192.168.1.10:3000");
    process.env.EXPO_PUBLIC_API_URL = previous;
  });
});
