import NextAuth, { NextAuthConfig } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { upsertUserUsecase } from "@/app/api/_usecase/user";

const config: NextAuthConfig = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  basePath: "/api/auth",
  callbacks: {
    async signIn({ user, account }) {
      try {
        // GitHub認証時のユーザー情報をupsert
        if (account?.provider === "github" && user.email) {
          const result = await upsertUserUsecase({
            email: user.email,
            name: user.name || user.email,
            icon: user.image || "",
          });

          if (!result.success) {
            console.error("ユーザーのupsertに失敗しました:", result.message);
            // サインイン自体は成功させる（DBエラーでサインインを止めない）
            return true;
          }

          console.log("ユーザー情報をupsertしました:", result.data);
        }

        return true;
      } catch (error) {
        console.error("サインイン時のupsertでエラーが発生しました:", error);
        // エラーが発生してもサインイン自体は成功させる
        return true;
      }
    },
    async jwt({ token, user, account }) {
      // JWTトークンにユーザー情報を追加
      if (account && user) {
        token.accessToken = account.access_token;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);