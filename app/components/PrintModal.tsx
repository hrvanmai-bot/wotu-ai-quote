"use client";

import { groupBySection, money, QuoteState, totals } from "../../lib/quote-engine";
import { AppSettings } from "../../lib/settings";

export function PrintModal({
  quote,
  settings,
  onClose,
}: {
  quote: QuoteState;
  settings: AppSettings;
  onClose: () => void;
}) {
  const t = totals(quote);
  const sections = groupBySection(quote.items);
  let stt = 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center py-8 px-4">
        <div className="no-print flex gap-3 mb-4 sticky top-4 z-10">
          <button className="primary" onClick={() => window.print()}>
            In / Save as PDF
          </button>
          <button className="secondary" onClick={onClose}>
            Dong
          </button>
        </div>

        <div className="print-area bg-white w-full max-w-[800px] p-8 shadow-xl rounded-lg">
          <div className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <div className="text-xl font-bold">{settings.companyName || "WOTU"}</div>
              {settings.companyAddress && (
                <div className="text-xs text-gray-500 mt-1">{settings.companyAddress}</div>
              )}
              {settings.companyPhone && (
                <div className="text-xs text-gray-500">DT: {settings.companyPhone}</div>
              )}
              {settings.companyEmail && (
                <div className="text-xs text-gray-500">{settings.companyEmail}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">BAO GIA</div>
              <div className="text-sm">{quote.quoteNumber}</div>
              <div className="text-xs text-gray-500">
                {new Date(quote.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-6">
            <div>
              <b>Khach hang:</b> {quote.customer || "—"}
            </div>
            <div>
              <b>Cong trinh:</b> {quote.project || "—"}
            </div>
            {quote.customerPhone && (
              <div>
                <b>Dien thoai:</b> {quote.customerPhone}
              </div>
            )}
            {quote.customerAddress && (
              <div>
                <b>Dia chi:</b> {quote.customerAddress}
              </div>
            )}
          </div>

          <table className="print-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Ma</th>
                <th>Hang muc</th>
                <th>DVT</th>
                <th className="num">KL</th>
                <th className="num">Don gia</th>
                <th className="num">Thanh tien</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(([section, items]) => (
                <>
                  <tr key={section}>
                    <td colSpan={7} className="print-section">
                      {section}
                    </td>
                  </tr>
                  {items.map((i) => {
                    stt += 1;
                    return (
                      <tr key={i.id}>
                        <td className="center">{stt}</td>
                        <td>{i.code}</td>
                        <td>
                          {i.name}
                          {i.material ? (
                            <div className="text-[11px] text-gray-500">{i.material}</div>
                          ) : null}
                        </td>
                        <td className="center">{i.unit}</td>
                        <td className="num">{i.qty}</td>
                        <td className="num">{money(i.unitPrice)}</td>
                        <td className="num">{money(i.qty * i.unitPrice)}</td>
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>

          <div className="mt-6 ml-auto max-w-xs text-sm space-y-1">
            <div className="flex justify-between">
              <span>Tam tinh</span>
              <b>{money(t.subtotal)}</b>
            </div>
            {quote.discount > 0 && (
              <div className="flex justify-between">
                <span>Chiet khau ({quote.discount}%)</span>
                <b>- {money(t.discount)}</b>
              </div>
            )}
            {quote.vat > 0 && (
              <div className="flex justify-between">
                <span>VAT ({quote.vat}%)</span>
                <b>{money(t.vat)}</b>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base">
              <b>TONG CONG</b>
              <b>{money(t.total)}</b>
            </div>
          </div>

          {quote.note && (
            <div className="mt-6 text-sm">
              <b>Ghi chu:</b> {quote.note}
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
              <div className="font-semibold">Nguoi lap</div>
              <div className="text-xs text-gray-400 mt-16">(Ky, ghi ro ho ten)</div>
            </div>
            <div>
              <div className="font-semibold">Khach hang</div>
              <div className="text-xs text-gray-400 mt-16">(Ky, ghi ro ho ten)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
