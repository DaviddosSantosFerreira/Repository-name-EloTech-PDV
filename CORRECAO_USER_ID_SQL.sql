-- ============================================
-- CORREÇÃO URGENTE: Adicionar coluna user_id na tabela sales
-- Execute este script no Supabase SQL Editor para corrigir o erro
-- ============================================

-- Adicionar coluna user_id se não existir
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

