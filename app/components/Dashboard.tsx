"use client";

import { money, Product, QuoteState, Knowledge, totals } from "../../lib/quote-engine";

export function Dashboard({
  quote,
  quotes,
  products,
  knowledge,
  newQuote,
  go,
}: {
  quote: QuoteState | null;
  quotes: QuoteState[];
  products: Product[];
  knowledge: Knowledge[];
  newQuote: () => void;
  go: (x: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="card p-7">
        <div className="badge">WOTU QUOTATION SYSTEM</div>
        <h2 className="hero">
          Quản lý báo giá tập trung.
          <br />
          <span>AI chỉ là trợ lý.</span>
        </h2>
        <p className="muted mt-3 max-w-2xl">
          Bảng giá tổng là nguồn dữ liệu. Mỗi báo giá là một hồ sơ riêng.
        </p>
        <button className="primary mt-6" onClick={newQuote}>
          ＋ Tạo báo giá mới
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Mã sản phẩm", products.filter((p) => p.active).length],
          ["Báo giá đã lưu", quotes.length],
          ["Kiến thức bật", knowledge.filter((k) => k.enabled).length],
          ["Báo giá hiện tại", quote ? money(totals(quote).total) : "Chưa tạo"],
        ].map(([label, val]) => (
          <div className="card p-5" key={String(label)}>
            <div className="muted">{label}</div>
            <div className="text-2xl font-semibold mt-2">{val}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Action title="Bảng giá tổng" text="Quản lý mã, đơn vị, vật liệu, giá." onClick={() => go("Bảng giá tổng")} />
        <Action title="Làm báo giá" text="Tạo báo giá, xuất PDF / Excel." onClick={() => go("Làm báo giá")} />
        <Action title="Cài đặt" text="API key, AI, VAT, sao lưu." onClick={() => go("Cài đặt")} />
      </div>
    </div>
  );
}

function Action({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-5 text-left hover:-translate-y-0.5 transition">
      <div className="font-semibold">{title} →</div>
      <div className="muted mt-2">{text}</div>
    </button>
  );
}
