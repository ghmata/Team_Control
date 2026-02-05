# 🚀 Tutorial: Deploy no Vercel

## 📋 Pré-requisitos

- ✅ Conta no [Vercel](https://vercel.com)
- ✅ Conta no [GitHub](https://github.com) com o repositório do projeto
- ✅ Supabase configurado e funcionando

---

## 🔧 Passo 1: Preparar as Variáveis de Ambiente

Antes de fazer o deploy, você precisa ter suas credenciais do Supabase:

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** (ex: `https://xxxxxxxxx.supabase.co`)
   - **anon public** key (chave pública)

---

## 📤 Passo 2: Deploy no Vercel

### Opção A: Deploy via Dashboard (Recomendado)

1. **Acesse o Vercel Dashboard:**
   - Entre em https://vercel.com e faça login

2. **Importar Projeto:**
   - Clique em **"Add New..."** → **"Project"**
   - Clique em **"Import Git Repository"**
   - Selecione seu repositório: `ghmata/Team_Control`
   - Clique em **"Import"**

3. **Configurar Projeto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (deixe vazio)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Adicionar Variáveis de Ambiente:**
   
   Clique em **"Environment Variables"** e adicione:
   
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://xxxxxxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sua-chave-publica-aqui` |

   > ⚠️ **IMPORTANTE:** Use o prefixo `VITE_` para que as variáveis sejam acessíveis no frontend

5. **Fazer Deploy:**
   - Clique em **"Deploy"**
   - Aguarde 2-3 minutos

6. **Pronto! 🎉**
   - Seu site estará em: `https://seu-projeto.vercel.app`

---

### Opção B: Deploy via CLI

1. **Instalar Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Fazer Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Configurar Variáveis de Ambiente:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy em Produção:**
   ```bash
   vercel --prod
   ```

---

## 🔄 Passo 3: Configurar Deploy Automático

Após o primeiro deploy, **toda vez que você fizer push** para o GitHub, o Vercel fará deploy automaticamente!

```bash
git add .
git commit -m "Nova funcionalidade"
git push origin main
```

O Vercel detecta automaticamente e faz o deploy em 2-3 minutos. ✨

---

## 🌐 Passo 4: Configurar Domínio Personalizado (Opcional)

1. No Vercel Dashboard, vá em **Settings** → **Domains**
2. Adicione seu domínio customizado (ex: `controle.meusite.com`)
3. Configure os DNS conforme as instruções do Vercel
4. Aguarde a propagação (pode levar até 48h)

---

## 🛡️ Passo 5: Configurar CORS no Supabase

Para garantir que o Vercel possa acessar o Supabase:

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API** → **CORS**
3. Adicione o domínio do Vercel:
   ```
   https://seu-projeto.vercel.app
   ```

---

## ✅ Verificar se Está Funcionando

Após o deploy, acesse seu site e verifique:

1. ✅ Página inicial carrega
2. ✅ Login funciona
3. ✅ Dados aparecem corretamente
4. ✅ Funcionalidades CRUD funcionam
5. ✅ PWA pode ser instalado

---

## 🐛 Solução de Problemas

### Erro: "Failed to load environment variables"

**Solução:** Verifique se as variáveis de ambiente estão corretas:
- Vá em **Settings** → **Environment Variables**
- Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão definidas
- Faça um novo deploy: **Deployments** → **...** → **Redeploy**

### Erro: "Supabase connection failed"

**Solução:** 
1. Verifique se o Supabase está online
2. Confirme que a URL e a chave estão corretas
3. Verifique o CORS no Supabase

### Erro de Build

**Solução:**
1. Teste o build localmente:
   ```bash
   npm run build
   ```
2. Corrija os erros que aparecerem
3. Faça commit e push novamente

---

## 📊 Monitoramento

O Vercel oferece:
- ✅ Analytics de acesso
- ✅ Logs de erro em tempo real
- ✅ Performance monitoring

Acesse em: **Analytics** e **Deployments** no dashboard.

---

## 🎯 Próximos Passos

1. ✅ Configure um domínio personalizado
2. ✅ Ative o SSL automático (Vercel faz automaticamente)
3. ✅ Configure alertas de erro no Vercel
4. ✅ Adicione mais administradores no Supabase

---

**🚀 Seu aplicativo está no ar!**

- **GitHub:** https://github.com/ghmata/Team_Control
- **Vercel:** https://seu-projeto.vercel.app
- **Supabase:** https://app.supabase.com

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Vercel: **Deployments** → clique no deploy → **Function Logs**
2. Verifique os erros no navegador (F12 → Console)
3. Confirme as variáveis de ambiente
