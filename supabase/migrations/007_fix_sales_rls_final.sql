-- ============================================
-- CORREÇÃO FINAL: RLS PARA SALES
-- ============================================
-- Objetivo: Corrigir erro 403 ao criar venda no PDV
-- Garantir que usuários só acessem suas próprias vendas
-- 
-- IMPORTANTE: Este script remove vendas inválidas (user_id NULL)
-- Execute em horário de baixo tráfego ou faça backup antes
-- ============================================

BEGIN;

-- ============================================
-- 1. REMOVER VENDAS INVÁLIDAS (user_id IS NULL)
-- ============================================
-- Remove registros órfãos que não podem ser acessados via RLS
DELETE FROM sales WHERE user_id IS NULL;

-- ============================================
-- 2. GARANTIR QUE RLS ESTÁ ATIVADO
-- ============================================
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================
DROP POLICY IF EXISTS "sales_select_own" ON sales;
DROP POLICY IF EXISTS "sales_insert_own" ON sales;
DROP POLICY IF EXISTS "sales_update_own" ON sales;
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON sales;
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
DROP POLICY IF EXISTS "Users can view own sales" ON sales;
DROP POLICY IF EXISTS "Users can create sales" ON sales;
DROP POLICY IF EXISTS "Allow public read access" ON sales;
DROP POLICY IF EXISTS "Allow public insert" ON sales;

-- ============================================
-- 4. CRIAR POLICIES CORRETAS BASEADAS EM auth.uid()
-- ============================================

-- Policy: SELECT - Usuários podem ver apenas suas próprias vendas
CREATE POLICY "sales_select_own"
ON sales
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: INSERT - Usuários podem criar vendas apenas com seu próprio user_id
CREATE POLICY "sales_insert_own"
ON sales
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE - Usuários podem atualizar apenas suas próprias vendas
CREATE POLICY "sales_update_own"
ON sales
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. TORNAR user_id OBRIGATÓRIO (NOT NULL)
-- ============================================
-- Só funciona após remover registros com NULL
ALTER TABLE sales ALTER COLUMN user_id SET NOT NULL;

COMMIT;

-- ============================================
-- VERIFICAÇÃO (opcional - executar após o COMMIT)
-- ============================================
-- SELECT COUNT(*) FROM sales WHERE user_id IS NULL; -- Deve retornar 0
-- SELECT COUNT(*) FROM sales; -- Total de vendas válidas







