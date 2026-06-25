const { query } = require('@anthropic-ai/claude-agent-sdk');
const db = require('../config/database');

const MIN_REVIEWS_WITH_COMMENT = 2;

function buildPrompt(reviews) {
    const lines = reviews
        .filter((r) => r.comment && r.comment.trim())
        .map((r) => `[${r.rating}/5] ${r.comment.trim()}`)
        .join('\n');
    return `Você vai ler avaliações de clientes sobre um prestador de serviço e gerar um resumo objetivo de 1 a 2 frases curtas em português brasileiro, no estilo de opiniões resumidas.

Regras:
- Foque nos pontos mais mencionados (positivos e negativos).
- Não cite estrelas, notas, números ou nomes de clientes.
- Não use marcadores, listas ou aspas.
- Tom neutro e descritivo.
- Devolva APENAS o texto do resumo, sem prefixos como "Resumo:" ou similares.

Avaliações:
${lines}`;
}

async function callAgent(prompt) {
    let text = '';
    const response = query({
        prompt,
        options: {
            model: 'claude-haiku-4-5',
            allowedTools: [],
            maxTurns: 1,
            settingSources: [],
            permissionMode: 'bypassPermissions',
        },
    });

    for await (const message of response) {
        if (message.type === 'assistant' && message.message?.content) {
            for (const block of message.message.content) {
                if (block.type === 'text') text += block.text;
            }
        }
    }
    return text.trim();
}

async function regenerateProviderSummary(providerId) {
    try {
        const reviews = await db.review.findMany({
            where: { providerId, comment: { not: null } },
            select: { rating: true, comment: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        if (reviews.length < MIN_REVIEWS_WITH_COMMENT) {
            await db.provider.update({
                where: { id: providerId },
                data: { reviewsSummary: null, reviewsSummaryUpdatedAt: new Date() },
            });
            return null;
        }

        const summary = await callAgent(buildPrompt(reviews));
        if (!summary) return null;

        await db.provider.update({
            where: { id: providerId },
            data: { reviewsSummary: summary, reviewsSummaryUpdatedAt: new Date() },
        });
        return summary;
    } catch (err) {
        console.error(`[aiSummary] Falha ao gerar resumo do provider ${providerId}:`, err.message);
        return null;
    }
}

function queueSummaryRegeneration(providerId) {
    setImmediate(() => {
        regenerateProviderSummary(providerId);
    });
}

module.exports = { regenerateProviderSummary, queueSummaryRegeneration };
