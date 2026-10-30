"use client";

// Búsqueda en vivo: filtra al escribir (desde 2 caracteres) sin esperar a Enter.

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

export function ClientSearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  const lastApplied = useRef(defaultValue.trim().length >= MIN_CHARS ? defaultValue.trim() : "");

  useEffect(() => {
    const term = value.trim();
    // Menos de 2 caracteres = sin filtro (lista completa)
    const next = term.length >= MIN_CHARS ? term : "";
    if (next === lastApplied.current) return;

    const timer = setTimeout(() => {
      lastApplied.current = next;
      startTransition(() => {
        router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);

  return (
    <form method="GET" className="relative" onSubmit={(e) => e.preventDefault()}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nombre, email o teléfono..."
        autoComplete="off"
        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isPending && (
        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-slate-400">Buscando…</span>
      )}
    </form>
  );
}
