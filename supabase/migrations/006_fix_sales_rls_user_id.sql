-- ============================================
-- CORREÇÃO: RLS PARA SALES BASEADO EM user_id
-- ============================================
-- Objetivo: Corrigir erro 403 ao criar venda no PDV
-- Garantir que usuários só acessem suas próprias vendas
-- ============================================

-- Garantir que RLS está ativado
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas conflitantes
DROP POLICY IF EXISTS "sales_select_own" ON sales;
DROP POLICY IF EXISTS "sales_insert_own" ON sales;
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;

-- Permitir SELECT apenas das próprias vendas
CREATE POLICY "sales_select_own"
ON sales
FOR SELECT
USING (auth.uid() = user_id);

-- Permitir INSERT apenas com user_id do próprio usuário
CREATE POLICY "sales_insert_own"
ON sales
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permitir UPDATE apenas das próprias vendas
CREATE POLICY "sales_update_own"
ON sales
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Garantir que user_id NÃO permite NULL
ALTER TABLE sales ALTER COLUMN user_id SET NOT NULL;







