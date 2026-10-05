import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

async function authHandler(req: Request, context: { params: Promise<{ nextauth?: string[] }> }) {
    try {
        // Resolve the params promise for Next.js 16 compatibility
        const params = await context.params;
        return await handler(req, { params });
    } catch (error) {
        console.error("NextAuth Handler Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export { authHandler as GET, authHandler as POST }
