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
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white border grid place-items-center">
          <img src="/wotu-mark.svg" alt="WOTU" className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            <span className="text-[#c41e2a]">WOTU</span> Quote
          </h1>
          <p className="muted mt-2 text-sm leading-relaxed">
            Hệ thống báo giá nội thất & xây dựng.
            <br />
            Đăng nhập bằng tài khoản Google để tiếp tục.
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
          {busy ? "Đang đăng nhập…" : "Tiếp tục với Google"}
        </button>
        <p className="text-[11px] text-[#8a93a1]">
          WOTU Design · Build · Quy Nhơn, Gia Lai
        </p>
      </div>
    </main>
  );
}
