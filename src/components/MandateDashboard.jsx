import React, { useMemo, useState } from 'react';
import secondRound from '../data/propostas-segundo-turno.json';
import { ArrowLeft, ArrowUpRight, Check, LayoutGrid, List, Search, X } from 'lucide-react';
import { buildDeck } from '../lib/round.js';

const candidate = secondRound.candidatos.find(({ id }) => id === 'lula');
const rival = secondRound.candidatos.find(({ id }) => id === 'flavio');
const commitments = secondRound.propostas.filter(({ candidatoId }) => candidatoId === candidate.id)
  .map((proposal) => ({ ...proposal, status: 'sem-evidencia', legislacao: [], atualizacoes: [] }));
const suggestedPairs = buildDeck(secondRound.propostas.filter(({ candidatoId }) => [candidate.id, rival.id].includes(candidatoId)))
  .filter(({ propostas }) => propostas.some(({ candidatoId }) => candidatoId === candidate.id)
    && propostas.some(({ candidatoId }) => candidatoId === rival.id))
  .map(({ eixo, tituloCurto, propostas }) => ({ eixo, tituloCurto, propostas }));
const statusLabel = { 'sem-evidencia': 'Sem evidência suficiente', 'nao-iniciada': 'Não iniciada', andamento: 'Em andamento', parcial: 'Parcialmente cumprida', concluida: 'Concluída', alterada: 'Alterada ou interrompida' };

