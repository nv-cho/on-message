import "server-only";

import { eq } from "@arkiv-network/sdk/query";
import { randomUUID } from "crypto";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { getPublicClient, getWalletClient } from "@/config/arkiv.server";

import { ChatRoom, ChatInvite, ChatMessage, CHAT_ENTITY_TYPE } from "./types";
import { attrsToMap } from "@/utils";

/**
 * open a new chat room between `from` and `to`.
 * creates:
 *  - one `chat_room` entity
 *  - one `chat_invite` entity
 */
export async function openChatRoom(params: {
  from: string;
  to: string;
}): Promise<{ roomKey: string }> {
  const { from, to } = params;
  const walletClient = getWalletClient();
  const roomKey = randomUUID();
  const now = Date.now();

  // 1) room entity
  await walletClient.createEntity({
    payload: jsonToPayload({ createdAt: now }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: CHAT_ENTITY_TYPE.room },
      { key: "roomKey", value: roomKey },
      { key: "participantA", value: from },
      { key: "participantB", value: to },
      { key: "status", value: "open" },
    ],

    expiresIn: ExpirationTime.fromDays(7),
  });

  // 2) invite entity (B can "discover" the room)
  await walletClient.createEntity({
    payload: jsonToPayload({ note: "", createdAt: now }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: CHAT_ENTITY_TYPE.invite },
      { key: "from", value: from },
      { key: "to", value: to },
      { key: "roomKey", value: roomKey },
      { key: "status", value: "pending" },
      { key: "createdAt", value: String(now) },
    ],

    expiresIn: ExpirationTime.fromDays(3),
  });

  return { roomKey };
}

export async function getRoomByKey(roomKey: string): Promise<ChatRoom | null> {
  const publicClient = getPublicClient();

  const result = await publicClient
    .buildQuery()
    .where([eq("type", CHAT_ENTITY_TYPE.room), eq("roomKey", roomKey)])
    .withAttributes(true)
    .fetch();

  const entity = result.entities[0];
  if (!entity) return null;

  const attrs = attrsToMap(entity.attributes);

  return {
    roomKey: attrs.roomKey,
    participantA: attrs.participantA,
    participantB: attrs.participantB,
    status: (attrs.status as ChatRoom["status"]) ?? "open",
  };
}

export async function listInvitesFor(address: string): Promise<ChatInvite[]> {
  const publicClient = getPublicClient();

  const result = await publicClient
    .buildQuery()
    .where([eq("type", CHAT_ENTITY_TYPE.invite), eq("to", address)])
    .withAttributes(true)
    .fetch();

  const entities = result.entities;

  return entities.map((e) => {
    const attrs = attrsToMap(e.attributes);
    return {
      entityKey: e.key,
      roomKey: attrs.roomKey,
      from: attrs.from,
      to: attrs.to,
      status: (attrs.status as ChatInvite["status"]) ?? "pending",
      note: attrs.note,
      createdAt: attrs.createdAt ? Number(attrs.createdAt) : undefined,
    };
  });
}

export async function listMessages(roomKey: string): Promise<ChatMessage[]> {
  const publicClient = getPublicClient();

  const result: any = await publicClient
    .buildQuery()
    .where([eq("type", CHAT_ENTITY_TYPE.message), eq("roomKey", roomKey)])
    .withAttributes(true)
    .fetch();

  const entities: any[] = result.entities ?? [];

  const messages: ChatMessage[] = entities.map((e, index) => {
    const attrs = attrsToMap(e.attributes);
    const sentAt =
      attrs.sentAt !== undefined ? Number(attrs.sentAt) : Date.now();

    const id =
      attrs.sentAt !== undefined
        ? `${roomKey}-${attrs.sentAt}`
        : `${roomKey}-${index}`;

    return {
      id,
      roomKey: attrs.roomKey ?? roomKey,
      from: attrs.from,
      to: attrs.to,
      text: attrs.text ?? "",
      sentAt,
    };
  });

  return messages.sort((a, b) => a.sentAt - b.sentAt);
}

export async function sendMessage(params: {
  roomKey: string;
  from: string;
  to: string;
  text: string;
  sentAt?: number;
}): Promise<void> {
  const { roomKey, from, to, text } = params;
  const walletClient = getWalletClient();
  const now = params.sentAt ?? Date.now();

  await walletClient.createEntity({
    payload: jsonToPayload({
      text,
      sentAt: now,
      from,
      to,
      roomKey,
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: CHAT_ENTITY_TYPE.message },
      { key: "roomKey", value: roomKey },
      { key: "from", value: from },
      { key: "to", value: to },
      { key: "text", value: text },
      { key: "sentAt", value: String(now) },
    ],
    expiresIn: ExpirationTime.fromDays(3),
  });
}

export async function deleteArkivEntity(
  entityKey: `0x${string}`
): Promise<void> {
  const walletClient = getWalletClient();
  await walletClient.deleteEntity({ entityKey });
}
