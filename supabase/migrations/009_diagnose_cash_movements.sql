-- ============================================
-- DIAGNÓSTICO: Estrutura da tabela cash_movements
-- ============================================
-- Execute este script para descobrir:
-- 1. Todas as colunas da tabela cash_movements
-- 2. Tipo de cada coluna
-- 3. Constraints e foreign keys
-- 4. Qual coluna representa ownership/usuario
-- ============================================

-- 1. Listar todas as colunas da tabela cash_movements
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cash_movements'
ORDER BY ordinal_position;

-- 2. Verificar foreign keys (pode indicar relação com users/profiles)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'cash_movements';

-- 3. Verificar constraints (para identificar colunas obrigatórias)
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'cash_movements';

-- 4. Verificar se existe relação com cash_registers (que pode ter user_id)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name = 'cash_movements' OR ccu.table_name = 'cash_registers');







