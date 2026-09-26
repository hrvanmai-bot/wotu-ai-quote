"use client";

import { useEffect, useRef, useState } from "react";
import { applyLearnResult, Product, Knowledge } from "../../lib/quote-engine";
import { AppSettings } from "../../lib/settings";

type Msg = {
  id: string;
  role: "user" | "bot";
  text: string;
  changes?: string[];
};

export function BusinessAgent({
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
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Xin chào — mình là WOTU Business Agent. Hỏi giá sản phẩm, dạy giá mới, thêm mã… Mình trả lời và tự lưu vào bảng giá khi bạn bảo đổi/lưu.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    setMsgs((m) => [...m, userMsg]);

    try {
      const r = await fetch("/api/ai-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Bạn là Business Agent bán hàng / quản lý bảng giá WOTU.\n- Nếu user HỎI giá / thông tin SP: trả lời trong message (dùng MASTER PRICE BOOK), không bắt buộc update.\n- Nếu user BẢO đổi giá / thêm mã / lưu / ghi nhớ: điền updatePrices / newProducts / knowledgeToSave ngay (tự lưu).\n- Trả lời ngắn, tiếng Việt, như chat bot.\nUser: ${text}`,
          products,
          knowledge,
          model: settings.model,
          apiKey: settings.apiKey,
          provider: settings.provider || "gemini",
          mode: "teach",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI lỗi");

      const learned = applyLearnResult(products, knowledge, d);
      const hasChange =
        learned.summary.length > 0 &&
        !learned.summary.every((s) => s.includes("Không"));

      if (
        (d.updatePrices && d.updatePrices.length) ||
        (d.newProducts && d.newProducts.length) ||
        (d.knowledgeToSave && d.knowledgeToSave.length)
      ) {
        setProducts(learned.products);
        setKnowledge(learned.knowledge);
      }

      const reply = d.message || "Đã xử lý.";

      setMsgs((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: reply,
          changes: hasChange ? learned.summary : undefined,
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: e instanceof Error ? e.message : "Không gọi được AI.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <div className="badge">BUSINESS AGENT</div>
        <h2 className="hero text-3xl">Agent bảng giá.</h2>
        <p className="muted mt-2">
          Chat như bot: hỏi giá, bảo đổi giá / thêm mã — agent tự lưu vào danh mục công ty.
        </p>
      </div>

      <div className="card flex flex-col h-[min(70vh,640px)]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-8 rounded-2xl bg-[#111a2d] text-white px-4 py-3 text-sm"
                  : "mr-8 rounded-2xl bg-[#f3f5f8] px-4 py-3 text-sm"
              }
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.changes && m.changes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200/60 text-xs text-emerald-800 space-y-0.5">
                  <div className="font-semibold">Đã lưu vào app:</div>
                  {m.changes.map((c, i) => (
                    <div key={i}>• {c}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="mr-8 rounded-2xl bg-[#f3f5f8] px-4 py-3 text-sm text-[#8a93a1]">
              Agent đang nghĩ…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t p-3 flex gap-2">
          <input
            className="field flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder='Vd: "Tủ MDF giá bao nhiêu?" hoặc "Đổi TB-PLY-M thành 2.900.000"'
            disabled={busy}
          />
          <button type="button" className="primary shrink-0" disabled={busy} onClick={send}>
            Gửi
          </button>
        </div>
      </div>

      <div className="text-xs text-[#8a93a1]">
        Gợi ý: hỏi giá theo tên · "thêm mã XX giá Y" · "đổi giá … thành …" · "lưu lại"
      </div>
    </div>
  );
}
