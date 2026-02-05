-- ============================================
-- SCRIPT DE MIGRAÇÃO DE DADOS
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Desabilitar RLS temporariamente para inserção
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias DISABLE ROW LEVEL SECURITY;

-- Limpar dados existentes (se houver)
TRUNCATE TABLE ausencias CASCADE;
TRUNCATE TABLE funcionarios CASCADE;

-- ============================================
-- INSERIR FUNCIONÁRIOS
-- ============================================

-- Criar UUIDs temporários que mapearemos para as ausências
WITH funcionarios_inseridos AS (
  INSERT INTO funcionarios (id, nome, graduacao, categoria, ordem_antiguidade, ativo) VALUES
    (gen_random_uuid(), 'ANGÉLICA', '2S', 'GRADUADO', 1, true),
    (gen_random_uuid(), 'JÉSSICA LOZASSO', '2S', 'GRADUADO', 2, true),
    (gen_random_uuid(), 'STILIS', '3S', 'GRADUADO', 3, true),
    (gen_random_uuid(), 'HIPÓLITO', '3S', 'GRADUADO', 4, true),
    (gen_random_uuid(), 'NICOLY', '3S', 'GRADUADO', 5, true),
    (gen_random_uuid(), 'BARRETO', '3S', 'GRADUADO', 6, true),
    (gen_random_uuid(), 'ROCHA', 'S1', 'CABO_SOLDADO', 7, true),
    (gen_random_uuid(), 'BASSE', 'S1', 'CABO_SOLDADO', 8, true),
    (gen_random_uuid(), 'GOMES', 'S1', 'CABO_SOLDADO', 9, true),
    (gen_random_uuid(), 'LOURES', 'S2', 'CABO_SOLDADO', 10, true),
    (gen_random_uuid(), 'EDUARDO SILVA', 'S2', 'CABO_SOLDADO', 11, true)
  RETURNING *
)
SELECT * FROM funcionarios_inseridos;

-- ============================================
-- INSERIR AUSÊNCIAS
-- ============================================

-- Ausência 1: ANGÉLICA - Dispensado pela chefia
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Dispensado pela chefia', '2026-02-06', '2026-02-06', 'INTEGRAL', '[]'::jsonb, NULL
FROM funcionarios WHERE nome = 'ANGÉLICA';

-- Ausência 2: NICOLY - Comissão
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Comissão', '2026-02-06', '2026-02-06', 'INTEGRAL', '[]'::jsonb, 'Comissão de conscritos'
FROM funcionarios WHERE nome = 'NICOLY';

-- Ausência 3: HIPÓLITO - Dispensado pela chefia
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Dispensado pela chefia', '2026-02-23', '2026-02-24', 'INTEGRAL', '[]'::jsonb, 'Acompanhamento da pós-cirurgia da esposa'
FROM funcionarios WHERE nome = 'HIPÓLITO';

-- Ausência 4: JÉSSICA LOZASSO - Férias
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Férias', '2026-03-02', '2026-03-31', 'INTEGRAL', '[]'::jsonb, NULL
FROM funcionarios WHERE nome = 'JÉSSICA LOZASSO';

-- Ausência 5: NICOLY - Reunião
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Reunião', '2026-02-05', '2026-02-05', 'VESPERTINO', '[]'::jsonb, NULL
FROM funcionarios WHERE nome = 'NICOLY';

-- Ausência 6: HIPÓLITO - Serviço (DT)
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Serviço', '2026-02-26', '2026-02-26', 'INTEGRAL', '[]'::jsonb, 'DT'
FROM funcionarios WHERE nome = 'HIPÓLITO';

-- Ausência 7: HIPÓLITO - Serviço (CMT Guarda)
INSERT INTO ausencias (funcionario_id, motivo, data_inicio, data_fim, turno_padrao, excecoes_por_dia, observacao)
SELECT id, 'Serviço', '2026-03-05', '2026-03-06', 'INTEGRAL', '[]'::jsonb, 'CMT Guarda'
FROM funcionarios WHERE nome = 'HIPÓLITO';

-- ============================================
-- REABILITAR RLS
-- ============================================

ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 'Funcionários inseridos:' as status, COUNT(*) as total FROM funcionarios;
SELECT 'Ausências inseridas:' as status, COUNT(*) as total FROM ausencias;

-- Listar todos os dados
SELECT * FROM funcionarios ORDER BY ordem_antiguidade;
SELECT 
  a.id,
  f.nome as funcionario,
  a.motivo,
  a.data_inicio,
  a.data_fim,
  a.turno_padrao,
  a.observacao
FROM ausencias a
JOIN funcionarios f ON a.funcionario_id = f.id
ORDER BY a.data_inicio;
