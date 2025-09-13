export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Voucher from "@/models/Voucher";
import { getMerchantSession } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  await connectDB();
  const session = await getMerchantSession();
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const v = await Voucher.findOne({ code: params.code, cafeId: session.cafeId }).lean();
  if (!v) return new Response(JSON.stringify({ error: "Not found or wrong cafe" }), { status: 404 });

  return new Response(JSON.stringify({
    code: v.code,
    status: v.status,
    offerName: v.offerName,
    items: v.items,
  }), { status: 200 });
}