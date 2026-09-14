# Freela Check

SPA de controle de presença para freelancers e gestores. O ambiente de desenvolvimento usa Docker Compose com o frontend React/Vite e um PocketBase local independente do backend hospedado pelo Skip.

## Pré-requisitos

- Docker Desktop com Docker Compose;
- portas `8080` e `8090` disponíveis.

Não é necessário instalar Node.js ou PocketBase diretamente na máquina.

## Subir o ambiente

No PowerShell, a partir da raiz do projeto:

```powershell
docker compose up --build
```

Para executar em segundo plano:

```powershell
docker compose up -d --build
```

URLs locais:

```text
Frontend:   http://127.0.0.1:8080
PocketBase: http://127.0.0.1:8090
Admin:      http://127.0.0.1:8090/_/
Health:     http://127.0.0.1:8090/api/health
```

## Parar e persistir os dados

```powershell
docker compose down
```

O volume nomeado `pocketbase_data` mantém integralmente `/pb/pb_data`, incluindo o SQLite, uploads, fotografias e metadados internos.

Para apagar completamente o banco e os arquivos **locais**:

```powershell
docker compose down -v
docker compose up --build
```

> **Atenção:** `docker compose down -v` apaga permanentemente o banco, os uploads e as fotografias do PocketBase local. O comando não deve ser usado quando for necessário preservar esses dados.

## PocketBase local

A imagem definida em `Dockerfile.pocketbase` usa exatamente o PocketBase Server `v0.39.0`. O download da release é validado por SHA-256 para Linux `amd64` e `arm64`.

As migrations são copiadas sem alteração:

```text
pocketbase/migrations/*.js -> /pb/pb_migrations/*.js
```

Os hooks preservam a convenção esperada pelo Skip no repositório e recebem somente a extensão exigida pelo servidor local:

```text
pocketbase/hooks/foo.js -> /pb/pb_hooks/foo.pb.js
```

O conteúdo é copiado sem transformação. Os arquivos originais nunca são renomeados e nenhum wrapper `require()` é gerado.

## Dados de desenvolvimento criados pelas migrations

A migration histórica `0002_seed_initial_data.js` cria registros quando o banco está vazio. Ela foi preservada para manter compatibilidade com o histórico do Skip e **não possui condicionamento por ambiente**. Em um novo banco local, os registros abaixo devem ser tratados exclusivamente como dados de desenvolvimento.

Usuários de autenticação da aplicação:

| Nome | E-mail | Senha de desenvolvimento |
| --- | --- | --- |
| Administrador Freela Check | `admin@bizcheck.com` | `admin123` |
| Fabricio Capelini | `fbcapelini@gmail.com` | `Skip@Pass` |

Também são criados:

- empresas de demonstração `Empresa ABC` e `Empresa XYZ`, com endereços e coordenadas;
- freelancers de demonstração Fabricio Capelini, Mariana Silva e Carlos Eduardo Rocha;
- licenças, vínculos de gestores e vínculos entre freelancers e empresas.

Esses usuários pertencem à collection de autenticação `users`. Eles **não** são superusuários do painel interno do PocketBase. Não reutilize essas senhas fora do desenvolvimento e não use essa migration para inicializar um novo ambiente de produção.

## Criar o primeiro superusuário local

Com o serviço em execução, substitua os valores do exemplo por credenciais exclusivas do seu ambiente local:

```powershell
docker compose exec pocketbase /pb/pocketbase superuser create SEU_EMAIL SUA_SENHA_FORTE
```

Depois, acesse `http://127.0.0.1:8090/_/`. Não reutilize credenciais do Skip ou de qualquer ambiente de produção.

Para consultar a ajuda do comando antes da criação:

```powershell
docker compose exec pocketbase /pb/pocketbase superuser create --help
```

## Seleção do backend por ambiente

- O Compose injeta `VITE_POCKETBASE_URL=http://127.0.0.1:8090` e `VITE_LOCAL_DEVELOPMENT=true` explicitamente no serviço `freelacheck`.
- `.env.development` não é versionado: o Preview do Skip também usa o modo `development` do Vite e deve apontar para o mesmo PocketBase remoto da produção.
- Preview e produção recebem a URL remota pelo `.env` existente ou pelo ambiente de build/deploy do Skip.
- `.env.example` documenta somente valores públicos e seguros para uma execução local fora do Docker. Nesse caso, copie-o para `.env.development.local`.
- Arquivos `.env.local` e `.env.development.local` são ignorados pelo Git.

Variáveis `VITE_*` são incorporadas ao bundle do navegador e nunca devem conter senhas, tokens ou outros segredos.

Como proteção adicional, o cliente PocketBase exige um backend de loopback quando `VITE_LOCAL_DEVELOPMENT=true` ou quando o próprio frontend é acessado por loopback. Assim, Docker, Vite local e previews locais não apontam silenciosamente para um backend remoto, enquanto Preview e produção hospedados pelo Skip podem usar a mesma URL remota.

## Comandos úteis

```powershell
# Estado dos serviços
docker compose ps

# Logs do PocketBase
docker compose logs pocketbase

# Logs do frontend
docker compose logs freelacheck

# Recriar apenas a imagem do PocketBase
docker compose build pocketbase

# Validações do frontend
docker compose exec freelacheck npm run lint
docker compose exec freelacheck npm run format:check
docker compose exec freelacheck npm run build
```

O projeto não possui uma suíte automatizada real; o script `npm test` apenas informa essa ausência e termina com sucesso.
