-- ============================================
-- SCRIPT DE CORREÇÃO: Adicionar user_id em sales
-- Copie TODO este conteúdo e cole no Supabase SQL Editor
-- ============================================

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

-- FIM DO SCRIPT - Execute e pronto!










