import { NextResponse } from "next/server";
import { listInvitesFor } from "@/lib/chat/repository.server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Missing address query param" },
      { status: 400 }
    );
  }

  try {
    const invites = await listInvitesFor(address);
    return NextResponse.json({ invites });
  } catch (err) {
    console.error("[GET /api/invites]", err);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}
