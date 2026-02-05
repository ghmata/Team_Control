# 🧪 Guia de Testes - Sistema Migrado para Supabase

## ✅ Servidor Rodando
O servidor está ativo em: **http://localhost:5173**

---

## 📋 Roteiro de Testes

### ✅ Teste 1: Acesso Público (SEM LOGIN)

**Objetivo:** Verificar que qualquer pessoa pode VER os dados

1. **Abra** seu navegador
2. **Acesse:** http://localhost:5173
3. **Verifique:**
   - ✅ Página Consulta carrega
   - ✅ Cards "Fora Hoje" e "Fora Amanhã" aparecem
   - ✅ Card "Próximos 7 Dias" aparece
   - ✅ Badge de motivo (Reunião, Férias, etc.) está visível
   - ✅ Nomes dos militares aparecem
   - ✅ **IMPORTANTE**: Você NÃO deve ver nenhum botão de edição

**Resultado Esperado:** ✅ Dados visíveis, mas sem opção de editar

---

### ✅ Teste 2: Login Administrador

**Objetivo:** Verificar que admins conseguem entrar no painel

1. **Clique** no botão "Login" ou acesse: http://localhost:5173/login
2. **Faça login:**
   - Email: `hipolitoghm@fab.mil.br`
   - Senha: `IlGh31272025@`
3. **Verifique:**
   - ✅ Login acontece sem erro
   - ✅ Redirecionado para página Admin
   - ✅ Botões "Adicionar Funcionário" e "Adicionar Ausência" aparecem
   - ✅ Listas de funcionários e ausências carregam

**Resultado Esperado:** ✅ Acesso total ao painel Admin

---

### ✅ Teste 3: CRUD de Funcionários

**Objetivo:** Testar criação, edição e deleção

**3.1 Criar Funcionário:**
1. **Clique:** "Adicionar Funcionário"
2. **Preencha:**
   - Nome: `TESTE MIGRAÇÃO`
   - Graduação: `S1`
   - Categoria: `Cabo/Soldado`
   - Ordem Antiguidade: `999`
   - Status: Ativo ✅
3. **Salve** e verifique:
   - ✅ Funcionário aparece na lista
   - ✅ **Abra outra aba** em http://localhost:5173 → Deve aparecer lá também!

**3.2 Editar Funcionário:**
1. **Encontre** "TESTE MIGRAÇÃO"
2. **Clique** em editar (ícone lápis)
3. **Mude** o nome para `TESTE EDITADO`
4. **Salve** e verifique:
   - ✅ Nome atualizado
   - ✅ Atualiza em tempo real na outra aba

**3.3 Deletar Funcionário:**
1. **Clique** no ícone de lixeira em "TESTE EDITADO"
2. **Confirme** exclusão
3. **Verifique:**
   - ✅ Desaparece da lista
   - ✅ Desaparece da outra aba também

**Resultado Esperado:** ✅ Todos CRUD funcionando + Dados sincronizados

---

### ✅ Teste 4: CRUD de Ausências

**Objetivo:** Testar sistema de ausências completo

**4.1 Criar Ausência Normal:**
1. **Clique:** "Adicionar Ausência"
2. **Preencha:**
   - Funcionário: (escolha qualquer um, ex: BARRETO)
   - Motivo: `Reunião`
   - Data Início: Amanhã
   - Data Fim: Daqui a 3 dias
   - Turno Padrão: `Dia Inteiro`
3. **Salve** e verifique:
   - ✅ Ausência criada
   - ✅ Aparece nos cards da página Consulta
   - ✅ Badge "Reunião" está visível

**4.2 Testar Validação de Conflito:**
1. **Tente** criar OUTRA ausência para o MESMO funcionário
2. **Use** as mesmas datas
3. **Resultado esperado:**
   - ❌ Sistema bloqueia: "Conflito de ausência para..."

