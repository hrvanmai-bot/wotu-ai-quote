"use client";

import { money, QuoteState, QuoteHistory } from "../../lib/quote-engine";

export function HistoryPage({
  history,
  quotes,
  onOpen,
}: {
  history: QuoteHistory[];
  quotes?: QuoteState[];
  onOpen: (q: QuoteState) => void;
}) {
  const fromQuotes = (quotes || []).map((q) => ({
    id: q.id,
    time: q.updatedAt || q.createdAt,
    action: "Đã lưu",
    total: q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    snapshot: q,
  }));

  const rows =
    fromQuotes.length > 0
      ? fromQuotes
      : history.map((h) => ({
          id: h.id,
          time: h.time,
          action: h.action,
          total: h.total,
          snapshot: h.snapshot,
        }));

  return (
    <div className="space-y-5">
      <div>
        <div className="badge">BÁO GIÁ ĐÃ LÀM</div>
        <h2 className="hero text-3xl">Báo giá đã làm.</h2>
        <p className="muted mt-2">Các bản báo giá đã lưu trên thiết bị này.</p>
      </div>
      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-16 text-center muted">Chưa có báo giá nào.</div>
        ) : (
          rows.map((h) => (
            <div
              className="p-5 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              key={h.id}
            >
              <div>
                <b>{h.snapshot.project || "Báo giá chưa đặt tên"}</b>
                <div className="text-xs text-[#8992a0] mt-1">
                  {h.snapshot.customer || "Chưa có khách"} ·{" "}
                  {new Date(h.time).toLocaleString("vi-VN")} · {h.action}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <b>{money(h.total)}</b>
                <button className="secondary" onClick={() => onOpen(h.snapshot)}>
                  Mở lại
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
