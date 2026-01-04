-- ============================================
-- TESTE: close_cash_register
-- ============================================
-- Execute este script APÓS executar 010_fix_cash_register_close_function.sql
-- ============================================

-- ============================================
-- 1. VERIFICAR CAIXA ABERTO ANTES DO FECHAMENTO
-- ============================================
SELECT 
  id,
  opened_by,
  opened_at,
  closed_at,
  closed_by,
  final_cash,
  final_pix,
  final_card
FROM cash_registers
WHERE opened_by = auth.uid()
  AND closed_at IS NULL
ORDER BY opened_at DESC
LIMIT 1;

-- ============================================
-- 2. CHAMAR close_cash_register
-- ============================================
-- Ajuste os valores conforme necessário
SELECT close_cash_register(
  p_final_cash := 1500.00,
  p_final_pix := 800.50,
  p_final_card := 1200.75
) AS resultado;

-- ============================================
-- 3. VERIFICAR CAIXA FECHADO APÓS O FECHAMENTO
-- ============================================
SELECT 
  id,
  opened_by,
  opened_at,
  closed_at,
  closed_by,
  final_cash,
  final_pix,
  final_card,
  CASE 
    WHEN closed_at IS NOT NULL THEN 'FECHADO ✅'
    ELSE 'AINDA ABERTO ❌'
  END AS status
FROM cash_registers
WHERE opened_by = auth.uid()
ORDER BY opened_at DESC
LIMIT 1;

-- ============================================
-- 4. VERIFICAR SE closed_at É NOT NULL
-- ============================================
SELECT 
  id,
  closed_at IS NOT NULL AS closed_at_not_null,
  closed_by,
  final_cash,
  final_pix,
  final_card
FROM cash_registers
WHERE opened_by = auth.uid()
  AND closed_at IS NOT NULL
ORDER BY closed_at DESC
LIMIT 1;





