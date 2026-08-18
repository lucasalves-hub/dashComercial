import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomain = process.env.ALLOWED_GOOGLE_DOMAIN || "grupotoy.com.br";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      return Boolean(email?.endsWith(`@${allowedDomain}`));
    },
  },
});
