import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { apiKeys } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

export const apiKeysRouter = router({
    // List all API keys for the user
    list: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const keys = await ctx.db.query.apiKeys.findMany({
            where: eq(apiKeys.userId, userId),
            orderBy: desc(apiKeys.createdAt),
            columns: {
                id: true,
                name: true,
                deviceName: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });

        return keys;
    }),

    // Generate a new API key
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            deviceName: z.string().max(100).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Generate a secure random API key
            const rawKey = `ks_${randomBytes(32).toString("hex")}`;
            const keyHash = createHash("sha256").update(rawKey).digest("hex");

            const [created] = await ctx.db.insert(apiKeys)
                .values({
                    userId,
                    keyHash,
                    name: input.name,
                    deviceName: input.deviceName,
                })
                .returning();

            // Return the raw key only once - it cannot be retrieved again
            return {
                id: created.id,
                name: created.name,
                deviceName: created.deviceName,
                key: rawKey, // This is the only time the key is shown
                createdAt: created.createdAt,
                message: "Save this API key - it will not be shown again!",
            };
        }),

    // Revoke (delete) an API key
    revoke: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const key = await ctx.db.query.apiKeys.findFirst({
                where: eq(apiKeys.id, input.id),
            });

            if (!key || key.userId !== userId) {
                throw new Error("API key not found");
            }

            await ctx.db.delete(apiKeys).where(eq(apiKeys.id, input.id));

            return { success: true };
        }),
});
