export const COVERAGE_THRESHOLD = 0.7;
export const MIN_PIECES_PER_TAG = 5;

export const CHANNEL_META: Record<string, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  google_business: { label: 'Google Business', color: '#4285F4' },
  tiktok: { label: 'TikTok', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  other: { label: 'Outro', color: '#6E7673' },
};

export const METRIC_HINTS: Record<string, string> = {
  reach: 'Insights → Contas alcançadas',
  impressions: 'Insights → Impressões',
  engagements: 'Insights → Interações',
  saves: 'Insights → Salvamentos',
  shares: 'Insights → Compartilhamentos',
  profile_clicks: 'Insights → Visitas ao perfil',
  leads: 'Contatos recebidos via publicação',
  link_clicks: 'Insights → Cliques no link',
  reactions: 'Abaixo da publicação → Reações',
  comments: 'Abaixo da publicação → Comentários',
  views: 'Analytics → Visualizações',
  website_clicks: 'Performance → Cliques no site',
  calls: 'Performance → Ligações',
  directions: 'Performance → Rotas traçadas',
  likes: 'Abaixo do vídeo → Curtidas',
  watch_hours: 'Analytics → Horas assistidas',
};
