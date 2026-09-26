import { NextResponse } from "next/server";
import { Product } from "../../../lib/quote-engine";

type FilePart = {
  mime: string;
  data: string;
  name?: string;
};

type Body = {
  text?: string;
  files?: FilePart[];
  products: Product[];
  model?: string;
  apiKey?: string;
  provider?: "gemini" | "openai";
};

const IMPORT_SCHEMA = {
  type: "object",
  properties: {
    message: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          unit: { type: "string" },
          price: { type: "number" },
          material: { type: "string" },
          note: { type: "string" },
        },
        required: ["code", "name", "price"],
      },
    },
  },
  required: ["message", "products"],
};

function normalizeCode(c: string) {
  return String(c || "").toUpperCase().trim().replace(/\s+/g, "-");
}

function normalizeName(n: string) {
  return String(n || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIncoming(raw: any[]): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const x of raw || []) {
    if (!x?.name || typeof x.price !== "number" || x.price < 0) continue;
    let code = normalizeCode(x.code || "");
    if (!code) {
      const slug = normalizeName(x.name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24)
        .toUpperCase();
      code = slug || `SP-${out.length + 1}`;
    }
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      name: String(x.name).trim(),
      category: String(x.category || "Khác").trim(),
      unit: String(x.unit || "Cái").trim(),
      price: Math.round(x.price),
      material: String(x.material || "").trim(),
      active: true,
      note: x.note ? String(x.note) : undefined,
    });
  }
  return out;
}

function detectConflicts(incoming: Product[], existing: Product[]) {
  const byCode = new Map(existing.map((p) => [p.code, p]));
  const byName = new Map(existing.map((p) => [normalizeName(p.name), p]));
  const conflicts: { matchType: "code" | "name"; existing: Product; incoming: Product }[] = [];
  const fresh: Product[] = [];
  for (const p of incoming) {
    const codeHit = byCode.get(p.code);
    if (codeHit) {
      conflicts.push({ matchType: "code", existing: codeHit, incoming: p });
      continue;
    }
    const nameHit = byName.get(normalizeName(p.name));
    if (nameHit) {
      conflicts.push({ matchType: "name", existing: nameHit, incoming: p });
      continue;
    }
    fresh.push(p);
  }
  return { conflicts, fresh };
}

async function callGemini(apiKey: string, model: string, text: string, files: FilePart[]) {
  const modelId = model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts: any[] = [{ text }];
  for (const f of files) {
    if (!f.data || !f.mime) continue;
    parts.push({ inline_data: { mime_type: f.mime, data: f.data } });
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: IMPORT_SCHEMA,
      },
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    let msg = errText;
    try { msg = JSON.parse(errText).error?.message || errText; } catch {}
    throw new Error(msg);
  }
  const data = await r.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
  if (!content) throw new Error("Gemini không trả về dữ liệu.");
  return JSON.parse(content);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const provider =
      body.provider || (process.env.AI_PROVIDER as "gemini" | "openai") || "gemini";
    const apiKey =
      body.apiKey?.trim() ||
      (provider === "gemini"
        ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
        : process.env.OPENAI_API_KEY || "");
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa có API key (GEMINI_API_KEY)." }, { status: 503 });
    }

    const textHint = (body.text || "").trim();
    const files = body.files || [];
    const spreadsheetFiles = files.filter(
      (f) =>
        f.mime.includes("sheet") ||
        f.mime.includes("excel") ||
        f.mime === "text/csv" ||
        f.mime === "text/plain" ||
        (f.name && /\.(csv|tsv|txt)$/i.test(f.name))
    );
    const mediaFiles = files.filter((f) => !spreadsheetFiles.includes(f));

    let sheetText = "";
    for (const f of spreadsheetFiles) {
      try {
        const buf = Buffer.from(f.data, "base64");
        const isExcel =
          (f.name && /\.xlsx?$/i.test(f.name)) ||
          f.mime.includes("sheet") ||
          f.mime.includes("excel");
        if (isExcel) {
          try {
            const XLSX = await import("xlsx");
            const wb = XLSX.read(buf, { type: "buffer" });
            for (const name of wb.SheetNames) {
              const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
              sheetText += `\n--- SHEET ${name} (${f.name || "excel"}) ---\n${csv.slice(0, 80000)}\n`;
            }
          } catch {
            sheetText += `\n--- FILE ${f.name || "excel"} ---\n(Không đọc được Excel, hãy xuất CSV.)\n`;
          }
        } else {
          sheetText += `\n--- FILE ${f.name || "sheet"} ---\n${buf.toString("utf-8").slice(0, 80000)}\n`;
        }
      } catch {}
    }

    const catalogSample = (body.products || [])
      .slice(0, 40)
      .map((p) => `${p.code} | ${p.name} | ${p.price}`)
      .join("\n");

    const prompt = `Bạn là WOTU AI Catalog Importer.\nTrích xuất danh mục sản phẩm / bảng giá từ chữ, ảnh, PDF, CSV/Excel.\n\nQUY TẮC:\n1. Mỗi SP: code, name, category, unit, price (VND số), material, note.\n2. CODE viết HOA. Không có mã → tự sinh từ tên.\n3. Không bỏ sót dòng có giá. Bỏ tiêu đề / tổng.\n4. unit mặc định "Cái"; category mặc định "Khác".\n5. message: tóm tắt tiếng Việt.\n\nBẢNG GIÁ HIỆN CÓ (tham khảo):\n${catalogSample || "Trống"}\n\nNỘI DUNG CHỮ / CSV:\n${textHint || "(không có)"}\n${sheetText || ""}\n\nNếu có ảnh/PDF đính kèm → đọc bảng giá trong đó.`;

    const model = body.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    if (provider === "openai" && mediaFiles.length > 0) {
      return NextResponse.json(
        { error: "Import ảnh/PDF cần Gemini." },
        { status: 400 }
      );
    }

    let parsed: any;
    if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: body.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: "JSON-only catalog importer." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    } else {
      const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ||
        "gemini-3.1-flash-lite,gemini-flash-latest,gemini-3.8-flash")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const models = [model, ...fallbacks.filter((m) => m !== model)];
      let lastErr: Error | null = null;
      for (const m of models) {
        try {
          parsed = await callGemini(apiKey, m, prompt, mediaFiles);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
          const msg = lastErr.message.toLowerCase();
          if (!msg.includes("high demand") && !msg.includes("unavailable") && !msg.includes("try again")) {
            throw lastErr;
          }
        }
      }
      if (lastErr) throw lastErr;
    }

    const incoming = parseIncoming(parsed.products || []);
    const { conflicts, fresh } = detectConflicts(incoming, body.products || []);

    return NextResponse.json({
      message: parsed.message || `Đọc được ${incoming.length} sản phẩm.`,
      products: incoming,
      fresh,
      conflicts,
      stats: { total: incoming.length, fresh: fresh.length, conflicts: conflicts.length },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
