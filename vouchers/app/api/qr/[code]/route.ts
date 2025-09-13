export const runtime = "nodejs";

import QRCode from "qrcode";

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
  const url = `${base}/v/${code}`;

  const svg = await QRCode.toString(url, { type: "svg" });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}