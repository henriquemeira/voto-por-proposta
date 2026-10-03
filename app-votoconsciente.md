# Prompt para o Agente de Desenvolvimento

Copie e cole o conteúdo abaixo no seu agente (Claude Code, Cursor, etc.) para construir a aplicação.

---

## CONTEXTO E OBJETIVO

Quero que você crie uma aplicação web (single-page, rodando localmente no navegador, sem backend obrigatório) chamada **"Voto por Proposta"**.

O objetivo é ajudar o eleitor a escolher um candidato **pelas propostas de governo, e não pelo nome ou partido**. Para isso, o app esconde a identidade do candidato até o final: o usuário só vê o conteúdo da proposta (resumida em um eixo/tema curto), e vai "jogando" para o lado que representa seu interesse/concordância. Só no final o sistema revela de quais candidatos e partidos vieram as propostas selecionadas, mostrando um ranking de afinidade.

## MECÂNICA PRINCIPAL (UX)

1. A tela mostra **cartões soltos de um lado** (ex.: lado esquerdo ou em uma pilha central), cada um contendo:
   - Um **eixo/tema curto** (ex.: "Fim da reeleição no Executivo", "Privatização de estatais", "SUS com fila zero via IA") — texto curto, de leitura rápida (máx. ~8-10 palavras no título do cartão).
   - Opcionalmente, uma descrição expandível (1-2 frases) se o usuário tocar/clicar no cartão antes de decidir.
   - **Nenhuma informação de candidato ou partido é exibida neste momento.**
2. O usuário "joga" o cartão para o outro lado por meio de:
   - **Drag-and-drop** (arrastar com o mouse/touch) para uma zona de "Tenho interesse / Concordo".
   - Também deve existir um botão alternativo (✔ Interessa / ✘ Não interessa) para acessibilidade e uso em desktop sem drag.
3. Os cartões aparecem em **ordem aleatória** e **embaralhados entre temas e candidatos**, para não criar viés de ordem.
4. Cada proposta pertence a um **tema/eixo principal** (ex.: Economia, Segurança Pública, Educação, Saúde, Reforma Política, Meio Ambiente, Trabalho). O usuário pode opcionalmente filtrar por eixo(s) de interesse no início (ex.: "só me mostre propostas de Economia e Segurança").
5. Ao final de todos os cartões (ou quando o usuário encerrar a rodada), o sistema mostra:
   - A lista de propostas que o usuário marcou como "interesse", agora **revelando o candidato e o partido** de cada uma.
   - Um **ranking de afinidade**: quantas propostas escolhidas pertencem a cada candidato (contagem e %), ordenado do maior para o menor.
   - Um gráfico simples (barras) comparando a afinidade entre os candidatos.
   - Destaque visual para o candidato com maior afinidade, mas deixando claro que é uma ferramenta de apoio à decisão, não uma recomendação de voto.

## FONTE DOS DADOS

As propostas devem vir de **fontes oficiais**, não de resumos jornalísticos. A fonte primária recomendada é o próprio TSE:

- O TSE lançou em setembro/2026 uma página oficial que reúne e organiza as propostas de **todos os candidatos à Presidência em macrotemas**, com título curto por item e referência às páginas do plano de governo original: `https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026`
- Cada candidato tem uma subpágina própria (ex.: `.../lula-propostas-de-governo`, `.../zema`, `.../ronaldo-caiado-propostas-de-governo`), já com os itens organizados por eixo temático — isso facilita muito a normalização, pois o próprio TSE já entrega títulos curtos.
- Os planos de governo completos (PDFs protocolados) também estão disponíveis no TSE, para os casos em que eu queira complementar com uma descrição mais longa de uma proposta específica.

Já extraí e normalizei uma primeira leva de propostas (6 candidatos: Lula, Flávio Bolsonaro, Caiado, Augusto Cury, Zema e Renan Santos) num arquivo `propostas-candidatos-2026.json`, que deve ser usado como dataset inicial do app. Esse arquivo já contém o campo de profundidade (ver seção abaixo).

## NÍVEIS DE PROFUNDIDADE

Para evitar que o usuário desista no meio do caminho por causa da quantidade de cartões, a aplicação deve oferecer **dois níveis de profundidade**, escolhidos pelo usuário na tela inicial:

- **Rasa (padrão)**: mostra só as propostas marcadas como `"nivel": "principal"` no dataset — as mais emblemáticas/diferenciadoras de cada candidato. Isso deve resultar em uma rodada curta (ideia: 25-35 cartões no total, considerando os 6 candidatos).
- **Profunda**: mostra todas as propostas (`"principal"` + `"completo"`), para o eleitor que quer se aprofundar.

Requisitos de UI para esse recurso:
- [ ] Tela inicial com um seletor claro (ex.: dois botões grandes: "Modo rápido (principais propostas)" vs "Modo completo (todas as propostas)"), com uma estimativa de tempo/quantidade de cartões ao lado de cada opção (ex.: "~30 cartões, 3-4 min" vs "~70 cartões, 8-10 min").
- [ ] Permitir trocar de rasa para funda **depois** de terminar uma rodada rasa, sem perder o que já foi selecionado (oferecer "Aprofundar com mais propostas" na tela de resultado, que adiciona só os cartões `"completo"` que ainda não foram vistos).
- [ ] O campo `nivel` de cada proposta deve estar sempre visível nos dados (não exibido ao usuário durante o jogo, é só um filtro interno).

## MODELO DE DADOS

