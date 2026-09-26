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

  async function onGoogle() {
    if (busy) return;
    setBusy(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden login-bg">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(12, 17, 91, 0.12)" }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-[10%] w-28 h-28 sm:w-40 sm:h-40 rounded-full opacity-50 animate-pulse"
          style={{
            background: "rgba(255, 255, 255, 0.16)",
            backdropFilter: "blur(22px) saturate(180%)",
            WebkitBackdropFilter: "blur(22px) saturate(180%)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            boxShadow:
              "0 8px 32px rgba(255, 255, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
          }}
        />
        <div
          className="absolute bottom-[16%] right-[12%] w-20 h-20 sm:w-28 sm:h-28 rounded-full opacity-40 animate-pulse"
          style={{
            background: "rgba(255, 255, 255, 0.14)",
            backdropFilter: "blur(18px) saturate(180%)",
            WebkitBackdropFilter: "blur(18px) saturate(180%)",
            border: "2px solid rgba(255, 255, 255, 0.28)",
            animationDelay: "1s",
          }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[28px] p-7 sm:p-9"
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.42)",
          boxShadow:
            "0 32px 80px rgba(0, 0, 0, 0.25), 0 12px 40px rgba(255, 255, 255, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.55)",
        }}
      >
        <div className="text-center space-y-3 mb-8">
          <div
            className="mx-auto w-14 h-14 rounded-2xl grid place-items-center"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-9 h-9"
              aria-label="WOTU"
            >
              <path
                d="M12 16 L32 8 L52 16 L52 48 L32 56 L12 48 Z"
                stroke="#111a2d"
                strokeWidth="3.5"
                fill="none"
              />
              <path
                d="M20 22 L32 16 L44 22 L44 42 L32 48 L20 42 Z"
                stroke="#111a2d"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0c115b]">
            <span className="text-[#c41e2a]">WOTU</span> Quote
          </h1>
          <p className="text-sm leading-relaxed text-[#0c115b]/75">
            Hệ thống báo giá nội thất & xây dựng
            <br />
            Đăng nhập để tiếp tục
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-3.5 px-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            color: "#172033",
            border: "1px solid rgba(255, 255, 255, 0.65)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          }}
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {busy ? "Đang đăng nhập…" : "Tiếp tục với Google"}
        </button>

        <p className="text-center text-[11px] mt-8 text-[#0c115b]/55">
          WOTU Design Build · Quy Nhơn, Gia Lai
        </p>
      </div>
    </div>
  );
}
