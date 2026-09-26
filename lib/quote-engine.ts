export type Product = {
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  material: string;
  active: boolean;
  note?: string;
};

export type QuoteItem = {
  id: string;
  section: string;
  name: string;
  description: string;
  unit: string;
  qty: number;
  unitPrice: number;
  material?: string;
  code?: string;
  note?: string;
};

export type QuoteState = {
  id: string;
  quoteNumber: string;
  customer: string;
  customerPhone?: string;
  customerAddress?: string;
  project: string;
  items: QuoteItem[];
  discount: number;
  vat: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type Knowledge = {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  createdAt: string;
};

export type QuoteHistory = {
  id: string;
  quoteId: string;
  time: string;
  action: string;
  total: number;
  snapshot: QuoteState;
};

export const catalog: Product[] = [
  { code: "TB-IN-A", name: "Tủ bếp dưới Inox 304 - Cánh Acrylic", category: "Tủ bếp", unit: "MD", price: 4650000, material: "Inox 304 / Acrylic", active: true },
  { code: "TB-PLY-M", name: "Tủ bếp trên Plywood - Melamine", category: "Tủ bếp", unit: "MD", price: 2800000, material: "Plywood phủ Melamine", active: true },
  { code: "TB-PLY-A", name: "Tủ bếp cao kịch trần Plywood - Acrylic", category: "Tủ bếp", unit: "MD", price: 2950000, material: "Plywood / Acrylic", active: true },
  { code: "GLASS-008", name: "Kính ốp bếp cường lực 8mm", category: "Bếp", unit: "MD", price: 900000, material: "Kính cường lực", active: true },
  { code: "STONE-LAMAR", name: "Đá Lamar mặt bếp và bàn đảo", category: "Bếp", unit: "MD", price: 2250000, material: "Đá Lamar", active: true },
  { code: "GAR-GP0280E", name: "Giá xoong nồi Garis GP02.80E", category: "Phụ kiện bếp", unit: "Cái", price: 3650000, material: "Inox 304", active: true },
  { code: "LED-001", name: "Hệ LED hắt sáng", category: "Điện / LED", unit: "MD", price: 250000, material: "Nhôm định hình + Adapter", active: true },
  { code: "SENSOR-001", name: "Cảm biến LED", category: "Điện / LED", unit: "Cái", price: 150000, material: "Cảm biến", active: true },
  { code: "RAY-001", name: "Ray giảm chấn", category: "Phụ kiện", unit: "Bộ", price: 450000, material: "Ray giảm chấn", active: true },
  { code: "TR-THACHCAO-001", name: "Trần thạch cao khung chìm", category: "Trần", unit: "m²", price: 185000, material: "Khung xương + tấm thạch cao", active: true },
  { code: "PLY-WARDROBE", name: "Tủ quần áo cánh mở Plywood - Melamine", category: "Tủ áo", unit: "m²", price: 2650000, material: "Plywood phủ Melamine", active: true },
  { code: "BED-18", name: "Giường ngủ 1m8 Plywood - Melamine", category: "Phòng ngủ", unit: "Bộ", price: 6500000, material: "Plywood phủ Melamine", active: true },
  { code: "LAVABO-CB", name: "Combo tủ Lavabo", category: "Phòng tắm", unit: "Bộ", price: 6500000, material: "Nhựa chống nước", active: true },
];

export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n || 0)) + " ₫";

export function totals(q: QuoteState) {
  const subtotal = q.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const discountAmt = subtotal * (q.discount || 0) / 100;
  const afterDiscount = subtotal - discountAmt;
  const vatAmt = afterDiscount * (q.vat || 0) / 100;
  return {
    subtotal,
    discount: discountAmt,
    afterDiscount,
    vat: vatAmt,
    total: afterDiscount + vatAmt,
  };
}

export function emptyQuote(prefix = "BG-WOTU"): QuoteState {
  const now = new Date();
  const d = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(Math.random() * 900 + 100);
  return {
    id: crypto.randomUUID(),
    quoteNumber: `${prefix}-${d}-${rand}`,
    customer: "",
    customerPhone: "",
    customerAddress: "",
    project: "",
    items: [],
    discount: 0,
    vat: 0,
    note: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function applyAICommand(
  state: QuoteState,
  data: any,
  products: Product[]
): QuoteState {
  const next = structuredClone(state);
  if (data.action === "create") next.items = [];
  for (const code of data.removeCodes || []) {
    next.items = next.items.filter((i) => i.code !== code);
  }
  for (const x of data.items || []) {
    const p = products.find((p) => p.code === x.code && p.active);
    if (!p) continue;
    const existing = next.items.find((i) => i.code === p.code);
    const item: QuoteItem = {
      id: existing?.id || crypto.randomUUID(),
      section: existing?.section || p.category,
      name: p.name,
      description: p.material,
      unit: p.unit,
      qty: x.qty,
      unitPrice: x.unitPrice ?? p.price,
      material: p.material,
      code: p.code,
      note: existing?.note || "",
    };
    if (existing) Object.assign(existing, item);
    else next.items.push(item);
  }
  if (data.discount !== null && data.discount !== undefined) {
    next.discount = data.discount;
  }
  next.updatedAt = new Date().toISOString();
  return next;
}

export function groupBySection(items: QuoteItem[]) {
  const map = new Map<string, QuoteItem[]>();
  for (const item of items) {
    const key = item.section || "Khác";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries());
}

export function exportCSV(q: QuoteState, companyName: string) {
  const t = totals(q);
  const rows: string[][] = [
    ["BÁO GIÁ", q.quoteNumber],
    ["Đơn vị", companyName],
    ["Khách hàng", q.customer],
    ["Điện thoại", q.customerPhone || ""],
    ["Địa chỉ", q.customerAddress || ""],
    ["Công trình", q.project],
    ["Ngày", new Date(q.createdAt).toLocaleDateString("vi-VN")],
    [],
    ["STT", "Mã", "Hạng mục", "Vật liệu", "ĐVT", "Khối lượng", "Đơn giá", "Thành tiền", "Ghi chú"],
  ];
  let stt = 1;
  for (const [section, items] of groupBySection(q.items)) {
    rows.push([`=== ${section} ===`]);
    for (const i of items) {
      rows.push([
        String(stt++),
        i.code || "",
        i.name,
        i.material || i.description || "",
        i.unit,
        String(i.qty),
        String(i.unitPrice),
        String(i.qty * i.unitPrice),
        i.note || "",
      ]);
    }
  }
  rows.push([]);
  rows.push(["", "", "", "", "", "", "Tạm tính", String(t.subtotal)]);
  rows.push(["", "", "", "", "", "", `Chiết khấu (${q.discount}%)`, String(-t.discount)]);
  rows.push(["", "", "", "", "", "", `VAT (${q.vat}%)`, String(t.vat)]);
  rows.push(["", "", "", "", "", "", "TỔNG CỘNG", String(t.total)]);
  if (q.note) rows.push([], ["Ghi chú", q.note]);

  const bom = "\uFEFF";
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\n");
  return bom + csv;
}

export function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
