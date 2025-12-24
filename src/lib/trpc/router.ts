import { router } from "./init";
import { syncRouter } from "./routers/sync";
import { mangaRouter } from "./routers/manga";
import { backupRouter } from "./routers/backup";
import { apiKeysRouter } from "./routers/api-keys";

export const appRouter = router({
    sync: syncRouter,
    manga: mangaRouter,
    backup: backupRouter,
    apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