Use uma estrutura de dados simples e editável (JSON), para que eu possa alimentar novas propostas facilmente depois. O arquivo `propostas-candidatos-2026.json` já fornecido segue este schema; veja abaixo um exemplo reduzido para referência:

```json
{
  "candidatos": [
    { "id": "lula", "nome": "Luiz Inácio Lula da Silva", "numero": 13, "partido": "PT", "vice": "Geraldo Alckmin", "urlTse": "https://www.tse.jus.br/.../lula-propostas-de-governo" }
  ],
  "eixos": [
    "Economia & Trabalho", "Saúde", "Segurança Pública", "Educação",
    "Agro & Meio Ambiente", "Política Externa", "Governança & Reforma do Estado"
  ],
  "propostas": [
    {
      "id": "lula-01",
      "candidatoId": "lula",
      "eixo": "Economia & Trabalho",
      "tituloCurto": "Redução da jornada 6x1 para 5x2",
      "nivel": "principal",
      "paginas": null
    },
    {
      "id": "lula-02",
      "candidatoId": "lula",
      "eixo": "Economia & Trabalho",
      "tituloCurto": "Desenrola Brasil: renegociação de dívidas",
      "nivel": "completo",
      "paginas": "6-14, 57-58"
    }
  ]
}
```

> Observação para o agente: use o arquivo `propostas-candidatos-2026.json` fornecido como dataset inicial (já tem ~12-17 propostas por candidato, classificadas em `"principal"` ou `"completo"`, com campo `paginas` referenciando o plano de governo oficial quando aplicável — `null` quando a proposta veio de cobertura jornalística e ainda precisa ser conferida contra o PDF oficial do TSE). Mantenha os textos curtos (`tituloCurto`) e neutros, sem viés de linguagem a favor ou contra qualquer candidato.

## REQUISITOS FUNCIONAIS

- [ ] Tela inicial explicando a mecânica em 2-3 frases, com botão "Começar".
- [ ] Filtro opcional por eixo(s) antes de começar (checkboxes).
- [ ] Tela de "jogo": um cartão por vez (ou pilha estilo Tinder), com drag-and-drop + botões alternativos.
- [ ] Barra de progresso (ex.: "12 de 48 propostas").
- [ ] Possibilidade de desfazer a última ação (botão "Voltar").
- [ ] Tela de resultado final com:
  - Lista de propostas escolhidas, agora com candidato + partido visíveis.
  - Ranking de afinidade por candidato (contagem absoluta e percentual sobre o total de propostas daquele candidato que existiam no jogo, para não distorcer caso um candidato tenha mais propostas cadastradas que outro).
  - Gráfico de barras simples comparando os candidatos.
  - Botão para reiniciar o teste.
- [ ] Dados devem vir de um arquivo JSON separado e fácil de editar (não hardcoded no meio do código de UI), para que eu possa adicionar/editar propostas sem mexer em lógica.

## REQUISITOS NÃO FUNCIONAIS

- Rodar 100% no navegador (pode usar React, HTML/CSS/JS puro, ou o que o agente achar mais simples de manter).
- Sem necessidade de login ou backend — estado pode viver em memória da sessão.
- Responsivo (funcionar bem em celular, já que o gesto de arrastar cartões é mobile-first).
- Visual limpo, com os cartões de proposta claramente neutros (sem logos ou cores de partido) até a tela de resultado.
- Código organizado de forma que eu consiga, no futuro, pedir para você (ou outro agente) importar propostas de uma pesquisa e gerar o JSON automaticamente.

## FORA DE ESCOPO (por enquanto)

- Não é necessário buscar dados automaticamente na internet — os dados virão de um arquivo JSON que eu forneço/edito.
- Não precisa ter sistema de contas de usuário nem salvar histórico entre sessões diferentes.
- Não é necessário fazer nenhuma recomendação de voto explícita — o app deve apenas mostrar a afinidade por proposta, deixando a decisão com o eleitor.

## MANUTENÇÃO E ATUALIZAÇÃO DO DATASET

- Os dados vivem em `propostas-candidatos-2026.json`, fora do código da interface, para que eu consiga adicionar novos candidatos, novos eixos ou novas propostas sem depender de uma nova rodada de desenvolvimento.
- Alguns itens têm `"paginas": null` porque vieram de reportagens (ex.: Band, Gazeta do Povo, CNN Brasil) e ainda não foram conferidos contra a página exata do PDF oficial do candidato no TSE. Trate esse campo como um indicador de "confiança da fonte": campos preenchidos = verificado direto na página oficial do TSE; `null` = precisa de checagem adicional antes de ser tratado como 100% oficial.
- Se eu quiser ampliar o dataset depois (mais candidatos, mais eixos), o caminho é: 1) acessar a página-índice do TSE, 2) abrir a subpágina de propostas do candidato desejado, 3) copiar os itens por macrotema para o JSON, mantendo o título curto que o próprio TSE já fornece.

## ENTREGÁVEL ESPERADO

Uma aplicação funcional com:
1. Arquivo de dados (JSON) separado e editável — `propostas-candidatos-2026.json`, já fornecido com dados reais extraídos do TSE.
2. Seletor de profundidade (rasa/funda) na tela inicial, com estimativa de cartões/tempo.
3. Interface da mecânica de "jogar os cartões" descrita acima (drag-and-drop + botões alternativos).
4. Tela de resultado com ranking de afinidade e opção de "aprofundar" sem perder o progresso.
5. Instruções curtas de como rodar o projeto localmente.
