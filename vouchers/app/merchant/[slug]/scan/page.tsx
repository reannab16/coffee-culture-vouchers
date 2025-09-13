"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

type VoucherItem = { _id: string; name: string; remaining: number };
type VoucherLite = { offerName: string; status: "active" | "completed" | "void"; items: VoucherItem[] };

function getCodeFromText(text: string): string | null {
  try {
    const u = new URL(text);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "v");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    if (/^[A-Z0-9]{6,12}$/i.test(text)) return text;
  }
  return null;
}

// underscore the param so ESLint knows it's intentionally unused
export default function ScanPage(_props: { params: { slug: string } }) {
  const [code, setCode] = useState<string>("");
  const [voucher, setVoucher] = useState<VoucherLite | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchVoucher(c: string) {
    if (!c) return;
    setError(null);
    setVoucher(null);
    const res = await fetch(`/api/merchant/vouchers/${c}`, { cache: "no-store" });
    const j: VoucherLite | { error: string } = await res.json();
    if (res.ok) setVoucher(j as VoucherLite);
    else setError((j as { error: string }).error || "Not found");
  }

  async function redeem(itemName: string) {
    const res = await fetch(`/api/merchant/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, itemName }),
    });
    const j: { items: VoucherItem[]; status: VoucherLite["status"]; error?: string } = await res.json();
    if (res.ok && voucher) {
      setVoucher({ ...voucher, items: j.items, status: j.status });
    } else {
      setError(j.error || "Redeem failed");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Scan &amp; Redeem</h1>

      <Scanner
        constraints={{ facingMode: { ideal: "environment" } }}
        scanDelay={750}
        onScan={(detected) => {
          const raw = detected[0]?.rawValue ?? "";
          const c = getCodeFromText(raw);
          if (c && c !== code) {
            setCode(c);
            void fetchVoucher(c);
          }
        }}
        onError={() => {}}
      />

      <div className="flex gap-2 mt-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          className="border p-2 flex-1 rounded"
        />
        <button className="bg-black text-white px-3 rounded" onClick={() => fetchVoucher(code)}>
          Lookup
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {voucher && (
        <div className="border rounded p-3">
          <p><b>Offer:</b> {voucher.offerName}</p>
          <p><b>Status:</b> {voucher.status}</p>
          <ul className="mt-2 space-y-2">
            {voucher.items.map((i) => (
              <li key={i._id} className="flex items-center justify-between">
                <span>{i.name}: <b>{i.remaining}</b></span>
                <button
                  disabled={i.remaining <= 0 || voucher.status !== "active"}
                  className="px-3 py-1 rounded bg-black text-white disabled:opacity-40"
                  onClick={() => redeem(i.name)}
                >
                  Redeem 1
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}