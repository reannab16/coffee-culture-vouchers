export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Cafe, { CafeDoc } from "@/models/Cafe";
import Guest, { GuestDoc } from "@/models/Guest";
import Voucher, { VoucherDoc } from "@/models/Voucher";

type VoucherForExport = Pick<VoucherDoc, "guestId" | "issuedAt">;

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("cafeSlug");
  if (!slug) return new Response("Missing cafeSlug", { status: 400 });

  const cafe = await Cafe.findOne({ slug }).lean<CafeDoc>();
  if (!cafe) return new Response("Cafe not found", { status: 404 });

  // Get distinct guestIds for this cafe (fast + no duplicates)
  const guestIds = await Voucher.distinct("guestId", { cafeId: cafe._id }) as Types.ObjectId[];

  if (guestIds.length === 0) {
    return new Response("email\n", {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="mailing-list-${slug}.csv"`,
      },
    });
  }

  const guests = await Guest.find({ _id: { $in: guestIds } })
    .select({ email: 1 })
    .lean<Pick<GuestDoc, "_id" | "email">[]>();

  const lines = ["email", ...guests.map(g => g.email)];
  const csv = lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mailing-list-${slug}.csv"`,
    },
  });
}