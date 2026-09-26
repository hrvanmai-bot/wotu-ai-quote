"use client";

import { money, QuoteState, QuoteHistory } from "../../lib/quote-engine";

export function HistoryPage({
  history,
  onOpen,
}: {
  history: QuoteHistory[];
  onOpen: (q: QuoteState) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="badge">QUOTE HISTORY</div>
        <h2 className="hero text-3xl">Lịch sử báo giá.</h2>
        <p className="muted mt-2">Mỗi phiên lưu snapshot để có thể mở lại.</p>
      </div>
      <div className="card overflow-hidden">
        {history.length === 0 ? (
          <div className="p-16 text-center muted">Chưa có lịch sử.</div>
        ) : (
          history.map((h) => (
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
