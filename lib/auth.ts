import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { isAdminEmail } from "./roles";

export { ADMIN_EMAIL, isAdminEmail } from "./roles";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email hoặc số điện thoại",
      credentials: {
        identifier: { label: "Email hoặc số điện thoại", type: "text" },
        name: { label: "Họ và tên", type: "text" },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier || "").trim();
        const name = String(credentials?.name || "").trim();

        if (!identifier || name.length < 2) return null;

        const email = identifier.includes("@")
          ? identifier.toLowerCase()
          : `${identifier.replace(/[^0-9+]/g, "")}@wotu.local`;

        return {
          id: identifier.toLowerCase(),
          name,
          email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = isAdminEmail(session.user.email);
        (session.user as any).id = token.sub;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
};
