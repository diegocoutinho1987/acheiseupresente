CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL,
  category text NOT NULL,
  store text NOT NULL,
  affiliate_url text NOT NULL,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  occasions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active products are public" ON public.products FOR SELECT TO anon, authenticated USING (active);

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create a session" ON public.sessions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.products (name, description, price, category, store, affiliate_url, image_url, tags, occasions) VALUES
('Cafeteira Prensa Francesa 350ml', 'Prensa francesa em vidro borossilicato para um café artesanal em casa.', 129.90, 'coffee', 'Loja do Café', 'https://example.com/produto/prensa-francesa', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', ARRAY['café','cafe','gastronomia','casa','manhã','acolhedor'], ARRAY['Aniversário','Natal','Dia das Mães','Dia dos Pais','Sem ocasião específica']),
('Kit Grãos Especiais Torra Média', 'Três pacotes de café especial de diferentes regiões do Brasil.', 89.00, 'coffee', 'Grão Nobre', 'https://example.com/produto/kit-graos', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600', ARRAY['café','cafe','gastronomia','presente rápido','curioso'], ARRAY['Aniversário','Natal','Sem ocasião específica']),
('Fone de Ouvido Bluetooth com Cancelamento de Ruído', 'Fone over-ear sem fio com até 30h de bateria e cancelamento ativo de ruído.', 449.90, 'tech', 'TechPoint', 'https://example.com/produto/fone-bluetooth', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', ARRAY['tecnologia','música','musica','viagem','trabalho','concentrado'], ARRAY['Aniversário','Natal','Formatura','Dia dos Namorados']),
('Smart Speaker Compacto', 'Caixa de som inteligente com assistente de voz para a casa toda.', 299.00, 'tech', 'TechPoint', 'https://example.com/produto/smart-speaker', 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600', ARRAY['tecnologia','casa','música','musica','prático'], ARRAY['Aniversário','Natal','Casamento']),
('Luminária de Leitura Recarregável', 'Luminária de clipe com três tons de luz, ideal para ler à noite.', 79.90, 'reading', 'Casa & Letras', 'https://example.com/produto/luminaria-leitura', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600', ARRAY['leitura','livros','casa','calmo','introspectivo'], ARRAY['Aniversário','Natal','Sem ocasião específica','Dia das Mães']),
('Box Literário Clássicos Brasileiros', 'Coleção com quatro clássicos da literatura brasileira em capa dura.', 189.90, 'reading', 'Livraria Aurora', 'https://example.com/produto/box-literario', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', ARRAY['leitura','livros','cultura','estudioso'], ARRAY['Aniversário','Natal','Formatura','Dia dos Pais']),
('Manta de Tricô Grosso', 'Manta macia de tricô para o sofá, perfeita para noites frias.', 159.00, 'home', 'Casa & Letras', 'https://example.com/produto/manta-trico', 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600', ARRAY['casa','conforto','decoração','acolhedor','caseiro'], ARRAY['Aniversário','Natal','Casamento','Dia das Mães']),
('Kit Velas Aromáticas Artesanais', 'Três velas de cera vegetal com aromas de lavanda, madeira e cítrico.', 119.00, 'home', 'Ateliê Aroma', 'https://example.com/produto/velas-aromaticas', 'https://images.unsplash.com/photo-1602874801006-e26c4c5b5e8a?w=600', ARRAY['casa','bem-estar','relaxar','decoração','calmo'], ARRAY['Aniversário','Natal','Dia das Mães','Dia dos Namorados']),
('Mochila de Viagem Impermeável 35L', 'Mochila resistente à água com compartimento para notebook e bagagem de mão.', 389.00, 'travel', 'Rota Sul', 'https://example.com/produto/mochila-viagem', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', ARRAY['viagem','aventura','tecnologia','aventureiro','prático'], ARRAY['Aniversário','Formatura','Natal','Dia dos Pais']),
('Garrafa Térmica Inox 500ml', 'Mantém bebidas quentes por 12h e geladas por 24h, ideal para trilhas.', 139.90, 'travel', 'Rota Sul', 'https://example.com/produto/garrafa-termica', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', ARRAY['viagem','esporte','café','cafe','ativo','aventureiro'], ARRAY['Aniversário','Natal','Dia dos Pais','Sem ocasião específica']),
('Colar Minimalista Banhado a Ouro', 'Colar delicado com pingente geométrico, banho de ouro 18k.', 229.00, 'acessorios', 'Joalheria Lume', 'https://example.com/produto/colar-minimalista', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', ARRAY['moda','acessórios','elegante','romântico'], ARRAY['Dia dos Namorados','Aniversário','Casamento','Dia das Mães']),
('Kit Jardinagem para Apartamento', 'Ferramentas compactas, vasos e sementes de temperos para cultivar em casa.', 99.90, 'home', 'Verde Vivo', 'https://example.com/produto/kit-jardinagem', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600', ARRAY['plantas','casa','natureza','gastronomia','criativo'], ARRAY['Aniversário','Natal','Dia das Mães','Sem ocasião específica']);