import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { catalog as seedCatalog, Product } from "../../../lib/quote-engine";

export const dynamic = "force-dynamic";

let memoryStore: { updatedAt: string; products: Product[] } | null = null;

async function loadSeed(): Promise<{ updatedAt: string; products: Product[] }> {
  if (memoryStore) return memoryStore;
  try {
    const p = path.join(process.cwd(), "data", "catalog.json");
    const raw = await readFile(p, "utf-8");
    const j = JSON.parse(raw);
    memoryStore = {
      updatedAt: j.updatedAt || new Date().toISOString(),
      products: j.products || seedCatalog,
    };
    return memoryStore;
  } catch {
    memoryStore = {
      updatedAt: new Date().toISOString(),
      products: seedCatalog,
    };
    return memoryStore;
  }
}

async function loadFromBlob(): Promise<{ updatedAt: string; products: Product[] } | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "wotu-catalog", limit: 5, token });
    const hit = blobs.find((b) => b.pathname.includes("catalog.json"));
    if (!hit) return null;
    const r = await fetch(hit.url, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return {
      updatedAt: j.updatedAt || new Date().toISOString(),
      products: j.products || [],
    };
  } catch {
    return null;
  }
}

async function saveToBlob(data: { updatedAt: string; products: Product[] }) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return false;
  try {
    const { put } = await import("@vercel/blob");
    await put("wotu-catalog/catalog.json", JSON.stringify(data), {
      access: "public",
      token,
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const blob = await loadFromBlob();
  if (blob && blob.products?.length) {
    memoryStore = blob;
    return NextResponse.json(blob);
  }
  const data = await loadSeed();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = (body.products || []) as Product[];
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "products rỗng" }, { status: 400 });
    }
    const data = {
      updatedAt: new Date().toISOString(),
      products,
    };
    memoryStore = data;
    const persisted = await saveToBlob(data);
    return NextResponse.json({
      ok: true,
      count: products.length,
      updatedAt: data.updatedAt,
      persisted,
      note: persisted
        ? "Đã lưu bảng giá lên hệ thống (Blob)."
        : "Đã cập nhật trên server. Thêm BLOB_READ_WRITE_TOKEN trên Vercel để lưu bền vững cho mọi máy chủ.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi lưu catalog" },
      { status: 500 }
    );
  }
}
