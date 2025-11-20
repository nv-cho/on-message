"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { eq } from "@arkiv-network/sdk/query";

import { attrsToMap } from "@/utils";
import type { ChatMessage } from "@/lib/chat/types";
import { getBrowserPublicClient } from "@/config/arkiv.client";

export type UiMessage = {
  id: string;
  sender: "me" | "them";
  text: string;
  timestamp: string;
  from: string;
  sentAt: number;
};

type UseMessageOptions = {
  me?: string;
  peer?: string;
};

export default function useMessage(options?: UseMessageOptions) {
  const params = useParams<{ roomKey: string }>();
  const searchParams = useSearchParams();

  const roomKey = params?.roomKey;

  const me = options?.me ?? searchParams.get("me") ?? "0xUserA"; // fallback for testing
  const peer = options?.peer ?? searchParams.get("peer") ?? "0xUserB";

  const [messages, setMessages] = useState<UiMessage[]>([]);

  const toUi = useCallback(
    (m: ChatMessage): UiMessage => {
      const from = m.from ?? "";
      const myAddr = me ?? "";

      const isMe =
        from && myAddr && from.toLowerCase() === myAddr.toLowerCase();

      const sender: "me" | "them" = isMe ? "me" : "them";

      const ts = m.sentAt || Date.now();

      const timestamp = new Date(ts).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });

      return {
        id: m.id,
        sender,
        text: m.text,
        timestamp,
        from,
        sentAt: ts,
      };
    },
    [me]
  );

  // 1) initial load from Arkiv
  useEffect(() => {
    if (!roomKey) return;

    let cancelled = false;

    (async () => {
      try {
        const publicClient = getBrowserPublicClient();

        const result = await publicClient
          .buildQuery()
          .where([eq("type", "chat_message"), eq("roomKey", roomKey)])
          .withAttributes(true)
          .fetch();

        const entities = result.entities ?? [];

        const msgs: ChatMessage[] = entities.map(
          (e, index: number): ChatMessage => {
            const attrs = attrsToMap(e.attributes);
            const sentAt =
              attrs.sentAt !== undefined ? Number(attrs.sentAt) : Date.now();

            return {
              id:
                attrs.sentAt !== undefined
                  ? `${roomKey}-${attrs.sentAt}`
                  : `${roomKey}-${index}`,
              roomKey: attrs.roomKey ?? roomKey,
              from: attrs.from,
              to: attrs.to,
              text: attrs.text ?? "",
              sentAt,
            };
          }
        );

        msgs.sort((a, b) => a.sentAt - b.sentAt);

        if (!cancelled) {
          setMessages(msgs.map(toUi));
        }
      } catch (err) {
        console.error("[useMessage] initial load error", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomKey, toUi]);

  // 2) real-time updates using Arkiv watchEntities
  useEffect(() => {
    if (!roomKey) return;

    const publicClient = getBrowserPublicClient();

    // note: in the examples https://arkiv.network/docs#sdk the watchEntities is shwon as example, but in the current version of the SDK this method doesn't exist
    const unsubscribe = publicClient.subscribeEntityEvents(
      {
        async onEntityCreated(event) {
          try {
            const entity = await publicClient.getEntity(event.entityKey);
            const attrs = attrsToMap(entity.attributes);

            if (attrs.type !== "chat_message") return;
            if (attrs.roomKey !== roomKey) return;

            const sentAt =
              attrs.sentAt !== undefined ? Number(attrs.sentAt) : Date.now();

            const msg: ChatMessage = {
              id:
                attrs.sentAt !== undefined
                  ? `${roomKey}-${attrs.sentAt}`
                  : `${roomKey}-${sentAt}`,
              roomKey: attrs.roomKey ?? roomKey,
              from: attrs.from,
              to: attrs.to,
              text: attrs.text ?? "",
              sentAt,
            };

            setMessages((prev) => {
              const exists = prev.some((m) => m.id === msg.id);
              if (exists) return prev;
              return [...prev, toUi(msg)];
            });
          } catch (err) {
            console.error("[useMessage] onEntityCreated error", err);
          }
        },
        onError(err: any) {
          console.error("[useMessage] subscribeEntityEvents error", err);
        },
        onEntityUpdated: () => {
          // not needed for Milestone 0
        },
        onEntityDeleted: () => {
          // nt needed for Milestone 0
        },
      },
      2000 // polling interval in ms
    );

    return () => {};
  }, [roomKey, toUi]);

  // 3) send message via API -> server -> Arkiv
  const sendMessage = useCallback(
    async (text: string, toOverride?: string) => {
      if (!roomKey) {
        console.warn("[useMessage] roomKey is missing");
        return;
      }

      const to = toOverride ?? peer;
      const now = Date.now();

      const optimistic: UiMessage = {
        id: `${roomKey}-${now}-optimistic`,
        sender: "me",
        text,
        timestamp: new Date(now).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        from: me,
        sentAt: now,
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch(`/api/rooms/${roomKey}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: me,
            to,
            text,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("[useMessage] sendMessage failed", res.status, errText);
          // rollback optimistic if send failed
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          return;
        }
      } catch (err) {
        console.error("[useMessage] send error", err);
      }
    },
    [roomKey, me, peer]
  );

  return {
    messages,
    sendMessage,
    me,
    peer,
  };
}
