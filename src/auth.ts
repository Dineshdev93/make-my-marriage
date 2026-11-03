import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/modules/auth/schema";
import { verifyCredentials } from "@/modules/auth/service";

const isProduction = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${isProduction ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
      },
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await verifyCredentials(parsed.data.email, parsed.data.password);
        if (!user) return null;
        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
