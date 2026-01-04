-- ============================================
-- CORREÇÃO: REMOVER RECURSÃO INFINITA EM RLS
-- ============================================
-- Erro: 42P17 - infinite recursion detected in policy for relation 'profiles'
-- 
-- CAUSA: Policies em profiles consultavam a própria tabela profiles
-- SOLUÇÃO: Remover subqueries recursivas e usar apenas auth.uid()
-- ============================================

-- ============================================
-- 1. REMOVER TODAS AS POLICIES RECURSIVAS DE PROFILES
-- ============================================

-- Remover policies antigas que causam recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- ============================================
-- 2. CRIAR POLICIES SEGURAS PARA PROFILES (SEM RECURSÃO)
-- ============================================

-- Policy: Usuários podem ver seu próprio perfil
-- Usa apenas auth.uid() e comparação direta (SEM subquery)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Usuários podem atualizar seu próprio perfil
-- Usa apenas auth.uid() e comparação direta (SEM subquery)
-- NOTA: Não verifica role aqui para evitar recursão
-- A validação de role deve ser feita na aplicação ou via trigger
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Permitir inserção de profiles (via trigger)
-- O trigger handle_new_user() cria profiles automaticamente
CREATE POLICY "Allow profile creation via trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. REMOVER POLICIES RECURSIVAS DE PRODUCTS
-- ============================================

-- Remover policies antigas que consultam profiles (causam recursão)
DROP POLICY IF EXISTS "Todos podem ler produtos ativos" ON public.products;
DROP POLICY IF EXISTS "Admin e gerente podem criar produtos" ON public.products;
DROP POLICY IF EXISTS "Admin e gerente podem atualizar produtos" ON public.products;
DROP POLICY IF EXISTS "Apenas admin pode deletar produtos" ON public.products;

-- ============================================
-- 4. CRIAR POLICIES TEMPORÁRIAS PARA PRODUCTS (SEM RECURSÃO)
-- ============================================

-- Policy temporária: Permitir leitura para usuários autenticados
-- Usa apenas auth.uid() (SEM consultar profiles)
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir atualização para usuários autenticados
CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir exclusão para usuários autenticados
CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 5. REMOVER POLICIES DE SALES (SE EXISTIREM)
-- ============================================

-- Remover todas as policies antigas de sales
DROP POLICY IF EXISTS "Allow public read access" ON public.sales;
DROP POLICY IF EXISTS "Allow public insert" ON public.sales;
DROP POLICY IF EXISTS "Users can view own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create sales" ON public.sales;

-- ============================================
-- 6. CRIAR POLICIES TEMPORÁRIAS PARA SALES (SEM RECURSÃO)
-- ============================================

-- Policy temporária: Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can read sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir atualização para usuários autenticados
CREATE POLICY "Authenticated users can update sales"
  ON public.sales FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. REMOVER POLICIES DE SALE_ITEMS (SE EXISTIREM)
-- ============================================

DROP POLICY IF EXISTS "Allow public read access" ON public.sale_items;
DROP POLICY IF EXISTS "Allow public insert" ON public.sale_items;

-- ============================================
-- 8. CRIAR POLICIES TEMPORÁRIAS PARA SALE_ITEMS
-- ============================================

-- Policy temporária: Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can read sale_items"
  ON public.sale_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy temporária: Permitir inserção para usuários autenticados
CREATE POLICY "Authenticated users can insert sale_items"
  ON public.sale_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 
-- 1. Estas policies são TEMPORÁRIAS e permitem acesso a qualquer
--    usuário autenticado. Para produção, implemente validação de
--    roles na aplicação ou use funções SECURITY DEFINER.
--
-- 2. A validação de roles (admin, gerente, vendedor) deve ser feita
--    na aplicação (contexts/PermissionContext.tsx) e não nas policies RLS.
--
-- 3. Se precisar de validação de roles no banco, crie funções
--    SECURITY DEFINER que não consultam profiles dentro de policies.
--
-- 4. Para verificar se um usuário é admin sem recursão, você pode:
--    - Usar uma função SECURITY DEFINER que bypassa RLS
--    - Armazenar roles em uma tabela separada sem RLS
--    - Validar roles apenas na aplicação
--
-- ============================================











