# Evolução: propostas de campanha e acompanhamento do mandato

## Objetivo

Acrescentar ao Voto por Proposta um painel público que acompanhe, durante o mandato, as propostas oficiais da candidatura eleita, sem apagar nem reinterpretar os registros usados no primeiro e no segundo turno. O app passa a ter duas áreas com propósitos diferentes:

- **Eleições:** experiência de exploração de propostas e resultados por edição e turno, preservando o funcionamento atual.
- **Mandatos:** acompanhamento longitudinal de compromissos, evidências, atualizações e comparação entre programas eleitorais.

O mandato deve ser identificado pelo ciclo eleitoral (por exemplo, eleição, turno, período e candidatura vencedora), não por um nome fixo no código. Assim, a próxima eleição poderá ganhar uma nova edição sem sobrescrever a anterior.

## Princípios editoriais

1. **Separar promessa de execução.** O texto registrado no TSE é a origem do compromisso. A avaliação do mandato é uma interpretação editorial apoiada em evidências.
2. **Guardar a origem de cada afirmação.** Cada compromisso deve apontar para o documento oficial e página ou trecho; cada atualização deve apontar para uma fonte de execução e sua data de consulta.
3. **Não converter atividade em conclusão.** Anúncio, envio de projeto, aprovação, regulamentação, início de execução e resultado social são etapas diferentes.
4. **Permitir incerteza e mudança.** Uma proposta pode ser parcialmente cumprida, alterada, suspensa ou sem evidência suficiente. O sistema não deve forçar um “sim/não”.
5. **Manter histórico auditável.** Atualizações são datadas e acrescentadas ao histórico; correções editoriais não apagam o que foi publicado antes.
6. **Tratar ausência de evidência com cuidado.** “Não localizado” ou “sem atualização” não significa “não cumprido”.

## O que conta como “100% das propostas”

O objetivo deve ser cobrir todos os compromissos identificáveis no plano oficial protocolado no TSE, mas a unidade precisa ser definida antes da contagem. Um plano pode conter diagnóstico, diretrizes amplas, objetivos, medidas concretas e várias ações dentro do mesmo parágrafo. A página de propostas por assunto do TSE ajuda a navegar, mas não deve ser presumida como inventário exaustivo de cada compromisso do PDF.

Para cada edição, o processo recomendado é congelar o arquivo original do TSE, registrar versão, data e hash, e fazer uma extração editorial completa. Cada item atômico recebe página(s), trecho de apoio e tipo: meta mensurável, entrega/ação, diretriz ou compromisso legislativo/institucional. Publicar também o método, a contagem por tipo e os itens ainda em revisão. Assim, “100%” significa cobertura do documento conforme um critério público, não garantia de que todas as frases aspiracionais possam ser verificadas como entregas.

## Experiência do painel

### Visão geral

- Cabeçalho com mandato, período coberto, data da última revisão e link para metodologia.
- Indicadores de quantidade por status, com totais e denominador visíveis.
- Filtros por tema, órgão responsável, tipo de compromisso, status e período da última atualização.
- Aviso claro de que as classificações são avaliações editoriais baseadas nas evidências linkadas.

### Quadro Kanban

O quadro serve para leitura rápida, mas não deve reduzir toda a execução a três colunas. Algumas promessas dependem de medidas do Executivo; outras precisam passar pelo Congresso e podem ficar aguardando análise, votação ou decisão de veto. Para representar isso sem misturar conceitos, cada compromisso tem dois campos independentes:

- **Situação da promessa:** não iniciada, em andamento, parcialmente cumprida, concluída, alterada/interrompida ou sem evidência suficiente.
- **Etapa legislativa:** não se aplica, medida ainda não enviada, aguardando análise, em tramitação, aguardando votação, aprovada, rejeitada, vetada, veto parcial, veto aguardando análise, veto mantido ou veto derrubado. O estágio deve incluir a casa legislativa, número e ano da proposição, última movimentação e link para a fonte oficial.

