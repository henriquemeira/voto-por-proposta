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

## Editar propostas

A única base utilizada pelo app é [`propostas-candidatos-2026.json`](propostas-candidatos-2026.json), na raiz do projeto. O Vite importa esse arquivo no build; depois de editar os dados, gere novamente o build para atualizar uma versão publicada. Durante o desenvolvimento, o Vite atualiza a aplicação automaticamente.

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

Use IDs únicos e um `candidatoId` cadastrado em `candidatos`. O eixo deve existir em `eixos`. O nível deve ser `principal` ou `completo`. Descrição e fonte são opcionais: quando faltam, o cartão informa que não há descrição adicional, e o resultado usa o `urlTse` da candidatura. Nomes, partidos, páginas e links de origem só aparecem no resultado. Cores são atribuídas automaticamente no resultado; é possível definir `corTema` no cadastro da candidatura.

O dataset fornecido tem 83 propostas de origem: 43 principais e 40 completas. Cartões com o mesmo eixo e título normalizado são agrupados, preservando suas candidaturas de origem. Hoje isso resulta em 43 cartões rápidos ou 81 completos. Os filtros recalculam a quantidade e o tempo estimado (6–9 segundos por cartão). A duração real depende do ritmo de leitura.

`paginas: null` indica conferência pendente contra o plano oficial. Referências preenchidas são exibidas conforme o dataset; o app não verifica automaticamente as fontes. Confira o conteúdo antes de apresentar a base como oficialmente validada.

## Rodadas e resultado

O modo rápido é o padrão. Após responder todos os cartões rápidos, “Aprofundar com mais propostas” adiciona cartões inéditos dos temas escolhidos e mantém todas as respostas e a ordem anterior. Se uma ideia já respondida também tiver origens adicionais no modo completo, essas origens são incluídas no cálculo sem repetir o cartão.

Ao encerrar antes do fim, o resultado informa quantos cartões ficaram sem resposta e permite continuar a rodada. O percentual é **propostas marcadas / propostas da candidatura incluídas no baralho filtrado**, inclusive as ainda não respondidas. O cálculo por tema segue a mesma regra. Empates percentuais compartilham a posição, e todas as candidaturas empatadas na maior afinidade são destacadas. A afinidade não é uma recomendação de voto.

Use `←` para passar, `→` para marcar interesse, `↓`, `Enter`, `Espaço` ou `D` para abrir detalhes e `Backspace` para desfazer. Há botões equivalentes, inclusive para desfazer no resultado.

## Guardar o resultado

Na tela de resultado, **Baixar meu resultado em PDF** gera o arquivo no próprio navegador usando jsPDF 4.2.1 instalado no projeto. O documento tem a data do teste, ranking com contagem e percentual, propostas escolhidas com candidato e partido, paginação e o aviso de apoio à decisão. Fontes padrão do PDF são locais; a geração não usa HTML, imagens remotas, CDN nem serviços externos. O download funciona sem internet quando o app já está carregado. Isso não inclui abrir o app pela primeira vez offline.

**Salvar este resultado neste navegador para abrir depois** é uma ação opcional. Não há salvamento automático nem preferência que habilite salvamentos futuros. Cada clique substitui o único resultado em `localStorage`, na chave `voto-por-proposta:last-result:v1`. O app guarda uma cópia das propostas escolhidas, candidaturas, data, totais e rankings, sem o baralho completo ou respostas rejeitadas. Essa cópia preserva o resultado mesmo se o dataset mudar depois.

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
