"use client";

import { useState } from "react";
import { applyLearnResult, Product, Knowledge } from "../../lib/quote-engine";
import { AppSettings } from "../../lib/settings";

export function TeachPanel({
  settings,
  products,
  knowledge,
  setProducts,
  setKnowledge,
}: {
  settings: AppSettings;
  products: Product[];
  knowledge: Knowledge[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setKnowledge: React.Dispatch<React.SetStateAction<Knowledge[]>>;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function teach() {
    if (!input.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    setLog([]);
    try {
      const r = await fetch("/api/ai-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          products,
          knowledge,
          model: settings.model,
          apiKey: settings.apiKey,
          mode: "teach",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI loi");
      const learned = applyLearnResult(products, knowledge, d);
      setProducts(learned.products);
      setKnowledge(learned.knowledge);
      setLog(learned.summary.length ? learned.summary : ["Khong co thay doi."]);
      setMsg(d.message || "Da xu ly.");
      setInput("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Khong goi duoc AI");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <h3 className="font-semibold">Day AI</h3>
      <p className="muted mt-1">Day gia, them ma moi, hoac quy tac.</p>
      {msg && <div className="ai-bubble mt-4">{msg}</div>}
      {log.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
          {log.map((s, i) => (
            <div key={i}>• {s}</div>
          ))}
        </div>
      )}
      <textarea
        className="field min-h-[100px] resize-none mt-3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Vi du: Gia TB-IN-A doi thanh 4800000"
      />
      <button type="button" disabled={busy} className="primary w-full mt-3" onClick={teach}>
        {busy ? "Dang day AI..." : "Day AI & luu"}
      </button>
    </section>
  );
}
