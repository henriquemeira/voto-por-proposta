import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDeck } from '../src/lib/round.js';
import { createResult, isSavedResult, readSavedResult, saveResult, forgetResult, RESULT_STORAGE_KEY } from '../src/lib/result.js';
import { createResultPdf } from '../src/lib/result-pdf.js';

const database = JSON.parse(readFileSync(new URL('../propostas-candidatos-2026.json', import.meta.url)));
function fixture(all = false) {
  const round = buildDeck(database.propostas);
  return createResult({ testedAt: '2026-10-03T15:30:00.000Z', depth: 'complete', selectedAxes: [], round,
    answers: round.map((card, index) => ({ id: card.id, interessada: all || index === 0 })),
    candidatos: database.candidatos, eixos: database.eixos });
}
function memoryStorage() {
  const values = new Map();
  return { values, getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('criar e ler resultados não persiste nada; só a ação de salvar substitui o último', () => {
  const storage = memoryStorage();
  const first = fixture();
  assert.equal(isSavedResult(first), true);
  assert.equal(first.propostas.length, 1);
  assert.equal('answers' in first, false);
  assert.equal('round' in first, false);
  assert.equal(readSavedResult(storage).result, null);
  assert.equal(storage.values.size, 0);
  assert.equal(saveResult(first, storage).error, '');
  assert.deepEqual(readSavedResult(storage).result, JSON.parse(JSON.stringify(first)));
  const second = { ...fixture(true), testedAt: '2026-10-04T15:30:00.000Z' };
  saveResult(second, storage);
  assert.equal(storage.values.size, 1);
  assert.equal(readSavedResult(storage).result.testedAt, second.testedAt);
  assert.equal(readSavedResult(storage).result.propostas.length, 83);
  assert.deepEqual(forgetResult(storage), { result: null, error: '' });
  assert.equal(storage.values.size, 0);
});

test('dados inválidos e armazenamento bloqueado produzem mensagens sem apagar automaticamente', () => {
  const storage = memoryStorage();
  storage.setItem(RESULT_STORAGE_KEY, '{invalid');
  assert.ok(readSavedResult(storage).error);
  assert.equal(storage.values.size, 1);
  storage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ ...fixture(), candidatos: [] }));
  assert.ok(readSavedResult(storage).error);
  const denied = new Proxy({}, { get() { throw new Error('SecurityError'); } });
  assert.ok(readSavedResult(denied).error);
  assert.ok(saveResult(fixture(), denied).error);
  assert.ok(forgetResult(denied).error);
});

test('PDF gera múltiplas páginas com todas as propostas, rodapés e acentos sem acessar rede', () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network forbidden during PDF generation'); };
  try {
    const result = fixture(true);
    const doc = createResultPdf(result);
    assert.ok(doc.getNumberOfPages() > 1);
    const content = Buffer.from(doc.output('arraybuffer'));
    assert.equal(content.subarray(0, 5).toString(), '%PDF-');
  } finally { globalThis.fetch = originalFetch; }
});
