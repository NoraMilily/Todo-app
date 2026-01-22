import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const credentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(6),
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
          },
        });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? null,
          username: user.username ?? null,
          displayName: user.displayName ?? null,
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Debug: log all JWT callback calls
      console.log("[AUTH] JWT callback called:", {
        hasUser: !!user,
        hasToken: !!token,
        trigger,
        tokenSub: token.sub,
        hasSession: !!session,
        sessionData: session,
      });

      // Initial sign in - set token from user object
      if (user) {
        console.log("[AUTH] Initial sign in, setting token from user:", user);
        token.sub = user.id;
        token.email = user.email ?? null;
        token.username = user.username ?? null;
        token.displayName = user.displayName ?? null;
        token.avatarUrl = user.avatarUrl ?? null;
        return token;
      }

      // When update() is called from client, update token with new data
      // In NextAuth beta, trigger === "update" when update() is called
      // session parameter contains data passed to update()
      if (trigger === "update" && token.sub) {
        console.log("[AUTH] JWT callback triggered with update");
        console.log("[AUTH] Session parameter received:", session);

        // If session data is provided, use it directly
        if (session?.user) {
          console.log("[AUTH] Updating token from session parameter:", session.user);
          if (session.user.displayName !== undefined) {
            token.displayName = session.user.displayName;
          }
          if (session.user.avatarUrl !== undefined) {
            token.avatarUrl = session.user.avatarUrl;
          }
          console.log("[AUTH] Token updated from session parameter");
        } else {
          // If no session data provided, fetch fresh data from database
          console.log("[AUTH] No session data provided, fetching fresh data from DB...");
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            });

            if (dbUser) {
              console.log("[AUTH] Fresh user data from DB:", dbUser);
              token.email = dbUser.email;
              token.username = dbUser.username;
              token.displayName = dbUser.displayName;
              token.avatarUrl = dbUser.avatarUrl;
              console.log("[AUTH] Token updated with fresh data from DB");
            } else {
              console.log("[AUTH] User not found in DB for id:", token.sub);
            }
          } catch (error) {
            // If DB query fails, keep existing token data
            console.error("[AUTH] Failed to fetch user data for JWT:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email ?? null;
        session.user.username = token.username ?? null;
        session.user.displayName = token.displayName ?? null;
        session.user.avatarUrl = token.avatarUrl ?? null;
      }
      return session;
    },
  },
});
