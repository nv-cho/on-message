import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/chat/repository.server";

type RouteContext = {
  params: Promise<{ roomKey: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { roomKey } = await context.params;

  if (!roomKey) {
    return NextResponse.json({ error: "Missing roomKey" }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { from, to, text } = body || {};
  if (!from || !text) {
    return NextResponse.json(
      { error: "Missing required fields: from, text" },
      { status: 400 }
    );
  }

  try {
    // todo: there is an nonce colission problem pending to be fixed, dont send messages at the same time from the same address
    await sendMessage({ roomKey, from, to: to ?? "", text });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST messages]", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
