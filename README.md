# Voto por Proposta

Aplicação local para explorar propostas sem ver nomes ou partidos durante a rodada. Ao final, apresenta as propostas marcadas, as candidaturas de origem e um ranking de afinidade.

## Rodar localmente

Requer Node.js 20.19 ou superior.

```bash
npm install
npm run dev
```

Abra no navegador o endereço indicado pelo Vite, normalmente `http://localhost:5173`.

Para gerar uma versão estática, use `npm run build`; os arquivos ficam em `dist/`.

## Editar propostas

Os dados ficam em [`src/data/propostas.json`](src/data/propostas.json), fora do código da interface. Cada proposta usa este formato:

```json
{
  "id": "p049",
  "candidatoId": "lula",
  "eixo": "Saúde",
  "tituloCurto": "Título curto da proposta",
  "descricao": "Resumo neutro da proposta.",
  "fonte": "https://endereco-da-fonte"
}
```

Use um `id` único e um `candidatoId` que corresponda a um item em `candidatos`. O valor de `eixo` precisa corresponder a um dos temas em `eixos`. A fonte aparece no resultado, junto à proposta revelada. Para incluir uma candidatura nova, adicione seus dados a `candidatos` e associe as propostas ao novo `id`.

O arquivo inicial contém 48 propostas de origem, oito por candidatura, resumidas a partir das páginas de propostas de governo do TSE para as eleições de 2026. Antes de iniciar a rodada, cartões com o mesmo eixo e título são agrupados para que a mesma ideia não apareça duas vezes. Se mais de uma candidatura apresentou essa proposta, todas as origens são mantidas no resultado e na contagem de afinidade. Consulte e atualize as fontes antes de usar a base em outro ciclo eleitoral.

## Como funciona o resultado

Cada proposta marcada conta para sua candidatura. O percentual geral é calculado sobre o número de propostas daquela candidatura que apareceu na rodada atual, depois da aplicação dos filtros. O resumo por tema repete o cálculo dentro de cada eixo. O ranking é uma comparação das escolhas registradas, não uma recomendação de voto.

Durante a rodada, use `←` para passar, `→` para marcar interesse, `↓`, `Enter`, `Espaço` ou `D` para abrir os detalhes e `Backspace` para voltar uma proposta.
