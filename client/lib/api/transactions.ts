import type { ApiClient } from "./client";
import type { Transaction } from "@pending/api-contract";

export async function listAllTransactions(
  client: Pick<ApiClient, "listTransactions">,
  signal?: AbortSignal,
) {
  const items: Transaction[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    signal?.throwIfAborted();
    const page = await client.listTransactions(cursor, signal);
    items.push(...page.items);
    if (page.nextCursor === null) break;
    if (cursors.has(page.nextCursor)) throw new Error("History pagination did not advance");
    cursors.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (cursor);
  return { items };
}
