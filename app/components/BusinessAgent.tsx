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
      text: "Xin chào. Bạn có thể hỏi giá, thêm mã hoặc yêu cầu đổi giá. Khi xác nhận lưu, hệ thống sẽ cập nhật bảng giá.",
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
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);

    try {
      const r = await fetch("/api/ai-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Trợ lý bảng giá WOTU. Hỏi giá thì trả lời; đổi/thêm/lưu giá thì điền updatePrices/newProducts/knowledgeToSave. Tiếng Việt ngắn gọn.\nUser: ${text}`,
          products,
          knowledge,
          model: settings.model,
          apiKey: settings.apiKey,
          provider: settings.provider || "gemini",
          mode: "teach",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Không xử lý được");
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
      setMsgs((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: d.message || "Đã xử lý.",
          changes: hasChange ? learned.summary : undefined,
        },
      ]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: e instanceof Error ? e.message : "Có lỗi xảy ra.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <div className="badge">HỖ TRỢ BẢNG GIÁ</div>
        <h2 className="hero text-3xl">Hỗ trợ bảng giá</h2>
        <p className="muted mt-2">Tra cứu giá hoặc cập nhật danh mục sản phẩm.</p>
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
                  <div className="font-semibold">Đã cập nhật:</div>
                  {m.changes.map((c, i) => (
                    <div key={i}>• {c}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="mr-8 rounded-2xl bg-[#f3f5f8] px-4 py-3 text-sm text-[#8a93a1]">
              Đang xử lý…
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
            placeholder='Ví dụ: "Tủ MDF giá bao nhiêu?"'
            disabled={busy}
          />
          <button type="button" className="primary shrink-0" disabled={busy} onClick={send}>
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