O Kanban pode ter faixas/visões por etapa, por exemplo **Execução pelo governo**, **Aguardando Congresso**, **Em tramitação**, **Aguardando votação**, **Aprovada — acompanhar implementação**, **Veto e análise do veto**, e **Concluídas**. Os filtros permitem alternar entre agrupar pela situação da promessa e pela etapa legislativa. A lista de etapas não se aplica a compromissos que não dependem de lei; eles permanecem nas colunas de execução. Rejeição ou veto não significam automaticamente promessa encerrada: o status geral continua separado e a justificativa explica o efeito sobre o compromisso.

O cartão mostra título, tema, situação da promessa, etapa legislativa quando aplicável, última verificação e indicador de evidência. Abrir o cartão revela o registro completo. O quadro não deve permitir arrastar e soltar como se o status fosse uma edição casual. Mudanças de situação ou etapa exigem atualização com fonte, data e nota editorial; isso mantém a classificação explicável.

Quando um compromisso tiver uma relação validada com uma proposta do outro candidato do segundo turno, o cartão recebe um selo **“Proposta equiparável”**. O selo deve ser visível tanto no Kanban quanto na tabela e levar ao detalhe comparativo, onde aparecem os dois textos oficiais e a justificativa editorial. Isso permite que pessoas que apoiaram qualquer candidatura acompanhem o compromisso comum sem sugerir que a execução já ocorreu.

O agrupamento já usado no jogo pode iniciar essa comparação: a função `buildDeck` reúne propostas pelo mesmo tema e título depois de normalizar acentos, caixa e pontuação. No painel de mandato, esse resultado deve ser tratado como **sugestão de par**, mostrando os textos de ambas as candidaturas para revisão. A coincidência exata ajuda a encontrar propostas que o jogo já apresenta no mesmo cartão, mas não confirma equivalência de escopo, público, meta ou condições. Portanto, o selo só é habilitado quando a relação tiver classificação `equiparavel` e revisão editorial explicitamente validada; outras relações sugeridas não recebem o selo.

### Tabela de acompanhamento

Uma linha por compromisso, com busca e filtros. Colunas sugeridas: título, tema, tipo, status, progresso (quando houver métrica válida), última atualização e fontes. Um ícone de check pode indicar **concluída**, mas não substitui os outros estados. No celular, a tabela vira linhas/cartões legíveis, sem exigir rolagem horizontal extensa.

### Detalhe do compromisso

- Texto curto e referência ao trecho original do plano (PDF e página).
- Status atual e justificativa editorial.
- Meta original, unidade, linha de base e prazo, quando declarados no plano.
- Linha do tempo de atualizações com data, fonte, resumo e autor/revisor.
- Ligações a objetivos/entregas do PPA, normas, orçamento, projetos de lei e indicadores relacionados, quando a correspondência for defensável.
- Para medidas legislativas: casa atual, número e tipo da proposição, autoria/iniciativa, situação, movimentações relevantes, votações, texto aprovado e, se houver, mensagem e análise de veto. Cada fato legislativo deve apontar para Câmara, Senado, Congresso Nacional, Planalto ou Diário Oficial.
- Relação com compromissos de outras candidaturas, com explicação da semelhança.

### Comparação entre candidaturas

Uma área compara compromissos registrados no TSE pelo candidato vencedor e pelo adversário do segundo turno (nesta edição, PT e PL), em pares temáticos. A comparação não deve depender permanentemente desses partidos: candidatura e eleição são dados da edição, para que o recurso continue funcionando em eleições futuras.

Cada relação recebe uma classificação editorial explícita:

- **Equiparável:** compromissos com objetivo ou entrega suficientemente coincidentes para serem acompanhados em conjunto. É esta classificação que habilita o selo **“Proposta equiparável”** nos cartões.
- **Sobreposição parcial:** compartilham parte importante, mas diferem em escopo, público, meta ou condição. Não recebe o selo de equiparável por padrão.
- **Meio diferente para objetivo parecido:** resultados pretendidos são próximos, mas os instrumentos propostos diferem.
- **Mesmo tema, sem equivalência demonstrada:** apenas o assunto é comum.
- **Sem correspondência encontrada:** não foi identificado compromisso comparável no outro plano.

