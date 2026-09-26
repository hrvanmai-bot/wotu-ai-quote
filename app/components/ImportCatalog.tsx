"use client";

import { useRef, useState } from "react";
import { money, Product } from "../../lib/quote-engine";
import { AppSettings } from "../../lib/settings";
import { Modal } from "./Modal";

type Conflict = {
  matchType: "code" | "name";
  existing: Product;
  incoming: Product;
};

type ConflictChoice = "overwrite" | "skip" | "rename";

function fileToBase64(file: File): Promise<{ mime: string; data: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const m = result.match(/^data:([^;]+);base64,(.+)$/);
      if (m) {
        resolve({ mime: m[1], data: m[2], name: file.name });
      } else {
        const b64 = btoa(unescape(encodeURIComponent(result)));
        resolve({
          mime: file.type || "text/plain",
          data: b64,
          name: file.name,
        });
      }
    };
    reader.onerror = () => reject(reader.error);
    if (
      file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      file.type.includes("sheet") ||
      file.type.includes("excel") ||
      /\.(png|jpe?g|webp|gif|pdf|xlsx|xls)$/i.test(file.name)
    ) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

export function ImportCatalog({
  settings,
  products,
  setProducts,
}: {
  settings: AppSettings;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fresh, setFresh] = useState<Product[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [choices, setChoices] = useState<Record<number, ConflictChoice>>({});
  const [renameCodes, setRenameCodes] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function resetPreview() {
    setFresh([]);
    setConflicts([]);
    setChoices({});
    setRenameCodes({});
  }

  async function runImport() {
    if (busy) return;
    if (!text.trim() && files.length === 0) {
      alert("Nhập chữ hoặc chọn file (ảnh / PDF / Excel / CSV).");
      return;
    }
    setBusy(true);
    setMsg(null);
    resetPreview();
    try {
      const encoded = await Promise.all(files.map(fileToBase64));
      const r = await fetch("/api/ai-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          files: encoded,
          products,
          model: settings.model,
          apiKey: settings.apiKey,
          provider: settings.provider || "gemini",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Import lỗi");
      setMsg(d.message || "Đã đọc xong.");
      setFresh(d.fresh || []);
      setConflicts(d.conflicts || []);
      const init: Record<number, ConflictChoice> = {};
      (d.conflicts || []).forEach((_: Conflict, i: number) => {
        init[i] = "overwrite";
      });
      setChoices(init);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không import được");
    } finally {
      setBusy(false);
    }
  }

  function applyImport() {
    const existingCodes = new Set(products.map((p) => p.code));
    const toAdd: Product[] = [...fresh];
    const overwriteMap = new Map<string, Product>();

    conflicts.forEach((c, i) => {
      const choice = choices[i] || "skip";
      if (choice === "skip") return;
      if (choice === "overwrite") {
        overwriteMap.set(c.existing.code, {
          ...c.incoming,
          code: c.existing.code,
          active: true,
        });
        return;
      }
      let code = (renameCodes[i] || `${c.incoming.code}-NEW`).toUpperCase().trim();
      if (!code || existingCodes.has(code) || toAdd.some((x) => x.code === code)) {
        code = `${c.incoming.code}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      }
      existingCodes.add(code);
      toAdd.push({ ...c.incoming, code, active: true });
    });

    setProducts((prev) => {
      let next = prev.map((p) => {
        const ov = overwriteMap.get(p.code);
        return ov ? { ...p, ...ov, code: p.code } : p;
      });
      const codes = new Set(next.map((p) => p.code));
      for (const p of toAdd) {
        if (!codes.has(p.code)) {
          next = [...next, p];
          codes.add(p.code);
        }
      }
      return next;
    });

    alert(
      `Đã nạp: +${toAdd.length} mới, ghi đè ${overwriteMap.size}, bỏ qua ${
        conflicts.filter((_, i) => (choices[i] || "skip") === "skip").length
      }.`
    );
    setText("");
    setFiles([]);
    resetPreview();
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="secondary shrink-0" onClick={() => setOpen(true)}>
        🤖 Nạp danh mục AI
      </button>

      {open && (
        <Modal onClose={() => !busy && setOpen(false)} title="Nạp danh mục sản phẩm bằng AI">
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <p className="muted text-sm">
              Dán bảng giá bằng chữ, hoặc tải ảnh / PDF / Excel / CSV. AI liệt kê vào kho.
              Trùng mã hoặc trùng tên → chọn <b>ghi đè</b>, <b>đổi mã</b> hoặc <b>bỏ qua</b>.
            </p>

            <textarea
              className="field min-h-[120px] resize-none font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ví dụ:\nTB-PLY-M | Tủ bếp Plywood Melamine | MD | 2800000\nHoặc dán nguyên bảng giá copy từ Excel...`}
            />

            <div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.pdf,.csv,.tsv,.txt,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const list = Array.from(e.target.files || []);
                  setFiles((prev) => [...prev, ...list].slice(0, 8));
                  e.target.value = "";
                }}
              />
              <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
                Chọn file (ảnh / PDF / Excel / CSV)
              </button>
              {files.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        className="text-red-500"
                        onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}
                      >
                        xóa
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="button" className="primary w-full" disabled={busy} onClick={runImport}>
              {busy ? "AI đang đọc..." : "Đọc & phân tích bằng AI"}
            </button>

            {msg && <div className="ai-bubble text-sm">{msg}</div>}

            {fresh.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Sản phẩm mới ({fresh.length})</h4>
                <div className="border rounded-xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#fafbfc] text-[10px] uppercase text-[#8992a0]">
                        <th className="text-left p-2">Mã</th>
                        <th className="text-left">Tên</th>
                        <th className="text-right p-2">Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fresh.map((p) => (
                        <tr key={p.code} className="border-t">
                          <td className="p-2 font-mono">{p.code}</td>
                          <td>
                            <div>{p.name}</div>
                            <div className="text-[#9aa2ae]">
                              {p.category} · {p.unit}
                            </div>
                          </td>
                          <td className="text-right p-2 font-semibold">{money(p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {conflicts.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-amber-700">
                  Trùng với kho hiện có ({conflicts.length})
                </h4>
                <div className="space-y-3">
                  {conflicts.map((c, i) => (
                    <div
                      key={i}
                      className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap gap-2 justify-between">
                        <span className="font-medium">
                          Trùng {c.matchType === "code" ? "MÃ" : "TÊN"}:{" "}
                          <span className="font-mono">{c.existing.code}</span> — {c.existing.name}
                        </span>
                        <span className="text-[#8992a0]">
                          Cũ: {money(c.existing.price)} → Mới: {money(c.incoming.price)}
                        </span>
                      </div>
                      <div className="text-[#5c6573]">
                        Incoming: <span className="font-mono">{c.incoming.code}</span> —{" "}
                        {c.incoming.name}
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        {(
                          [
                            ["overwrite", "Ghi đè"],
                            ["rename", "Đổi mã mới"],
                            ["skip", "Bỏ qua"],
                          ] as const
                        ).map(([v, label]) => (
                          <label key={v} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`c-${i}`}
                              checked={(choices[i] || "overwrite") === v}
                              onChange={() => setChoices((x) => ({ ...x, [i]: v }))}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                      {choices[i] === "rename" && (
                        <input
                          className="field font-mono text-xs"
                          placeholder="Mã mới"
                          value={renameCodes[i] || `${c.incoming.code}-NEW`}
                          onChange={(e) =>
                            setRenameCodes((x) => ({ ...x, [i]: e.target.value }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(fresh.length > 0 || conflicts.length > 0) && (
              <button type="button" className="primary w-full" onClick={applyImport}>
                Xác nhận lưu vào bảng giá
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
