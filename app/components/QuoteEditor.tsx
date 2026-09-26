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
  setQuote: (q: QuoteState) => void;
  setProducts: (x: Product[] | ((p: Product[]) => Product[])) => void;
  setKnowledge: (x: Knowledge[] | ((k: Knowledge[]) => Knowledge[])) => void;
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
      <div className="card p-16 text-center">
        <h2 className="text-xl font-semibold">Chua co bao gia.</h2>
        <p className="muted mt-2">Tao mot bao gia rieng roi moi them hang muc.</p>
        <button className="primary mt-5" onClick={newQuote}>
          + Tao bao gia
        </button>
      </div>
    );
  }

  const t = totals(quote);

  async function send() {
    if (!input.trim() || busy) return;
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

  function doExportCSV() {
    const csv = exportCSV(quote!, settings.companyName);
    downloadBlob(csv, `${quote!.quoteNumber || "bao-gia"}.csv`, "text/csv;charset=utf-8");
  }

  function removeItem(id: string) {
    setQuote({
      ...quote!,
      items: quote!.items.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    });
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

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_390px] gap-5">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
          <div>
            <div className="badge">QUOTE {quote.quoteNumber}</div>
            <h2 className="hero text-3xl">{quote.project || "Bao gia moi"}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="secondary" onClick={newQuote}>Moi</button>
            <button className="secondary" onClick={doExportCSV}>Excel</button>
            <button className="secondary" onClick={onPrint}>In / PDF</button>
            <button className="primary" onClick={save}>Luu bao gia</button>
          </div>
        </div>

        <div className="card p-5 grid md:grid-cols-2 gap-3">
          <input className="field" value={quote.customer} onChange={(e) => setQuote({ ...quote, customer: e.target.value, updatedAt: new Date().toISOString() })} placeholder="Khach hang" />
          <input className="field" value={quote.project} onChange={(e) => setQuote({ ...quote, project: e.target.value, updatedAt: new Date().toISOString() })} placeholder="Ten cong trinh" />
          <input className="field" value={quote.customerPhone || ""} onChange={(e) => setQuote({ ...quote, customerPhone: e.target.value })} placeholder="Dien thoai" />
          <input className="field" value={quote.customerAddress || ""} onChange={(e) => setQuote({ ...quote, customerAddress: e.target.value })} placeholder="Dia chi" />
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 border-b flex justify-between">
            <div>
              <b>Chi tiet bao gia</b>
              <div className="muted mt-1">{quote.items.length} hang muc</div>
            </div>
            <div className="text-right">
              <div className="muted">TONG CONG</div>
              <div className="text-xl font-bold">{money(t.total)}</div>
            </div>
          </div>
          {quote.items.length === 0 ? (
            <div className="p-16 text-center muted">Bao gia dang trong. Hay yeu cau AI.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-[10px] uppercase text-[#929baa]">
                  <th className="text-left p-4">Hang muc</th>
                  <th className="text-center">KL</th>
                  <th className="text-right">Don gia</th>
                  <th className="text-right">Thanh tien</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="p-4">
                      <b>{i.name}</b>
                      <div className="text-xs text-[#929baa]">{i.code} · {i.material}</div>
                    </td>
                    <td className="text-center p-2">
                      <input className="field-sm w-16 mx-auto" type="number" value={i.qty} onChange={(e) => updateQty(i.id, Number(e.target.value) || 0)} />
                      <div className="text-[10px] text-[#929baa]">{i.unit}</div>
                    </td>
                    <td className="text-right p-2">
                      <input className="field-sm w-28 ml-auto" type="number" value={i.unitPrice} onChange={(e) => updatePrice(i.id, Number(e.target.value) || 0)} />
                    </td>
                    <td className="text-right font-semibold p-4">{money(i.qty * i.unitPrice)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => removeItem(i.id)} className="text-xs text-red-500">Xoa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="p-5 border-t ml-auto max-w-sm space-y-2">
            <div className="flex justify-between">Tam tinh <b>{money(t.subtotal)}</b></div>
            <div className="flex justify-between items-center gap-2">
              <span>Chiet khau %</span>
              <input className="field-sm w-20" type="number" value={quote.discount} onChange={(e) => setQuote({ ...quote, discount: Number(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-between">Chiet khau <b>- {money(t.discount)}</b></div>
            <div className="flex justify-between items-center gap-2">
              <span>VAT %</span>
              <input className="field-sm w-20" type="number" value={quote.vat} onChange={(e) => setQuote({ ...quote, vat: Number(e.target.value) || 0 })} />
            </div>
            <div className="flex justify-between">VAT <b>{money(t.vat)}</b></div>
            <div className="flex justify-between border-t pt-3 text-base">
              <b>TONG CONG</b>
              <b>{money(t.total)}</b>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4 sticky top-[94px] h-fit">
        <div className="card overflow-hidden">
          <div className="bg-[#111a2d] text-white p-5">
            <div className="text-[10px] tracking-widest text-white/40">WOTU AI COPILOT</div>
            <b className="text-lg block mt-1">Nhap yeu cau tu nhien.</b>
            <span className="text-xs text-white/45">AI doc bang gia + kien thuc dang bat.</span>
          </div>
          <div className="p-5">
            {aiMsg && <div className="ai-bubble">{aiMsg}</div>}
            {learnLog.length > 0 && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 space-y-1">
                <b className="block mb-1">AI da luu / cap nhat</b>
                {learnLog.map((s, i) => (
                  <div key={i}>• {s}</div>
                ))}
              </div>
            )}
            {["Bep 3m5 MDF chong am", "Them 2 bo ray giam chan", "Giam 5%", "Luu ma nay vao bang gia"].map((x) => (
              <button key={x} type="button" className="suggest" onClick={() => setInput(x)}>
                {x}
              </button>
            ))}
            <textarea
              className="field min-h-[120px] resize-none mt-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Vi du: them tran thach cao 85m2..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button disabled={busy} className="primary w-full mt-2" onClick={send}>
              {busy ? "Dang xu ly..." : "Gui cho AI"}
            </button>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-medium text-sm">Kien thuc dang ap dung</div>
          {knowledge.filter((k) => k.enabled).slice(0, 5).map((k) => (
            <div className="text-xs text-[#707988] mt-2" key={k.id}>
              • {k.title}
            </div>
          ))}
          {!knowledge.filter((k) => k.enabled).length && (
            <div className="muted mt-2">Chua co quy tac.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
