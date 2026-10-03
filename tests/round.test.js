import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterDeck, buildDeck, extendRound, rankCandidates, leaders } from '../src/lib/round.js';

const database = JSON.parse(readFileSync(new URL('../propostas-candidatos-2026.json', import.meta.url)));
const candidates = [{ id: 'a', nome: 'A' }, { id: 'b', nome: 'B' }];
const proposal = (id, candidatoId, tituloCurto, nivel = 'principal', eixo = 'Saúde') => ({ id, candidatoId, tituloCurto, nivel, eixo });

test('dataset fornecido gera os modos e respeita os filtros', () => {
  assert.equal(filterDeck(database.propostas, [], 'quick').length, 43);
  assert.equal(filterDeck(database.propostas, [], 'complete').length, 81);
  const filtered = filterDeck(database.propostas, ['Saúde'], 'quick');
  assert.ok(filtered.length > 0);
  assert.ok(filtered.every((card) => card.eixo === 'Saúde' && card.propostas.every((item) => item.nivel === 'principal')));
  assert.equal(filterDeck(database.propostas, ['Tema inexistente'], 'quick').length, 0);
});

test('aprofundar preserva respostas e ordem; ideias comuns ganham origens sem repetir cartões', () => {
  const proposals = [proposal('a1', 'a', 'Saúde digital'), proposal('b1', 'b', 'Saude digital', 'completo'), proposal('b2', 'b', 'Atendimento básico', 'completo')];
  const quick = filterDeck(proposals, [], 'quick');
  const full = filterDeck(proposals, [], 'complete');
  const answers = [{ id: quick[0].id, interessada: true }];
  const extended = extendRound(quick, full);
  assert.equal(extended.length, 2);
  assert.equal(extended[0].id, answers[0].id);
  assert.equal(extended[0].propostas.length, 2);
  assert.equal(new Set(extended.map((card) => card.id)).size, extended.length);
  assert.deepEqual(extendRound(extended, full), extended);
  const picked = extended.filter((card) => answers.some((answer) => answer.id === card.id && answer.interessada)).flatMap((card) => card.propostas);
  assert.equal(picked.length, 2);
  assert.equal(rankCandidates(candidates, extended, picked)[0].id, 'a');
});

test('ranking proporcional reconhece empates mesmo com contagens diferentes', () => {
  const deck = buildDeck([proposal('a1', 'a', 'A1'), proposal('a2', 'a', 'A2'), ...[1, 2, 3, 4].map((n) => proposal(`b${n}`, 'b', `B${n}`))]);
  const picked = deck.filter((card) => ['A1', 'B1', 'B2'].includes(card.tituloCurto)).flatMap((card) => card.propostas);
  const stats = rankCandidates(candidates, deck, picked);
  assert.deepEqual(stats.map((item) => [item.percent, item.place, item.tied]), [[50, 1, true], [50, 1, true]]);
  assert.equal(leaders(stats).length, 2);
  assert.equal(leaders(rankCandidates(candidates, deck, [])).length, 0);
  assert.equal(leaders(rankCandidates(candidates, deck, picked, 'Saúde')).length, 2);
});

test('encerramento antecipado mantém no denominador todas as propostas incluídas', () => {
  const deck = buildDeck([proposal('a1', 'a', 'A1'), proposal('a2', 'a', 'A2'), proposal('b1', 'b', 'B1')]);
  const stats = rankCandidates(candidates, deck, deck[0].propostas);
  assert.equal(stats[0].chosen, 1);
  assert.equal(stats[0].total, 2);
  assert.equal(stats[0].percent, 50);
});
