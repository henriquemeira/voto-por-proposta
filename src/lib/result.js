import { rankCandidates } from './round.js';

export const RESULT_STORAGE_KEY = 'voto-por-proposta:last-result:v1';

// Salva uma fotografia do resultado, sem respostas rejeitadas nem histórico.
export function createResult({ testedAt, depth, selectedAxes, round, answers, candidatos, eixos }) {
  const liked = new Set(answers.filter((answer) => answer.interessada).map((answer) => answer.id));
  const cards = round.filter((card) => liked.has(card.id));
  const propostas = cards.flatMap((card) => card.propostas).map((proposal) => ({
    id: proposal.id, candidatoId: proposal.candidatoId, eixo: proposal.eixo,
    tituloCurto: proposal.tituloCurto, descricao: proposal.descricao || '',
    paginas: proposal.paginas ?? null, fonte: proposal.fonte || '',
  }));
  return {
    version: 1, testedAt, depth, selectedAxes: [...selectedAxes],
    totals: { included: round.length, answered: answers.length, pickedCards: cards.length },
    candidatos: candidatos.map(({ id, nome, partido, corTema, urlTse }) => ({ id, nome, partido, corTema, urlTse })),
    propostas,
    rankings: rankCandidates(candidatos, round, propostas),
    areaRankings: eixos.map((eixo) => {
      const stats = rankCandidates(candidatos, round, propostas, eixo);
      return { eixo, stats, total: stats.reduce((sum, item) => sum + item.total, 0),
        chosen: stats.reduce((sum, item) => sum + item.chosen, 0) };
    }).filter((area) => area.total > 0),
  };
}

const isText = (value) => typeof value === 'string';
const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
const isCandidate = (candidate) => candidate && ['id', 'nome', 'partido'].every((key) => isText(candidate[key]));
const isStat = (stat) => isCandidate(stat) && isCount(stat.total) && stat.total > 0
  && isCount(stat.chosen) && stat.chosen <= stat.total
  && Number.isFinite(stat.percent) && Math.abs(stat.percent - stat.chosen / stat.total * 100) < 1e-8
  && isCount(stat.place) && stat.place > 0 && typeof stat.tied === 'boolean';

export function isSavedResult(result) {
  if (!result || result.version !== 1 || !isText(result.testedAt) || !Number.isFinite(Date.parse(result.testedAt))
    || !['quick', 'complete'].includes(result.depth)
    || !Array.isArray(result.selectedAxes) || !result.selectedAxes.every(isText)
    || !result.totals || !['included', 'answered', 'pickedCards'].every((key) => isCount(result.totals[key]))
    || result.totals.answered > result.totals.included || result.totals.pickedCards > result.totals.answered
    || !Array.isArray(result.candidatos) || !result.candidatos.every(isCandidate)
    || !Array.isArray(result.propostas) || !Array.isArray(result.rankings) || !result.rankings.every(isStat)
    || !Array.isArray(result.areaRankings)) return false;
  const ids = new Set(result.candidatos.map((candidate) => candidate.id));
  return result.propostas.every((proposal) => proposal
    && ['id', 'candidatoId', 'eixo', 'tituloCurto', 'descricao', 'fonte'].every((key) => isText(proposal[key]))
    && ids.has(proposal.candidatoId) && (proposal.paginas === null || isText(proposal.paginas)))
    && result.rankings.every((stat) => ids.has(stat.id))
    && result.areaRankings.every((area) => area && isText(area.eixo) && isCount(area.total)
      && isCount(area.chosen) && area.chosen <= area.total && Array.isArray(area.stats)
      && area.stats.every((stat) => isStat(stat) && ids.has(stat.id)));
}

export function readSavedResult(storage) {
  try {
    const raw = (storage || window.localStorage).getItem(RESULT_STORAGE_KEY);
    if (!raw) return { result: null, error: '' };
    const result = JSON.parse(raw);
    if (!isSavedResult(result)) throw new Error('Invalid snapshot');
    return { result, error: '' };
  } catch {
    return { result: null, error: 'Não foi possível abrir o resultado salvo. Os dados locais podem estar indisponíveis ou inválidos.' };
  }
}

// Chamado apenas pelos botões explícitos da interface.
export function saveResult(result, storage) {
  try {
    if (!isSavedResult(result)) throw new Error('Invalid snapshot');
    (storage || window.localStorage).setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    return { result, error: '' };
  } catch {
    return { result: null, error: 'Não foi possível salvar neste navegador. Verifique se o armazenamento local está permitido ou baixe o PDF.' };
  }
}

export function forgetResult(storage) {
  try {
    (storage || window.localStorage).removeItem(RESULT_STORAGE_KEY);
    return { result: null, error: '' };
  } catch {
    return { error: 'Não foi possível apagar o resultado. Verifique as permissões de armazenamento deste navegador.' };
  }
}

export function formatResultDate(date) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(date));
}
