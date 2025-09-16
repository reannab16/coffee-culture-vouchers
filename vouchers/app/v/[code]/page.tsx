import Image from "next/image";
import QRCode from "qrcode";
import { connectDB } from "@/lib/db";
import Voucher, { VoucherDoc } from "@/models/Voucher";
import Cafe, { CafeDoc } from "@/models/Cafe";
import { Icon } from "@iconify/react/dist/iconify.js";

import { Lora } from "next/font/google";
import { CCLogo, KasaCafeLogo } from "@/app/[cafeSlug]/page";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // pick what you need
  style: ["normal", "italic"], // optional
  display: "swap", // good CLS behavior
});

export const dynamic = "force-dynamic";

async function getData(code: string) {
  await connectDB();
  const v = await Voucher.findOne({ code }).lean<VoucherDoc>();
  if (!v) return null;
  const cafe = await Cafe.findById(v.cafeId).lean<CafeDoc>();
  return {
    code,
    status: v.status,
    offerName: v.offerName,
    items: v.items,
    cafeName: cafe?.name ?? "Café",
  };
}

export default async function VoucherPage({
  params,
}: {
  params: { code: string };
}) {
  const { code } = await params;
  const data = await getData(code);
  if (!data) return <div className="p-6">Voucher not found.</div>;

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const voucherUrl = `${base}/v/${params.code}`;
  const dataUrl = await QRCode.toDataURL(voucherUrl);

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 flex items-center justify-center flex-col">
      <div className="container flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-center mb-10">
          <KasaCafeLogo className="w-12 h-12 text-foreground" />
          <div>x</div>
          <CCLogo
            className="w-16 h-16 text-foreground"
            darkColour="var(--foreground)"
          />
        </div>
        <h1
          className={`text-4xl font-semibold text-center uppercase ${lora.className} mb-5`}
        >
          enjoy your freebies!
        </h1>
      </div>
      <div
        style={{
          background: `linear-gradient(to right, #d68c7a 0%, #d68c7a 60%, #2f211a33)`,
        }}
        className=" rounded-2xl my-2 max-w-80 w-full relative bg-gradient-to-r from-[var(--mainBrown)] from-0% via-[var(--mainBrown)] via-70% to-[#2f211a33] sm:mr-4 gap-y-5 flex flex-col"
      >
        <div className="flex justify-between  px-4 pt-4">
          <div className="flex items-center space-x-2">
            <Image
              src={"/kasalogo1.webp"}
              alt={"kasa café logo"}
              width={35}
              height={35}
              className="object-cover rounded-full w-[35px] h-[35px]"
            />
            <div className="text-[#fff]">
              <h1 className="text-base ">Kasa Café</h1>
              <div className="flex items-center">
                <Icon
                  icon="hugeicons:location-01"
                  className="h-3 text-[var(--backgroundColour)]  "
                />
                <p className="text-xs">Fitsrovia</p>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs px-3 py-[1px] max-h-5 rounded-full bg-[#d68c7a]/80 text-center justify-center items-center flex text-white">
              Valid till 07/10/25
            </div>
            <img
              style={{
                width: "50%",
                height: "100%",
                position: "absolute",
                right: "0px",
                top: "0px",
                zIndex: -1,
                borderRadius: "20px 20px 20px 20px",
              }}
              src="/kasabackground.jpg"
              alt=""
              className="object-cover"
            />
          </div>
        </div>
        <ul className="list-disc pl-6 flex gap-x-2 pb-5 mt-2 flex-col items-start justify-start gap-y-2">
          {data.items.map((i) => (
            <li
              key={String(i._id)}
              className="bg-white/80 h-6 flex items-center justify-between px-4 rounded-full text-sm truncate gap-x-1"
            >
              {i.name}: <b>{i.remaining}</b> left
            </li>
          ))}
        </ul>
        <div className="w-full flex items-center justify-center mb-10">
          <Image
            src={dataUrl}
            alt="Voucher QR"
            width={150}
            height={150}
            className="rounded-xl"
          />
        </div>
      </div>

      <p className="text-sm text-foreground/80">Show this QR at the till.</p>
    </div>
  );
}
