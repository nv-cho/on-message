"use client";

import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import {
  transport,
  ARKIV_CHAIN,
  ARKIV_PRIVATE_KEY,
  ArkivWalletClient,
  ARKIV_RPC_HTTP_URL,
} from "./arkiv";

let publicClientSingleton: ReturnType<typeof createPublicClient> | null = null;
let walletClientSingleton: ReturnType<typeof createWalletClient> | null = null;

export function getBrowserPublicClient() {
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

export const addArkivNetwork = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    console.warn("window.ethereum is not available");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: "0xe0087f840", // 60138453056 in hex
          chainName: "Arkiv Mendoza Testnet",
          nativeCurrency: {
            name: "ETH",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [ARKIV_RPC_HTTP_URL],
          blockExplorerUrls: ["https://explorer.mendoza.hoodi.arkiv.network"],
        },
      ],
    });
  } catch (error) {
    console.error("Failed to add network:", error);
  }
};
