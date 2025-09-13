import { offersByCafe } from "@/lib/offers";
import { redirect } from "next/navigation";

export default function CafePage({
  params,
  searchParams,
}: {
  params: { cafeSlug: string };
  searchParams: { error?: string };
}) {
  const cfg = offersByCafe[params.cafeSlug];
  if (!cfg) return <div className="p-6">Unknown café.</div>;

  async function claim(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    const cafeSlug = params.cafeSlug;

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const res = await fetch(`${base}/api/vouchers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // you could also validate email here before fetch
      body: JSON.stringify({ cafeSlug, email }),
      cache: "no-store",
    });

    const data = await res.json();

    if (res.ok && data.viewUrl) {
      redirect(data.viewUrl); // ✅ type-safe: action returns void/never
    }

    // Redirect back with an error message
    const err =
      data?.error || "Failed to create voucher — please try again.";
    redirect(`/${cafeSlug}?error=${encodeURIComponent(err)}`);
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{cfg.name}</h1>
      <p className="text-lg">{cfg.offerName}</p>
      <ul className="list-disc pl-6">
        {cfg.included.map((i) => (
          <li key={i.name}>
            {i.number} × {i.name}
          </li>
        ))}
      </ul>

      {/* Optional error banner from previous redirect */}
      {searchParams?.error && (
        <p className="p-2 rounded bg-red-100 text-red-800">
          {searchParams.error}
        </p>
      )}

      <form action={claim}>
        <label className="block mb-2">Email</label>
        <input
          name="email"
          type="email"
          required
          className="border p-2 w-full rounded"
          placeholder="you@email.com"
        />
        <button className="mt-3 bg-black text-white px-4 py-2 rounded">
          Get voucher
        </button>
      </form>
    </div>
  );
}