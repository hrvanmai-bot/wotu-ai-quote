"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSession().then((s) => {
      if (s?.user) router.replace("/");
    });
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);

    try {
      const result = await signIn("credentials", {
        identifier,
        name,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Vui lòng nhập đúng email/số điện thoại và họ tên.");
        return;
      }

      router.replace("/");
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

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-[#0c115b]">
            Email hoặc số điện thoại
            <input
              required
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com hoặc 09xx xxx xxx"
              className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-[#172033] outline-none placeholder:text-[#172033]/45 focus:border-[#0c115b] focus:ring-2 focus:ring-[#0c115b]/20"
            />
          </label>
          <label className="block text-sm font-medium text-[#0c115b]">
            Họ và tên
            <input
              required
              minLength={2}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Văn A"
              className="mt-1.5 w-full rounded-xl border border-white/60 bg-white/70 px-4 py-3 text-sm text-[#172033] outline-none placeholder:text-[#172033]/45 focus:border-[#0c115b] focus:ring-2 focus:ring-[#0c115b]/20"
            />
          </label>
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-2xl py-3.5 px-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70"
            style={{
              background: "rgba(255, 255, 255, 0.92)",
              color: "#172033",
              border: "1px solid rgba(255, 255, 255, 0.65)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            }}
          >
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-[11px] mt-8 text-[#0c115b]/55">
          WOTU Design Build · Quy Nhơn, Gia Lai
        </p>
      </div>
    </div>
  );
}
