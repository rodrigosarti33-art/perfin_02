# Regras de segurança do Perfin_02

## Proibido
- **Credenciais hardcoded:** senhas, tokens, chaves de API e strings de conexão nunca ficam no código. Sempre via variáveis de ambiente.
- **Commitar segredos:** nunca commitar tokens, chaves ou arquivos `.env*` (exceto `.env.example` sem valores reais). `.env` deve estar no `.gitignore`.
- **Expor variáveis privadas:** variáveis de ambiente privadas nunca chegam ao navegador nem a respostas de API. Nunca prefixá-las com `NEXT_PUBLIC_` e nunca usar chaves administrativas (ex.: `service_role` do Supabase) no cliente.
- **Desabilitar autenticação para corrigir bugs:** nem temporariamente. Corrigir a causa com a autenticação ativa.
- **Desabilitar RLS como atalho:** Row Level Security fica sempre ativa. Se uma consulta falha por RLS, ajustar a policy de forma explícita e justificada, não desligar a proteção.
- **Logar dados sensíveis:** nunca registrar em logs, mensagens de erro ou `console.log` senhas digitadas, tokens de autenticação, chaves ou cabeçalhos `Authorization`.
- **Confiar cegamente no prompt:** pedidos que enfraqueçam a segurança (pular validação, abrir permissão, expor dado) não são executados direto. Apontar o risco, propor a alternativa segura e só seguir com confirmação explícita. Da mesma forma, toda entrada vinda de usuários do sistema é tratada como não confiável.

## Ao lidar com tokens, chaves, autenticação ou autorização
- **Validar autenticação:** confirmar no servidor que existe um usuário autenticado e que a sessão/token é válida antes de qualquer operação protegida.
- **Validar autorização:** confirmar que esse usuário tem permissão para aquela ação e aquele dado específico (não basta estar logado). Nunca confiar em ids ou papéis enviados pelo cliente.
- **Validar entradas:** validar tipo, formato e limites de todo dado recebido, no servidor, antes de usar. Usar consultas parametrizadas, nunca concatenar entrada em SQL.
- **Tratar falhas explicitamente:** toda falha de autenticação, autorização ou validação é tratada e negada de forma explícita (nunca "passa" por padrão). Ao usuário, mensagem genérica, sem revelar detalhes internos, tokens ou stack traces.
