-- ============================================
-- CORREÇÃO FINAL: RLS PARA cash_movements
-- ============================================
-- Objetivo: Corrigir erro 403 ao inserir registros em cash_movements
-- Erro: "new row violates row-level security policy for table cash_movements" (code 42501)
-- 
-- Garantir que usuários só acessem suas próprias movimentações de caixa
-- ============================================

BEGIN;

-- ============================================
-- 1. GARANTIR QUE RLS ESTÁ ATIVADO
-- ============================================
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================
DROP POLICY IF EXISTS "cash_movements_select_own" ON cash_movements;
DROP POLICY IF EXISTS "cash_movements_insert_own" ON cash_movements;
DROP POLICY IF EXISTS "cash_movements_update_own" ON cash_movements;
DROP POLICY IF EXISTS "Authenticated users can read cash_movements" ON cash_movements;
DROP POLICY IF EXISTS "Authenticated users can insert cash_movements" ON cash_movements;
DROP POLICY IF EXISTS "Authenticated users can update cash_movements" ON cash_movements;
DROP POLICY IF EXISTS "Users can view own cash_movements" ON cash_movements;
DROP POLICY IF EXISTS "Users can create cash_movements" ON cash_movements;
DROP POLICY IF EXISTS "Allow public read access" ON cash_movements;
DROP POLICY IF EXISTS "Allow public insert" ON cash_movements;

-- ============================================
-- 3. CRIAR POLICIES CORRETAS BASEADAS EM auth.uid()
-- ============================================

-- Policy: SELECT - Usuários podem ver apenas suas próprias movimentações
CREATE POLICY "cash_movements_select_own"
ON cash_movements
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: INSERT - Usuários podem criar movimentações apenas com seu próprio user_id
CREATE POLICY "cash_movements_insert_own"
ON cash_movements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE - Usuários podem atualizar apenas suas próprias movimentações
CREATE POLICY "cash_movements_update_own"
ON cash_movements
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. GARANTIR QUE user_id SEJA NOT NULL (opcional - apenas se não quebrar dados)
-- ============================================
-- IMPORTANTE: Verifique primeiro se há registros com user_id NULL:
-- SELECT COUNT(*) FROM cash_movements WHERE user_id IS NULL;
--
-- Se houver registros NULL e você quiser removê-los:
-- DELETE FROM cash_movements WHERE user_id IS NULL;
--
-- Se não houver NULLs (ou após removê-los), descomente a linha abaixo:
-- ALTER TABLE cash_movements ALTER COLUMN user_id SET NOT NULL;

COMMIT;

-- ============================================
-- VERIFICAÇÃO (opcional - executar após o COMMIT)
-- ============================================
-- SELECT COUNT(*) FROM cash_movements WHERE user_id IS NULL; -- Verificar se há NULLs
-- SELECT COUNT(*) FROM cash_movements; -- Total de movimentações

