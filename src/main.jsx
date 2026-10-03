import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronUp,
  CircleHelp, Heart, RotateCcw, Sparkles, X,
} from 'lucide-react';
import database from './data/propostas.json';
import './styles.css';

const shuffle = (items) => {
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

function buildDeck(proposals) {
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

function App() {
  const [screen, setScreen] = useState('intro');
  const [selectedAxes, setSelectedAxes] = useState([]);
  const [round, setRound] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [drag, setDrag] = useState({ active: false, x: 0, y: 0 });
  const [throwDirection, setThrowDirection] = useState('');
  const startPoint = useRef(null);
  const actionLock = useRef(false);
  const actionTimer = useRef(null);
  const [showMethod, setShowMethod] = useState(false);

  const currentIndex = answers.length;
  const current = round[currentIndex];
  const candidateById = useMemo(
    () => Object.fromEntries(database.candidatos.map((candidate) => [candidate.id, candidate])),
    [],
  );
  const pickedCards = useMemo(() => {
    const liked = new Set(answers.filter((answer) => answer.interessada).map((answer) => answer.id));
    return round.filter((proposal) => liked.has(proposal.id));
  }, [answers, round]);
  const picked = useMemo(() => pickedCards.flatMap((card) => card.propostas), [pickedCards]);

  const rankings = useMemo(() => {
    const stats = database.candidatos.map((candidate) => {
      const total = round.reduce((sum, card) => sum + card.propostas.filter((proposal) => proposal.candidatoId === candidate.id).length, 0);
      const chosen = picked.filter((proposal) => proposal.candidatoId === candidate.id).length;
      return { ...candidate, total, chosen, percent: total ? (chosen / total) * 100 : 0 };
    }).filter((candidate) => candidate.total > 0);
    return stats.sort((a, b) => b.percent - a.percent || b.chosen - a.chosen || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [picked, round]);

  const areaRankings = useMemo(() => database.eixos.map((eixo) => {
    const stats = database.candidatos.map((candidate) => {
      const total = round.reduce((sum, card) => sum + (card.eixo === eixo
        ? card.propostas.filter((proposal) => proposal.candidatoId === candidate.id).length
        : 0), 0);
      const chosen = picked.filter((proposal) => proposal.eixo === eixo && proposal.candidatoId === candidate.id).length;
      return { ...candidate, total, chosen, percent: total ? (chosen / total) * 100 : 0 };
    }).filter((candidate) => candidate.total > 0)
      .sort((a, b) => b.percent - a.percent || b.chosen - a.chosen || a.nome.localeCompare(b.nome, 'pt-BR'));
    const total = stats.reduce((sum, candidate) => sum + candidate.total, 0);
    const chosen = stats.reduce((sum, candidate) => sum + candidate.chosen, 0);
    return { eixo, stats, total, chosen, winner: chosen ? stats[0] : null };
  }).filter((area) => area.total > 0), [picked, round]);

  const toggleAxis = (axis) => {
    setSelectedAxes((active) => active.includes(axis)
      ? active.filter((item) => item !== axis)
      : [...active, axis]);
  };

  const startRound = () => {
    const filtered = selectedAxes.length
      ? database.propostas.filter((proposal) => selectedAxes.includes(proposal.eixo))
      : database.propostas;
    clearTimeout(actionTimer.current);
    actionLock.current = false;
    setThrowDirection('');
    setRound(shuffle(buildDeck(filtered)));
    setAnswers([]);
    setExpanded(false);
    setScreen('game');
  };

  const choose = useCallback((interessada) => {
    if (!current || actionLock.current) return;
    actionLock.current = true;
    setThrowDirection(interessada ? 'right' : 'left');
    setExpanded(false);
    setDrag({ active: false, x: 0, y: 0 });
    actionTimer.current = window.setTimeout(() => {
      setAnswers((previous) => [...previous, { id: current.id, interessada }]);
      setThrowDirection('');
      actionLock.current = false;
      if (currentIndex + 1 >= round.length) setScreen('results');
    }, 310);
  }, [current, currentIndex, round.length]);

  const undo = () => {
    if (!answers.length || actionLock.current) return;
    setAnswers((previous) => previous.slice(0, -1));
    setExpanded(false);
    setScreen('game');
  };

  const restart = () => {
    clearTimeout(actionTimer.current);
    actionLock.current = false;
    setThrowDirection('');
    setAnswers([]);
    setRound([]);
    setExpanded(false);
    setDrag({ active: false, x: 0, y: 0 });
    setScreen('intro');
  };

  const finishEarly = () => {
    if (!actionLock.current) setScreen('results');
  };

  useEffect(() => {
    if (screen !== 'game' || showMethod) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); choose(true); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); choose(false); }
      if (event.key === 'Backspace' && answers.length) { event.preventDefault(); undo(); }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setExpanded((value) => !value);
      }
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button, a')) {
        event.preventDefault();
        setExpanded((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, choose, answers.length, showMethod]);

  const onPointerDown = (event) => {
    if (actionLock.current || event.target.closest('button, a')) return;
    startPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ active: true, x: 0, y: 0 });
  };

  const onPointerMove = (event) => {
    if (!startPoint.current) return;
    setDrag({ active: true, x: event.clientX - startPoint.current.x, y: event.clientY - startPoint.current.y });
  };

  const onPointerUp = () => {
    if (!startPoint.current) return;
    const distance = drag.x;
    startPoint.current = null;
    if (distance > 110) choose(true);
    else if (distance < -110) choose(false);
    else setDrag({ active: false, x: 0, y: 0 });
  };

  const motion = drag.active
    ? `translate(${drag.x}px, ${drag.y * 0.35}px) rotate(${drag.x * 0.035}deg)`
    : undefined;
  const activePill = drag.x > 35 ? 'interest' : drag.x < -35 ? 'pass' : '';
  const winner = pickedCards.length ? rankings[0] : null;
  const deckCount = useMemo(() => buildDeck(database.propostas).length, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); restart(); }} aria-label="Voto por Proposta, início">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">voto <b>por</b> proposta</span>
        </a>
        <div className="topbar-right">
          <span className="privacy-note"><span className="privacy-dot" /> Identidades ocultas até o final</span>
          <button className="icon-button help-button" onClick={() => setShowMethod(true)} aria-label="Como funciona">
            <CircleHelp size={19} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {screen === 'intro' && (
        <main className="intro-screen page-width" id="inicio">
          <section className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> ELEIÇÃO COM MAIS CONTEXTO</div>
            <h1>Primeiro, as ideias.<br /><em>Depois, os nomes.</em></h1>
            <p className="hero-text">Conheça propostas sem ver quem as apresentou. Marque as que fazem sentido para você e descubra suas afinidades no final.</p>
            <div className="hero-facts">
              <div><span className="fact-icon"><Sparkles size={16} /></span><span>Cartões únicos, em ordem aleatória</span></div>
              <div><span className="fact-icon"><Heart size={16} /></span><span>Seu ritmo, suas escolhas</span></div>
            </div>
          </section>

          <aside className="preview-stack" aria-label="Prévia de um cartão anônimo">
            <div className="preview-stamp"><span className="stamp-dot" /> SEM IDENTIFICAÇÃO</div>
            <div className="preview-back preview-back-two" />
            <div className="preview-back preview-back-one" />
            <div className="preview-card">
              <div className="preview-card-top"><span className="axis-chip">EDUCAÇÃO</span><span className="preview-number">01 / {deckCount}</span></div>
              <div className="preview-spark">✳</div>
              <h2>Escola em<br />tempo integral</h2>
              <p>Uma proposta. Uma escolha. Sem nomes ou partidos à vista.</p>
              <div className="preview-card-bottom"><span>ARRASTE PARA ESCOLHER</span><ArrowRight size={16} /></div>
            </div>
            <div className="preview-orbit orbit-a" /><div className="preview-orbit orbit-b" />
            <div className="preview-caption">Uma escolha de cada vez.</div>
          </aside>

          <section className="setup-card">
            <div className="setup-intro">
              <div className="setup-step">01 <span>—</span> 02</div>
              <div><h2>Por onde você quer começar?</h2><p>Escolha os temas que mais importam. Ou deixe tudo em aberto.</p></div>
            </div>
            <div className="axis-grid" role="group" aria-label="Filtrar propostas por tema">
              {database.eixos.map((axis) => {
                const active = selectedAxes.includes(axis);
                return <button key={axis} className={`axis-option ${active ? 'selected' : ''}`} onClick={() => toggleAxis(axis)} aria-pressed={active}>
                  <span className="checkbox-mark">{active && <Check size={12} strokeWidth={2.4} />}</span>{axis}
                </button>;
              })}
            </div>
            <div className="setup-footer">
              <span className="selection-hint">{selectedAxes.length ? `${selectedAxes.length} ${selectedAxes.length === 1 ? 'tema escolhido' : 'temas escolhidos'}` : 'Sem filtro · todos os temas'}</span>
              <button className="primary-button" onClick={startRound}>Começar <ArrowRight size={17} /></button>
            </div>
          </section>
          <footer className="intro-footer"><span>FEITO PARA ESCOLHER COM CALMA</span><span>{database.propostas.length} propostas de origem · repetidas agrupadas · 0 nomes à vista</span></footer>
        </main>
      )}

      {screen === 'game' && current && (
        <main className="game-screen page-width">
          <div className="game-heading">
            <button className="back-link" onClick={restart} aria-label="Sair da rodada"><ArrowLeft size={15} /> Sair da rodada</button>
            <div className="game-heading-title"><span className="eyebrow"><span className="eyebrow-line" /> SUA RODADA</span><h1>O que faz sentido<br /><em>para você?</em></h1></div>
            <button className="finish-link" onClick={finishEarly} disabled={Boolean(throwDirection)} aria-label="Encerrar rodada">Encerrar rodada <ArrowUpRight size={15} /></button>
          </div>

          <div className="progress-panel">
            <div className="progress-label"><span>CARTÃO <b>{String(currentIndex + 1).padStart(2, '0')}</b> <i>DE</i> {String(round.length).padStart(2, '0')}</span><span>{round.length - currentIndex} restantes</span></div>
            <div className="progress-track"><span style={{ width: `${(currentIndex / round.length) * 100}%` }} /></div>
          </div>

          <div className="decision-layout">
            <div className={`drop-hint left-hint ${activePill === 'pass' ? 'hint-active' : ''}`}><span className="hint-circle"><X size={19} /></span><span>PASSAR</span><small>não é para mim</small></div>
            <div className="card-stage">
              <div className="card-context"><span className="context-dot" /> UMA PROPOSTA ANÔNIMA</div>
              <article key={current.id} className={`proposal-card ${drag.active ? 'is-dragging' : ''} ${throwDirection ? `throw-${throwDirection}` : ''}`} style={motion ? { transform: motion } : undefined}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
                <div className="proposal-card-head"><span className="axis-chip">{current.eixo}</span><span className="anonymous-mark" title="Identidade protegida">● ● ●</span></div>
                <div className="card-decoration">✳</div>
                <h2>{current.tituloCurto}</h2>
                <button className="details-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                  {expanded ? 'Ocultar detalhes' : 'Ler sobre a proposta'} {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                <div className={`proposal-description ${expanded ? 'open' : ''}`} aria-hidden={!expanded}>{current.descricao}</div>
                <div className="card-bottom"><span>ARRASTE PARA ESCOLHER</span><span className="drag-arrows"><ArrowLeft size={14} /><ArrowRight size={14} /></span></div>
                {activePill && <div className={`swipe-feedback ${activePill}`}>{activePill === 'interest' ? 'INTERESSA' : 'PASSAR'}</div>}
              </article>
              <div className="decision-buttons">
                <button className="decision-button pass-button" onClick={() => choose(false)} disabled={Boolean(throwDirection)}><span className="decision-icon"><X size={19} /></span>Não interessa <kbd>←</kbd></button>
                <button className="decision-button interest-button" onClick={() => choose(true)} disabled={Boolean(throwDirection)}><span className="decision-icon"><Check size={19} /></span>Tenho interesse <kbd>→</kbd></button>
              </div>
              <div className="undo-row"><button onClick={undo} disabled={!answers.length || Boolean(throwDirection)}><RotateCcw size={14} /> Voltar uma proposta</button><span>Você pode mudar de ideia a qualquer momento</span></div>
            </div>
            <div className={`drop-hint right-hint ${activePill === 'interest' ? 'hint-active' : ''}`}><span className="hint-circle"><Check size={18} /></span><span>INTERESSA</span><small>quero saber mais</small></div>
          </div>
          <div className="game-disclaimer"><span className="disclaimer-mark">i</span> A identidade de cada proposta permanece oculta até o resultado.</div>
        </main>
      )}

      {screen === 'results' && (
        <main className="results-screen page-width">
          <div className="results-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> SUA RODADA, REVELADA</div><h1>Ideias em comum.<br /><em>Agora, os nomes.</em></h1><p>Você marcou <b>{pickedCards.length}</b> {pickedCards.length === 1 ? 'cartão' : 'cartões'} entre {round.length} analisados.</p></div>
            <div className="result-seal"><span className="seal-star">✳</span><span>ESCOLHAS<br />CONCLUÍDAS</span><b>{answers.length}<small> / {round.length}</small></b></div>
          </div>

          <section className="ranking-section">
            <div className="section-heading"><div><span className="eyebrow">01 — AFINIDADE</span><h2>Suas propostas por candidatura</h2></div><span className="ranking-note">Percentual das propostas vistas<br />de cada candidatura que você marcou</span></div>
            {winner && <div className="top-match" style={{ '--candidate-color': winner.corTema }}><div className="match-icon">✳</div><div><span>MAIOR AFINIDADE NESTA RODADA</span><b>{winner.nome} <i>· {winner.partido}</i></b></div><strong>{Math.round(winner.percent)}<small>%</small></strong></div>}
            <div className="ranking-list">
              {rankings.map((candidate, index) => <div className={`ranking-row ${index === 0 ? 'first' : ''}`} key={candidate.id}>
                <div className="ranking-place">{String(index + 1).padStart(2, '0')}</div>
                <div className="ranking-name"><span className="candidate-dot" style={{ background: candidate.corTema }} /><div><b>{candidate.nome}</b><small>{candidate.partido} <span>·</span> {candidate.chosen} de {candidate.total} propostas marcadas</small></div></div>
                <div className="ranking-bar"><span style={{ width: `${candidate.percent}%`, background: candidate.corTema }} /></div>
                <div className="ranking-percent">{Math.round(candidate.percent)}<small>%</small></div>
              </div>)}
            </div>
            <p className="ranking-explainer">O percentual compara suas escolhas com o total de propostas daquela candidatura que apareceu nesta rodada. Candidaturas sem propostas nos temas escolhidos não aparecem. A afinidade não mede qualidade nem substitui sua avaliação.</p>
          </section>

          <section className="area-section">
            <div className="section-heading"><div><span className="eyebrow">02 — AFINIDADE POR TEMA</span><h2>Onde suas ideias se encontram</h2></div><span className="ranking-note">Cada tema compara suas escolhas<br />com as propostas vistas naquela área</span></div>
            <div className="area-grid">
              {areaRankings.map((area) => <article className="area-card" key={area.eixo}>
                <div className="area-card-head"><span className="axis-chip">{area.eixo}</span><span>{area.chosen} {area.chosen === 1 ? 'marcada' : 'marcadas'}</span></div>
                {area.winner ? <div className="area-winner">
                  <span className="area-caption">MAIOR AFINIDADE NESTE TEMA</span>
                  <div className="area-candidate"><span className="candidate-dot" style={{ background: area.winner.corTema }} /><div><b>{area.winner.nome}</b><small>{area.winner.partido}</small></div></div>
                  <div className="area-metric"><span>{area.winner.chosen} de {area.winner.total} propostas</span><b>{Math.round(area.winner.percent)}<small>%</small></b></div>
                  <div className="area-bar"><span style={{ width: `${area.winner.percent}%`, background: area.winner.corTema }} /></div>
                </div> : <div className="area-empty"><b>Nenhuma proposta marcada</b><span>{area.total} {area.total === 1 ? 'proposta apareceu' : 'propostas apareceram'} neste tema.</span></div>}
              </article>)}
            </div>
            <p className="ranking-explainer">Se uma proposta idêntica apareceu em mais de um plano, ela foi mostrada uma vez e suas origens foram mantidas no cálculo de cada candidatura.</p>
          </section>

          <section className="chosen-section">
            <div className="section-heading"><div><span className="eyebrow">03 — SUAS ESCOLHAS</span><h2>As propostas que interessaram</h2></div><span className="chosen-count">{picked.length} {picked.length === 1 ? 'proposta' : 'propostas'}</span></div>
            {picked.length === 0 ? <div className="empty-picks"><span>✳</span><p>Nenhuma proposta foi marcada nesta rodada.<br />Você pode refazer o teste e explorar outros temas.</p></div> : <div className="chosen-list">
              {picked.map((proposal) => {
                const candidate = candidateById[proposal.candidatoId];
                return <article className="chosen-card" key={proposal.id}>
                  <div className="chosen-axis">{proposal.eixo}</div>
                  <div className="chosen-main"><h3>{proposal.tituloCurto}</h3><p>{proposal.descricao}</p><a href={proposal.fonte} target="_blank" rel="noreferrer">Ver proposta no TSE <ArrowUpRight size={13} /></a></div>
                  <div className="chosen-candidate"><span className="candidate-dot" style={{ background: candidate.corTema }} /><div><b>{candidate.nome}</b><small>{candidate.partido}</small></div></div>
                </article>;
              })}
            </div>}
          </section>
          <div className="results-end"><p>Este resultado é um ponto de partida para sua pesquisa.<br />A decisão de voto continua sendo sua.</p><button className="primary-button" onClick={restart}><RotateCcw size={16} /> Refazer teste</button></div>
          <footer className="results-footer">VOTO POR PROPOSTA <span>·</span> Fontes das propostas: Tribunal Superior Eleitoral (TSE)</footer>
        </main>
      )}

      {showMethod && <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMethod(false); }}>
        <section className="method-modal" role="dialog" aria-modal="true" aria-labelledby="method-title"><button className="modal-close" onClick={() => setShowMethod(false)} aria-label="Fechar"><X size={18} /></button><div className="eyebrow"><span className="eyebrow-line" /> COMO FUNCIONA</div><h2 id="method-title">Uma proposta de cada vez.</h2><p>Os cartões aparecem em ordem aleatória, sem nome ou partido. Você pode ler mais, marcar interesse ou passar, e voltar à resposta anterior. Uma proposta com o mesmo eixo e título aparece uma só vez.</p><p>No resultado, as identidades são reveladas. Se mais de uma candidatura apresentou a mesma proposta, todas as origens entram no cálculo. O ranking mostra a proporção de propostas marcadas em relação às propostas daquela candidatura que apareceram na rodada.</p><p className="keyboard-hint">Teclas: ← passar · → interessa · ↓, Enter, Espaço ou D: abrir detalhes</p><button className="primary-button" onClick={() => setShowMethod(false)}>Entendi <Check size={16} /></button></section>
      </div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
