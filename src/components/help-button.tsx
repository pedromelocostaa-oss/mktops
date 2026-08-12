'use client';

import { useState } from 'react';

interface Article {
  title: string;
  body: string;
}

const ARTICLES: Record<string, Article> = {
  cobertura: {
    title: 'Cobertura',
    body: 'A cobertura mostra quantas publicacoes do periodo ja tem dados preenchidos. O indicador exibe "X de Y publicacoes com dados". Insights e comparacoes so aparecem quando a cobertura atinge 70% — abaixo disso, os numeros podem ser enganosos. Preencha os dados das publicacoes pendentes em Registrar ou Dados.',
  },
  silencio: {
    title: 'Regra do silencio',
    body: 'Para evitar conclusoes imprecisas, medias e rankings so sao exibidos quando ha pelo menos 5 pecas com a mesma combinacao de canal + etiqueta e a cobertura esta acima de 70%. Abaixo disso, o sistema mostra quantas pecas faltam em vez de mostrar numeros que poderiam enganar.',
  },
  etiquetas: {
    title: 'Etiquetas',
    body: 'Etiquetas classificam publicacoes por formato (ex: Reels, Carrossel) e tema (ex: Produto, Bastidores). Use-as ao registrar publicacoes para descobrir quais combinacoes de formato + tema geram melhores resultados no painel Conteudo. Quanto mais consistente a etiquetagem, melhores os insights.',
  },
};

const PAGE_ARTICLES: Record<string, string[]> = {
  '/': ['cobertura'],
  '/registrar': ['cobertura', 'etiquetas'],
  '/dados': ['cobertura'],
  '/conteudo': ['silencio', 'etiquetas', 'cobertura'],
  '/relatorios': ['cobertura', 'silencio'],
  '/canais': [],
};

export default function HelpButton({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<string | null>(null);

  const basePath = '/' + (pathname.split('/')[1] || '');
  const articleKeys = PAGE_ARTICLES[basePath] || PAGE_ARTICLES['/'] || [];

  if (articleKeys.length === 0) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(!open); setActiveArticle(null); }}
        className="fixed bottom-6 right-6 w-10 h-10 bg-brand text-white rounded-full shadow-lg flex items-center justify-center text-lg font-semibold hover:bg-brand-light z-40"
        aria-label="Ajuda"
      >
        ?
      </button>

      {open && (
        <div className="fixed bottom-18 right-6 w-80 bg-surface rounded-md shadow-lg border border-line z-40 overflow-hidden">
          {!activeArticle ? (
            <div>
              <div className="px-4 py-3 border-b border-line">
                <h3 className="text-sm font-medium text-ink">Ajuda</h3>
              </div>
              <div className="py-1">
                {articleKeys.map((key) => {
                  const article = ARTICLES[key];
                  if (!article) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveArticle(key)}
                      className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-paper transition-colors"
                    >
                      {article.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="px-4 py-3 border-b border-line flex items-center gap-2">
                <button
                  onClick={() => setActiveArticle(null)}
                  className="text-ink-soft hover:text-ink text-sm"
                >
                  ←
                </button>
                <h3 className="text-sm font-medium text-ink">
                  {ARTICLES[activeArticle]?.title}
                </h3>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-ink leading-relaxed">
                  {ARTICLES[activeArticle]?.body}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
