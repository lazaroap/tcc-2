const db = require('../src/config/database');
const { regenerateProviderSummary } = require('../src/utils/aiSummary');

(async () => {
    const providers = await db.$queryRaw`
        SELECT p.id, u.name, COUNT(r.id) FILTER (WHERE r.comment IS NOT NULL AND r.comment != '') AS n
        FROM "Provider" p
        JOIN "User" u ON u.id = p."userId"
        LEFT JOIN "Review" r ON r."providerId" = p.id
        WHERE p."reviewsSummary" IS NULL
        GROUP BY p.id, u.name
        HAVING COUNT(r.id) FILTER (WHERE r.comment IS NOT NULL AND r.comment != '') >= 2
        ORDER BY n DESC
    `;
    console.log(`[backfill] ${providers.length} prestadores pendentes`);

    let done = 0;
    for (const p of providers) {
        const start = Date.now();
        const summary = await regenerateProviderSummary(p.id);
        const ms = Date.now() - start;
        done++;
        console.log(`[backfill] ${done}/${providers.length} ${p.name} (${p.n} reviews, ${ms}ms): ${summary ? summary.slice(0, 80) + '...' : 'FAIL'}`);
    }

    console.log('[backfill] concluído');
    await db.$disconnect();
})().catch((e) => {
    console.error('[backfill] erro fatal:', e);
    process.exit(1);
});
