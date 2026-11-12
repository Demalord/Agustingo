-- 05_mas_preguntas.sql — 6 preguntas más por skill y curso (12 por skill) para que las lecciones roten.
-- Solo inserta; si una pregunta ya existe (mismo curso, skill y texto) no la duplica. Correr después de 04.

insert into public.preguntas (curso, skill, tipo, pregunta, opciones, respuesta)
select v.curso, v.skill, v.tipo, v.pregunta, v.opciones::jsonb, v.respuesta
from (values
-- ═════════════════════ INGLÉS ═════════════════════
('en','basico1','opcion','¿Cómo se dice "el hombre"?','["the man","the woman","the girl"]','the man'),
('en','basico1','opcion','¿Cómo se dice "la niña"?','["the girl","the boy","the woman"]','the girl'),
('en','basico1','traducir_es_a_idioma','Él es un niño',null,'he is a boy|he''s a boy'),
('en','basico1','traducir_es_a_idioma','Ella es una mujer',null,'she is a woman|she''s a woman'),
('en','basico1','traducir_idioma_a_es','The girl',null,'la niña'),
('en','basico1','traducir_idioma_a_es','He is a man',null,'él es un hombre|es un hombre'),

('en','basico2','opcion','¿Cómo se dice "ustedes son"?','["you are","we are","they are"]','you are'),
('en','basico2','opcion','¿Cómo se dice "nosotras"?','["we","they","you"]','we'),
('en','basico2','traducir_es_a_idioma','Ellas son niñas',null,'they are girls|they''re girls'),
('en','basico2','traducir_es_a_idioma','Nosotros somos hombres',null,'we are men|we''re men'),
('en','basico2','traducir_idioma_a_es','We are women',null,'nosotras somos mujeres|somos mujeres|nosotros somos mujeres'),
('en','basico2','traducir_idioma_a_es','They are boys',null,'ellos son niños|son niños|ellos son chicos|son chicos'),

('en','saludos','opcion','¿Cómo se dice "buenas noches"?','["good night","good morning","good afternoon"]','good night'),
('en','saludos','opcion','¿Cómo se dice "por favor"?','["please","thank you","sorry"]','please'),
('en','saludos','traducir_es_a_idioma','Buenas tardes',null,'good afternoon'),
('en','saludos','traducir_es_a_idioma','Lo siento',null,'i am sorry|i''m sorry|sorry'),
('en','saludos','traducir_idioma_a_es','Thank you',null,'gracias'),
('en','saludos','traducir_idioma_a_es','Good afternoon',null,'buenas tardes'),

('en','comida','opcion','¿Cómo se dice "la leche"?','["the milk","the water","the bread"]','the milk'),
('en','comida','opcion','¿Cómo se dice "el agua"?','["the water","the milk","the apple"]','the water'),
('en','comida','traducir_es_a_idioma','Nosotros comemos pan',null,'we eat bread|we are eating bread|we''re eating bread'),
('en','comida','traducir_es_a_idioma','El niño bebe leche',null,'the boy drinks milk|the boy is drinking milk|the child drinks milk'),
('en','comida','traducir_idioma_a_es','I drink water',null,'yo bebo agua|bebo agua|yo tomo agua|tomo agua'),
('en','comida','traducir_idioma_a_es','The woman eats an apple',null,'la mujer come una manzana'),

('en','animales','opcion','¿Cómo se dice "el caballo"?','["the horse","the dog","the bird"]','the horse'),
('en','animales','opcion','¿Cómo se dice "el pájaro"?','["the bird","the cat","the horse"]','the bird'),
('en','animales','traducir_es_a_idioma','El perro bebe agua',null,'the dog drinks water|the dog is drinking water'),
('en','animales','traducir_es_a_idioma','Tengo un gato',null,'i have a cat'),
('en','animales','traducir_idioma_a_es','The bird eats bread',null,'el pájaro come pan'),
('en','animales','traducir_idioma_a_es','I have a dog',null,'yo tengo un perro|tengo un perro'),

('en','plurales','opcion','¿Cómo se dice "los gatos"?','["the cats","the cat","the dogs"]','the cats'),
('en','plurales','opcion','¿Cómo se dice "las mujeres"?','["the women","the woman","the men"]','the women'),
('en','plurales','traducir_es_a_idioma','Los perros beben agua',null,'the dogs drink water|the dogs are drinking water'),
('en','plurales','traducir_es_a_idioma','Los hombres comen manzanas',null,'the men eat apples|the men are eating apples'),
('en','plurales','traducir_idioma_a_es','The girls drink milk',null,'las niñas beben leche|las niñas toman leche'),
('en','plurales','traducir_idioma_a_es','The birds eat bread',null,'los pájaros comen pan'),

('en','verbos','opcion','¿Cómo se dice "ellos escriben"?','["they write","they read","they run"]','they write'),
('en','verbos','opcion','¿Cómo se dice "nosotros hablamos"?','["we speak","we read","we write"]','we speak'),
('en','verbos','traducir_es_a_idioma','Yo leo un libro',null,'i read a book|i am reading a book|i''m reading a book'),
('en','verbos','traducir_es_a_idioma','Ella corre',null,'she runs|she is running|she''s running'),
('en','verbos','traducir_idioma_a_es','He reads',null,'él lee|lee'),
('en','verbos','traducir_idioma_a_es','We run',null,'nosotros corremos|corremos'),

-- ═════════════════════ ITALIANO ═════════════════════
('it','basico1','opcion','¿Cómo se dice "el hombre"?','["l''uomo","la donna","la bambina"]','l''uomo'),
('it','basico1','opcion','¿Cómo se dice "la niña"?','["la bambina","il bambino","la donna"]','la bambina'),
('it','basico1','traducir_es_a_idioma','Él es un niño',null,'lui è un bambino|è un bambino'),
('it','basico1','traducir_es_a_idioma','Ella es una mujer',null,'lei è una donna|è una donna'),
('it','basico1','traducir_idioma_a_es','La bambina',null,'la niña'),
('it','basico1','traducir_idioma_a_es','Lui è un uomo',null,'él es un hombre|es un hombre'),

('it','basico2','opcion','¿Cómo se dice "ustedes son"?','["voi siete","noi siamo","loro sono"]','voi siete'),
('it','basico2','opcion','¿Cómo se dice "nosotros"?','["noi","loro","voi"]','noi'),
('it','basico2','traducir_es_a_idioma','Ellas son niñas',null,'loro sono bambine|sono bambine'),
('it','basico2','traducir_es_a_idioma','Nosotros somos hombres',null,'noi siamo uomini|siamo uomini'),
('it','basico2','traducir_idioma_a_es','Noi siamo donne',null,'nosotras somos mujeres|somos mujeres|nosotros somos mujeres'),
('it','basico2','traducir_idioma_a_es','Loro sono bambini',null,'ellos son niños|son niños'),

('it','saludos','opcion','¿Cómo se dice "buenas noches"?','["buonanotte","buongiorno","buonasera"]','buonanotte'),
('it','saludos','opcion','¿Cómo se dice "por favor"?','["per favore","grazie","scusa"]','per favore'),
('it','saludos','traducir_es_a_idioma','Buenas tardes',null,'buonasera|buona sera|buon pomeriggio'),
('it','saludos','traducir_es_a_idioma','Lo siento',null,'mi dispiace|scusa|scusi'),
('it','saludos','traducir_idioma_a_es','Grazie',null,'gracias'),
('it','saludos','traducir_idioma_a_es','Buonasera',null,'buenas tardes|buenas noches'),

('it','comida','opcion','¿Cómo se dice "la leche"?','["il latte","l''acqua","il pane"]','il latte'),
('it','comida','opcion','¿Cómo se dice "el agua"?','["l''acqua","il latte","la mela"]','l''acqua'),
('it','comida','traducir_es_a_idioma','Nosotros comemos pan',null,'noi mangiamo pane|mangiamo pane|noi mangiamo il pane|mangiamo il pane'),
('it','comida','traducir_es_a_idioma','El niño bebe leche',null,'il bambino beve latte|il bambino beve il latte'),
('it','comida','traducir_idioma_a_es','Io bevo acqua',null,'yo bebo agua|bebo agua|yo tomo agua|tomo agua'),
('it','comida','traducir_idioma_a_es','La donna mangia una mela',null,'la mujer come una manzana'),

('it','animales','opcion','¿Cómo se dice "el caballo"?','["il cavallo","il cane","l''uccello"]','il cavallo'),
('it','animales','opcion','¿Cómo se dice "el pájaro"?','["l''uccello","il gatto","il cavallo"]','l''uccello'),
('it','animales','traducir_es_a_idioma','El perro bebe agua',null,'il cane beve acqua|il cane beve l''acqua'),
('it','animales','traducir_es_a_idioma','Tengo un gato',null,'io ho un gatto|ho un gatto'),
('it','animales','traducir_idioma_a_es','L''uccello mangia pane',null,'el pájaro come pan'),
('it','animales','traducir_idioma_a_es','Io ho un cane',null,'yo tengo un perro|tengo un perro'),

('it','plurales','opcion','¿Cómo se dice "los gatos"?','["i gatti","il gatto","i cani"]','i gatti'),
('it','plurales','opcion','¿Cómo se dice "las mujeres"?','["le donne","la donna","gli uomini"]','le donne'),
('it','plurales','traducir_es_a_idioma','Los perros beben agua',null,'i cani bevono acqua|i cani bevono l''acqua'),
('it','plurales','traducir_es_a_idioma','Los hombres comen manzanas',null,'gli uomini mangiano mele|gli uomini mangiano le mele'),
('it','plurales','traducir_idioma_a_es','Le bambine bevono latte',null,'las niñas beben leche|las niñas toman leche'),
('it','plurales','traducir_idioma_a_es','Gli uccelli mangiano pane',null,'los pájaros comen pan'),

('it','verbos','opcion','¿Cómo se dice "ellos escriben"?','["loro scrivono","loro leggono","loro corrono"]','loro scrivono'),
('it','verbos','opcion','¿Cómo se dice "nosotros hablamos"?','["noi parliamo","noi leggiamo","noi scriviamo"]','noi parliamo'),
('it','verbos','traducir_es_a_idioma','Yo leo un libro',null,'io leggo un libro|leggo un libro'),
('it','verbos','traducir_es_a_idioma','Ella corre',null,'lei corre|corre'),
('it','verbos','traducir_idioma_a_es','Lui legge',null,'él lee|lee'),
('it','verbos','traducir_idioma_a_es','Noi corriamo',null,'nosotros corremos|corremos')
) as v(curso, skill, tipo, pregunta, opciones, respuesta)
where not exists (
  select 1 from public.preguntas p
  where p.curso = v.curso and p.skill = v.skill and p.pregunta = v.pregunta
);

-- Self-check: 12 preguntas de lección por skill y curso, y opciones bien formadas
do $$
begin
  assert not exists (
    select 1 from public.preguntas where tipo <> 'texto_real'
    group by curso, skill having count(*) < 12), 'cada skill debe tener al menos 12 preguntas de lección';
  assert not exists (select 1 from public.preguntas p
                     where p.tipo = 'opcion' and not (p.opciones ? p.respuesta)), 'opción correcta fuera de la lista';
end $$;
