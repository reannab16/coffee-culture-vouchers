export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Cafe from "@/models/Cafe";
import Guest from "@/models/Guest";
import Voucher from "@/models/Voucher";
import { offersByCafe } from "@/lib/offers";
import { shortCode } from "@/lib/code";

const Body = z.object({
  cafeSlug: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  await connectDB();
  const json = await req.json();
  const { cafeSlug, email } = Body.parse(json);

  const cfg = offersByCafe[cafeSlug];
  if (!cfg) return new Response(JSON.stringify({ error: "Unknown cafe" }), { status: 404 });

  // get or create cafe row (seeded already, but safe)
  const cafe = await Cafe.findOne({ slug: cafeSlug });
  if (!cafe) return new Response(JSON.stringify({ error: "Cafe not found" }), { status: 404 });

  // rate-limit: 1 voucher per email per cafe per 24h (simple check)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Voucher.findOne({
    cafeId: cafe._id,
    issuedAt: { $gte: since },
  }).populate({ path: "guestId", match: { email: email.toLowerCase() } });

  if (existing?.guestId) {
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    return new Response(JSON.stringify({
      message: "Already claimed in last 24h",
      viewUrl: `${origin}/v/${existing.code}`
    }), { status: 200 });
  }

  const guest = await Guest.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $setOnInsert: { email: email.toLowerCase() } },
    { upsert: true, new: true }
  );

  // generate unique code
  let code = shortCode(8);
  while (await Voucher.exists({ code })) {
    code = shortCode(8);
  }

  const items = cfg.included.map(i => ({ name: i.name, remaining: i.number }));

  const voucher = await Voucher.create({
    code,
    cafeId: cafe._id,
    guestId: guest._id,
    offerName: cfg.offerName,
    items,
    status: "active",
  });

  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const viewUrl = `${origin}/v/${voucher.code}`;

  return new Response(JSON.stringify({ code: voucher.code, viewUrl }), { status: 200 });
}