A interface mostra os dois textos ou sínteses, as fontes e páginas do TSE, a classificação, a justificativa e a data da revisão. A equiparação é feita entre compromissos específicos, não entre partidos como um todo, e pode ser revisada com histórico. O selo significa que os planos contêm propostas comparáveis; não significa que os candidatos concordavam em todos os detalhes, nem que o governo está executando a versão do adversário. Para afirmar execução, o painel precisa ainda mostrar evidência de implementação e explicar a relação entre a ação do governo e cada compromisso.

## Estados e critérios

Manter um status principal e, quando for possível, uma medida quantitativa separada:

- **Não iniciada:** ainda não foi encontrada evidência de ação de implementação.
- **Em andamento:** há ação verificável ligada ao compromisso, mas falta cumprir o critério de conclusão.
- **Parcialmente cumprida:** parte identificável do compromisso foi entregue; explicar o que falta.
- **Concluída:** critério de conclusão definido para aquele compromisso foi demonstrado por fonte adequada.
- **Alterada ou interrompida:** o governo mudou, suspendeu ou abandonou o compromisso; registrar ato, data e efeito.
- **Sem evidência suficiente:** as fontes consultadas não permitem classificar com segurança.

Para compromissos legislativos, registrar também a etapa legislativa em campo próprio. Uma escala recomendada é: **não enviada**, **aguardando análise**, **em tramitação**, **aguardando votação**, **aprovada**, **rejeitada**, **vetada totalmente**, **vetada parcialmente**, **veto aguardando análise**, **veto mantido** e **veto derrubado**. Quando houver mais de uma proposição, cada uma tem seu próprio registro legislativo relacionado ao compromisso; não comprimir tramitações diferentes em um único rótulo. Após aprovação ou derrubada de veto, acompanhar sanção/promulgação, regulamentação, implementação e resultados como evidências distintas.

“Não iniciada” e “sem evidência suficiente” não devem ser inferidas automaticamente do silêncio das fontes. Os critérios de conclusão variam: aprovação de lei não prova por si só que o serviço foi implantado; execução orçamentária não prova impacto; uma meta de resultado precisa de indicador e período comparáveis.

## Fontes de dados e rotina de atualização

### Fontes primárias

1. **TSE / DivulgaCandContas:** documento de campanha registrado e metadados da candidatura. Congelar a versão usada pelo projeto como registro eleitoral.
2. **PPA e monitoramento do MPO/Seplan:** usar objetivos, metas, entregas e relatórios anuais como uma fonte central de ligação com o planejamento do governo. O PPA é relacionado, mas não é equivalência automática às promessas de campanha; o governo pode revisar seus atributos.
3. **Orçamento e execução:** consultar LOA, SIOP e Portal da Transparência para verificar recursos, empenhos e pagamentos ligados à política, sem tratá-los como prova de resultado.
4. **Legislação e Congresso:** Diário Oficial, Planalto e dados abertos da Câmara/Senado para acompanhar medidas normativas e proposições. Tramitação é evidência de etapa legislativa, não de entrega concluída.
5. **Órgãos setoriais e estatísticas oficiais:** ministérios, IBGE e demais produtores oficiais para entregas e resultados mensuráveis.

O painel PPA Aberto e os relatórios/dados abertos do monitoramento do PPA são boas fontes para a revisão periódica. O MPO informa publicação de monitoramento anual, com dados e relatórios por ano-base; portanto, não se deve prometer atualização automática contínua para compromissos cuja fonte é anual.

### Cadência viável

