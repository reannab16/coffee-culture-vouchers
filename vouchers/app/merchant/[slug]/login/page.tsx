"use client";
import { useState } from "react";

export default function Login({ params }: { params: { slug: string } }) {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/merchant/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: params.slug, pin })
    });
    if (res.ok) {
      window.location.href = `/merchant/${params.slug}/scan`;
    } else {
      const j = await res.json();
      setMsg(j.error || "Login failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Staff Login ({params.slug})</h1>
      <form onSubmit={onSubmit}>
        <input
          value={pin} onChange={(e)=>setPin(e.target.value)}
          placeholder="Enter PIN" className="border p-2 w-full rounded" />
        <button className="mt-3 bg-black text-white px-4 py-2 rounded">Login</button>
      </form>
      {msg && <p className="text-red-600">{msg}</p>}
    </div>
  );
}