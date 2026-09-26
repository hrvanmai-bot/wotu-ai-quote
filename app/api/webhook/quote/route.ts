import { NextResponse } from "next/server";
import {
  applyAICommand,
  applyLearnResult,
  catalog,
  emptyQuote,
  Product,
  Knowledge,
  QuoteState,
} from "../../../../lib/quote-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secret = process.env.WEBHOOK_SECRET;
    if (secret && body.secret !== secret) {
      return NextResponse.json({ error: "Unauthorized webhook secret" }, { status: 401 });
    }

    const message = String(body.message || "").trim();
    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    const apiKey =
      (body.apiKey as string)?.trim() || process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 503 }
      );
    }

    const products: Product[] = Array.isArray(body.products)
      ? body.products
      : catalog;
    const knowledge: Knowledge[] = Array.isArray(body.knowledge)
      ? body.knowledge
      : [];

    let quote: QuoteState = body.quote
      ? { ...emptyQuote(), ...body.quote }
      : emptyQuote(process.env.QUOTE_PREFIX || "BG-WOTU");

    if (body.customer) quote.customer = String(body.customer);
    if (body.project) quote.project = String(body.project);
    if (body.customerPhone) quote.customerPhone = String(body.customerPhone);
    if (body.customerAddress)
      quote.customerAddress = String(body.customerAddress);

    const active = products.filter((p) => p.active);
    const catalogText = active
      .map(
        (p) =>
          `CODE=${p.code} | NAME=${p.name} | CAT=${p.category} | UNIT=${p.unit} | MATERIAL=${p.material} | PRICE=${p.price}`
      )
      .join("\n");
    const memory = knowledge
      .filter((k) => k.enabled)
      .map((k) => `[${k.title}] ${k.content}`)
      .join("\n");

    const prompt = `You are WOTU AI Quote webhook.\nRules: Only use CODE from MASTER PRICE BOOK. Do not invent prices unless user specifies.\naction=create if empty quote else edit.\n\nMASTER PRICE BOOK:\n${catalogText}\n\nKNOWLEDGE:\n${memory || "none"}\n\nCURRENT QUOTE:\n${JSON.stringify({
  customer: quote.customer,
  project: quote.project,
  items: quote.items.map((i) => ({
    code: i.code,
    qty: i.qty,
    unitPrice: i.unitPrice,
  })),
})}\n\nREQUEST:\n${message}`;

    const schema = {
      type: "object",
      name: "wotu_webhook_command",
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
              required: [
                "code",
                "name",
                "category",
                "unit",
                "price",
                "material",
              ],
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

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "JSON-only WOTU quote webhook parser." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_schema", json_schema: schema },
        temperature: 0.1,
      }),
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: await r.text() },
        { status: 502 }
      );
    }

    const data = await r.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "AI empty response" }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    const valid = new Map(active.map((p) => [p.code, p]));
    parsed.items = (parsed.items || [])
      .filter((x: any) => valid.has(x.code) && x.qty > 0)
      .map((x: any) => ({
        ...x,
        unitPrice: x.unitPrice ?? valid.get(x.code)!.price,
      }));
    parsed.removeCodes = parsed.removeCodes || [];
    parsed.updatePrices = parsed.updatePrices || [];
    parsed.newProducts = parsed.newProducts || [];
    parsed.knowledgeToSave = parsed.knowledgeToSave || [];
    parsed.notes = parsed.notes || [];

    const learned = applyLearnResult(products, knowledge, parsed);
    const nextQuote = applyAICommand(quote, parsed, learned.products);

    const subtotal = nextQuote.items.reduce(
      (s, i) => s + i.qty * i.unitPrice,
      0
    );
    const discountAmt = (subtotal * (nextQuote.discount || 0)) / 100;
    const after = subtotal - discountAmt;
    const vatAmt = (after * (nextQuote.vat || 0)) / 100;

    return NextResponse.json({
      ok: true,
      message: parsed.message,
      quote: nextQuote,
      totals: {
        subtotal,
        discount: discountAmt,
        vat: vatAmt,
        total: after + vatAmt,
      },
      learned: learned.summary,
      notes: parsed.notes,
      products: learned.products,
      knowledge: learned.knowledge,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "WOTU AI Quote Webhook",
    usage: "POST /api/webhook/quote",
    body: {
      message: "string (required)",
      customer: "string",
      project: "string",
      secret: "string if WEBHOOK_SECRET set",
    },
  });
}
