"use client";

import { useState } from "react";
import { money, Product } from "../../lib/quote-engine";
import { Modal } from "./Modal";

export function PriceBook({
  products,
  add,
  update,
  remove,
}: {
  products: Product[];
  add: (p: Product) => void;
  update: (p: Product) => void;
  remove: (c: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Tất cả");
  const [show, setShow] = useState(false);
  const cats = ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))];
  const list = products.filter(
    (p) =>
      (cat === "Tất cả" || p.category === cat) &&
      (p.code + " " + p.name + " " + p.material).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <div className="badge">MASTER PRICE BOOK</div>
          <h2 className="hero text-3xl">Bảng giá tổng.</h2>
          <p className="muted mt-2">Kho dữ liệu trung tâm. AI và báo giá lấy từ đây.</p>
        </div>
        <button className="primary shrink-0" onClick={() => setShow(true)}>
          ＋ Thêm mã
        </button>
      </div>
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <input className="field flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên..." />
        <select className="field sm:max-w-[190px]" value={cat} onChange={(e) => setCat(e.target.value)}>
          {cats.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#fafbfc] text-[10px] uppercase tracking-wider text-[#8992a0]">
                <th className="text-left p-4">Mã</th>
                <th className="text-left">Hạng mục</th>
                <th className="text-left">Nhóm</th>
                <th className="text-left">ĐVT</th>
                <th className="text-right">Đơn giá</th>
                <th className="text-center">Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr className="border-b last:border-0" key={p.code}>
                  <td className="p-4 font-mono text-xs text-[#9a7441]">{p.code}</td>
                  <td>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[#9aa2ae]">{p.material}</div>
                  </td>
                  <td>{p.category}</td>
                  <td>{p.unit}</td>
                  <td className="text-right font-semibold">{money(p.price)}</td>
                  <td className="text-center">
                    <button onClick={() => update({ ...p, active: !p.active })} className={p.active ? "status-on" : "status-off"}>
                      {p.active ? "Đang dùng" : "Đang ẩn"}
                    </button>
                  </td>
                  <td className="text-right p-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        const v = prompt("Đơn giá mới", String(p.price));
                        if (v != null) update({ ...p, price: Number(v) || p.price });
                      }}
                      className="text-xs underline mr-3"
                    >
                      Sửa giá
                    </button>
                    <button onClick={() => remove(p.code)} className="text-xs text-red-500">
                      Ẩn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && (
        <ProductModal
          onClose={() => setShow(false)}
          onSave={(p) => {
            add(p);
            setShow(false);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Product) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Nội thất");
  const [unit, setUnit] = useState("MD");
  const [price, setPrice] = useState("");
  const [material, setMaterial] = useState("");
  return (
    <Modal title="Thêm mã vào bảng giá tổng" onClose={onClose}>
      <div className="grid gap-3">
        <input className="field" placeholder="Mã sản phẩm" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="field" placeholder="Tên hạng mục" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" placeholder="Nhóm" value={category} onChange={(e) => setCategory(e.target.value)} />
        <input className="field" placeholder="Đơn vị" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input className="field" placeholder="Đơn giá" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className="field" placeholder="Vật liệu" value={material} onChange={(e) => setMaterial(e.target.value)} />
      </div>
      <button
        className="primary w-full mt-4"
        onClick={() =>
          code &&
          name &&
          price &&
          onSave({
            code: code.toUpperCase(),
            name,
            category,
            unit,
            price: Number(price),
            material,
            active: true,
          })
        }
      >
        Lưu vào bảng giá tổng
      </button>
    </Modal>
  );
}
