"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, FormEvent } from "react";

import useArkiv from "@/hooks/useArkiv";
import useMessage from "@/hooks/useMessage";

const ChatRoom = () => {
  const router = useRouter();

  const { account, isConnected, connect } = useArkiv();
  const { messages, sendMessage } = useMessage(
    account
      ? { me: account } // peer still comes from URL or default
      : undefined
  );

  const [inputValue, setInputValue] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const goBackToLobby = () => {
    router.push("/");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // if not connected, show a connect state instead of the chat
  if (!isConnected || !account) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#050709] text-gray-200 font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0" />

        <header className="h-14 border-b border-white/10 flex items-center px-4 z-10 bg-[#050709]/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <h1 className="text-sm tracking-tight text-gray-400 lowercase">
              chatroom://<span className="text-gray-100">disconnected</span>
            </h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center z-10">
          <button
            onClick={connect}
            className="px-4 py-2 border border-[#00eaff] text-[#00eaff] text-sm uppercase tracking-wider hover:bg-[#00eaff]/10 transition-colors"
          >
            connect_wallet
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
          <span className="w-2 h-2 bg-green-500 animate-pulse rounded-full"></span>
          <h1 className="text-sm tracking-tight text-gray-400 lowercase">
            chatroom://<span className="text-gray-100">user-a</span>-and-
            <span className="text-gray-100">user-b</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={goBackToLobby}
          className="cursor-pointer text-[11px] uppercase tracking-wider text-gray-500 hover:text-[#00eaff] transition-colors"
        >
          lobby{"  "}&lt;
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-minimal z-10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[70%] ${
              msg.sender === "me" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`
                relative px-4 py-3 border text-sm md:text-base
                ${
                  msg.sender === "me"
                    ? "bg-[#0a0c14] border-[#00eaff] text-cyan-50"
                    : "bg-[#0a0c14] border-[#ff00d4] text-fuchsia-50"
                }
                hover:brightness-110 transition-all duration-200
              `}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-gray-600 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="border-t border-white/10 bg-[#080a10] p-4 z-10 shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-4 max-w-full"
        >
          <div className="flex-1 relative group">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none select-none">
              {">"}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="enter_message..."
              className="w-full bg-transparent border-none outline-none pl-4 text-gray-100 placeholder-gray-700 focus:ring-0 caret-[#00eaff]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="cursor-pointer text-sm text-[#00eaff] hover:text-[#36f5ff] disabled:text-gray-700 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
          >
            send{">"}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatRoom;
