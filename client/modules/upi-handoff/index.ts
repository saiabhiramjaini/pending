import { requireNativeModule } from "expo-modules-core";

export type UpiApp = { packageName: string; name: string };

type Native = {
  listApps: () => Promise<UpiApp[]>;
  pay: (uri: string, packageName?: string | null) => Promise<string>;
};

const native = requireNativeModule<Native>("UpiHandoff");

export async function listUpiApps(): Promise<UpiApp[]> {
  try {
    return await native.listApps();
  } catch {
    return [];
  }
}

export async function launchUpiPay(uri: string, packageName?: string | null): Promise<string> {
  return native.pay(uri, packageName ?? null);
}
