export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Cafe from "@/models/Cafe";
import Guest from "@/models/Guest";
import Voucher from "@/models/Voucher";
import { offersByCafe } from "@/lib/offers";
import { shortCode } from "@/lib/code";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const Body = z.object({
  cafeSlug: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  await connectDB();
  const json = await req.json();
  const { cafeSlug, email } = Body.parse(json);

  const cfg = offersByCafe[cafeSlug];
  if (!cfg)
    return new Response(JSON.stringify({ error: "Unknown cafe" }), {
      status: 404,
    });

  // get or create cafe row (seeded already, but safe)
  const cafe = await Cafe.findOne({ slug: cafeSlug });
  if (!cafe)
    return new Response(JSON.stringify({ error: "Cafe not found" }), {
      status: 404,
    });

  // rate-limit: 1 voucher per email per cafe per 24h (simple check)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await Voucher.findOne({
    cafeId: cafe._id,
    issuedAt: { $gte: since },
  }).populate({ path: "guestId", match: { email: email.toLowerCase() } });

  if (existing?.guestId) {
    const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
    return new Response(
      JSON.stringify({
        message: "Already claimed in last 24h",
        viewUrl: `${origin}/v/${existing.code}`,
      }),
      { status: 200 }
    );
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

  const items = cfg.included.map((i) => ({
    name: i.name,
    remaining: i.number,
  }));

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

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Tip: test first with onboarding@resend.dev as the sender
      const from = process.env.RESEND_FROM ?? "info@coffee-culture.uk";

      const html = (
        viewUrl: string,
        code: string,
        offerName: string,
        origin: string
      ) => `
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">
    Your ${offerName} voucher is ready. Show the QR at the till.
  </div>

  <div style="background:#f6f9fc;padding:24px 0;margin:0;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;border:1px solid #eaeaea;">
            <tr>
              <td style="padding:24px 28px;text-align:center;">
                <img src="https://raw.githubusercontent.com/reannab16/coffee-culture-vouchers/refs/heads/main/vouchers/public/kasalogo1.webp" alt="Kasa Café" width="40" height="40" style="display:inline-block;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:600;margin-top:12px;color:#111">
                  Your voucher is ready
                </div>
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#555;font-size:14px;margin-top:6px;">
                  Offer: <strong>${offerName}</strong>
                </div>

                <!-- CTA button -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 0;">
                  <tr>
                    <td align="center" bgcolor="#111111" style="border-radius:8px;">
                      <a href="${viewUrl}"
                        style="display:inline-block;padding:12px 18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
                        font-size:14px;color:#ffffff;text-decoration:none;border-radius:8px;"
                      >Open voucher</a>
                    </td>
                  </tr>
                </table>

                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#888;font-size:11px;line-height:1.4;">
                  Show this QR at the till. This voucher is single-use and tied to your email.
                </div>
              </td>
            </tr>
          </table>

          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#98a2b3;font-size:11px;margin-top:12px;">
            © ${new Date().getFullYear()} Kasa Café • Coffee Culture
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

      const result = await resend.emails.send({
        from,
        to: email,
        subject: "Your Voucher from Kasa Café x Coffee Culture",
        html: html(viewUrl, voucher.code, cfg.offerName, origin),
      });

      if (result.error) {
        console.error("Resend send error:", result.error);
      }
    } else {
      console.warn("RESEND_API_KEY not set; skipping email send");
    }
  } catch (e) {
    console.error("Resend exception:", e);
  }

  return new Response(JSON.stringify({ code: voucher.code, viewUrl }), {
    status: 200,
  });
}
