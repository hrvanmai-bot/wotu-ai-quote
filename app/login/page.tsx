"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession().then((s) => {
      if (s?.user) router.replace("/");
    });
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center bg-[#f5f6f8] p-6">
      <div className="card p-8 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#111a2d] text-white grid place-items-center font-black text-xl mx-auto">
          W
        </div>
        <div>
          <h1 className="text-2xl font-semibold">WOTU Quote</h1>
          <p className="muted mt-2 text-sm">
            Đăng nhập để làm báo giá. Chỉ chủ sở hữu mới mở được bảng giá & cấu hình.
          </p>
        </div>
        <button
          type="button"
          className="primary w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await signIn("google", { callbackUrl: "/" });
          }}
        >
          {busy ? "Đang chuyển…" : "Đăng nhập bằng Google"}
        </button>
        <p className="text-[11px] text-[#8a93a1]">
          Apple / iCloud sẽ bổ sung sau. Hiện dùng Google.
        </p>
      </div>
    </main>
  );
}
