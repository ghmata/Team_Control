-- ============================================
-- CRIAR USUÁRIOS ADMINISTRADORES
-- ============================================
-- EMAILS:
-- 1. hipolitoghm@fab.mil.br (Senha: IlGh31272025@)
-- 2. angelicacerca@accs.fab.mil.br (Senha: tsup2026)
--
-- INSTRUÇÕES:
-- ============================================

-- PASSO 1: Criar usuários no Supabase Dashboard
-- ============================================
-- Acesse: Dashboard → Authentication → Users → "Add User"
--
-- USUÁRIO 1:
--   Email: hipolitoghm@fab.mil.br
--   Password: IlGh31272025@
--   ☑ Auto Confirm User (marcar checkbox)
--
-- USUÁRIO 2:
--   Email: angelicacerca@accs.fab.mil.br
--   Password: tsup2026
--   ☑ Auto Confirm User (marcar checkbox)

-- ============================================
-- PASSO 2: Executar SQL abaixo (neste editor)
-- ============================================

-- Adicionar hipolitoghm@fab.mil.br como admin
INSERT INTO usuarios_admin (email, user_id)
SELECT 'hipolitoghm@fab.mil.br', id 
FROM auth.users 
WHERE email = 'hipolitoghm@fab.mil.br'
ON CONFLICT (email) DO NOTHING;

-- Adicionar angelicacerca@accs.fab.mil.br como admin
INSERT INTO usuarios_admin (email, user_id)
SELECT 'angelicacerca@accs.fab.mil.br', id 
FROM auth.users 
WHERE email = 'angelicacerca@accs.fab.mil.br'
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PASSO 3: Verificar (executar após PASSO 2)
-- ============================================

SELECT 
  ua.email as "Email Admin",
  ua.created_at as "Cadastrado em",
  CASE 
    WHEN u.id IS NOT NULL THEN '✓ Vinculado'
    ELSE '✗ Não encontrado'
  END as "Status"
FROM usuarios_admin ua
LEFT JOIN auth.users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Email Admin                        | Cadastrado em       | Status
-- -----------------------------------|---------------------|-------------
-- hipolitoghm@fab.mil.br            | 2026-02-04 ...      | ✓ Vinculado
-- angelicacerca@accs.fab.mil.br     | 2026-02-04 ...      | ✓ Vinculado

-- ============================================
-- COMANDOS ÚTEIS (apenas se necessário)
-- ============================================

-- Ver todos os usuários autenticados:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Remover um admin (se precisar):
-- DELETE FROM usuarios_admin WHERE email = 'email@para-remover.com';

-- Adicionar novo admin no futuro:
-- INSERT INTO usuarios_admin (email, user_id)
-- SELECT 'novo-email@fab.mil.br', id 
-- FROM auth.users 
-- WHERE email = 'novo-email@fab.mil.br'
-- ON CONFLICT (email) DO NOTHING;
