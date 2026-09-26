import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { catalog as seedCatalog, Product } from "../../../lib/quote-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET() {
  const data = await loadSeed();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = (body.products || []) as Product[];
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Danh mục trống" }, { status: 400 });
    }
    const data = {
      updatedAt: new Date().toISOString(),
      products,
    };
    memoryStore = data;
    return NextResponse.json({
      ok: true,
      count: products.length,
      updatedAt: data.updatedAt,
      persisted: false,
      note: "Đã cập nhật bảng giá trên server (phiên hiện tại).",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi lưu catalog" },
      { status: 500 }
    );
  }
}
