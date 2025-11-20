"use client";

import { type Address } from "viem";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function useArkiv() {
  const [account, setAccount] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

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

    // 1) restore already authorized accounts
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
