export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Voucher, { VoucherDoc } from "@/models/Voucher";
import Cafe, { CafeDoc } from "@/models/Cafe";

export async function GET(_: NextRequest, { params }: { params: { code: string } }) {
  await connectDB();
  const v = await Voucher.findOne({ code: params.code }).lean<VoucherDoc>();
  if (!v) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const cafe = await Cafe.findById(v.cafeId).lean<CafeDoc>();

  return new Response(JSON.stringify({
    code: v.code,
    status: v.status,
    offerName: v.offerName,
    items: v.items,
    cafe: { slug: cafe?.slug, name: cafe?.name },
  }), { status: 200 });
}