import { NextResponse } from "next/server";
import { Product, QuoteState, Knowledge } from "../../../lib/quote-engine";

type Body = {
  message: string;
  quote?: QuoteState;
  products: Product[];
  knowledge: Knowledge[];
  model?: string;
  apiKey?: string;
  mode?: "quote" | "teach";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const apiKey = body.apiKey?.trim() || process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Chua co API key. Vao Cai dat -> dan OPENAI_API_KEY, hoac cau hinh bien moi truong tren Vercel.",
        },
        { status: 503 }
      );
    }

    const mode = body.mode || "quote";
    const active = (body.products || []).filter((p) => p.active);
    const catalogText = active
      .map(
        (p) =>
          `CODE=${p.code} | NAME=${p.name} | CAT=${p.category} | UNIT=${p.unit} | MATERIAL=${p.material} | PRICE=${p.price}`
      )
      .join("\n");

    const memory = (body.knowledge || [])
      .filter((k) => k.enabled)
      .map((k) => `[${k.title}] ${k.content}`)
      .join("\n");

    const quoteSnap = body.quote
      ? JSON.stringify({
          customer: body.quote.customer,
          project: body.quote.project,
          discount: body.quote.discount,
          vat: body.quote.vat,
          items: (body.quote.items || []).map((i) => ({
            code: i.code,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
          })),
        })
      : "Chua co bao gia";

    const prompt =
      mode === "teach"
        ? `Ban la WOTU AI Teacher — day bang gia va kien thuc.\nNGUYEN TAC:\n1. Khi nguoi dung day gia moi / sua gia -> dien updatePrices (code co san) hoac newProducts (ma chua co).\n2. Khi nguoi dung day quy tac / luu y -> dien knowledgeToSave.\n3. Khong bia ma neu khong du thong tin; hoi lai trong message.\n4. CODE viet HOA, ngan gon.\n5. price la so VND, khong dau phay.\n6. message: tom tat tieng Viet.\n\nMASTER PRICE BOOK:\n${catalogText || "Trong"}\n\nKIEN THUC DANG BAT:\n${memory || "Khong co"}\n\nYEU CAU DAY:\n${body.message}`
        : `Ban la WOTU AI Quote Assistant — vua lam bao gia vua hoc duoc khi duoc bao luu.\nNGUYEN TAC:\n1. Lam bao gia: chi dung CODE trong MASTER PRICE BOOK; khong bia gia tru khi user noi ro.\n2. action create chi khi user muon bao gia moi tu dau; con lai edit.\n3. removeCodes khi xoa hang muc.\n4. discount: % chiet khau, null neu khong doi.\n5. Neu user noi "luu lai", "day", "cap nhat bang gia", "them ma vao kho", "ghi nho":\n   - Hang muc CHUA co trong bang gia -> newProducts\n   - Doi gia ma DA CO -> updatePrices\n   - Quy tac / luu y -> knowledgeToSave\n6. notes: danh sach luu y.\n7. message: tom tat tieng Viet.\n\nMASTER PRICE BOOK:\n${catalogText || "Trong"}\n\nKIEN THUC DANG BAT:\n${memory || "Khong co"}\n\nBAO GIA HIEN TAI:\n${quoteSnap}\n\nYEU CAU:\n${body.message}`;

    const schema = {
      type: "object",
      name: "wotu_ai_command",
      strict: true,
      schema: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["create", "edit", "teach"] },
          message: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                qty: { type: "number" },
                unitPrice: { type: ["number", "null"] },
              },
              required: ["code", "qty", "unitPrice"],
              additionalProperties: false,
            },
          },
          removeCodes: { type: "array", items: { type: "string" } },
          discount: { type: ["number", "null"] },
          updatePrices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string" },
                price: { type: "number" },
                note: { type: "string" },
              },
              required: ["code", "price", "note"],
              additionalProperties: false,
            },
          },
          newProducts: {
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
              },
              required: ["code", "name", "category", "unit", "price", "material"],
              additionalProperties: false,
            },
          },
          knowledgeToSave: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
              },
              required: ["title", "content"],
              additionalProperties: false,
            },
          },
          notes: { type: "array", items: { type: "string" } },
        },
        required: [
          "action",
          "message",
          "items",
          "removeCodes",
          "discount",
          "updatePrices",
          "newProducts",
          "knowledgeToSave",
          "notes",
        ],
        additionalProperties: false,
      },
    };

    const model = body.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a precise JSON-only assistant for WOTU quotation and price teaching.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_schema", json_schema: schema },
        temperature: 0.15,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      let msg = errText;
      try {
        const j = JSON.parse(errText);
        msg = j.error?.message || errText;
      } catch {}
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI khong tra ve noi dung." }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    const valid = new Map(active.map((p) => [p.code, p]));
    const allCodes = new Map((body.products || []).map((p) => [p.code, p]));

    parsed.items = (parsed.items || [])
      .filter((x: any) => valid.has(x.code) && x.qty > 0)
      .map((x: any) => ({
        ...x,
        unitPrice: x.unitPrice ?? valid.get(x.code)!.price,
      }));

    parsed.removeCodes = (parsed.removeCodes || []).filter((x: string) =>
      allCodes.has(x)
    );

    parsed.updatePrices = (parsed.updatePrices || []).filter(
      (x: any) => allCodes.has(x.code) && typeof x.price === "number" && x.price >= 0
    );

    parsed.newProducts = (parsed.newProducts || [])
      .filter(
        (x: any) =>
          x.code &&
          x.name &&
          typeof x.price === "number" &&
          !allCodes.has(String(x.code).toUpperCase())
      )
      .map((x: any) => ({
        ...x,
        code: String(x.code).toUpperCase().trim(),
        category: x.category || "Khac",
        unit: x.unit || "Cai",
        material: x.material || "",
      }));

    parsed.knowledgeToSave = (parsed.knowledgeToSave || []).filter(
      (x: any) => x.title && x.content
    );

    parsed.notes = parsed.notes || [];

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 }
    );
  }
}
