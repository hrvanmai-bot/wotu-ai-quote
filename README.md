# WOTU AI Quote

Workspace báo giá AI của WOTU.

## Nguyên tắc

- AI chỉ diễn giải câu lệnh; Price Engine tính tiền.
- Giá chuẩn lấy từ kho mã WOTU hoặc giá người dùng nhập.
- Báo giá theo mẫu WOTU: hạng mục, ĐVT, khối lượng, đơn giá, thành tiền.

## Tính năng

- **Bảng giá tổng** — kho mã, bật/ẩn, sửa giá
- **Làm báo giá** — AI chat, sửa KL/đơn giá tay, VAT + chiết khấu
- **Dạy AI** — trong Cài đặt hoặc khi làm báo giá
- **API key trong app** — Cài đặt → dán OPENAI_API_KEY
- **In / PDF** — xem trước + in (Save as PDF)
- **Xuất Excel** — CSV UTF-8 BOM
- **Webhook** — `POST /api/webhook/quote` tự tạo báo giá

## Cài đặt

```bash
npm install
npm run dev
```

### Biến môi trường (Vercel)

| Key | Mô tả |
|-----|--------|
| `OPENAI_API_KEY` | Bắt buộc nếu không nhập key trong app |
| `OPENAI_MODEL` | Tuỳ chọn, mặc định `gpt-4o-mini` |
| `WEBHOOK_SECRET` | Tuỳ chọn — bảo vệ webhook |

### Webhook

```bash
curl -X POST https://your-app.vercel.app/api/webhook/quote \
  -H "Content-Type: application/json" \
  -d '{"message":"Bếp 3m5 MDF chống ẩm","customer":"Anh A","project":"Căn 1202","secret":"YOUR_SECRET"}'
```

## Deploy

Push `main` → Vercel build tự động.