- **Revisão trimestral leve:** verificar mudanças relevantes em atos oficiais, andamento legislativo e páginas de programas; registrar apenas novidades verificáveis.
- **Revisão anual completa:** incorporar o relatório e os dados abertos mais recentes do monitoramento do PPA, reavaliar critérios, vínculos e indicadores.
- Exibir em cada item “verificado em” e “fonte consultada”. Sem novidade, registrar a data da checagem sem mudar o status.
- Começar com atualização editorial manual. Automatizar coleta só depois de estabilizar o esquema e identificar fontes com formato e licença adequados; automação pode sugerir evidências, mas não deve decidir status sozinha.

### Fluxo de edição para a primeira versão

O projeto é atualmente um app Vite estático sem backend: dados de propostas são JSON no repositório e resultados pessoais são locais no navegador. O MVP pode manter essa simplicidade: atualizar arquivos versionados no Git, revisar diff, publicar novo build e mostrar a data da última atualização. Isso deixa autoria e histórico transparentes, mas exige uma publicação para que o público veja mudanças.

Se mais pessoas precisarem editar sem mexer no Git, a etapa posterior pode introduzir CMS ou backend com autenticação, revisão e trilha de auditoria. Não é necessário começar por isso; primeiro validar o processo editorial com poucos itens e uma cadência sustentável.

## Modelo de dados sugerido

Separar edição eleitoral, candidatura, compromisso, fontes e observações. Não reaproveitar o status de mandato para alterar os JSONs usados pelo jogo.

```json
{
  "id": "eleicao-2026-lula-001",
  "edicaoId": "presidencial-2026-turno-2",
  "candidatoId": "lula",
  "tema": "Economia e trabalho",
  "titulo": "Título editorial do compromisso",
  "textoOriginal": "Trecho fiel ao documento ou síntese identificada como tal",
  "tipo": "meta-mensuravel",
  "meta": { "valor": 40, "unidade": "horas semanais", "prazo": "2030" },
  "fonteCampanha": {
    "url": "https://...",
    "pagina": "75",
    "versaoConsultadaEm": "2026-10-26"
  },
  "status": "em-andamento",
  "legislacao": [{
    "proposicao": "PL 1234/2027",
    "casaAtual": "Câmara dos Deputados",
    "etapa": "aguardando-votacao",
    "ultimaMovimentacaoEm": "2027-06-12",
    "urlOficial": "https://...",
    "historico": [
      { "data": "2027-02-10", "etapa": "em-tramitacao", "nota": "Apresentada à Câmara", "fonte": "https://..." },
      { "data": "2027-06-12", "etapa": "aguardando-votacao", "nota": "Parecer aprovado na comissão; aguarda votação em plenário", "fonte": "https://..." }
    ]
  }],
  "comparacoes": [{
    "compromissoId": "eleicao-2026-pl-014",
    "classificacao": "equiparavel",
    "validado": true,
    "justificativa": "Os dois compromissos definem o mesmo resultado e abrangem o mesmo público, embora usem formulações diferentes.",
    "revisadoEm": "2026-10-26"
  }],
  "criterioConclusao": "Critério editorial explícito e verificável",
  "atualizadoEm": "2026-10-26",
  "atualizacoes": [
    {
      "data": "2026-10-26",
      "status": "em-andamento",
      "nota": "O que a evidência demonstra e o que ainda falta",
      "fontes": [{ "titulo": "Fonte oficial", "url": "https://...", "publicadaEm": "2026-10-01" }]
    }
  ],
  "relacoes": [{ "compromissoId": "eleicao-2026-adversario-014", "tipo": "sobreposicao-parcial", "justificativa": "..." }]
}
```

Os campos de `meta` devem aceitar `null`; não inventar valor ou prazo quando o plano não informa. O estado corrente pode ser materializado para leitura rápida, mas o histórico em `atualizacoes` deve ser a fonte de auditoria.

## Compatibilidade e preservação do que existe

