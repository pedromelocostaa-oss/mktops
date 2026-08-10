insert into metric_definitions (channel_type, key, label_pt, unit, equivalence_group, is_primary, sort_order) values
-- Instagram
('instagram', 'reach',          'Alcance',              'count', 'audience',   true,  1),
('instagram', 'impressions',    'Impressões',            'count', 'audience',   false, 2),
('instagram', 'engagements',    'Engajamentos',          'count', 'engagement', false, 3),
('instagram', 'saves',          'Salvamentos',           'count', 'engagement', false, 4),
('instagram', 'shares',         'Compartilhamentos',     'count', 'engagement', false, 5),
('instagram', 'profile_clicks', 'Cliques no perfil',     'count', 'action',     false, 6),
('instagram', 'leads',          'Leads',                 'count', 'conversion', true,  7),
-- Facebook
('facebook', 'reach',           'Alcance',              'count', 'audience',   true,  1),
('facebook', 'impressions',     'Impressões',            'count', 'audience',   false, 2),
('facebook', 'engagements',     'Engajamentos',          'count', 'engagement', false, 3),
('facebook', 'link_clicks',     'Cliques no link',       'count', 'action',     false, 4),
('facebook', 'leads',           'Leads',                 'count', 'conversion', true,  5),
-- LinkedIn
('linkedin', 'impressions',     'Impressões',            'count', 'audience',   true,  1),
('linkedin', 'reactions',       'Reações',               'count', 'engagement', false, 2),
('linkedin', 'comments',        'Comentários',           'count', 'engagement', false, 3),
('linkedin', 'shares',          'Compartilhamentos',     'count', 'engagement', false, 4),
('linkedin', 'link_clicks',     'Cliques no link',       'count', 'action',     false, 5),
('linkedin', 'leads',           'Leads',                 'count', 'conversion', true,  6),
-- Google Business
('google_business', 'views',          'Visualizações',    'count', 'audience',   true,  1),
('google_business', 'website_clicks', 'Cliques no site',  'count', 'action',     false, 2),
('google_business', 'calls',          'Ligações',         'count', 'action',     false, 3),
('google_business', 'directions',     'Rotas traçadas',   'count', 'action',     false, 4),
('google_business', 'leads',          'Leads',            'count', 'conversion', true,  5),
-- TikTok
('tiktok', 'views',       'Visualizações',        'count', 'audience',   true,  1),
('tiktok', 'likes',        'Curtidas',             'count', 'engagement', false, 2),
('tiktok', 'comments',     'Comentários',          'count', 'engagement', false, 3),
('tiktok', 'shares',       'Compartilhamentos',    'count', 'engagement', false, 4),
('tiktok', 'saves',        'Salvamentos',          'count', 'engagement', false, 5),
('tiktok', 'leads',        'Leads',                'count', 'conversion', true,  6),
-- YouTube
('youtube', 'views',              'Visualizações',       'count', 'audience',   true,  1),
('youtube', 'impressions',        'Impressões',           'count', 'audience',   false, 2),
('youtube', 'likes',              'Curtidas',            'count', 'engagement', false, 3),
('youtube', 'comments',           'Comentários',         'count', 'engagement', false, 4),
('youtube', 'shares',             'Compartilhamentos',   'count', 'engagement', false, 5),
('youtube', 'watch_hours',        'Horas assistidas',    'hours', 'engagement', false, 6),
('youtube', 'leads',              'Leads',               'count', 'conversion', true,  7);
