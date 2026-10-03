export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeText = (text) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export function buildDeck(proposals) {
  const distinctIds = [...new Map(proposals.map((proposal) => [proposal.id, proposal])).values()];
  const cardsByTopic = new Map();
  distinctIds.forEach((proposal) => {
    const key = `${normalizeText(proposal.eixo)}|${normalizeText(proposal.tituloCurto)}`;
    const existing = cardsByTopic.get(key);
    if (!existing) {
      cardsByTopic.set(key, {
        id: `deck-${key}`,
        eixo: proposal.eixo,
        tituloCurto: proposal.tituloCurto,
        descricao: proposal.descricao,
        propostas: [proposal],
      });
      return;
    }

    // Uma ideia comum a mais de uma candidatura aparece uma vez e mantém todas as origens.
    if (!existing.propostas.some((item) => item.candidatoId === proposal.candidatoId)) {
      existing.propostas.push(proposal);
    }
  });
  return [...cardsByTopic.values()];
}

export function filterDeck(proposals, axes, depth) {
  return buildDeck(proposals.filter((proposal) =>
    (!axes.length || axes.includes(proposal.eixo))
    && (depth === 'complete' || proposal.nivel === 'principal')));
}

export function extendRound(round, completeDeck) {
  const byId = new Map(completeDeck.map((card) => [card.id, card]));
  const existing = new Set(round.map((card) => card.id));
  return [...round.map((card) => byId.get(card.id) || card),
    ...shuffle(completeDeck.filter((card) => !existing.has(card.id)))];
}

export function rankCandidates(candidates, round, picked, eixo) {
  const proposals = round.filter((card) => !eixo || card.eixo === eixo).flatMap((card) => card.propostas);
  const stats = candidates.map((candidate) => {
    const total = proposals.filter((proposal) => proposal.candidatoId === candidate.id).length;
    const chosen = picked.filter((proposal) => proposal.candidatoId === candidate.id && (!eixo || proposal.eixo === eixo)).length;
    return { ...candidate, total, chosen, percent: total ? chosen / total * 100 : 0 };
  }).filter((candidate) => candidate.total > 0)
    .sort((a, b) => b.percent - a.percent || a.nome.localeCompare(b.nome, 'pt-BR'));
  return stats.map((candidate, index) => ({ ...candidate,
    place: stats.findIndex((item) => equalAffinity(item, candidate)) + 1,
    tied: stats.some((item, other) => other !== index && equalAffinity(item, candidate)),
  }));
}

export function equalAffinity(a, b) {
  return a.chosen * b.total === b.chosen * a.total;
}

export function leaders(stats) {
  return stats[0]?.chosen ? stats.filter((candidate) => equalAffinity(candidate, stats[0])) : [];
}

export function estimateTime(count) {
  if (!count) return '0 min';
  return `~${Math.max(1, Math.ceil(count * 6 / 60))}–${Math.max(2, Math.ceil(count * 9 / 60))} min`;
}