- Manter `propostas-candidatos-2026.json` como registro do primeiro turno e `src/data/propostas-segundo-turno.json` como registro do segundo turno.
- Não inserir status de mandato nesses arquivos: uma nova avaliação não pode mudar o conteúdo usado nos resultados eleitorais antigos.
- Adicionar identificadores explícitos de edição eleitoral no futuro, preservando IDs atuais ou uma tabela de migração.
- Continuar separando resultados salvos por turno; nenhum resultado pessoal precisa ser migrado para o painel público.
- Adicionar a próxima eleição como outra edição, com seus próprios documentos, candidaturas, turnos e snapshots. O painel deve pedir a edição, em vez de assumir que sempre existe um único “mandato atual”.

## Entrega por fases

### Fase 1 — Inventário e método

Fechar critério de atomização, extrair todos os compromissos do PDF oficial da candidatura vencedora e do adversário, validar páginas, registrar lacunas e publicar metodologia. Não mexer no fluxo do jogo.

### Fase 2 — MVP de acompanhamento

Adicionar navegação “Eleições / Mandato”, tabela e Kanban, filtros básicos, detalhes de compromisso, fontes de campanha e histórico manual de atualização. Começar com status editorial e evidências para cada item publicado. O conjunto de compromissos pode ser incluído progressivamente, exibindo cobertura e itens ainda em revisão para não sugerir completude prematura.

### Fase 3 — Comparação

Reaproveitar `buildDeck` para listar sugestões de pares com mesmo tema e título normalizados, apresentando os textos lado a lado para revisão. Validar ou corrigir editorialmente cada relação, registrando classificação, justificativa e data; só relações equiparáveis validadas recebem o selo. Ampliar depois a identificação para correspondências temáticas com títulos diferentes. Separar semelhança de campanha da execução no governo.

### Fase 4 — Dados e manutenção

Importar planilhas/dados abertos do PPA para ajudar a localizar vínculos; adicionar referências de orçamento, legislação e indicadores. Avaliar automação de alertas e edição colaborativa apenas depois de testar uma ou duas rodadas reais de atualização.

## Critérios de aceite do MVP

- O acesso às áreas eleitorais atuais e seus resultados continua funcionando sem alteração de conteúdo.
- É possível abrir uma edição de mandato sem tornar seus status parte do jogo eleitoral.
- Cada compromisso publicado tem fonte de campanha; cada classificação tem justificativa e ao menos uma evidência, ou é marcada claramente como sem evidência suficiente.
- Compromissos legislativos mostram etapa, casa, identificação da proposição e movimentação mais recente, sem tratar aprovação ou veto como sinônimo automático de cumprimento ou descumprimento.
- O selo “Proposta equiparável” aparece apenas em pares PT/PL (ou das candidaturas da edição selecionada) classificados editorialmente como equiparáveis e abre os dois registros de origem.
- Kanban e tabela apresentam os mesmos dados e filtros básicos.
- A página mostra cobertura do inventário, última revisão e metodologia.
- Cada atualização deixa registro datado e mantém o histórico anterior.
- Comparações mostram a fonte e o motivo do pareamento, sem sugerir que mera semelhança significa cumprimento.

## Referências oficiais iniciais

- [TSE — planos de governo e consulta no DivulgaCandContas](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/propostas-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/planos-de-governo-dos-candidatos-ao-cargo-de-presidente-da-republica-eleicoes-2026/)
- [MPO — gestão do PPA 2024–2027](https://www.gov.br/planejamento/pt-br/assuntos/planejamento/plano-plurianual/gestao-do-ppa-2024-2027)
- [MPO — monitoramento do PPA e dados abertos](https://www.gov.br/planejamento/pt-br/assuntos/planejamento/plano-plurianual/arquivos/arquivos-ppa-2024-2027/gestao-do-ppa-2024-2027/monitoramento-do-ppa-2024-2027)
- [Dados Abertos da Câmara — API de proposições e tramitações](https://dadosabertos.camara.leg.br/swagger/api.html)
- [Portal da Transparência — catálogo de APIs](https://www.gov.br/conecta/catalogo/apis/portal-da-transparencia-do-governo-federal)
