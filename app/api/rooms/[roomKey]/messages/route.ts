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

  const { from, to, text, sentAt } = body || {};
  if (!from || !text) {
    return NextResponse.json(
      { error: "Missing required fields: from, text" },
      { status: 400 }
    );
  }

  const sentAtNum =
    typeof sentAt === "number" && Number.isFinite(sentAt) ? sentAt : Date.now();

  try {
    // note: nonce collision caveat still applies when using same PK in 2 tabs
    await sendMessage({
      roomKey,
      from,
      to: to ?? "",
      text,
      sentAt: sentAtNum,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST messages]", err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
