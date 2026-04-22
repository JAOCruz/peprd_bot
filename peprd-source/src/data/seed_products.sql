-- PepRD — Peptide catalog (approx pricing from peprd.io, verify before going live)
-- Unit = vial dosage. Sync with live pricing on the site.

INSERT INTO categories (slug, name, description, emoji, display_order) VALUES
  ('glp1',      'GLP-1 / Metabólicos',     'Péptidos para investigación metabólica y apetito', '⚖️', 1),
  ('gh',        'Hormona de crecimiento',  'Secretagogos de GH y análogos IGF',                 '🧪', 2),
  ('reparacion','Reparación tisular',      'BPC-157, TB-500 y blends de reparación',            '🩹', 3),
  ('piel',      'Piel y cabello',          'GHK, GHK-Cu, Melanotan y estética',                 '✨', 4),
  ('nootropicos','Nootrópicos',            'Semax, Selank, Cerebrolysin y cognitivos',          '🧠', 5),
  ('longevidad','Longevidad',              'Epitalon, NAD+, MOTS-c, SS-31',                     '⏳', 6),
  ('hormonales','Sexual / Hormonal',       'PT-141, Oxytocin, Kisspeptin, HCG',                 '💞', 7),
  ('inmune',    'Sistema inmune',          'Thymosin Alpha-1, LL-37, KPV, VIP',                 '🛡️', 8),
  ('soporte',   'Soporte / Reconstitución','BAC Water, B12, vitaminas y agentes solventes',     '💧', 9)
ON CONFLICT (slug) DO NOTHING;

