import { NextResponse } from "next/server";
import { Product, QuoteState, Knowledge } from "../../../lib/quote-engine";

type Body = {
  message: string;
  quote?: QuoteState;
  products: Product[];
  knowledge: Knowledge[];
  model?: string;
  apiKey?: string;
  provider?: "gemini" | "openai";
  mode?: "quote" | "teach";
};

const RESPONSE_SCHEMA = {
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
          unitPrice: { type: "number", nullable: true },
        },
        required: ["code", "qty"],
      },
    },
    removeCodes: { type: "array", items: { type: "string" } },
    discount: { type: "number", nullable: true },
    updatePrices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          price: { type: "number" },
          note: { type: "string" },
        },
        required: ["code", "price"],
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
        required: ["code", "name", "price"],
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
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["action", "message", "items", "removeCodes", "notes"],
};

function buildPrompt(
  mode: string,
  catalogText: string,
  memory: string,
  quoteSnap: string,
  message: string
) {
  if (mode === "teach") {
    return `Ban la WOTU AI Teacher.\nMASTER PRICE BOOK:\n${catalogText || "Trong"}\nKIEN THUC:\n${memory || "Khong co"}\nYEU CAU DAY:\n${message}\nTra ve JSON dung schema.`;
  }
  return `Ban la WOTU AI Quote Assistant.\nChi dung CODE trong MASTER PRICE BOOK.\nMASTER PRICE BOOK:\n${catalogText || "Trong"}\nKIEN THUC:\n${memory || "Khong co"}\nBAO GIA HIEN TAI:\n${quoteSnap}\nYEU CAU:\n${message}\nTra ve JSON dung schema.`;
}

function normalizeParsed(parsed: any, active: Product[], allProducts: Product[]) {
  const valid = new Map(active.map((p) => [p.code, p]));
  const allCodes = new Map(allProducts.map((p) => [p.code, p]));
  parsed.items = (parsed.items || [])
    .filter((x: any) => valid.has(x.code) && x.qty > 0)
    .map((x: any) => ({
      ...x,
      unitPrice: x.unitPrice ?? valid.get(x.code)!.price,
    }));
  parsed.removeCodes = (parsed.removeCodes || []).filter((x: string) => allCodes.has(x));
  parsed.updatePrices = (parsed.updatePrices || []).filter(
    (x: any) => allCodes.has(x.code) && typeof x.price === "number" && x.price >= 0
  );
  parsed.newProducts = (parsed.newProducts || [])
    .filter(
      (x: any) =>
        x.code && x.name && typeof x.price === "number" && !allCodes.has(String(x.code).toUpperCase())
    )
    .map((x: any) => ({
      ...x,
      code: String(x.code).toUpperCase().trim(),
      category: x.category || "Khac",
      unit: x.unit || "Cai",
      material: x.material || "",
    }));
  parsed.knowledgeToSave = (parsed.knowledgeToSave || []).filter((x: any) => x.title && x.content);
  parsed.notes = parsed.notes || [];
  parsed.discount = parsed.discount ?? null;
  return parsed;
}

async function callGemini(apiKey: string, model: string, prompt: string) {
  const modelId = model || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });
  if (!r.ok) {
    const errText = await r.text();
    let msg = errText;
    try {
      const j = JSON.parse(errText);
      msg = j.error?.message || errText;
    } catch {}
    throw new Error(msg);
  }
  const data = await r.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  if (!text) throw new Error("Gemini empty response");
  return JSON.parse(text);
}

async function callOpenAI(apiKey: string, model: string, prompt: string) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [
        { role: "system", content: "JSON-only WOTU quote assistant." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
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
    throw new Error(msg);
  }
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI empty response");
  return JSON.parse(content);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const provider =
      body.provider ||
      (process.env.AI_PROVIDER as "gemini" | "openai") ||
      "gemini";

    const apiKey =
      body.apiKey?.trim() ||
      (provider === "gemini"
        ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
        : process.env.OPENAI_API_KEY || "");

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            provider === "gemini"
              ? "Chua co Gemini API key. Them GEMINI_API_KEY tren Vercel, hoac dan key trong Cai dat."
              : "Chua co OpenAI API key.",
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

    const prompt = buildPrompt(mode, catalogText, memory, quoteSnap, body.message);
    const model =
      body.model ||
      (provider === "gemini"
        ? process.env.GEMINI_MODEL || "gemini-2.0-flash"
        : process.env.OPENAI_MODEL || "gpt-4o-mini");

    const parsedRaw =
      provider === "openai"
        ? await callOpenAI(apiKey, model, prompt)
        : await callGemini(apiKey, model, prompt);

    const parsed = normalizeParsed(parsedRaw, active, body.products || []);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI request failed" },
      { status: 500 }
    );
  }
}
