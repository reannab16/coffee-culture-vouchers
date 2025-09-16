"use client";
import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 bg-foreground text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {pending ? <><Spinner className="h-4 w-4 mr-2" /> Loading…</> : children}
    </button>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ verticalAlign: "-0.2em" }}
    />
  );
}