**4.3 Testar Aviso de Excesso (3 Graduados):**
1. **Escolha** 3 graduados diferentes (ex: ANGÉLICA, JÉSSICA, STILIS)
2. **Cadastre** ausência para cada um no **mesmo dia**
3. **Tente** cadastrar um **4º graduado** no mesmo dia
4. **Resultado esperado:**
   - ⚠️ Aviso aparece: "já haverá 3 ou mais graduados ausentes"
   - ✅ **Lista** mostra quem está fora
   - ✅ Permite prosseguir clicando "Confirmar e Prosseguir"

**4.4 Editar Ausência:**
1. **Encontre** uma ausência cadastrada
2. **Edite** o motivo ou datas
3. **Salve** e verifique:
   - ✅ Dados atualizados
   - ✅ Reflete na página Consulta

**4.5 Deletar Ausência:**
1. **Delete** ausência
2. **Verifique:**
   - ✅ Remove da lista
   - ✅ Desaparece dos cards

**Resultado Esperado:** ✅ Validações funcionando + Avisos exibidos

---

### ✅ Teste 5: Logout e Re-Login

**Objetivo:** Verificar que sessão persiste

1. **Faça** logout
2. **Feche** o navegador
3. **Abra** novamente e acesse http://localhost:5173/login
4. **Faça** login novamente
5. **Verifique:**
   - ✅ Login persiste
   - ✅ Dados ainda estão lá

---

### ✅ Teste 6: Login com Encarregada

**Objetivo:** Testar segundo usuário admin

1. **Faça** logout (se logado)
2. **Faça** login com:
   - Email: `angelicacerca@accs.fab.mil.br`
   - Senha: `tsup2026`
3. **Verifique:**
   - ✅ Login funciona
   - ✅ Acesso total ao painel Admin
   - ✅ Vê os mesmos dados

---

### ✅ Teste 7: Acesso Não-Admin

**Objetivo:** Verificar que não-admins não editam

1. **Crie** novo usuário no Supabase:
   - Email: `teste@teste.com`
   - Senha: `123456`
   - **NÃO** adicione à tabela `usuarios_admin`
2. **Faça** login com esse usuário
3. **Resultado esperado:**
   - ✅ Login funciona
   - ❌ **NÃO** redireciona para Admin
   - ✅ Fica na página Consulta (somente leitura)

---

## 🐛 Checklist de Possíveis Problemas

### Se Página Não Carrega:
- [ ] Verificar console do navegador (F12)
- [ ] Verificar `.env` está correto
- [ ] Servidor está rodando?

### Se Login Falha:
- [ ] Email está correto? (não use username)
- [ ] Senha está correta?
- [ ] Usuário existe no Supabase Authentication?
- [ ] Usuário está em `usuarios_admin`?

### Se Dados Não Aparecem:
- [ ] Console mostra erros?
- [ ] Verificar se há dados no Supabase (pelo Dashboard)
- [ ] RLS está ativo?
- [ ] Policies estão corretas?

### Se Admin Não Consegue Editar:
- [ ] Email está em `usuarios_admin`?
- [ ] Executou o SQL corretamente?
- [ ] Verificar no Supabase: SQL Editor → SELECT * FROM usuarios_admin;

---

## ✅ Resultado Final Esperado

**Após todos os testes:**
- ✅ Página pública funciona para todos
- ✅ Login funciona para admins
- ✅ CRUD completo funciona
- ✅ Validações e avisos funcionam
- ✅ Dados sincronizam entre dispositivos/abas
- ✅ Não-admins só visualizam

---

## 📝 Reporte de Testes

Preencha conforme testa:

| Teste | Status | Observações |
|-------|--------|-------------|
| 1. Acesso Público | ⬜ | |
| 2. Login Admin | ⬜ | |
| 3. CRUD Funcionários | ⬜ | |
| 4. CRUD Ausências | ⬜ | |
| 5. Validações | ⬜ | |
| 6. Login Encarregada | ⬜ | |
| 7. Não-Admin | ⬜ | |

**Legenda:**
- ✅ = Passou
- ⚠️ = Passou com observações
- ❌ = Falhou

---

**Quando terminar os testes, me informe os resultados!** 🚀
