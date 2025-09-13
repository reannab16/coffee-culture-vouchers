export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Cafe from "@/models/Cafe";
import Guest from "@/models/Guest";
import Voucher from "@/models/Voucher";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("cafeSlug");
  if (!slug) return new Response("Missing cafeSlug", { status: 400 });

  const cafe = await Cafe.findOne({ slug }).lean();
  if (!cafe) return new Response("Cafe not found", { status: 404 });

  const vouchers = await Voucher.find({ cafeId: cafe._id }).select("guestId issuedAt").lean();
  const guestIds = [...new Set(vouchers.map(v => String(v.guestId)))];
  const guests = await Guest.find({ _id: { $in: guestIds } }).lean();

  const lines = ["email"];
  guests.forEach(g => lines.push((g as any).email));
  const csv = lines.join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv" } });
}