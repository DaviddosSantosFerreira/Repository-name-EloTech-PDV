-- ============================================
-- CORREÇÃO: Função close_cash_register e RLS
-- ============================================
-- Objetivo: Corrigir função de fechamento de caixa
-- Garantir que apenas o usuário que abriu pode fechar
-- ============================================

BEGIN;

-- ============================================
-- 1. REMOVER FUNÇÃO ANTIGA (SE EXISTIR)
-- ============================================
DROP FUNCTION IF EXISTS close_cash_register(
  p_final_cash NUMERIC,
  p_final_pix NUMERIC,
  p_final_card NUMERIC
);

-- ============================================
-- 2. CRIAR FUNÇÃO close_cash_register
-- ============================================
CREATE OR REPLACE FUNCTION close_cash_register(
  p_final_cash NUMERIC DEFAULT 0,
  p_final_pix NUMERIC DEFAULT 0,
  p_final_card NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_register_id UUID;
  v_rows_updated INTEGER;
  v_result JSONB;
BEGIN
  -- Localizar o caixa aberto do usuário atual
  -- ORDER BY opened_at DESC para pegar o mais recente
  SELECT id INTO v_register_id
  FROM cash_registers
  WHERE opened_by = auth.uid()
    AND closed_at IS NULL
  ORDER BY opened_at DESC
  LIMIT 1;

  -- Se não encontrou caixa aberto, retornar erro
  IF v_register_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhum caixa aberto encontrado para este usuário'
    );
  END IF;

  -- Atualizar o caixa
  UPDATE cash_registers
  SET 
    closed_at = NOW(),
    closed_by = auth.uid(),
    final_cash = p_final_cash,
    final_pix = p_final_pix,
    final_card = p_final_card
  WHERE id = v_register_id
    AND opened_by = auth.uid()
    AND closed_at IS NULL;

  -- Verificar quantas linhas foram atualizadas
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  -- Se nenhuma linha foi atualizada, retornar erro
  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Falha ao fechar caixa. Nenhuma linha atualizada.'
    );
  END IF;

  -- Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'register_id', v_register_id,
    'closed_at', NOW()
  );
END;
$$;

-- ============================================
-- 3. GARANTIR QUE RLS ESTÁ ATIVADO
-- ============================================
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. REMOVER POLICIES ANTIGAS (SE EXISTIREM)
-- ============================================
DROP POLICY IF EXISTS "cash_registers_select_own" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_update_own" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_insert_own" ON cash_registers;
DROP POLICY IF EXISTS "Authenticated users can read cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "Authenticated users can update cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "Authenticated users can insert cash_registers" ON cash_registers;

-- ============================================
-- 5. CRIAR POLICIES RLS MÍNIMAS
-- ============================================

-- Policy: SELECT - Usuários podem ver apenas seus próprios caixas
CREATE POLICY "cash_registers_select_own"
ON cash_registers
FOR SELECT
USING (opened_by = auth.uid());

-- Policy: UPDATE - Usuários podem atualizar apenas seus próprios caixas
CREATE POLICY "cash_registers_update_own"
ON cash_registers
FOR UPDATE
USING (opened_by = auth.uid())
WITH CHECK (opened_by = auth.uid());

-- Policy: INSERT - Usuários podem criar caixas (necessário para open_cash_register)
CREATE POLICY "cash_registers_insert_own"
ON cash_registers
FOR INSERT
WITH CHECK (opened_by = auth.uid());

COMMIT;





