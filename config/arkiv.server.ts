import "server-only";

import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { createWalletClient, createPublicClient } from "@arkiv-network/sdk";
import {
  transport,
  ARKIV_CHAIN,
  ARKIV_PRIVATE_KEY,
  ArkivPublicClient,
  ArkivWalletClient,
} from "./arkiv";

let publicClientSingleton: ReturnType<typeof createPublicClient> | null = null;
let walletClientSingleton: ReturnType<typeof createWalletClient> | null = null;

// read-only
export function getPublicClient(): ArkivPublicClient {
  if (!publicClientSingleton) {
    publicClientSingleton = createPublicClient({
      chain: ARKIV_CHAIN,
      transport,
    });
  }

  return publicClientSingleton;
}

export function getWalletClient(): ArkivWalletClient {
  if (!ARKIV_PRIVATE_KEY) {
    throw new Error("ARKIV_PRIVATE_KEY is not configured");
  }

  if (!walletClientSingleton) {
    walletClientSingleton = createWalletClient({
      chain: ARKIV_CHAIN,
      transport,
      account: privateKeyToAccount(ARKIV_PRIVATE_KEY),
    });
  }

  return walletClientSingleton;
}
