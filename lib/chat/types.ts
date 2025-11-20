export const CHAT_ENTITY_TYPE = {
  room: "chat_room",
  invite: "chat_invite",
  message: "chat_message",
} as const;

export type ChatEntityType =
  (typeof CHAT_ENTITY_TYPE)[keyof typeof CHAT_ENTITY_TYPE];

export type ChatRoomStatus = "open" | "closed";

export type ChatRoom = {
  roomKey: string;
  participantA: string;
  participantB: string;
  status: ChatRoomStatus;
};

export type ChatInviteStatus = "pending" | "accepted" | "rejected";

export type ChatInvite = {
  roomKey: string;
  from: string;
  to: string;
  status: ChatInviteStatus;
  note?: string;
  createdAt?: number;
};

export type ChatMessage = {
  id: string;
  roomKey: string;
  from: string;
  to?: string;
  text: string;
  sentAt: number; // epoch ms
};
