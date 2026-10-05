---
name: feature
description: Fluxo padrão do Perfin_02 para implementar uma mudança usando os subagentes architect → frontend → tester → reviewer. Use quando pedirem uma nova funcionalidade ou uma alteração não trivial.
argument-hint: <descrição da mudança>
---

# Fluxo de feature

Mudança pedida: $ARGUMENTS

1. **Análise** — chame o subagente `architect` com a descrição da mudança. Mostre ao usuário o impacto, os arquivos envolvidos, os riscos e o plano, e aguarde a aprovação antes de seguir.
2. **Implementação** — para mudanças de interface, chame o `frontend` com o plano aprovado. Para outras mudanças, implemente seguindo o plano.
3. **Testes** — chame o `tester` com a lista de arquivos alterados.
4. **Review** — chame o `reviewer` com a lista de arquivos alterados.
5. **Correções** — se o tester ou o reviewer apontarem problemas, corrija e repita os passos 3 e 4 para os pontos afetados.
6. **Resumo** — informe ao usuário o que mudou, os testes executados e o que ficou pendente.
