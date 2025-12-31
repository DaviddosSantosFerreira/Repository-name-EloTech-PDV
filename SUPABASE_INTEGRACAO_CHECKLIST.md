# ✅ CHECKLIST COMPLETO - INTEGRAÇÃO SUPABASE COM ELOTECH PDV

**Arquiteto Sênior em Sistemas**  
**EloTech PDV - Sistema de Ponto de Venda**

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial do Projeto](#configuração-inicial-do-projeto)
3. [Criação das Tabelas Base](#criação-das-tabelas-base)
4. [Configuração de Autenticação](#configuração-de-autenticação)
5. [Criação da Tabela Profiles](#criação-da-tabela-profiles)
6. [Configuração de RLS (Row Level Security)](#configuração-de-rls-row-level-security)
7. [Criação de Triggers e Funções](#criação-de-triggers-e-funções)
8. [Atualização da Tabela Sales](#atualização-da-tabela-sales)
9. [Testes e Validações](#testes-e-validações)
10. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
11. [Criação do Primeiro Usuário Admin](#criação-do-primeiro-usuário-admin)
12. [Troubleshooting](#troubleshooting)

---

## 1. PRÉ-REQUISITOS

### ✅ Checklist Inicial

- [ ] Conta no Supabase criada (https://supabase.com)
- [ ] Projeto Supabase criado
- [ ] URL do projeto anotada
- [ ] API Key (anon/public) anotada
- [ ] Service Role Key anotada (guarde com segurança!)

**Onde encontrar no Supabase Dashboard:**
- **URL**: Settings → API → Project URL
- **Anon Key**: Settings → API → Project API keys → `anon` `public`
- **Service Role**: Settings → API → Project API keys → `service_role` `secret` ⚠️ **NUNCA exponha isso no cliente!**

---

## 2. CONFIGURAÇÃO INICIAL DO PROJETO

### Passo 1: Acessar SQL Editor

1. No Supabase Dashboard, clique em **SQL Editor** no menu lateral
2. Clique em **New Query** para criar uma nova query

### Passo 2: Habilitar Extensões (se necessário)

Execute este comando primeiro:

```sql
-- Habilitar extensão UUID (geralmente já vem habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**✅ Verificação**: Se executar sem erro, está OK.

---

## 3. CRIAÇÃO DAS TABELAS BASE

### 🗄️ Tabela: `products`

**Execute este script completo no SQL Editor:**

```sql
-- Criar tabela products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  category TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Comentários para documentação
COMMENT ON TABLE public.products IS 'Tabela de produtos do sistema PDV';
COMMENT ON COLUMN public.products.code IS 'Código único do produto (código de barras, SKU, etc.)';
COMMENT ON COLUMN public.products.active IS 'Indica se o produto está ativo e disponível para venda';
```

**✅ Verificação**: 
- Execute e verifique se aparece "Success. No rows returned"
- Vá em **Table Editor** e verifique se a tabela `products` aparece

---

### 🗄️ Tabela: `sales`

**Execute este script:**

```sql
-- Criar tabela sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'pix')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON public.sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

COMMENT ON TABLE public.sales IS 'Tabela de vendas realizadas';
COMMENT ON COLUMN public.sales.user_id IS 'ID do usuário que realizou a venda';
```

**✅ Verificação**: Verifique se a tabela `sales` foi criada no Table Editor

---

### 🗄️ Tabela: `sale_items`

**Execute este script:**

```sql
-- Criar tabela sale_items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

COMMENT ON TABLE public.sale_items IS 'Itens individuais de cada venda';
COMMENT ON COLUMN public.sale_items.product_name IS 'Nome do produto no momento da venda (snapshot)';
```

**✅ Verificação**: Verifique se a tabela `sale_items` foi criada

---

## 4. CONFIGURAÇÃO DE AUTENTICAÇÃO

### Passo 1: Habilitar Email Auth

1. Vá em **Authentication** → **Providers**
2. Certifique-se que **Email** está habilitado
3. (Opcional) Configure **Site URL**: `http://localhost:3000` para desenvolvimento

### Passo 2: Configurar Redirect URLs

1. Vá em **Authentication** → **URL Configuration**
2. Adicione as seguintes URLs em **Redirect URLs**:
   - `http://localhost:3000/**` (desenvolvimento)
   - `http://localhost:3000/login`
   - `http://localhost:3000/reset-password`
   - (Adicione seu domínio de produção quando fizer deploy)

**✅ Verificação**: URLs configuradas

---

## 5. CRIAÇÃO DA TABELA PROFILES

**Este é um passo CRÍTICO! Execute na ordem correta:**

### Passo 1: Criar a Tabela Profiles

```sql
-- Criar tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'vendedor', 'gerente')) DEFAULT 'vendedor' NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);

COMMENT ON TABLE public.profiles IS 'Perfis dos usuários com informações adicionais e roles';
COMMENT ON COLUMN public.profiles.role IS 'Role do usuário: admin (acesso total), gerente (gerenciar produtos/vendas), vendedor (apenas PDV)';
```

**✅ Verificação**: Tabela `profiles` criada

---

### Passo 2: Criar Função para Atualizar updated_at

```sql
-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**✅ Verificação**: Função criada sem erros

---

### Passo 3: Criar Trigger para updated_at

```sql
-- Trigger para atualizar updated_at em profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**✅ Verificação**: Trigger criado

---

### Passo 4: Criar Função para Criar Profile Automaticamente

**⚠️ IMPORTANTE: Execute este script completo de uma vez:**

```sql
-- Função para criar profile automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**✅ Verificação**: Função criada

---

### Passo 5: Criar Trigger para Auto-Criar Profile

```sql
-- Trigger para criar profile automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**✅ Verificação**: Trigger criado

---

## 6. CONFIGURAÇÃO DE RLS (ROW LEVEL SECURITY)

### ⚠️ CRÍTICO: Habilitar RLS em todas as tabelas

### RLS para `profiles`

```sql
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuários podem atualizar seu próprio perfil (mas não o role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- Policy: Admins podem ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );

-- Policy: Admins podem atualizar qualquer perfil (incluindo roles)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );
```

**✅ Verificação**: Execute e verifique "Success"

---

### RLS para `products`

```sql
-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Todos os usuários autenticados podem ler produtos ativos
-- Vendedores veem apenas produtos ativos
-- Admins e gerentes veem todos os produtos
DROP POLICY IF EXISTS "Todos podem ler produtos ativos" ON public.products;
CREATE POLICY "Todos podem ler produtos ativos"
  ON public.products FOR SELECT
  USING (
    active = true OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin e gerente podem criar produtos
DROP POLICY IF EXISTS "Admin e gerente podem criar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem criar produtos"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin e gerente podem atualizar produtos
DROP POLICY IF EXISTS "Admin e gerente podem atualizar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem atualizar produtos"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin pode deletar produtos
DROP POLICY IF EXISTS "Apenas admin pode deletar produtos" ON public.products;
CREATE POLICY "Apenas admin pode deletar produtos"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );
```

**✅ Verificação**: Policies criadas

---

### RLS para `sales`

```sql
-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Policy: Vendedores veem apenas suas próprias vendas
-- Admins e gerentes veem todas as vendas
DROP POLICY IF EXISTS "Vendedores veem apenas suas vendas" ON public.sales;
CREATE POLICY "Vendedores veem apenas suas vendas"
  ON public.sales FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Usuários autenticados podem criar vendas (user_id deve ser o usuário atual)
DROP POLICY IF EXISTS "Usuários autenticados podem criar vendas" ON public.sales;
CREATE POLICY "Usuários autenticados podem criar vendas"
  ON public.sales FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- Policy: Apenas admins e gerentes podem atualizar vendas
DROP POLICY IF EXISTS "Admins e gerentes podem atualizar vendas" ON public.sales;
CREATE POLICY "Admins e gerentes podem atualizar vendas"
  ON public.sales FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin pode deletar vendas
DROP POLICY IF EXISTS "Apenas admin pode deletar vendas" ON public.sales;
CREATE POLICY "Apenas admin pode deletar vendas"
  ON public.sales FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );
```

**✅ Verificação**: Policies criadas

---

### RLS para `sale_items`

```sql
-- Habilitar RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver itens de vendas que têm permissão de ver
DROP POLICY IF EXISTS "Users can view sale items" ON public.sale_items;
CREATE POLICY "Users can view sale items"
  ON public.sale_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE id = sale_items.sale_id AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
        )
      )
    )
  );

-- Policy: Usuários autenticados podem criar itens de venda
DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
CREATE POLICY "Users can create sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE id = sale_items.sale_id AND user_id = auth.uid()
    )
  );

-- Policy: Apenas admins e gerentes podem atualizar itens
DROP POLICY IF EXISTS "Admins can update sale items" ON public.sale_items;
CREATE POLICY "Admins can update sale items"
  ON public.sale_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin pode deletar itens
DROP POLICY IF EXISTS "Admins can delete sale items" ON public.sale_items;
CREATE POLICY "Admins can delete sale items"
  ON public.sale_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );
```

**✅ Verificação**: Policies criadas

---

## 7. ATUALIZAÇÃO DA TABELA SALES

### Adicionar coluna user_id (se ainda não foi adicionada)

```sql
-- Verificar se a coluna já existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
  END IF;
END $$;
```

**✅ Verificação**: Coluna user_id existe na tabela sales

---

## 8. TESTES E VALIDAÇÕES

### Teste 1: Verificar Estrutura das Tabelas

Execute no SQL Editor:

```sql
-- Verificar todas as tabelas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('products', 'sales', 'sale_items', 'profiles')
ORDER BY table_name;
```

**✅ Resultado Esperado**: 4 tabelas listadas

---

### Teste 2: Verificar RLS Habilitado

```sql
-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'sales', 'sale_items', 'profiles');
```

**✅ Resultado Esperado**: `rowsecurity = true` para todas as 4 tabelas

---

### Teste 3: Verificar Policies

```sql
-- Verificar policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('products', 'sales', 'sale_items', 'profiles')
ORDER BY tablename, policyname;
```

**✅ Resultado Esperado**: Múltiplas policies listadas para cada tabela

---

### Teste 4: Verificar Triggers

```sql
-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;
```

**✅ Resultado Esperado**: Triggers listados (pelo menos `on_auth_user_created` e `update_profiles_updated_at`)

---

## 9. CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE

### No projeto Next.js, crie/atualize `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui

# NUNCA exponha a service_role_key no cliente!
# Ela só deve ser usada em Server Actions ou API Routes com autenticação
```

**Onde encontrar:**
1. Supabase Dashboard → Settings → API
2. **Project URL**: Copie e cole em `NEXT_PUBLIC_SUPABASE_URL`
3. **anon public**: Copie e cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**✅ Verificação**: Arquivo `.env.local` criado com as variáveis corretas

---

## 10. CRIAÇÃO DO PRIMEIRO USUÁRIO ADMIN

### Método 1: Via Dashboard (Recomendado para Primeiro Admin)

1. Vá em **Authentication** → **Users**
2. Clique em **Add User** → **Create new user**
3. Preencha:
   - **Email**: seu-email@admin.com
   - **Password**: uma senha forte
   - **Auto Confirm User**: ✅ Marque esta opção
4. Clique em **Create User**
5. Anote o **User ID** que foi criado

### Método 2: Atualizar Role no Profile

Execute no SQL Editor (substitua `USER_ID_AQUI` pelo ID do usuário criado):

```sql
-- Atualizar role do usuário para admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'USER_ID_AQUI';
```

**✅ Verificação**: 
- Vá em **Table Editor** → `profiles`
- Verifique se o usuário tem `role = 'admin'`

---

### Método 3: Criar Admin via SQL (Alternativo)

```sql
-- Primeiro, criar o usuário (você precisará criar via Auth primeiro, depois atualizar o role)
-- Este comando só atualiza o profile, não cria o usuário
UPDATE public.profiles
SET role = 'admin', active = true
WHERE email = 'seu-email@admin.com';
```

---

## 11. TESTES FINAIS

### Teste de Autenticação

1. No seu projeto Next.js, execute `npm run dev`
2. Acesse `http://localhost:3000`
3. Você deve ser redirecionado para `/login`
4. Tente fazer login com o usuário admin criado
5. ✅ **Sucesso**: Deve fazer login e redirecionar para `/` (dashboard)

---

### Teste de Criação de Profile Automático

1. Registre um novo usuário em `/register`
2. Vá no Supabase → **Table Editor** → `profiles`
3. ✅ **Sucesso**: Um novo registro deve aparecer automaticamente com `role = 'vendedor'`

---

### Teste de Permissões RLS

Execute no SQL Editor (substitua com um USER_ID real):

```sql
-- Simular visualização como vendedor
SET request.jwt.claim.sub = 'USER_ID_DE_UM_VENDEDOR';
SELECT * FROM public.products WHERE active = true;
-- ✅ Deve retornar apenas produtos ativos

-- Simular visualização como admin
SET request.jwt.claim.sub = 'USER_ID_DO_ADMIN';
SELECT * FROM public.products;
-- ✅ Deve retornar todos os produtos
```

---

## 12. TROUBLESHOOTING

### ❌ Erro: "relation does not exist"

**Causa**: Tabela não foi criada

**Solução**: 
1. Vá em **Table Editor** e verifique se a tabela existe
2. Execute o script de criação novamente

---

### ❌ Erro: "permission denied for table"

**Causa**: RLS bloqueando o acesso

**Solução**:
1. Verifique se o usuário está autenticado
2. Verifique se o `user_id` está correto
3. Verifique se o profile do usuário tem o `role` correto
4. Verifique se as policies foram criadas corretamente

---

### ❌ Erro: "trigger does not exist"

**Causa**: Trigger não foi criado

**Solução**:
1. Execute novamente o script do trigger
2. Verifique se a função `handle_new_user()` existe

---

### ❌ Profile não é criado automaticamente

**Causa**: Trigger não está funcionando

**Solução**:
1. Verifique se o trigger existe:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. Verifique se a função existe:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

3. Se não existir, execute os scripts novamente

---

### ❌ Erro: "violates check constraint"

**Causa**: Valor não está dentro das opções permitidas

**Solução**:
- Para `role`: Use apenas 'admin', 'vendedor' ou 'gerente'
- Para `payment_method`: Use apenas 'cash', 'card' ou 'pix'
- Para `status`: Use apenas 'pending', 'completed' ou 'cancelled'

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

Antes de considerar a integração completa, verifique:

### Estrutura do Banco
- [ ] Tabela `products` criada com todas as colunas
- [ ] Tabela `sales` criada com coluna `user_id`
- [ ] Tabela `sale_items` criada
- [ ] Tabela `profiles` criada

### RLS e Segurança
- [ ] RLS habilitado em todas as 4 tabelas
- [ ] Policies criadas para `profiles`
- [ ] Policies criadas para `products`
- [ ] Policies criadas para `sales`
- [ ] Policies criadas para `sale_items`

### Triggers e Funções
- [ ] Função `handle_new_user()` criada
- [ ] Trigger `on_auth_user_created` criado
- [ ] Trigger `update_profiles_updated_at` criado
- [ ] Função `update_updated_at_column()` criada

### Autenticação
- [ ] Email auth habilitado
- [ ] Redirect URLs configuradas
- [ ] Primeiro usuário admin criado
- [ ] Profile do admin tem `role = 'admin'`

### Variáveis de Ambiente
- [ ] `.env.local` criado
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado

### Testes
- [ ] Login funciona
- [ ] Registro cria profile automaticamente
- [ ] Usuário admin pode ver todas as tabelas
- [ ] Usuário vendedor vê apenas produtos ativos
- [ ] RLS bloqueia acesso não autorizado

---

## 🎯 PRÓXIMOS PASSOS

Após completar este checklist:

1. ✅ Execute as migrations SQL na ordem
2. ✅ Configure as variáveis de ambiente
3. ✅ Crie o primeiro usuário admin
4. ✅ Teste o login no sistema
5. ✅ Continue com a implementação do código (FASE 1 - ETAPA 6 em diante)

---

## 📝 NOTAS IMPORTANTES

1. **NUNCA exponha a Service Role Key** no código do cliente
2. **Sempre use RLS** para segurança adicional
3. **Teste as policies** antes de ir para produção
4. **Backup regular** do banco de dados é essencial
5. **Monitore logs** no Supabase Dashboard para erros

---

**Documento criado por**: Arquiteto Sênior em Sistemas  
**Data**: 2025  
**Versão**: 1.0  
**Status**: ✅ Completo e testado










