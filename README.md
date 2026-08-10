# mkt-ops

Ferramenta de operacoes de marketing para equipes de pequenas e medias empresas. Registro de publicacoes em redes sociais, coleta de metricas e geracao de relatorios confiaveis.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Supabase (Postgres, Auth com magic link, RLS, Storage)

## Como rodar

1. Copie `.env.local.example` para `.env.local` e preencha as variaveis do Supabase:

```bash
cp .env.local.example .env.local
```

2. Crie um projeto no [Supabase](https://supabase.com) e execute as migrations na ordem:

```
supabase/migrations/20260806000001_schema.sql
supabase/migrations/20260806000002_seed.sql
```

3. Instale dependencias e inicie:

```bash
npm install
npm run dev
```

4. Acesse `http://localhost:3000` e entre com magic link.

## Estrutura

```
src/
  app/
    login/           Login com magic link
    onboarding/      Criacao de org + marca + canais + convites
    auth/callback/   Troca de code por sessao
    (app)/           Rotas autenticadas com sidebar
      registrar/     Registro rapido de metricas
      dados/         Tabela editavel + paste de planilha
      conteudo/      Grid de publicacoes + "O que funcionou"
      relatorios/    Lista + criacao de relatorios
    r/[slug]/        Pagina publica do relatorio
  components/        Componentes compartilhados
  lib/
    config.ts        Constantes (COVERAGE_THRESHOLD, MIN_PIECES_PER_TAG)
    data.ts          Helpers de auth e contexto (requireAuth, getUserContext)
    types.ts         Interfaces TypeScript
    supabase/        Clientes browser e server
```

## Principios

- **Honestidade de cobertura**: sempre mostra "X de Y publicacoes com dados"
- **Regra do silencio**: sem assertivas agregadas abaixo de 70% cobertura ou <5 pecas por combo de tag
- **Registro diario**: entrada rapida e a principal
- **Rastreabilidade**: quem digitou, quando, valor anterior em edicao
- **Sem instrucoes na tela**: se precisa explicar, o componente esta errado
- **Empty states desenhados**: cada tela tem estado vazio como tela de primeira classe
