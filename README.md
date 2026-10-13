# Voto por Proposta

Aplicação local para explorar propostas sem ver nomes ou partidos durante a rodada. Ao final, apresenta as propostas marcadas, suas candidaturas de origem e afinidade geral e por tema, incluindo empates.

## Rodar localmente

Requer Node.js 20.19 ou superior.

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite, normalmente `http://localhost:5173`.
Para gerar uma versão estática, use `npm run build`; os arquivos ficam em `dist/`.

## Fases eleitorais e dados

O app abre na fase do segundo turno. A base [`propostas-segundo-turno.json`](src/data/propostas-segundo-turno.json) reúne as propostas de Lula e Flávio Bolsonaro, com 96 itens de origem, descrições editoriais, páginas e links para os planos oficiais. O modo rápido reúne 10 propostas principais por candidatura; o intermediário amplia a seleção para 24 por candidatura, com 14 propostas adicionais distribuídas em todos os sete temas; o completo inclui as 48 propostas de cada candidatura. As escolhas intermediárias são selecionadas editorialmente para dar cobertura temática e manter os denominadores equilibrados.

A base [`propostas-candidatos-2026.json`](propostas-candidatos-2026.json), na raiz, permanece como registro histórico do primeiro turno, sem alterações. Use os botões da página inicial para alternar entre o segundo turno e o arquivo do primeiro turno. Os resultados salvos são separados por fase; resultados legados sem fase continuam associados ao primeiro turno.

Fontes primárias: [página do TSE para o segundo turno](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026-segundo-turno), [propostas de Lula por assunto](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/lula-propostas-de-governo) e [propostas de Flávio Bolsonaro por assunto](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/flavio-bolsonaro). As descrições são sínteses editoriais; páginas e links permitem consultar o texto integral. A organização temática serve ao jogo e não é uma avaliação de qualidade nem uma transcrição integral dos programas.

Para alterar as propostas do segundo turno, edite a base JSON acima. O Vite importa o arquivo no build; depois de editar os dados, gere novamente o build para atualizar uma versão publicada. Durante o desenvolvimento, o Vite atualiza a aplicação automaticamente.

```json
{
  "id": "candidato-01",
  "candidatoId": "candidato",
  "eixo": "Saúde",
  "tituloCurto": "Título curto da proposta",
  "nivel": "principal",
  "paginas": "25-26",
  "descricao": "Descrição neutra opcional.",
  "fonte": "https://endereco-da-fonte-opcional"
}
```

Use IDs únicos e um `candidatoId` cadastrado em `candidatos`. O eixo deve existir em `eixos`. O nível deve ser `principal`, `intermediario` ou `completo`. Descrição e fonte são opcionais: quando faltam, o cartão informa que não há descrição adicional, e o resultado usa o `urlTse` da candidatura. Nomes, partidos, páginas e links de origem só aparecem no resultado. Cores são atribuídas automaticamente no resultado; é possível definir `corTema` no cadastro da candidatura.

O arquivo histórico do primeiro turno contém 83 propostas de origem; a nova base do segundo turno contém 96, distribuídas igualmente: 48 propostas por candidatura, com 10 principais e 14 intermediárias para cada uma. Cartões com o mesmo eixo e título normalizado são agrupados, preservando suas candidaturas de origem. Os filtros recalculam a quantidade e o tempo estimado (6–9 segundos por cartão). A duração real depende do ritmo de leitura.

`paginas: null` indica conferência pendente contra o plano oficial. Referências preenchidas são exibidas conforme o dataset; o app não verifica automaticamente as fontes. Confira o conteúdo antes de apresentar a base como oficialmente validada.

Em 03/10/2026, as 83 propostas receberam descrições resumidas a partir dos planos completos disponíveis no TSE. O campo `fonte` aponta para o PDF oficial, com `#page=` para o trecho utilizado. Foram localizadas páginas para os 19 registros que tinham `paginas: null`. Os textos são paráfrases editoriais; os objetivos apresentados pelos planos não representam resultados garantidos. Veja [a nota de consulta e diferenças entre títulos e documentos](docs/consulta-planos-oficiais.md).

## Rodadas e resultado

O modo rápido é o padrão. Após responder todos os cartões, a pessoa pode avançar ao intermediário e depois ao completo, mantendo respostas e ordem dos cartões existentes. Cada etapa adiciona cartões inéditos dos temas escolhidos. Se uma ideia já respondida também tiver origens adicionais numa etapa posterior, essas origens são incluídas no cálculo sem repetir o cartão.

Ao encerrar antes do fim, o resultado informa quantos cartões ficaram sem resposta e permite continuar a rodada. O percentual é **propostas marcadas / propostas da candidatura incluídas no baralho filtrado**, inclusive as ainda não respondidas. O cálculo por tema segue a mesma regra. Empates percentuais compartilham a posição, e todas as candidaturas empatadas na maior afinidade são destacadas. A afinidade não é uma recomendação de voto.

Use `←` para passar, `→` para marcar interesse, `↓`, `Enter`, `Espaço` ou `D` para abrir detalhes e `Backspace` para desfazer. Há botões equivalentes, inclusive para desfazer no resultado.

## Guardar o resultado

Na tela de resultado, **Baixar meu resultado em PDF** gera o arquivo no próprio navegador usando jsPDF 4.2.1 instalado no projeto. O documento tem a data do teste, ranking com contagem e percentual, propostas escolhidas com candidato e partido, paginação e o aviso de apoio à decisão. Fontes padrão do PDF são locais; a geração não usa HTML, imagens remotas, CDN nem serviços externos. O download funciona sem internet quando o app já está carregado. Isso não inclui abrir o app pela primeira vez offline.

**Salvar este resultado neste navegador para abrir depois** é uma ação opcional. Não há salvamento automático nem preferência que habilite salvamentos futuros. Cada clique substitui o último resultado daquela fase em `localStorage`; primeiro e segundo turno ficam separados. O app guarda uma cópia das propostas escolhidas, candidaturas, data, totais e rankings, sem o baralho completo ou respostas rejeitadas. Essa cópia preserva o resultado mesmo se o dataset mudar depois.

Ao reabrir o app no mesmo navegador e endereço, o aviso permite ver o resultado, começar novo teste ou **Esquecer este resultado**. Começar outro teste mantém o resultado anterior até uma nova ação explícita de salvar ou apagar. A cópia reaberta é para leitura e pode ser baixada em PDF. Limpar os dados do site também remove a cópia; modo privado ou permissões do navegador podem impedir o salvamento, caso em que a interface informa a falha.

Geração do PDF, salvamento e exclusão não fazem chamadas de rede. Os dados permanecem no navegador do usuário; não há e-mail, backend, banco de dados ou histórico de múltiplos resultados.

## Organização e validação

- `src/main.jsx`: interface e estado da sessão.
- `src/lib/round.js`: filtros, agrupamento, aprofundamento, ranking e estimativas.
- `src/lib/result.js`: fotografia do resultado e armazenamento local por ação explícita.
- `src/lib/result-pdf.js`: geração e download do PDF inteiramente local com jsPDF.
- `tests/result.test.js`: salvamento, substituição, exclusão, erros de armazenamento e PDF.
- `src/styles.css`: visual e adaptações para mobile.
- `tests/round.test.js`: cenários de filtros, continuidade, duplicatas, percentuais e empates.

Execute `npm test` para validar a lógica e `npm run build` para compilar a aplicação.
