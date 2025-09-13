import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import Voucher from "@/models/Voucher";
import Cafe from "@/models/Cafe";

export const dynamic = "force-dynamic"; // no cache

async function getData(code: string) {
  await connectDB();
  const v = await Voucher.findOne({ code }).lean();
  if (!v) return null;
  const cafe = await Cafe.findById(v.cafeId).lean();
  return {
    code,
    status: v.status as string,
    offerName: v.offerName as string,
    items: (v.items as any[]),
    cafeName: cafe?.name as string,
  };
}

export default async function VoucherPage({ params }: { params: { code: string } }) {
  const data = await getData(params.code);
  if (!data) return <div className="p-6">Voucher not found.</div>;

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const voucherUrl = `${base}/v/${params.code}`;
  const dataUrl = await QRCode.toDataURL(voucherUrl);

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">{data.cafeName}</h1>
      <p className="text-lg">{data.offerName}</p>
      <ul className="list-disc pl-6">
        {data.items.map((i:any) => (
          <li key={i._id}>{i.name}: <b>{i.remaining}</b> left</li>
        ))}
      </ul>
      <img src={dataUrl} alt="Voucher QR" className="w-48 h-48" />
      <p className="text-sm text-gray-600">Show this QR at the till.</p>
    </div>
  );
}