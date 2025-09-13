export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Voucher, { VoucherDoc } from "@/models/Voucher";
import { getMerchantSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ code: string }> } // 👈 params is a Promise
) {
  const { code } = await context.params; // 👈 await it

  await connectDB();
  const session = await getMerchantSession();
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const v = await Voucher.findOne({ code, cafeId: session.cafeId }).lean<VoucherDoc>();
  if (!v) {
    return new Response(JSON.stringify({ error: "Not found or wrong cafe" }), { status: 404 });
  }

  return new Response(
    JSON.stringify({
      code: v.code,
      offerName: v.offerName,
      status: v.status,
      items: v.items,
    }),
    { status: 200 }
  );
}