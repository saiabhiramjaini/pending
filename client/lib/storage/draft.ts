import type { StateStorage } from "zustand/middleware";

function storage() {
  try {
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    return new MMKV({ id: "pending" });
  } catch {
    /* native store unavailable in tests */
    return null;
  }
}

// Android may kill the app while a UPI app is in front; the draft must survive that.
export const draftStorage: StateStorage = {
  getItem: (key) => storage()?.getString(key) ?? null,
  setItem: (key, value) => storage()?.set(key, value),
  removeItem: (key) => storage()?.delete(key),
};
