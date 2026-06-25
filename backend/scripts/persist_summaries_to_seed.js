const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

(async () => {
    const seedPath = path.join(__dirname, '..', 'prisma', 'seed-data.json');
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

    const rows = await db.provider.findMany({
        where: { reviewsSummary: { not: null } },
        select: { id: true, reviewsSummary: true, reviewsSummaryUpdatedAt: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));

    let updated = 0;
    for (const p of seed.providers) {
        const row = byId.get(p.id);
        if (!row) continue;
        p.reviewsSummary = row.reviewsSummary;
        p.reviewsSummaryUpdatedAt = row.reviewsSummaryUpdatedAt.toISOString();
        updated++;
    }

    fs.writeFileSync(seedPath, JSON.stringify(seed, null, 4) + '\n');
    console.log(`Atualizado ${updated} prestadores no seed-data.json (de ${seed.providers.length} totais).`);
    await db.$disconnect();
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
