"use client";

import { useState } from "react";
import {
  applyAICommand,
  applyLearnResult,
  exportCSV,
  downloadBlob,
  money,
  Product,
  QuoteState,
  Knowledge,
  totals,
} from "../../lib/quote-engine";
import { AppSettings } from "../../lib/settings";

export function QuoteEditor({
  quote,
  products,
  knowledge,
  settings,
  setQuote,
  setProducts,
  setKnowledge,
  save,
  newQuote,
  record,
  onPrint,
}: {
  quote: QuoteState | null;
  products: Product[];
  knowledge: Knowledge[];
  settings: AppSettings;
  setQuote: React.Dispatch<React.SetStateAction<QuoteState | null>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setKnowledge: React.Dispatch<React.SetStateAction<Knowledge[]>>;
  save: () => void;
  newQuote: () => void;
  record: (a: string, q: QuoteState) => void;
  onPrint: () => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [learnLog, setLearnLog] = useState<string[]>([]);

  if (!quote) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto">
        <div className="badge mx-auto">BAO GIA</div>
        <h2 className="text-xl font-semibold mt-3">Chua co bao gia dang mo</h2>
        <p className="muted mt-2 text-sm">Tao bao gia moi de bat dau.</p>
        <button className="primary mt-6" onClick={newQuote}>
          + Tao bao gia moi
        </button>
      </div>
    );
  }

  const t = totals(quote);
  const infoReady =
    Boolean(quote.customer?.trim()) &&
    Boolean(quote.project?.trim()) &&
    Boolean((quote.customerPhone || "").trim());

  async function send() {
    if (!input.trim() || busy) return;
    if (!infoReady) {
      alert("Vui long dien: Khach hang, Cong trinh, So dien thoai truoc khi dung AI.");
      return;
    }
    setBusy(true);
    setAiMsg(null);
    setLearnLog([]);
    try {
      const r = await fetch("/api/ai-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          quote,
          products,
          knowledge,
          model: settings.model,
          apiKey: settings.apiKey,
          provider: settings.provider || "gemini",
          mode: "quote",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI loi");
      const learned = applyLearnResult(products, knowledge, d);
      if (learned.summary.length) {
        setProducts(learned.products);
        setKnowledge(learned.knowledge);
        setLearnLog(learned.summary);
      }
      const next = applyAICommand(quote!, d, learned.products);
      setQuote(next);
      record(d.message || input, next);
      setAiMsg(d.message || "Da cap nhat bao gia.");
      setInput("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Khong goi duoc AI");
    } finally {
      setBusy(false);
    }
  }

  function updateQty(id: string, qty: number) {
    setQuote({
      ...quote!,
      items: quote!.items.map((i) => (i.id === id ? { ...i, qty } : i)),
      updatedAt: new Date().toISOString(),
    });
  }

  function updatePrice(id: string, unitPrice: number) {
    setQuote({
      ...quote!,
      items: quote!.items.map((i) => (i.id === id ? { ...i, unitPrice } : i)),
      updatedAt: new Date().toISOString(),
    });
  }

  function removeItem(id: string) {
    setQuote({
      ...quote!,
      items: quote!.items.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="badge">BAO GIA</div>
            <h2 className="hero text-2xl sm:text-3xl mt-1">
              {quote.quoteNumber || "Bao gia moi"}
            </h2>
            <p className="muted mt-1 text-sm">
              Dien thong tin khach roi chat AI de lap hang muc.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="secondary" onClick={save}>
              Luu
            </button>
            <button type="button" className="secondary" onClick={onPrint}>
              In / PDF
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() =>
                downloadBlob(
                  exportCSV(quote, settings.companyName),
                  `${quote.quoteNumber || "bao-gia"}.csv`,
                  "text/csv;charset=utf-8"
                )
              }
            >
              CSV
            </button>
          </div>
        </div>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold text-sm">Thong tin khach hang</h3>
            {!infoReady ? (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Bat buoc truoc khi chat AI
              </span>
            ) : (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Da du thong tin
              </span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="field"
              value={quote.customer}
              onChange={(e) =>
                setQuote({
                  ...quote,
                  customer: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Ten khach hang *"
            />
            <input
              className="field"
              value={quote.project}
              onChange={(e) =>
                setQuote({
                  ...quote,
                  project: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Ten cong trinh / du an *"
            />
            <input
              className="field"
              value={quote.customerPhone || ""}
              onChange={(e) =>
                setQuote({ ...quote, customerPhone: e.target.value })
              }
              placeholder="So dien thoai *"
            />
            <input
              className="field"
              value={quote.customerAddress || ""}
              onChange={(e) =>
                setQuote({ ...quote, customerAddress: e.target.value })
              }
              placeholder="Dia chi (tuy chon)"
            />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#fafbfc] text-[10px] uppercase tracking-wider text-[#8992a0]">
                  <th className="text-left p-3">Hang muc</th>
                  <th className="text-center">SL</th>
                  <th className="text-right">Don gia</th>
                  <th className="text-right">Thanh tien</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quote.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center muted text-sm">
                      Chua co hang muc. Dien thong tin khach roi yeu cau AI.
                    </td>
                  </tr>
                ) : (
                  quote.items.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-xs text-[#9aa2ae]">
                          {i.code} · {i.unit}
                          {i.material ? ` · ${i.material}` : ""}
                        </div>
                      </td>
                      <td className="text-center">
                        <input
                          className="field-sm w-16 mx-auto"
                          type="number"
                          value={i.qty}
                          onChange={(e) =>
                            updateQty(i.id, Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="field-sm w-28 ml-auto"
                          type="number"
                          value={i.unitPrice}
                          onChange={(e) =>
                            updatePrice(i.id, Number(e.target.value) || 0)
                          }
                        />
                      </td>
                      <td className="text-right font-semibold pr-2">
                        {money(i.qty * i.unitPrice)}
                      </td>
                      <td className="pr-3 text-right">
                        <button
                          type="button"
                          className="text-xs text-red-500"
                          onClick={() => removeItem(i.id)}
                        >
                          Xoa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t p-4 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#8a93a1]">Chiet khau %</span>
              <input
                className="field-sm w-20"
                type="number"
                value={quote.discount}
                onChange={(e) =>
                  setQuote({
                    ...quote,
                    discount: Number(e.target.value) || 0,
                  })
                }
              />
              <span className="text-[#8a93a1]">VAT %</span>
              <input
                className="field-sm w-20"
                type="number"
                value={quote.vat}
                onChange={(e) =>
                  setQuote({ ...quote, vat: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-6">
                <span className="text-[#8a93a1]">Tam tinh</span>
                <span>{money(t.subtotal)}</span>
              </div>
              <div className="flex justify-end gap-6 text-lg font-semibold">
                <span>Tong cong</span>
                <span className="text-[#9a1f2b]">{money(t.total)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside className="card overflow-hidden flex flex-col h-fit lg:sticky lg:top-24">
        <div className="bg-[#111a2d] text-white px-4 py-3">
          <div className="text-[10px] tracking-widest text-white/40">WOTU AI</div>
          <div className="font-semibold">Tro ly bao gia</div>
        </div>
        <div className="p-4 space-y-3">
          {!infoReady && (
            <div className="text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-3">
              Dien <b>Khach hang</b>, <b>Cong trinh</b> va <b>SDT</b> ben trai truoc khi chat AI.
            </div>
          )}
          {aiMsg && <div className="ai-bubble text-sm">{aiMsg}</div>}
          {learnLog.length > 0 && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-2 space-y-0.5">
              {learnLog.map((s, i) => (
                <div key={i}>• {s}</div>
              ))}
            </div>
          )}
          <textarea
            className="field min-h-[120px] resize-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              infoReady
                ? "Vi du: Bao gia tu bep duoi inox 4m, tu tren 3m..."
                : "Dien thong tin khach truoc..."
            }
            disabled={!infoReady || busy}
          />
          <button
            type="button"
            disabled={busy || !infoReady}
            className="primary w-full"
            onClick={send}
          >
            {busy ? "Dang xu ly..." : "Gui AI"}
          </button>
        </div>
      </aside>
    </div>
  );
}
