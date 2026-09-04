# AGENTS.md

## Fonte de verdade e escopo

- Este arquivo orienta agentes que alterarem este repositório inteiro.
- Consulte o `README.md` para contexto geral, mas trate código, `package.json`, configurações e arquivos Docker atuais como fonte principal da verdade.
- O README veio do template Skip e está parcialmente desatualizado: indica Node 18+, porta 5173 e execução local com npm; o ambiente adotado neste projeto usa Docker, Node.js 24, serviço `freelacheck` e porta 8080.
- Não existe `package-lock.json` atualmente. Há `pnpm-lock.yaml` e `bun.lockb`, mas a imagem Docker executa `npm install` e os comandos do projeto usam npm. Não crie, substitua ou atualize lockfiles sem necessidade explícita da tarefa.

## Visão do projeto

- SPA de controle de presença (“Freela Check”) com dois fluxos: aplicativo mobile-first para freelancers e painel administrativo responsivo para gestores/gerentes.
- Stack efetiva: React 19, TypeScript, Vite 8, React Router DOM, Tailwind CSS 3, componentes shadcn/ui baseados em Radix UI, Lucide, React Hook Form/Zod, Recharts e SDK PocketBase.
- O frontend consome PocketBase pela variável `VITE_POCKETBASE_URL`. O cliente único fica em `src/lib/pocketbase/client.ts`.
- O repositório também versiona o backend PocketBase em `pocketbase/hooks/` e `pocketbase/migrations/`. O Docker Compose atual não sobe PocketBase; não presuma um backend local nem invente comandos para executá-lo ou migrá-lo.

## Ambiente Docker

- Use Docker como ambiente de desenvolvimento. A imagem usa `node:24`, diretório `/app` e expõe a porta 8080.
- O serviço do Compose é `freelacheck`; o container recebe o código por bind mount e mantém `/app/node_modules` em volume separado.
- Para o uso diário, suba a aplicação com `docker compose up -d` e acesse `http://127.0.0.1:8080`. Use `docker compose up -d --build` quando for necessário reconstruir a imagem, como após alterações relevantes no `Dockerfile` ou nas dependências.
- Prefira executar comandos Node/npm dentro do container. Com o serviço ativo, use `docker compose exec freelacheck npm run <script>`. Para uma execução isolada, use `docker compose run --rm freelacheck npm run <script>`.
- O Vite já está configurado na porta 8080; o Compose publica `8080:8080` e inicia o servidor com `--host 0.0.0.0`. Não troque host ou porta sem solicitação explícita.
- A build de produção sai em `dist/`; `npm run build:dev` usa modo development, gera `dev-dist/`, sourcemaps e ativa o plugin Skip de `data-uid` em JSX.

## Scripts existentes

Use somente scripts definidos em `package.json`:

- `npm run dev` ou `npm start`: servidor Vite de desenvolvimento.
- `npm run build`: build de produção.
- `npm run build:dev`: build no modo development.
- `npm run lint`: Oxlint em `src`.
- `npm run lint:fix`: Oxlint com correções automáticas; use apenas quando as correções estiverem no escopo.
- `npm run format`: Oxfmt com escrita.
- `npm run format:check`: verifica formatação sem escrever.
- `npm run preview`: preview da build.
- `npm test` e `npm run test:watch`: apenas informam que o projeto não possui testes e terminam com sucesso; não representam uma suíte real.

Antes de concluir uma implementação, execute no container apenas as validações relevantes que de fato existem. Como base, prefira `npm run lint`, `npm run format:check` e `npm run build`; execute `npm test` somente deixando claro que atualmente não há testes automatizados. Não invente comandos de typecheck ou outros scripts ausentes.

## Arquitetura e estrutura

