export const runtime = "nodejs";

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import Cafe from "@/models/Cafe";
import { setMerchantSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  await connectDB();
  const { slug, pin } = await req.json();

  const cafe = await Cafe.findOne({ slug });
  if (!cafe?.pinHash) return new Response(JSON.stringify({ error: "Invalid login" }), { status: 401 });

  const ok = await bcrypt.compare(pin, cafe.pinHash);
  if (!ok) return new Response(JSON.stringify({ error: "Invalid login" }), { status: 401 });

  await setMerchantSession({ cafeId: cafe._id.toString(), slug: cafe.slug }, 12);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}