export default function MandateDashboard({ onBack }) {
  const [view, setView] = useState('kanban');
  const [theme, setTheme] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const items = useMemo(() => commitments.filter((item) => (!theme || item.eixo === theme) && (!status || item.status === status)
    && `${item.tituloCurto} ${item.descricao} ${item.eixo}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))), [theme, status, query]);
  const open = (item) => setSelected(item);

  return <main className="mandate-page page-width">
    <button className="back-link" onClick={onBack}><ArrowLeft size={15}/> Voltar às eleições</button>
    <header className="mandate-heading">
      <div><div className="eyebrow"><span className="eyebrow-line"/> MANDATO · ELEIÇÃO 2026 · 2027–2030</div>
        <h1>Promessas em<br/><em>acompanhamento.</em></h1>
        <p>Compromissos do plano de governo registrado no TSE. Situações e evidências ainda aguardam revisão editorial.</p>
      </div>
      <aside className="mandate-summary"><span>INVENTÁRIO ATUAL</span><b>{commitments.length}</b><small>itens mapeados · cobertura do plano em revisão</small><a href={candidate.urlPdf} target="_blank" rel="noreferrer">Plano oficial de {candidate.nome}<ArrowUpRight size={14}/></a></aside>
    </header>
    <div className="mandate-notice"><b>Sem evidência suficiente</b><span>O painel ainda não atribui cumprimento. Cada proposta precisa de evidência e revisão antes de receber outra situação.</span></div>
    <section className="mandate-comparisons"><div><span className="eyebrow">COMPARAÇÃO DE CAMPANHA</span><h2>Possíveis propostas em comum</h2><p>O jogo já agrupa cartões pelo mesmo tema e título normalizados. Aqui, esses pares são sugestões automáticas que precisam de revisão editorial.</p></div>
      {suggestedPairs.length ? <div className="mandate-pair-list">{suggestedPairs.map((pair) => <article className="mandate-pair" key={`${pair.eixo}-${pair.tituloCurto}`}><span className="axis-chip">{pair.eixo}</span><h3>{pair.tituloCurto}</h3><div className="mandate-pair-texts">{pair.propostas.map((proposal) => <div key={proposal.id}><p><b>{proposal.candidatoId === candidate.id ? candidate.nome : rival.nome}:</b> {proposal.descricao}</p>{proposal.fonte && <a href={proposal.fonte} target="_blank" rel="noreferrer">Plano oficial · p. {proposal.paginas || '—'} <ArrowUpRight size={12}/></a>}</div>)}</div><span className="pair-review">Sugestão automática · requer validação</span></article>)}</div> : <p className="mandate-empty">O agrupamento exato por tema e título não encontrou pares entre os dois planos. Propostas parecidas com títulos diferentes ainda podem ser relacionadas manualmente.</p>}
    </section>
    <div className="mandate-toolbar">
      <label className="mandate-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar compromisso" aria-label="Buscar compromisso"/></label>
      <select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Filtrar por tema"><option value="">Todos os temas</option>{secondRound.eixos.map((axis) => <option key={axis}>{axis}</option>)}</select>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por situação"><option value="">Todas as situações</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <div className="mandate-view-switch" aria-label="Modo de visualização"><button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')} aria-pressed={view === 'kanban'}><LayoutGrid size={16}/> Quadro</button><button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-pressed={view === 'table'}><List size={16}/> Tabela</button></div>
    </div>
    {view === 'kanban' ? <section className="mandate-grid" aria-label="Compromissos por situação">
      {Object.entries(statusLabel).map(([status, label]) => <div className="mandate-column" key={status}><header><span>{label}</span><b>{status === 'sem-evidencia' ? items.length : 0}</b></header>{status === 'sem-evidencia' ? items.map((item) => <CommitmentCard key={item.id} item={item} onOpen={open}/>) : <p className="mandate-empty">Nenhum compromisso classificado.</p>}</div>)}
    </section> : <div className="mandate-table-wrap"><table className="mandate-table"><thead><tr><th>Compromisso</th><th>Tema</th><th>Situação</th><th>Verificado em</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><button className="mandate-row-link" onClick={() => open(item)}>{item.tituloCurto}{isComparable(item) && <ComparableBadge/>}</button></td><td>{item.eixo}</td><td><span className="mandate-status">{statusLabel[item.status]}</span></td><td>Revisão pendente</td></tr>)}</tbody></table>{!items.length && <p className="mandate-empty">Nenhum compromisso encontrado.</p>}</div>}
    <footer className="mandate-footer">Fonte dos compromissos: TSE · {candidate.nome} ({candidate.partido}) · adversário do segundo turno: {rival.nome} ({rival.partido}). O inventário não equivale a cobertura integral auditada do PDF.</footer>
    {selected && <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="mandate-detail" role="dialog" aria-modal="true" aria-labelledby="mandate-detail-title"><button className="modal-close" onClick={() => setSelected(null)} aria-label="Fechar"><X size={18}/></button><span className="axis-chip">{selected.eixo}</span><h2 id="mandate-detail-title">{selected.tituloCurto}</h2><p>{selected.descricao}</p><div className="mandate-detail-status"><span>SITUAÇÃO</span><b>{statusLabel[selected.status]}</b><small>Sem classificação de execução publicada.</small></div><h3>Origem no plano de governo</h3><p>Referência: página {selected.paginas || 'pendente de conferência'}.</p>{selected.fonte && <a href={selected.fonte} target="_blank" rel="noreferrer">Abrir fonte oficial no TSE <ArrowUpRight size={14}/></a>}{isComparable(selected) && <ComparableDetail item={selected}/>}</section></div>}
  </main>;
}

function isComparable(item) { return (item.comparacoes || []).some(({ classificacao, validado }) => classificacao === 'equiparavel' && validado === true); }
function CommitmentCard({ item, onOpen }) { return <article className="mandate-card"><button onClick={() => onOpen(item)}><span className="axis-chip">{item.eixo}</span><h3>{item.tituloCurto}</h3><p>{item.descricao}</p>{isComparable(item) && <ComparableBadge/>}<footer><span className="mandate-status">Sem evidência suficiente</span><small>Revisão pendente</small></footer></button></article>; }
function ComparableBadge() { return <span className="comparable-badge"><Check size={12}/> Proposta equiparável</span>; }
function ComparableDetail({ item }) { const relation = item.comparacoes.find(({ classificacao }) => classificacao === 'equiparavel'); const other = secondRound.propostas.find(({ id }) => id === relation.compromissoId); return other ? <section className="comparable-detail"><h3>Propostas equiparáveis</h3><p><b>{candidate.nome}:</b> {item.descricao}</p><p><b>{rival.nome}:</b> {other.descricao}</p><p>{relation.justificativa}</p></section> : null; }
