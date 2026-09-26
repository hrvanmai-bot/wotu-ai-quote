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
        <div className="badge">TỔNG QUAN</div>
        <h2 className="hero text-3xl mt-2">
          Xin chào,
          <br />
          <span className="text-[#c41e2a]">WOTU Design Build</span>
        </h2>
        <p className="muted mt-3 max-w-2xl text-sm leading-relaxed">
          Quản lý bảng giá và lập báo giá nhanh. Dùng AI để soạn hạng mục, chỉnh
          giá và xuất bản in.
        </p>
        <button className="primary mt-6" onClick={newQuote}>
          ＋ Tạo báo giá mới
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Mã đang dùng", products.filter((p) => p.active).length],
          ["Báo giá đã lưu", quotes.length],
          ["Ghi chú AI", knowledge.filter((k) => k.enabled).length],
          ["Báo giá hiện tại", quote ? money(totals(quote).total) : "—"],
        ].map(([label, val]) => (
          <div className="card p-5" key={String(label)}>
            <div className="muted text-xs">{label}</div>
            <div className="text-2xl font-semibold mt-2">{val}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Action
          title="Bảng giá"
          text="Xem và cập nhật danh mục sản phẩm."
          onClick={() => go("Bảng giá tổng")}
        />
        <Action
          title="Làm báo giá"
          text="Tạo mới, chỉnh hạng mục, in PDF."
          onClick={() => go("Làm báo giá")}
        />
        <Action
          title="Cài đặt"
          text="Thông tin công ty, VAT, sao lưu."
          onClick={() => go("Cài đặt")}
        />
      </div>
    </div>
  );
}

function Action({
  title,
  text,
  onClick,
}: {
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-5 text-left hover:-translate-y-0.5 transition"
    >
      <div className="font-semibold">{title} →</div>
      <div className="muted mt-2 text-sm">{text}</div>
    </button>
  );
}