- `src/main.tsx`: bootstrap React e import do CSS global.
- `src/App.tsx`: árvore completa de rotas. Envolve a aplicação em `BrowserRouter`, `AppProvider`, `Layout` e toaster. Páginas administrativas são lazy-loaded.
- `src/context/AppContext.tsx`: estado e orquestração centrais de autenticação, sessão, usuário/gestor, empresas, biometria WebAuthn, geolocalização e check-in/check-out. Consuma-o por `useApp()`; preserve suas transições de estado e persistência ao alterar fluxos.
- `src/pages/`: telas do freelancer. Fluxo atual: `/` decide o redirecionamento; `/acesso` valida telefone; `/autenticar` trata WebAuthn; `/empresas` seleciona empresa; `/inicio` registra/mostra presença; `/perfil` gerencia perfil/sessão.
- `src/pages/admin/`: login e aceite de convite, layout administrativo e páginas de dashboard, empresa, freelancers e histórico. Rotas atuais: `/admin/login`, `/admin/convite`, `/admin`, `/admin/empresa/:id`, `/admin/empresa/:id/freelancers`, `/admin/empresa/:id/freelancers/novo` e `/admin/empresa/:id/historico`.
- `src/components/`: componentes próprios compartilhados, incluindo logo, layout, modais de ponto/localização e painel de debug.
- `src/components/ui/`: biblioteca shadcn/ui existente. Reutilize esses primitives antes de criar novos componentes ou adicionar outra biblioteca visual.
- `src/services/`: fronteira de acesso a dados por domínio: `auth.ts`, `attendance.ts`, `companies.ts` e `admin.ts`. Mantenha chamadas PocketBase e mapeamento de DTOs aqui, em vez de espalhá-los pelas páginas.
- `src/hooks/`: hooks compartilhados. Para realtime do PocketBase, use `useRealtime`; ele controla callback atualizado, unsubscribe e cleanup, evitando inscrições inline conflitantes.
- `src/lib/`: utilitários de CNPJ/telefone, geolocalização, WebAuthn, storage, logging, erros PocketBase, helpers de UI e integração Skip AI. Reutilize-os antes de duplicar lógica.
- `src/lib/pocketbase/schema.json`: fotografia do schema PocketBase usada como referência; mudanças de backend devem permanecer coerentes com hooks, migrations, serviços e tipos.
- `pocketbase/migrations/`: schema e evolução das coleções (`companies`, `licenses`, `license_managers`, `freelancers`, `freelancer_companies`, `attendance_records` e `device_releases`).
- `pocketbase/hooks/`: endpoints customizados `/api/auth/*`, `/api/attendance/*` e `/api/admin/*`. Os serviços frontend tentam esses endpoints e, em vários casos, possuem fallback direto pelo SDK quando recebem 404; preserve os dois caminhos quando modificar esse comportamento.

## Convenções de implementação

- Use componentes funcionais e hooks React. Páginas são exports default; utilitários, serviços e componentes compartilhados normalmente usam exports nomeados.
- Use o alias `@/` para imports de `src`. Preserve imports relativos quando o arquivo já segue esse padrão local.
- Siga o estilo Oxfmt: aspas simples e sem ponto e vírgula. Use Tailwind e as variáveis de tema existentes em `src/main.css`/`tailwind.config.ts`.
- Combine classes condicionais com `cn()` de `src/lib/utils.ts` quando apropriado.
- Modele payloads, respostas, estado e erros com tipos/interfaces explícitos. Embora o `tsconfig.app.json` não habilite `strict`, mantenha boa tipagem, trate erros recebidos como `unknown` e evite adicionar `any`.
- Preserve os nomes de campos e os mapeamentos já necessários entre UI em português (`cidade`, `estado`, `endereco`) e registros PocketBase (`city`, `state`, `address`).
- Preserve autenticação e autorização dos dois perfis: freelancer usa telefone, vínculo de dispositivo/WebAuthn e geolocalização; gestor/gerente usa autenticação PocketBase, licença, papel e perfil.
- Dados locais devem passar pelos helpers de `src/lib/storage.ts` e pelas chaves `STORAGE_KEYS`. Não introduza acessos dispersos ao `localStorage` quando o helper atender ao caso.
- Mantenha cleanup de effects, subscriptions e timers. Não faça subscriptions PocketBase inline quando `useRealtime` for aplicável.
- Componentes administrativos grandes já concentram bastante UI e regras. Faça alterações focadas; não use uma tarefa pequena como pretexto para reorganizá-los.

## Regras para alterações

- Leia os arquivos envolvidos e procure componentes, hooks, serviços e utilitários reutilizáveis antes de criar algo novo.
- Preserve a arquitetura e a aparência existentes. Não introduza tecnologias, padrões, diretórios ou abstrações que não sejam necessários para a tarefa.
- Antes de adicionar dependências, confirme que a stack atual não resolve o problema. Se a dependência for indispensável, explique a necessidade e mantenha o mecanismo de instalação coerente com o Docker atual.
- Não faça refatorações, reformatações amplas ou correções não relacionadas.
- Não altere artefatos gerados (`dist/`, `dev-dist/`, `node_modules/`).
- Trate `.env` e dados de autenticação como sensíveis; não exponha tokens, credenciais ou valores de ambiente em logs e respostas.
- Se houver divergência entre documentação e implementação, siga a implementação atual e atualize documentação somente se isso estiver no escopo solicitado.

## Git e segurança do trabalho local

- Antes de editar, inspecione `git status` e preserve todas as alterações locais existentes, inclusive arquivos não rastreados.
- Nunca descarte, sobrescreva ou reverta trabalho local sem autorização explícita.
- Não execute comandos Git destrutivos, como `git reset --hard`, `git clean`, checkout restaurador de arquivos ou equivalentes.
- Não faça commit nem push automaticamente.
- Ao finalizar, informe os arquivos alterados e as validações executadas, incluindo limitações como a ausência de testes reais.
