import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
            // GitHub returns an `iss` parameter in the OAuth callback (RFC 9207).
            // openid-client validates it unconditionally, so the issuer has to be
            // declared here or the callback fails with
            // "issuer must be configured on the issuer".
            issuer: "https://github.com/login/oauth",
        }),
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Allow relative callback URLs
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`;
            }
            // Allow callback URLs on the same origin
            try {
                if (new URL(url).origin === baseUrl) {
                    return url;
                }
            } catch {
                // Not a parseable absolute URL, fall through to the default
            }
            // Default to dashboard for sign-in
            return `${baseUrl}/dashboard`;
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Always fetch the latest role from database to ensure it's up-to-date
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { role: true }
                });
                session.user.role = dbUser?.role || user.role;
            }
            return session
        },
    },
}
