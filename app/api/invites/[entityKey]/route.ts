import { deleteArkivEntity } from "@/lib/chat/repository.server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ entityKey: string }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { entityKey } = await context.params;

  if (!entityKey) {
    return NextResponse.json({ error: "Missing entityKey" }, { status: 400 });
  }

  try {
    await deleteArkivEntity(entityKey as `0x${string}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE invite]", err);
    return NextResponse.json(
      { error: "Failed to delete invite" },
      { status: 500 }
    );
  }
}
