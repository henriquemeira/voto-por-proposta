import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronUp,
  CircleHelp, Download, Heart, RotateCcw, Sparkles, X,
} from 'lucide-react';
import rawDatabase from '../propostas-candidatos-2026.json';
import { shuffle, filterDeck, extendRound, leaders, estimateTime } from './lib/round.js';
import { createResult, readSavedResult, saveResult, forgetResult, formatResultDate } from './lib/result.js';
import { downloadResultPdf } from './lib/result-pdf.js';
import './styles.css';

const resultColors = ['#b34136', '#315b77', '#27766b', '#bc7c30', '#d39131', '#77508a'];
const database = { ...rawDatabase, candidatos: rawDatabase.candidatos.map((candidate, index) => ({
  ...candidate, corTema: candidate.corTema || resultColors[index % resultColors.length],
})) };

function App() {
  const [screen, setScreen] = useState('intro');
  const [testedAt, setTestedAt] = useState(() => new Date().toISOString());
  const [savedState, setSavedState] = useState(() => readSavedResult());
  const [viewedResult, setViewedResult] = useState(null);
  const [dismissSavedNotice, setDismissSavedNotice] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [selectedAxes, setSelectedAxes] = useState([]);
  const [depth, setDepth] = useState('quick');
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
    () => Object.fromEntries((viewedResult?.candidatos || database.candidatos).map((candidate) => [candidate.id, candidate])),
    [viewedResult],
  );
  const liveResult = useMemo(() => createResult({ testedAt, depth, selectedAxes, round, answers,
    candidatos: database.candidatos, eixos: database.eixos }), [testedAt, depth, selectedAxes, round, answers]);
  const visibleResult = viewedResult || liveResult;
  const picked = visibleResult.propostas;
  const resultTotals = visibleResult.totals;

  const quickDeck = useMemo(() => filterDeck(database.propostas, selectedAxes, 'quick'), [selectedAxes]);
  const completeDeck = useMemo(() => filterDeck(database.propostas, selectedAxes, 'complete'), [selectedAxes]);
  const selectedDeck = depth === 'quick' ? quickDeck : completeDeck;
  const additionalCount = completeDeck.filter((card) => !round.some((item) => item.id === card.id)).length;
  const rankings = visibleResult.rankings;
  const topCandidates = leaders(rankings);
  const areaRankings = visibleResult.areaRankings.map((area) => ({ ...area, winners: leaders(area.stats) }));

  const openSavedResult = () => {
    if (!savedState.result) return;
    setViewedResult(savedState.result);
    setResultMessage('');
    setScreen('results');
  };

  const saveCurrentResult = () => {
    const outcome = saveResult(visibleResult);
    if (!outcome.error) setSavedState(outcome);
    setResultMessage(outcome.error || 'Resultado salvo neste navegador. O resultado anterior, se havia, foi substituído.');
  };

  const forgetSavedResult = () => {
    const outcome = forgetResult();
    if (outcome.error) {
      setResultMessage(outcome.error);
      setSavedState((previous) => ({ ...previous, error: outcome.error }));
    } else {
      setSavedState(outcome);
      setResultMessage('Resultado salvo apagado deste navegador.');
    }
  };

  const exportPdf = () => {
    setPdfBusy(true);
    setResultMessage('');
    try {
      downloadResultPdf(visibleResult);
      setResultMessage('PDF gerado neste dispositivo. Confira o download no navegador.');
    } catch {
      setResultMessage('Não foi possível gerar o PDF. Tente novamente neste navegador.');
    } finally {
      setPdfBusy(false);
    }
  };

  const toggleAxis = (axis) => {
    setSelectedAxes((active) => active.includes(axis)
      ? active.filter((item) => item !== axis)
      : [...active, axis]);
  };

  const startRound = () => {
    if (!selectedDeck.length) return;
    setTestedAt(new Date().toISOString());
    setViewedResult(null);
    setResultMessage('');
    clearTimeout(actionTimer.current);
    actionLock.current = false;
    setThrowDirection('');
    setRound(shuffle(selectedDeck));
    setAnswers([]);
    setExpanded(false);
    setScreen('game');
  };

  const deepen = () => {
    setRound((previous) => extendRound(previous, completeDeck));
    setDepth('complete');
    setExpanded(false);
    setDrag({ active: false, x: 0, y: 0 });
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
    setViewedResult(null);
    setResultMessage('');
    setDismissSavedNotice(false);
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  useEffect(() => () => clearTimeout(actionTimer.current), []);

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
  const deckCount = selectedDeck.length;

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
          {!dismissSavedNotice && (savedState.result || savedState.error) && <section className="saved-result-notice" aria-label="Resultado salvo neste navegador">
            {savedState.result && <><h2>Você tem um resultado salvo</h2><p>Teste de {formatResultDate(savedState.result.testedAt)}. Guardado somente neste navegador.</p>
              <div className="saved-result-actions"><button className="primary-button" onClick={openSavedResult}>Ver resultado</button><button className="secondary-button" onClick={() => { restart(); setDismissSavedNotice(true); }}>Começar novo teste</button></div></>}
            {savedState.error && <p role="status">{savedState.error}</p>}
            <button className="text-button" onClick={forgetSavedResult}>Esquecer este resultado</button>
          </section>}
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
            </div>
          </section>
          <section className="depth-panel" aria-labelledby="depth-title">
            <div><h2 id="depth-title">Quanto você quer explorar?</h2><p>As estimativas acompanham os temas escolhidos. Você pode aprofundar depois.</p></div>
            <div className="depth-options" role="group" aria-label="Profundidade da rodada">
              {[['quick', 'Modo rápido', 'Principais propostas', quickDeck], ['complete', 'Modo completo', 'Todas as propostas', completeDeck]].map(([value, label, description, deck]) =>
                <button key={value} className={`depth-option ${depth === value ? 'selected' : ''}`} aria-pressed={depth === value} onClick={() => setDepth(value)}>
                  <span><b>{label}</b><small>{description}</small></span><span>{deck.length} cartões<small>{estimateTime(deck.length)}</small></span>
                </button>)}
            </div>
            {!selectedDeck.length && <p role="status">Não há propostas neste modo para os temas escolhidos. Escolha outros temas ou o modo completo.</p>}
            <button className="primary-button" onClick={startRound} disabled={!selectedDeck.length}>Começar · {selectedDeck.length} cartões <ArrowRight size={17} /></button>
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
                <div className={`proposal-description ${expanded ? 'open' : ''}`} aria-hidden={!expanded}>{current.descricao || 'Este item contém apenas o título resumido. Ainda não há uma descrição adicional cadastrada.'}</div>
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
            <div><div className="eyebrow"><span className="eyebrow-line" /> SUA RODADA, REVELADA</div><h1>Ideias em comum.<br /><em>Agora, os nomes.</em></h1><p>Você marcou <b>{resultTotals.pickedCards}</b> {resultTotals.pickedCards === 1 ? 'cartão' : 'cartões'} entre {resultTotals.answered} respondidos, de {resultTotals.included} cartões na rodada.</p></div>
            <div className="result-seal"><span className="seal-star">✳</span><span>RESPOSTAS<br />REGISTRADAS</span><b>{resultTotals.answered}<small> / {resultTotals.included}</small></b></div>
          </div>

          <section className="ranking-section">
            <div className="section-heading"><div><span className="eyebrow">01 — AFINIDADE</span><h2>Suas propostas por candidatura</h2></div><span className="ranking-note">Percentual das propostas incluídas<br />de cada candidatura que você marcou</span></div>
            {topCandidates.length > 1 && <p className="tie-notice">Empate na maior afinidade: {topCandidates.length} candidaturas têm o mesmo percentual.</p>}
            {topCandidates.map((candidate) => <div key={candidate.id} className="top-match" style={{ '--candidate-color': candidate.corTema }}><div className="match-icon">✳</div><div><span>{topCandidates.length > 1 ? 'MAIOR AFINIDADE · EMPATE' : 'MAIOR AFINIDADE NESTA RODADA'}</span><b>{candidate.nome} <i>· {candidate.partido}</i></b></div><strong>{Math.round(candidate.percent)}<small>%</small></strong></div>)}
            <div className="ranking-list">
              {rankings.map((candidate, index) => <div className={`ranking-row ${index === 0 ? 'first' : ''}`} key={candidate.id}>
                <div className="ranking-place">{String(candidate.place).padStart(2, '0')}</div>
                <div className="ranking-name"><span className="candidate-dot" style={{ background: candidate.corTema }} /><div><b>{candidate.nome}</b><small>{candidate.partido}{candidate.tied ? ' · empate' : ''} <span>·</span> {candidate.chosen} de {candidate.total} propostas marcadas</small></div></div>
                <div className="ranking-bar"><span style={{ width: `${candidate.percent}%`, background: candidate.corTema }} /></div>
                <div className="ranking-percent">{Math.round(candidate.percent)}<small>%</small></div>
              </div>)}
            </div>
            {resultTotals.answered < resultTotals.included && <p className="tie-notice">Rodada encerrada antes do fim: {resultTotals.included - resultTotals.answered} cartões ficaram sem resposta. Eles continuam no total usado para calcular os percentuais.</p>}
            <p className="ranking-explainer">O percentual compara suas escolhas com o total de propostas daquela candidatura incluídas nesta rodada, mesmo se você encerrar antes do fim. Candidaturas sem propostas nos temas escolhidos não aparecem. A afinidade não mede qualidade nem substitui sua avaliação.</p>
          </section>

          <section className="area-section">
            <div className="section-heading"><div><span className="eyebrow">02 — AFINIDADE POR TEMA</span><h2>Onde suas ideias se encontram</h2></div><span className="ranking-note">Cada tema compara suas escolhas<br />com as propostas incluídas naquela área</span></div>
            <div className="area-grid">
              {areaRankings.map((area) => <article className="area-card" key={area.eixo}>
                <div className="area-card-head"><span className="axis-chip">{area.eixo}</span><span>{area.chosen} {area.chosen === 1 ? 'marcada' : 'marcadas'}</span></div>
                {area.winners.length ? <div className="area-winner">
                  <span className="area-caption">{area.winners.length > 1 ? 'MAIOR AFINIDADE · EMPATE' : 'MAIOR AFINIDADE NESTE TEMA'}</span>
                  {area.winners.map((candidate) => <div className="area-leader" key={candidate.id}>
                    <div className="area-candidate"><span className="candidate-dot" style={{ background: candidate.corTema }} /><div><b>{candidate.nome}</b><small>{candidate.partido}</small></div></div>
                    <div className="area-metric"><span>{candidate.chosen} de {candidate.total} propostas</span><b>{Math.round(candidate.percent)}<small>%</small></b></div>
                    <div className="area-bar"><span style={{ width: `${candidate.percent}%`, background: candidate.corTema }} /></div>
                  </div>)}
                </div> : <div className="area-empty"><b>Nenhuma proposta marcada</b><span>{area.total} propostas incluídas neste tema.</span></div>}

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
                  <div className="chosen-main"><h3>{proposal.tituloCurto}</h3>{proposal.descricao && <p>{proposal.descricao}</p>}
                    <p className={`source-status ${proposal.paginas == null ? 'pending' : ''}`}>{proposal.paginas == null ? 'Conferência pendente: sem referência de página no plano oficial.' : `Referência no dataset: páginas ${proposal.paginas} do plano de governo.`}</p>
                    {(proposal.fonte || candidate.urlTse) && <a href={proposal.fonte || candidate.urlTse} target="_blank" rel="noreferrer">Consultar página da candidatura no TSE <ArrowUpRight size={13} /></a>}</div>
                  <div className="chosen-candidate"><span className="candidate-dot" style={{ background: candidate.corTema }} /><div><b>{candidate.nome}</b><small>{candidate.partido}</small></div></div>
                </article>;
              })}
            </div>}
          </section>
          {!viewedResult && <div className="round-next-actions">
            {depth === 'quick' && resultTotals.answered === resultTotals.included && additionalCount > 0 && <div className="deepen-panel"><div><h2>Quer explorar mais ideias?</h2><p>Suas escolhas serão mantidas. Mais {additionalCount} cartões inéditos · {estimateTime(additionalCount)}.</p></div><button className="primary-button" onClick={deepen}>Aprofundar com mais propostas <ArrowRight size={17} /></button></div>}
            {resultTotals.answered < resultTotals.included && <button className="primary-button" onClick={() => setScreen('game')}>Continuar rodada <ArrowRight size={17} /></button>}
            {resultTotals.answered > 0 && <button className="back-link" onClick={undo}><RotateCcw size={14} /> Desfazer última resposta</button>}
          </div>}
          <div className="results-end"><p>Este resultado é um ponto de partida para sua pesquisa.<br />A decisão de voto continua sendo sua.</p><button className="primary-button" onClick={restart}><RotateCcw size={16} /> Refazer teste</button></div>
          <section className="result-export-panel" aria-label="Guardar meu resultado">
            <p className="result-date">Teste feito em {formatResultDate(visibleResult.testedAt)}{viewedResult ? ' · resultado salvo' : ''}</p>
            <button className="primary-button pdf-button" onClick={exportPdf} disabled={pdfBusy}><Download size={17} />{pdfBusy ? 'Gerando PDF…' : 'Baixar meu resultado em PDF'}</button>
            <p className="export-privacy">O PDF é gerado neste dispositivo, inclusive sem internet com o app já aberto.</p>
            <button className="secondary-button save-result-button" onClick={saveCurrentResult}>Salvar este resultado neste navegador para abrir depois</button>
            <p className="export-privacy">Salvar é opcional. Só o último resultado é guardado, apenas quando você clica no botão. O dado fica só neste navegador: o app o lê aqui, sem acesso por servidor ou outro dispositivo e sem enviá-lo pela rede.</p>
            {(savedState.result || savedState.error) && <button className="text-button" onClick={forgetSavedResult}>Esquecer este resultado</button>}
            {resultMessage && <p className="result-action-message" role="status">{resultMessage}</p>}
          </section>

          <footer className="results-footer">VOTO POR PROPOSTA <span>·</span> Dataset fornecido · referências ao TSE · itens sem páginas aguardam conferência</footer>
        </main>
      )}

      {showMethod && <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMethod(false); }}>
        <section className="method-modal" role="dialog" aria-modal="true" aria-labelledby="method-title"><button className="modal-close" onClick={() => setShowMethod(false)} aria-label="Fechar"><X size={18} /></button><div className="eyebrow"><span className="eyebrow-line" /> COMO FUNCIONA</div><h2 id="method-title">Uma proposta de cada vez.</h2><p>Os cartões aparecem em ordem aleatória, sem nome ou partido. Você pode ler mais, marcar interesse ou passar, e voltar à resposta anterior. Uma proposta com o mesmo eixo e título aparece uma só vez.</p><p>No resultado, as identidades são reveladas. Se mais de uma candidatura apresentou a mesma proposta, todas as origens entram no cálculo. O ranking mostra a proporção de propostas marcadas em relação às propostas daquela candidatura incluídas na rodada. Empates percentuais são apresentados juntos. O modo rápido inclui as principais propostas e permite aprofundar mantendo suas escolhas.</p><p className="keyboard-hint">Teclas: ← passar · → interessa · ↓, Enter, Espaço ou D: abrir detalhes</p><button className="primary-button" onClick={() => setShowMethod(false)}>Entendi <Check size={16} /></button></section>
      </div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
