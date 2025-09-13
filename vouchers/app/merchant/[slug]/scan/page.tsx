"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

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

export default function ScanPage({ params }: { params: { slug: string } }) {
  const [code, setCode] = useState("");
  const [voucher, setVoucher] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchVoucher(c: string) {
    if (!c) return;
    setError(null);
    setVoucher(null);
    const res = await fetch(`/api/merchant/vouchers/${c}`, { cache: "no-store" });
    const j = await res.json();
    if (res.ok) setVoucher(j);
    else setError(j.error || "Not found");
  }

  async function redeem(itemName: string) {
    const res = await fetch(`/api/merchant/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, itemName }),
    });
    const j = await res.json();
    if (res.ok) setVoucher((v: any) => ({ ...v, items: j.items, status: j.status }));
    else setError(j.error || "Redeem failed");
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Scan &amp; Redeem</h1>

      <Scanner
        constraints={{ facingMode: { ideal: "environment" } }} // prefer back camera
        scanDelay={750}                                        // debounce scans a bit
        onScan={(detected) => {
          const raw = detected[0]?.rawValue;
          const c = raw ? getCodeFromText(raw) : null;
          if (c && c !== code) {
            setCode(c);
            fetchVoucher(c);
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
          <p>
            <b>Offer:</b> {voucher.offerName}
          </p>
          <p>
            <b>Status:</b> {voucher.status}
          </p>
          <ul className="mt-2 space-y-2">
            {voucher.items.map((i: any) => (
              <li key={i._id} className="flex items-center justify-between">
                <span>
                  {i.name}: <b>{i.remaining}</b>
                </span>
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