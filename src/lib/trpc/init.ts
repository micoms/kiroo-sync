import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { apiKeys, users } from "@/lib/db/schema";
import { createHash } from "crypto";

export const createTRPCContext = async (opts: { headers: Headers }) => {
    const session = await auth.api.getSession({
        headers: opts.headers,
    });

    return {
        db,
        session,
        headers: opts.headers,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for authenticated users
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            session: { ...ctx.session, user: ctx.session.user },
        },
    });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Middleware for API key authentication (for mobile clients)
const enforceApiKeyAuth = t.middleware(async ({ ctx, next }) => {
    const apiKey = ctx.headers.get("x-api-key");

    if (!apiKey) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "API key required" });
    }

    const keyHash = createHash("sha256").update(apiKey).digest("hex");

    const keyRecord = await ctx.db.query.apiKeys.findFirst({
        where: eq(apiKeys.keyHash, keyHash),
    });

    if (!keyRecord) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid API key" });
    }

    // Update last used timestamp
    await ctx.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, keyRecord.id));

    return next({
        ctx: {
            apiKey: keyRecord,
            userId: keyRecord.userId,
        },
    });
});

export const apiKeyProcedure = t.procedure.use(enforceApiKeyAuth);

