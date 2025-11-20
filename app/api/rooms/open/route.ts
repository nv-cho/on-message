import { NextResponse } from "next/server";
import { openChatRoom } from "@/lib/chat/repository.server";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { from, to } = body || {};

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing required fields: from, to" },
      { status: 400 }
    );
  }

  try {
    const { roomKey } = await openChatRoom({ from, to });
    return NextResponse.json({ roomKey });
  } catch (err) {
    console.error("[POST /api/rooms/open]", err);
    return NextResponse.json(
      { error: "Failed to open chat room" },
      { status: 500 }
    );
  }
}
