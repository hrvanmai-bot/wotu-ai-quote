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
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  products: Product[];
  knowledge: Knowledge[];
  quotes: QuoteState[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setKnowledge: React.Dispatch<React.SetStateAction<Knowledge[]>>;
  setQuotes: React.Dispatch<React.SetStateAction<QuoteState[]>>;
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
        alert("Khoi phuc thanh cong!");
      } catch {
        alert("File khong hop le.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <div className="badge">SYSTEM SETTINGS</div>
        <h2 className="hero text-3xl">Cai dat.</h2>
        <p className="muted mt-2">Cau hinh ung dung, API key va day AI.</p>
      </div>

      <section className="card p-6">
        <h3 className="font-semibold">AI & API Key</h3>
        <p className="muted mt-1">Key luu tren thiet bi (localStorage).</p>
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
              alert(settings.apiKey.trim() ? "Da luu API key." : "Chua nhap API key.")
            }
          >
            Luu key
          </button>
        </div>
        <div className="mt-2 text-xs">
          {settings.apiKey.trim() ? (
            <span className="text-emerald-600">Da co key</span>
          ) : (
            <span className="text-[#8a93a1]">Chua co key</span>
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
        <h3 className="font-semibold">Thong tin cong ty</h3>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <input className="field" value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} placeholder="Ten don vi" />
          <input className="field" value={settings.quotePrefix} onChange={(e) => setSettings({ ...settings, quotePrefix: e.target.value })} placeholder="Tien to so BG" />
          <input className="field" value={settings.companyPhone} onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })} placeholder="Dien thoai" />
          <input className="field" value={settings.companyEmail} onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })} placeholder="Email" />
          <input className="field sm:col-span-2" value={settings.companyAddress} onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })} placeholder="Dia chi" />
        </div>
        <label className="block text-sm font-medium mt-4">VAT mac dinh (%)</label>
        <input
          className="field mt-2 max-w-[160px]"
          type="number"
          value={settings.defaultVat}
          onChange={(e) => setSettings({ ...settings, defaultVat: Number(e.target.value) || 0 })}
        />
      </section>

      <section className="card p-6">
        <h3 className="font-semibold">Sao luu & khoi phuc</h3>
        <div className="flex flex-wrap gap-3 mt-4">
          <button className="primary" onClick={backup}>Tai backup JSON</button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>Khoi phuc tu file</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        </div>
      </section>
    </div>
  );
}
