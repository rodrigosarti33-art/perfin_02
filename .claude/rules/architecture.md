# Regras de arquitetura do Perfin_02

## Antes de mudar
- Entender e preservar a arquitetura existente antes de propor qualquer alteração. Se a mudança exigir quebrar um padrão, justificar o motivo explicitamente.
- Preferir modificar ou aprimorar um módulo existente antes de criar um novo.
- Reutilizar funções, componentes, hooks e utilitários já existentes sempre que possível. Procurar no código antes de escrever algo novo.

## Dependências
- Não introduzir novas dependências (pacotes npm, bibliotecas, serviços) sem explicar o motivo: o que resolve, por que o que já existe não serve e qual o custo (tamanho, manutenção, segurança).

## Regras de negócio
- Regras e lógica de negócio nunca ficam no código React/Next.js (componentes, hooks, páginas, layouts).
- Elas vivem em uma camada própria (módulos de domínio/serviços) ou no backend/banco. A interface apenas chama essa camada e exibe o resultado.
- Exemplos de regra de negócio: cálculos, validações de domínio, permissões, mudanças de status, regras de preço ou prazo.

## Tamanho
- Arquivos com no máximo ~400 linhas. Passou disso, dividir em módulos com responsabilidades claras.
- Funções com no máximo ~50 linhas. Passou disso, extrair partes em funções menores e bem nomeadas.
