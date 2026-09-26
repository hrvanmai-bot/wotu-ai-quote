"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  catalog,
  emptyQuote,
  Product,
  QuoteState,
  Knowledge,
  QuoteHistory,
  totals,
} from "../lib/quote-engine";
import { defaultSettings, AppSettings } from "../lib/settings";
import { Dashboard } from "./components/Dashboard";
import { PriceBook } from "./components/PriceBook";
import { QuoteEditor } from "./components/QuoteEditor";
import { PrintModal } from "./components/PrintModal";
import { KnowledgePage } from "./components/KnowledgePage";
import { HistoryPage } from "./components/HistoryPage";
import { SettingsPage } from "./components/SettingsPage";
import { BusinessAgent } from "./components/BusinessAgent";
import { ADMIN_EMAIL } from "../lib/roles";

const NAV_ADMIN: [string, string][] = [
  ["Tổng quan", "⌂"],
  ["Bảng giá tổng", "▦"],
  ["Làm báo giá", "＋"],
  ["Business Agent", "◎"],
  ["Kiến thức AI", "✦"],
  ["Lịch sử", "↺"],
  ["Cài đặt", "⚙"],
];

const NAV_USER: [string, string][] = [
  ["Làm báo giá", "＋"],
];

export default function Home() {
  const { data: session, status } = useSession();
  const isAdmin =
    Boolean((session?.user as any)?.isAdmin) ||
    (session?.user?.email || "").toLowerCase() === ADMIN_EMAIL;
  const NAV = isAdmin ? NAV_ADMIN : NAV_USER;
  const [active, setActive] = useState("Làm báo giá");
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [quotes, setQuotes] = useState<QuoteState[]>([]);
  const [products, setProducts] = useState<Product[]>(catalog);
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [history, setHistory] = useState<QuoteHistory[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    try {
      const get = (k: string, d: any) =>
        JSON.parse(localStorage.getItem(k) || "null") ?? d;
      setProducts(get("wotu_products", catalog));
      setKnowledge(get("wotu_knowledge", []));
      setHistory(get("wotu_history", []));
      setQuotes(get("wotu_quotes", []));
      const s = get("wotu_settings", defaultSettings);
      setSettings({ ...defaultSettings, ...s });
      const q = get("wotu_current_quote", null);
      if (q) {
        setQuote({
          ...emptyQuote(s?.quotePrefix || "BG-WOTU"),
          ...q,
          quoteNumber: q.quoteNumber || emptyQuote().quoteNumber,
          vat: q.vat ?? s?.defaultVat ?? 0,
          discount: q.discount ?? 0,
        });
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("wotu_products", JSON.stringify(products));
    localStorage.setItem("wotu_knowledge", JSON.stringify(knowledge));
    localStorage.setItem("wotu_history", JSON.stringify(history));
    localStorage.setItem("wotu_quotes", JSON.stringify(quotes));
    localStorage.setItem("wotu_settings", JSON.stringify(settings));
    if (quote)
      localStorage.setItem("wotu_current_quote", JSON.stringify(quote));
    else localStorage.removeItem("wotu_current_quote");
  }, [loaded, products, knowledge, history, quotes, settings, quote]);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin && active !== "Làm báo giá") {
      setActive("Làm báo giá");
    }
  }, [status, isAdmin, active]);

  function newQuote() {
    const q = emptyQuote(settings.quotePrefix);
    q.vat = settings.defaultVat;
    setQuote(q);
    setActive("Làm báo giá");
  }

  function saveQuote(q: QuoteState) {
    const next = [q, ...quotes.filter((x) => x.id !== q.id)];
    setQuotes(next);
    setQuote(q);
  }

  function record(action: string, q: QuoteState) {
    const h: QuoteHistory = {
      id: crypto.randomUUID(),
      quoteId: q.id,
      time: new Date().toISOString(),
      action,
      total: totals(q).total,
      snapshot: structuredClone(q),
    };
    setHistory((x) => [h, ...x].slice(0, 100));
  }

  function finishQuote() {
    if (!quote) return;
    saveQuote(quote);
    record("Lưu báo giá", quote);
  }

  function openQuote(q: QuoteState) {
    setQuote(
      structuredClone({
        ...emptyQuote(settings.quotePrefix),
        ...q,
        vat: q.vat ?? 0,
        discount: q.discount ?? 0,
      })
    );
    setActive("Làm báo giá");
  }

  function updateProduct(p: Product) {
    setProducts((x) => x.map((v) => (v.code === p.code ? p : v)));
  }

  function addProduct(p: Product) {
    if (products.some((x) => x.code === p.code)) {
      alert("Mã sản phẩm đã tồn tại.");
      return;
    }
    setProducts((x) => [...x, p]);
  }

  function removeProduct(code: string) {
    if (confirm("Ẩn mã này khỏi AI và bảng giá?")) {
      setProducts((x) =>
        x.map((p) => (p.code === code ? { ...p, active: false } : p))
      );
    }
  }

  if (!loaded || status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center text-[#8a93a1]">
        Đang mở WOTU…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen grid place-items-center text-[#8a93a1]">
        Đang chuyển đăng nhập…
      </div>
    );
  }

  return (
    <main className="min-h-screen flex bg-[#f5f6f8] text-[#172033] page-pad-mobile">
      <aside className="hidden lg:flex w-[255px] bg-[#111a2d] text-white flex-col p-4 sticky top-0 h-screen no-print">
        <div className="flex items-center gap-3 px-3 py-4 mb-7">
          <div className="w-10 h-10 rounded-xl bg-white text-[#111a2d] grid place-items-center font-black">W</div>
          <div>
            <div className="font-bold">WOTU</div>
            <div className="text-[10px] tracking-[.28em] text-white/40">QUOTATION SYSTEM</div>
          </div>
        </div>
        <div className="px-3 text-[10px] uppercase tracking-[.2em] text-white/30 mb-3">Hệ thống</div>
        {NAV.map(([n, icon]) => (
          <button
            key={n}
            onClick={() => setActive(n)}
            className={
              "flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl text-sm mb-1 " +
              (active === n ? "bg-white text-[#111a2d]" : "text-white/65 hover:bg-white/5")
            }
          >
            <span className="w-5 text-center">{icon}</span>
            {n}
          </button>
        ))}
        <div className="mt-auto rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-wider text-white/35">Tài khoản</div>
          <div className="mt-2 text-sm truncate">{session?.user?.email}</div>
          <div className="text-xs text-white/45">{isAdmin ? "Admin · full quyền" : "Chỉ làm báo giá"}</div>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <header className="h-[74px] bg-white/90 backdrop-blur border-b flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 no-print">
          <div>
            <div className="text-[11px] text-[#929aa7]">WOTU / {active}</div>
            <h1 className="font-semibold mt-0.5">{active}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-[#8a93a1] max-w-[180px] truncate">
              {session?.user?.email}
              {isAdmin ? " · Admin" : ""}
            </span>
            <button className="primary" onClick={newQuote}>＋ Báo giá mới</button>
            <button type="button" className="secondary text-xs" onClick={() => signOut({ callbackUrl: "/login" })}>
              Thoát
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
          {active === "Tổng quan" && isAdmin && (
            <Dashboard quote={quote} quotes={quotes} products={products} knowledge={knowledge} newQuote={newQuote} go={setActive} />
          )}
          {active === "Bảng giá tổng" && isAdmin && (
            <PriceBook products={products} add={addProduct} update={updateProduct} remove={removeProduct} settings={settings} setProducts={setProducts} />
          )}
          {active === "Làm báo giá" && (
            <QuoteEditor
              quote={quote}
              products={products}
              knowledge={knowledge}
              settings={settings}
              setQuote={setQuote}
              setProducts={setProducts}
              setKnowledge={setKnowledge}
              save={finishQuote}
              newQuote={newQuote}
              record={record}
              onPrint={() => setShowPrint(true)}
            />
          )}
          {active === "Business Agent" && isAdmin && (
            <BusinessAgent
              settings={settings}
              products={products}
              knowledge={knowledge}
              setProducts={setProducts}
              setKnowledge={setKnowledge}
            />
          )}
          {active === "Kiến thức AI" && isAdmin && (
            <KnowledgePage knowledge={knowledge} setKnowledge={setKnowledge} />
          )}
          {active === "Lịch sử" && isAdmin && (
            <HistoryPage history={history} onOpen={openQuote} />
          )}
          {active === "Cài đặt" && isAdmin && (
            <SettingsPage
              settings={settings}
              setSettings={setSettings}
              products={products}
              knowledge={knowledge}
              quotes={quotes}
              setProducts={setProducts}
              setKnowledge={setKnowledge}
              setQuotes={setQuotes}
            />
          )}
        </div>
      </section>

      <nav className="mobile-nav no-print">
        {NAV.map(([n, icon]) => (
          <button key={n} className={active === n ? "active" : ""} onClick={() => setActive(n)}>
            <span className="text-base">{icon}</span>
            <span className="truncate max-w-[56px]">{n.split(" ")[0]}</span>
          </button>
        ))}
      </nav>

      {showPrint && quote && (
        <PrintModal quote={quote} settings={settings} onClose={() => setShowPrint(false)} />
      )}
    </main>
  );
}
