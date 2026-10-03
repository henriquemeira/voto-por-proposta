import { jsPDF } from 'jspdf';
import { formatResultDate } from './result.js';

// Texto e fontes padrão do PDF: nenhum HTML, imagem, fonte remota ou serviço externo.
export function createResultPdf(result) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const margin = 18;
  const width = 174;
  const bottom = 270;
  let y = 24;
  doc.setProperties({ title: 'Meu resultado - Voto por Proposta', author: 'Voto por Proposta' });

  function newPage() {
    doc.addPage();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 113, 105);
    doc.text('VOTO POR PROPOSTA | MEU RESULTADO', margin, 14);
    y = 25;
  }
  function ensureSpace(height) {
    if (y + height > bottom) newPage();
  }
  function text(value, { size = 10, bold = false, color = [45, 51, 43], after = 3 } = {}) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(String(value).replace(/[\u2010-\u2015]/g, '-'), width);
    const lineHeight = size * .48;
    for (const line of lines) {
      ensureSpace(lineHeight);
      // Reaplicar estilo depois de uma quebra de página.
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += after;
  }
  function section(title) {
    ensureSpace(22);
    y += 5;
    text(title, { size: 14, bold: true, after: 5 });
  }

  text('Voto por Proposta', { size: 24, bold: true, after: 5 });
  text('Meu resultado', { size: 14, after: 5 });
  text(`Teste feito em ${formatResultDate(result.testedAt)}`);
  text(`Modo ${result.depth === 'quick' ? 'rápido' : 'completo'} | Temas: ${result.selectedAxes.length ? result.selectedAxes.join(', ') : 'todos'}`);
  text(`${result.totals.pickedCards} cartões marcados, ${result.totals.answered} respondidos de ${result.totals.included} incluídos.`);
  if (result.totals.answered < result.totals.included) {
    text('Rodada encerrada antes do fim. Os cartões sem resposta continuam no total utilizado no cálculo.', { color: [110, 113, 105] });
  }

  section('Ranking de afinidade');
  text('Percentual = propostas escolhidas / propostas da candidatura incluídas na rodada. Posições iguais indicam empate.', { size: 9, color: [110, 113, 105], after: 5 });
  if (!result.rankings.length) text('Nenhuma candidatura incluída nesta rodada.');
  for (const candidate of result.rankings) {
    ensureSpace(19);
    text(`${candidate.place}. ${candidate.nome} (${candidate.partido})${candidate.tied ? ' - empate' : ''}`, { bold: true, after: 1 });
    text(`${candidate.chosen} de ${candidate.total} propostas escolhidas | ${Math.round(candidate.percent)}% de afinidade`, { size: 9, after: 5 });
  }

  section('Propostas escolhidas');
  const candidates = Object.fromEntries(result.candidatos.map((candidate) => [candidate.id, candidate]));
  if (!result.propostas.length) text('Nenhuma proposta foi marcada nesta rodada.');
  result.propostas.forEach((proposal, index) => {
    ensureSpace(28);
    const candidate = candidates[proposal.candidatoId];
    text(`${index + 1}. ${proposal.tituloCurto}`, { bold: true, after: 1 });
    text(`${proposal.eixo} | ${candidate.nome} (${candidate.partido})`, { size: 9, after: 2 });
    if (proposal.descricao) text(proposal.descricao, { size: 9, after: 2 });
    text(proposal.paginas === null ? 'Conferência pendente: sem referência de página no plano oficial.' : `Referência no dataset: páginas ${proposal.paginas} do plano de governo.`, { size: 8, color: [110, 113, 105], after: 5 });
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(222, 219, 211);
    doc.line(margin, 279, 192, 279);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110, 113, 105);
    doc.text('Ferramenta de apoio à decisão - não é recomendação de voto.', margin, 285);
    doc.text(`${page} / ${pages}`, 192, 291, { align: 'right' });
  }
  return doc;
}

export function downloadResultPdf(result) {
  const date = new Date(result.testedAt);
  const filenameDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  createResultPdf(result).save(`voto-por-proposta-${filenameDate}.pdf`);
}