-- ==== GLP-1 / Metabólicos ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-RETA-5',  'Retatrutide 5mg',                    'Triple agonista GLP-1/GIP/Glucagon',             3660, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-RETA-10', 'Retatrutide 10mg',                   'Triple agonista — presentación grande',          6400, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-TIRZ-10', 'Tirzepatide 10mg',                   'Dual GLP-1/GIP (Mounjaro-like)',                 4880, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-TIRZ-20', 'Tirzepatide 20mg',                   'Dual GLP-1/GIP — presentación grande',           8540, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-SEMA-5',  'Semaglutide 5mg',                    'GLP-1 análogo (Ozempic/Wegovy-like)',            3050, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-SEMA-10', 'Semaglutide 10mg',                   'GLP-1 análogo — presentación grande',            4880, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-CAGRI-5', 'Cagrilintide 5mg',                   'Análogo de amylina de larga acción',             3660, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-SECA',    'Semaglutide + Cagrilintide blend',   'CagriSema — GLP-1 + amylina',                    4880, 'blend vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-MAZDU',   'Mazdutide 5mg',                      'GLP-1/Glucagon dual agonista',                   4270, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-SURV',    'Survodutide 5mg',                    'GLP-1/Glucagon — investigación NASH',            4880, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-AOD',     'AOD-9604 5mg',                       'Fragmento lipolítico',                           1830, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-5AMINO',  '5-Amino-1MQ 100mg',                  'Inhibidor NNMT — metabolismo graso',             3050, '100mg'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-HGH176',  'HGH Frag 176-191 5mg',               'Fragmento lipolítico de GH',                     1830, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-TESA',    'Tesamorelin 5mg',                    'GHRH análogo',                                   3050, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='glp1'), 'GLP-SLU',     'SLU-PP-332 10mg',                    'Agonista ERR experimental',                      3660, '10mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Hormona de crecimiento ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-CJC-DAC',    'CJC-1295 DAC 5mg',               'GHRH larga acción con DAC',                     2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-CJC-NODAC',  'CJC-1295 No-DAC 5mg',            'GHRH modificado sin DAC',                       2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-IPA',        'Ipamorelin 5mg',                 'GH secretagogo selectivo',                      2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-CJCIPA',     'CJC-1295 + Ipamorelin blend',    'Combo sinérgico GHRH + ghrelin mimetic',        2745, 'blend vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-SERMO',      'Sermorelin 5mg',                 'GHRH (1-29) análogo',                           2135, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-GHRP2',      'GHRP-2 5mg',                     'Ghrelin mimetic — GH secretagogo',              2135, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-GHRP6',      'GHRP-6 5mg',                     'Ghrelin mimetic — apetito y GH',                2135, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-HEXA',       'Hexarelin 5mg',                  'Ghrelin mimetic potente',                       2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-SOMATR',     'Somatropin 10IU',                'GH recombinante',                               3660, '10IU vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-IGF1',       'IGF-1 LR3 1mg',                  'Long R3 IGF-1',                                 4270, '1mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-PEGMGF',     'PEG-MGF 2mg',                    'Mechano growth factor PEGilado',                3050, '2mg vial'),
  ((SELECT id FROM categories WHERE slug='gh'), 'GH-GDF8',       'GDF-8 inhibidor 1mg',            'Anti-myostatin',                                4880, '1mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Reparación tisular ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-BPC5',    'BPC-157 5mg',                  'Body Protection Compound',                         2135, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-BPC10',   'BPC-157 10mg',                 'Body Protection Compound — econ',                  3660, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-TB5',     'TB-500 5mg',                   'Thymosin Beta-4 fragmento',                        2745, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-TB10',    'TB-500 10mg',                  'Thymosin Beta-4 — grande',                         4880, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-BPCTB10', 'BPC-157 + TB-500 10mg blend',  'Combo reparación (incluye vial BAC gratis)',       6100, 'blend 10mg'),
  ((SELECT id FROM categories WHERE slug='reparacion'), 'REP-ARA',     'ARA-290 16mg',                 'Péptido Cibinetide',                               4880, '16mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Piel y cabello ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-GHK',     'GHK 50mg',                'Tripéptido cobre — piel/cabello',               1830, '50mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-GHKCU',   'GHK-Cu 50mg',             'GHK con cobre quelado',                         2135, '50mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-AHKCU',   'AHK-Cu 50mg',             'AHK-Cu para estimular folículos',               2135, '50mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-MT1',     'Melanotan 1 10mg',        'Alpha-MSH análogo',                             2440, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-MT2',     'Melanotan 2 10mg',        'Alpha-MSH análogo (más potente)',               2440, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-GLOW',    'Glow Blend',              'GHK-Cu + Glutathione + NAD+ blend',             3660, 'blend vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-SNAP8',   'SNAP-8 25mg',             'Octapéptido cosmético',                         1830, '25mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-GLUTA',   'Glutathione 600mg',       'Antioxidante maestro',                          2440, '600mg vial'),
  ((SELECT id FROM categories WHERE slug='piel'), 'PIE-HA',      'Hyaluronic Acid vial',    'HA grado investigación',                        2135, 'vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Nootrópicos ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-CERE',  'Cerebrolysin 5ml',    'Mezcla neurotrófica porcina',             2440, '5ml ampolla'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-SELA',  'Selank 10mg',         'Nootrópico ansiolítico',                  1830, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-SEMA',  'Semax 20mg',          'Péptido pro-cognitivo',                   1830, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-P21',   'P21 10mg',            'CNTF fragmento experimental',             2440, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-PE22',  'PE 22-28 5mg',        'Nootrópico experimental',                 1830, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-PINE',  'Pinealon 20mg',       'Tripéptido pineal',                       2135, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-DSIP',  'DSIP 5mg',            'Delta Sleep Inducing Peptide',            1525, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='nootropicos'), 'NOO-DERM',  'Dermorphin 5mg',      'Agonista mu-opioide',                     2745, '5mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Longevidad ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-EPI',     'Epitalon 50mg',        'Tetrapéptido telómero/pineal',          2135, '50mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-FOX04',   'FOXO4-DRI 10mg',       'Senolytic peptide',                     4880, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-MOTS',    'MOTS-c 10mg',          'Péptido mitocondrial',                  2440, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-SS31',    'SS-31 (Elamipretide) 10mg','Péptido mitocondrial de membrana',   4880, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-NAD',     'NAD+ 500mg',           'Nicotinamida adenina dinucleótido',     2745, '500mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-THYM',    'Thymalin 10mg',        'Péptido tímico',                        2135, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-VILO',    'Vilon 20mg',           'Dipéptido regulatorio',                 2135, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-TEST',    'Testagen 20mg',        'Tetrapéptido próstata/testicular',      2135, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='longevidad'), 'LON-PNC',     'PNC-27 5mg',           'Anti-cáncer experimental',              4880, '5mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Sexual / Hormonal ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='hormonales'), 'HOR-PT141',  'PT-141 (Bremelanotide) 10mg','Melanocortin — libido',            2440, '10mg vial'),
  ((SELECT id FROM categories WHERE slug='hormonales'), 'HOR-OXY',    'Oxytocin 5mg',               'Hormona oxitocina',                  1830, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='hormonales'), 'HOR-KISS',   'Kisspeptin-10 5mg',          'Péptido GnRH/HPG axis',              2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='hormonales'), 'HOR-HCG',    'HCG 5000IU',                 'Hormona coriónica gonadotrópica',    2135, '5000IU vial'),
  ((SELECT id FROM categories WHERE slug='hormonales'), 'HOR-HMG',    'HMG 75IU',                   'Human Menopausal Gonadotropin',      2135, '75IU vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Sistema inmune ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='inmune'), 'INM-TA1',   'Thymosin Alpha-1 5mg', 'Modulador inmune tímico',               3050, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='inmune'), 'INM-LL37',  'LL-37 5mg',            'Péptido antimicrobiano catelicidina',   2440, '5mg vial'),
  ((SELECT id FROM categories WHERE slug='inmune'), 'INM-KPV',   'KPV 20mg',             'Tripéptido antiinflamatorio',           1830, '20mg vial'),
  ((SELECT id FROM categories WHERE slug='inmune'), 'INM-VIP',   'VIP 5mg',              'Vasoactive Intestinal Peptide',         2440, '5mg vial')
ON CONFLICT (sku) DO NOTHING;

-- ==== Soporte / Reconstitución ====
INSERT INTO products (category_id, sku, name, description, price, unit) VALUES
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-BAC3',   'BAC Water 3ml',          'Agua bacteriostática',                     300,  '3ml vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-BAC30',  'BAC Water 30ml',         'Agua bacteriostática — grande',            900,  '30ml vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-AA',     'Acetic Acid 0.6%',       'Solvente para péptidos hidrofóbicos',      600,  '10ml vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-B12',    'Vitamina B12 5mg',       'Cianocobalamina inyectable',               900,  '5mg vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-MEL',    'Melatonin 20mg',         'Hormona del sueño',                        900,  '20mg vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-LCAR',   'L-Carnitine 500mg',      'Aminoácido quema de grasa',                1200, '500mg vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-LIPO',   'Lipo-C (Lipotropic)',    'MIC + B12 blend lipotrópico',              1525, 'blend vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-ADAM',   'Adamax 10mg',            'Blend nootrópico experimental',            2440, 'blend vial'),
  ((SELECT id FROM categories WHERE slug='soporte'), 'SUP-KLOW',   'Klow Blend',             'GHK-Cu + BPC-157 + TB-500 + KPV',          5490, 'blend vial')
ON CONFLICT (sku) DO NOTHING;
