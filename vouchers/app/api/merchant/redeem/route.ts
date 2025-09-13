export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Voucher, { VoucherDoc } from "@/models/Voucher";
import { getMerchantSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getMerchantSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { code, itemName } = await req.json() as { code?: string; itemName?: string };
  if (!code || !itemName) return new Response(JSON.stringify({ error: "Bad request" }), { status: 400 });

  // atomic decrement
  const updated = await Voucher
    .findOneAndUpdate(
      { code, cafeId: session.cafeId, status: "active", "items.name": itemName, "items.remaining": { $gt: 0 } },
      { $inc: { "items.$.remaining": -1 } },
      { new: true }
    )
    .lean<VoucherDoc>();

  if (!updated) return new Response(JSON.stringify({ error: "No remaining or wrong cafe" }), { status: 400 });

  const totalRemaining = updated.items.reduce((sum, item) => sum + item.remaining, 0);

  if (totalRemaining === 0 && updated.status !== "completed") {
    await Voucher.updateOne({ _id: updated._id }, { $set: { status: "completed", completedAt: new Date() } });
  }

  return new Response(JSON.stringify({
    ok: true,
    items: updated.items,
    status: totalRemaining === 0 ? "completed" : "active"
  }), { status: 200 });
}