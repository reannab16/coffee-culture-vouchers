export const runtime = "nodejs";

import QRCode from "qrcode";

export async function GET(_: Request, { params }: { params: { code: string } }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const url = `${base}/v/${params.code}`;
  const png = await QRCode.toBuffer(url);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
}