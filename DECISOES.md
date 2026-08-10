# Decisoes de implementacao — Fase 1

Registro de toda decisao que divergiu do brief ou preencheu lacuna nao especificada.

## 1. Tabela `invitations`

O brief nao mencionava invitations como tabela separada. Adicionada para suportar o passo 3 do onboarding (convidar equipe) com aceitacao automatica via trigger chain: quando um usuario novo faz signup, o trigger `handle_new_user` cria o profile, e o trigger `handle_invitation_acceptance` verifica invitations pendentes pelo email e cria memberships automaticamente.

## 2. TikTok e YouTube no seed de metric_definitions

O brief listava Instagram, Facebook, LinkedIn e Google Business. Adicionados TikTok (6 metricas) e YouTube (7 metricas) no seed porque sao canais comuns e o enum `channel_type` ja os incluia.

## 3. metric_key sem FK para metric_definitions

`metric_values.metric_key` e `goals.metric_key` referenciam `metric_definitions.key` por valor (text), sem foreign key formal. Decisao: manter sem FK para permitir metricas customizadas futuras sem migration, e porque `metric_definitions` funciona como catalogo de referencia, nao como restricao.

## 4. Onboarding via security definer

O problema galinha-e-ovo: o usuario precisa criar org + brand + membership, mas RLS exige membership para acessar qualquer tabela. Resolvido com a funcao `complete_onboarding()` que roda como `security definer` e cria tudo em uma transacao.

## 5. Pagina publica sem layout (app)

A rota `/r/[slug]` fica fora do route group `(app)` para nao herdar o sidebar e a autenticacao. Usa `get_public_report` (security definer) e `record_report_view` para funcionar sem sessao.

## 6. Snapshot como JSON em vez de tabelas normalizadas

O brief pedia "snapshot ao publicar". Implementado como coluna `payload jsonb` em `report_snapshots`, contendo metricas agregadas, cobertura, metas e valores brutos congelados no momento da publicacao. Permite que o relatorio publico mostre dados historicos mesmo que os dados originais sejam editados depois.

## 7. Cores de status

O brief definia positive como azul (#1E6FA8), nao verde. Seguido a risca. Gold (#C9962B) para alertas e cobertura baixa. Negative (#A8324A) para erros.

## 8. Validacao de outliers no registro

O brief mencionava "aviso se valor >10x ou <1/10x da mediana historica". Implementado no registrar-client com comparacao contra mediana dos valores existentes para a mesma metrica no mesmo canal.

## 9. Filtros do Conteudo

O brief mencionava "filtros por canal/formato/tema". Implementados como 3 selects (canal, formato, tema). Formato e tema compartilham o estado `filterTag` porque sao mutuamente exclusivos na filtragem (um tag e ou formato ou tema).

## 10. Templates de relatorio

Tres templates conforme o brief: Diretoria (board), Comercial (sales), Time (team). A diferenca na pagina publica e que Diretoria e Comercial mostram a secao de metas, enquanto Time nao mostra.
