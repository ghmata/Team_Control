-- ============================================
-- EFETIVO PWA - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: funcionarios
-- ============================================
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  graduacao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('GRADUADO', 'CABO_SOLDADO')),
  ordem_antiguidade INTEGER NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para ordenação por antiguidade
CREATE INDEX idx_funcionarios_antiguidade ON funcionarios(ordem_antiguidade);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);

-- ============================================
-- TABLE: ausencias
-- ============================================
CREATE TABLE ausencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  turno_padrao TEXT NOT NULL CHECK (turno_padrao IN ('MATUTINO', 'VESPERTINO', 'INTEGRAL')),
  excecoes_por_dia JSONB DEFAULT '[]'::jsonb,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: data_fim >= data_inicio
  CONSTRAINT ausencia_datas_validas CHECK (data_fim >= data_inicio)
);

-- Indexes para performance
CREATE INDEX idx_ausencias_funcionario ON ausencias(funcionario_id);
CREATE INDEX idx_ausencias_datas ON ausencias(data_inicio, data_fim);
CREATE INDEX idx_ausencias_data_inicio ON ausencias(data_inicio);
CREATE INDEX idx_ausencias_data_fim ON ausencias(data_fim);

-- ============================================
-- TABLE: usuarios_admin
-- ============================================
CREATE TABLE usuarios_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para lookup rápido
CREATE INDEX idx_usuarios_admin_email ON usuarios_admin(email);
CREATE INDEX idx_usuarios_admin_user_id ON usuarios_admin(user_id);

-- ============================================
-- FUNCTION: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_funcionarios_updated_at
  BEFORE UPDATE ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ausencias_updated_at
  BEFORE UPDATE ON ausencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: funcionarios
-- ============================================

-- Todos podem visualizar funcionários
CREATE POLICY "Funcionários são públicos para leitura"
  ON funcionarios
  FOR SELECT
  USING (true);

-- Apenas admins podem inserir
CREATE POLICY "Apenas admins podem inserir funcionários"
  ON funcionarios
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admins podem atualizar
CREATE POLICY "Apenas admins podem atualizar funcionários"
  ON funcionarios
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admins podem deletar
CREATE POLICY "Apenas admins podem deletar funcionários"
  ON funcionarios
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: ausencias
-- ============================================

-- Todos podem visualizar ausências
CREATE POLICY "Ausências são públicas para leitura"
  ON ausencias
  FOR SELECT
  USING (true);

-- Apenas admins podem inserir
CREATE POLICY "Apenas admins podem inserir ausências"
  ON ausencias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admins podem atualizar
CREATE POLICY "Apenas admins podem atualizar ausências"
  ON ausencias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- Apenas admins podem deletar
CREATE POLICY "Apenas admins podem deletar ausências"
  ON ausencias
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_admin
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLICIES: usuarios_admin
-- ============================================

-- Usuários autenticados podem ver se são admin
CREATE POLICY "Usuários podem ver seu próprio registro admin"
  ON usuarios_admin
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- DADOS INICIAIS (OPCIONAL - PARA TESTES)
-- ============================================

-- Inserir funcionários de exemplo (comentado - remova os -- para usar)
/*
INSERT INTO funcionarios (nome, graduacao, categoria, ordem_antiguidade, ativo) VALUES
  ('ANGÉLICA', '2S', 'GRADUADO', 1, true),
  ('JÉSSICA LOZASSO', '2S', 'GRADUADO', 2, true),
  ('STILIS', '3S', 'GRADUADO', 3, true),
  ('HIPÓLITO', '3S', 'GRADUADO', 4, true),
  ('NICOLY', '3S', 'GRADUADO', 5, true),
  ('BARRETO', '3S', 'GRADUADO', 6, true),
  ('ROCHA', 'S1', 'CABO_SOLDADO', 7, true),
  ('BASSE', 'S1', 'CABO_SOLDADO', 8, true),
  ('GOMES', 'S1', 'CABO_SOLDADO', 9, true),
  ('LOURES', 'S2', 'CABO_SOLDADO', 10, true),
  ('EDUARDO SILVA', 'S2', 'CABO_SOLDADO', 11, true);
*/

-- ============================================
-- INSTRUÇÕES
-- ============================================

/*
1. Copie todo este SQL
2. No Supabase Dashboard, vá em "SQL Editor"
3. Cole e execute (Run)
4. Em "Authentication" → "Users", crie os usuários admin
5. Adicione os emails em usuarios_admin:

   INSERT INTO usuarios_admin (email, user_id)
   SELECT 'seu-email@gmail.com', id 
   FROM auth.users 
   WHERE email = 'seu-email@gmail.com';

   INSERT INTO usuarios_admin (email, user_id)
   SELECT 'encarregada@email.com', id 
   FROM auth.users 
   WHERE email = 'encarregada@email.com';
*/
