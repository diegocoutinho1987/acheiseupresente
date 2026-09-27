ALTER TABLE public.occasions ADD COLUMN questionnaire_visible boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN questionnaire_visible boolean NOT NULL DEFAULT true;

UPDATE public.occasions
SET questionnaire_visible = name IN ('Aniversário', 'Natal', 'Dia dos Namorados', 'Casamento', 'Formatura', 'Dia das Mães', 'Dia dos Pais', 'Outra ocasião', 'Sem ocasião específica');

UPDATE public.profiles
SET questionnaire_visible = name IN ('Mãe', 'Pai', 'Esposo(a)', 'Namorado(a)', 'Filho(a)', 'Irmão(ã)', 'Amigo(a)', 'Colega');

COMMENT ON COLUMN public.occasions.questionnaire_visible IS 'Controls whether this active occasion appears as a new choice in the public questionnaire.';
COMMENT ON COLUMN public.profiles.questionnaire_visible IS 'Controls whether this active profile appears as a new choice in the public questionnaire.';