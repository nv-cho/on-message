"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import useArkiv from "@/hooks/useArkiv";
import type { ChatInvite } from "@/lib/chat/types";

type InviteWithId = ChatInvite & {};

const ChatLobby = () => {
  const router = useRouter();
  const { account, isConnected, connect } = useArkiv();

  const [invites, setInvites] = useState<InviteWithId[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [peerAddress, setPeerAddress] = useState("");
  const [creating, setCreating] = useState(false);

  // fetch invites when wallet connected
  useEffect(() => {
    if (!account) return;

    const fetchInvites = async () => {
      setLoadingInvites(true);
      try {
        const res = await fetch(`/api/invites?address=${account}`);
        if (!res.ok) {
          console.error(
            "[ChatLobby] failed to fetch invites",
            await res.text()
          );
          return;
        }
        const json = await res.json();
        setInvites(json.invites ?? []);
      } catch (err) {
        console.error("[ChatLobby] error fetching invites", err);
      } finally {
        setLoadingInvites(false);
      }
    };

    fetchInvites();
  }, [account]);

  const handleOpenChat = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!account) return;
    if (!peerAddress.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/rooms/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: account,
          to: peerAddress.trim(),
        }),
      });

      if (!res.ok) {
        console.error("[ChatLobby] failed to open room", await res.text());
        return;
      }

      const json = await res.json();
      const roomKey = json.roomKey as string;

      // redirect to chatroom with me/peer in query
      router.push(
        `/chat/${roomKey}?me=${encodeURIComponent(
          account
        )}&peer=${encodeURIComponent(peerAddress.trim())}`
      );
    } catch (err) {
      console.error("[ChatLobby] open room error", err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenInvite = (invite: ChatInvite) => {
    if (!account) return;

    // from = inviter, to = account
    const peer = invite.from;
    const roomKey = invite.roomKey;

    router.push(
      `/chat/${roomKey}?me=${encodeURIComponent(
        account
      )}&peer=${encodeURIComponent(peer)}`
    );
  };

  if (!isConnected || !account) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#050709] text-gray-200 font-mono relative overflow-hidden">
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

        {/* Header */}
        <header className="h-14 border-b border-white/10 flex items-center px-4 z-10 bg-[#050709]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <h1 className="text-sm tracking-tight text-gray-400 lowercase">
              chat://<span className="text-gray-100">lobby-disconnected</span>
            </h1>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 flex items-center justify-center z-10">
          <button
            onClick={connect}
            className="px-4 py-2 border border-[#00eaff] text-[#00eaff] text-sm uppercase tracking-wider hover:bg-[#00eaff]/10 transition-colors"
          >
            connect_wallet{">"}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#050709] text-gray-200 font-mono relative overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 z-10 bg-[#050709]/90 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full" />
          <h1 className="text-sm tracking-tight text-gray-400 lowercase">
            chat://<span className="text-gray-100">lobby</span>
          </h1>
        </div>
        <div className="text-[11px] text-gray-500">
          you:{" "}
          <span className="text-gray-300">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 z-10 p-4 flex flex-col md:flex-row gap-4">
        {/* Pending Invites */}
        <section className="flex-1 border border-white/10 bg-[#080a10]/80 backdrop-blur-sm p-4 flex flex-col min-h-[200px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-gray-400">
              pending_invites
            </h2>
            {loadingInvites && (
              <span className="text-[10px] text-gray-500">loading...</span>
            )}
          </div>

          {invites.length === 0 && !loadingInvites ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-gray-600">
              no_pending_invites
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-minimal">
              {invites.map((invite, idx) => (
                <button
                  key={`${invite.roomKey}-${idx}`}
                  onClick={() => handleOpenInvite(invite)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 border border-white/10 bg-[#0a0c14]/80 hover:bg-[#0f1018] transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500">
                      from:
                      <span className="text-gray-300 ml-1">
                        {invite.from.slice(0, 6)}...{invite.from.slice(-4)}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-600">
                      room:{" "}
                      <span className="text-gray-400">{invite.roomKey}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#00eaff] group-hover:text-[#36f5ff] uppercase tracking-wider">
                    open_chat{">"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* New Chat Form */}
        <section className="flex-1 border border-white/10 bg-[#080a10]/80 backdrop-blur-sm p-4 flex flex-col min-h-[200px]">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-3">
            new_chat
          </h2>

          <form onSubmit={handleOpenChat} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="peer"
                className="text-[11px] text-gray-500 lowercase"
              >
                peer_address
              </label>
              <input
                id="peer"
                type="text"
                value={peerAddress}
                onChange={(e) => setPeerAddress(e.target.value)}
                placeholder="enter_address_to_chat_with..."
                className="w-full bg-transparent border border-white/10 px-2 py-1 text-xs text-gray-100 placeholder-gray-700 focus:outline-none focus:border-[#00eaff] caret-[#00eaff]"
              />
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!peerAddress.trim() || creating}
                className="text-xs text-[#00eaff] hover:text-[#36f5ff] disabled:text-gray-700 disabled:cursor-not-allowed uppercase tracking-wider border border-[#00eaff]/50 px-3 py-1 hover:border-[#36f5ff]/80 transition-colors"
              >
                {creating ? "opening..." : "open_chatroom>"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ChatLobby;
