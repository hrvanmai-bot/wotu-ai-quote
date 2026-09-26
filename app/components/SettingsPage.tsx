"use client";

import { useRef } from "react";
import { Product, QuoteState, Knowledge } from "../../lib/quote-engine";
import { defaultSettings, AppSettings } from "../../lib/settings";
import { TeachPanel } from "./TeachPanel";

export function SettingsPage({
  settings,
  setSettings,
  products,
  knowledge,
  quotes,
  setProducts,
  setKnowledge,
  setQuotes,
}: {
  settings: AppSettings;
  setSettings: (x: AppSettings) => void;
  products: Product[];
  knowledge: Knowledge[];
  quotes: QuoteState[];
  setProducts: (x: Product[]) => void;
  setKnowledge: (x: Knowledge[]) => void;
  setQuotes: (x: QuoteState[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function backup() {
    const blob = new Blob(
      [JSON.stringify({ products, knowledge, quotes, settings, version: 2 }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wotu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function restore(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.products) setProducts(data.products);
        if (data.knowledge) setKnowledge(data.knowledge);
        if (data.quotes) setQuotes(data.quotes);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        alert("Khôi phục thành công!");
      } catch {
        alert("File không hợp lệ.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <div className="badge">SYSTEM SETTINGS</div>
        <h2 className="hero text-3xl">Cài đặt.</h2>
        <p className="muted mt-2">Cấu hình ứng dụng, API key và dạy AI.</p>
      </div>

      <section className="card p-6">
        <h3 className="font-semibold">AI & API Key</h3>
        <p className="muted mt-1">Key lưu trên thiết bị (localStorage), không đưa lên git.</p>
        <label className="block text-sm font-medium mt-4">OPENAI_API_KEY</label>
        <div className="flex gap-2 mt-2">
          <input
            className="field flex-1 font-mono text-xs"
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="sk-..."
            autoComplete="off"
          />
          <button
            type="button"
            className="secondary shrink-0"
            onClick={() =>
              alert(settings.apiKey.trim() ? "Đã lưu API key trên thiết bị này." : "Chưa nhập API key.")
            }
          >
            Lưu key
          </button>
        </div>
        <div className="mt-2 text-xs">
          {settings.apiKey.trim() ? (
            <span className="text-emerald-600">● Đã có key trên thiết bị</span>
          ) : (
            <span className="text-[#8a93a1]">○ Chưa có key — dùng key Vercel nếu có</span>
          )}
        </div>
        <label className="block text-sm font-medium mt-5">Model AI</label>
        <input
          className="field mt-2"
          value={settings.model}
          onChange={(e) => setSettings({ ...settings, model: e.target.value })}
          placeholder="gpt-4o-mini"
        />
      </section>

      <TeachPanel
        settings={settings}
        products={products}
        knowledge={knowledge}
        setProducts={setProducts}
        setKnowledge={setKnowledge}
      />

      <section className="card p-6">
        <h3 className="font-semibold">Thông tin công ty</h3>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <input className="field" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} placeholder="Tên đơn vị" />
          <input className="field" value={settings.quotePrefix} onChange={(e) => setSettings({ ...settings, quotePrefix: e.target.value })} placeholder="Tiền tố số BG" />
          <input className="field" value={settings.companyPhone} onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} placeholder="Điện thoại" />
          <input className="field" value={settings.companyEmail} onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} placeholder="Email" />
          <input className="field sm:col-span-2" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} placeholder="Địa chỉ" />
        </div>
        <label className="block text-sm font-medium mt-4">VAT mặc định (%)</label>
        <input
          className="field mt-2 max-w-[160px]"
          type="number"
          value={settings.defaultVat}
          onChange={(e) => setSettings({ ...settings, defaultVat: Number(e.target.value) || 0 })}
        />
      </section>

      <section className="card p-6">
        <h3 className="font-semibold">Sao lưu & khôi phục</h3>
        <div className="flex flex-wrap gap-3 mt-4">
          <button className="primary" onClick={backup}>Tải backup JSON</button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>Khôi phục từ file</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        </div>
      </section>
    </div>
  );
}
