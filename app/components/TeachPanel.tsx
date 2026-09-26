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
  setProducts: (x: Product[] | ((p: Product[]) => Product[])) => void;
  setKnowledge: (x: Knowledge[] | ((k: Knowledge[]) => Knowledge[])) => void;
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
      if (!r.ok) throw new Error(d.error || "AI lỗi");
      const learned = applyLearnResult(products, knowledge, d);
      setProducts(learned.products);
      setKnowledge(learned.knowledge);
      setLog(
        learned.summary.length
          ? learned.summary
          : ["Không có thay đổi bảng giá / kiến thức."]
      );
      setMsg(d.message || "Đã xử lý.");
      setInput("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không gọi được AI");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <h3 className="font-semibold">Dạy AI — cập nhật bảng giá & kiến thức</h3>
      <p className="muted mt-1">
        Nói chuyện để dạy giá, thêm mã mới, hoặc quy tắc. AI tự cập nhật kho mã và kiến thức.
      </p>
      {msg && <div className="ai-bubble mt-4">{msg}</div>}
      {log.length > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
          <b className="block mb-1">Đã áp dụng</b>
          {log.map((s, i) => (
            <div key={i}>• {s}</div>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "Cập nhật giá TR-THACHCAO-001 thành 210000",
          "Thêm mã TRAN-TC-VIP: Trần thạch cao VIP, m², 280000",
          "Ghi nhớ: dự án A trần thạch cao 220k/m²",
        ].map((x) => (
          <button key={x} type="button" className="suggest" onClick={() => setInput(x)}>
            {x}
          </button>
        ))}
      </div>
      <textarea
        className="field min-h-[100px] resize-none mt-3"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ví dụ: Giá tủ bếp TB-IN-A đổi thành 4800000"
      />
      <button type="button" disabled={busy} className="primary w-full mt-3" onClick={teach}>
        {busy ? "Đang dạy AI…" : "Dạy AI & lưu"}
      </button>
    </section>
  );
}
