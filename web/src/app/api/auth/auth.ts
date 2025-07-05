import NextAuth, { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";

const config: NextAuthConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  basePath: "/api/auth",
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);