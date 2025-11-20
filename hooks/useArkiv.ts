"use client";

import { type Address, createWalletClient, custom } from "viem";
import { useEffect, useState } from "react";
import { ARKIV_CHAIN_ID_HEX, ARKIV_RPC_HTTP_URL } from "@/config/arkiv";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const addArkivNetwork = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    console.warn("window.ethereum is not available");
    return;
  }

  const client = createWalletClient({
    transport: custom(window.ethereum),
  });

  try {
    await client.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARKIV_CHAIN_ID_HEX,
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
    console.log("Arkiv Mendoza Testnet added");
  } catch (error) {
    console.error("Failed to add Arkiv network:", error);
    throw error;
  }
};

/**
 * Ensure the wallet is on the Arkiv Mendoza chain.
 * - If already on it: returns true.
 * - If not: tries to switch.
 * - If chain not added (error 4902): adds it via addArkivNetwork, then switches.
 */
const ensureArkivNetwork = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !window.ethereum) {
    console.warn("window.ethereum is not available");
    return false;
  }

  const ethereum = window.ethereum;

  try {
    const currentChainId: string = await ethereum.request({
      method: "eth_chainId",
    });

    if (currentChainId === ARKIV_CHAIN_ID_HEX) {
      return true;
    }

    // Try to switch first
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARKIV_CHAIN_ID_HEX }],
      });
      console.log("Switched to Arkiv Mendoza Testnet");
      return true;
    } catch (switchError: any) {
      // 4902 = chain not added to wallet
      if (switchError?.code === 4902) {
        console.log("Arkiv network not found, adding it...");

        try {
          await addArkivNetwork();

          // Some wallets auto-switch after add, but spec doesn't require it.
          // Try switching again just in case.
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ARKIV_CHAIN_ID_HEX }],
          });

          console.log("Arkiv network added and switched");
          return true;
        } catch (addError) {
          console.error("Failed to add/switch to Arkiv network:", addError);
          return false;
        }
      }

      console.error("Failed to switch to Arkiv network:", switchError);
      return false;
    }
  } catch (err) {
    console.error("Failed to read current chainId:", err);
    return false;
  }
};

export default function useArkiv() {
  const [account, setAccount] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    // 1) ensure we're on Arkiv Mendoza
    const ok = await ensureArkivNetwork();
    if (!ok) {
      alert("Could not switch to Arkiv Mendoza Testnet");
      return;
    }

    // 2) request accounts
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setIsConnected(false);
        return;
      }

      const addr = accounts[0] as Address;

      console.log("account connected!", addr);
      setAccount(addr);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const ethereum = window.ethereum;

    // 1) restore already authorized accounts (does NOT auto-switch chain)
    (async () => {
      try {
        const accounts: string[] = await ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          const addr = accounts[0] as Address;
          setAccount(addr);
          setIsConnected(true);
          console.log("restored account from eth_accounts:", addr);
        }
      } catch (err) {
        console.error("Failed to load existing accounts:", err);
      }
    })();

    // 2) listen to account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        const addr = accounts[0] as Address;
        setAccount(addr);
        setIsConnected(true);
      }
    };

    ethereum.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  return {
    account,
    isConnected,
    connect,
    disconnect,
  };
}
