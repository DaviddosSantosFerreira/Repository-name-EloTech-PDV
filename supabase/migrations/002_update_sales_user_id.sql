-- Migration: Adicionar user_id na tabela sales e atualizar RLS
-- Execute este script no SQL Editor do Supabase Dashboard

-- Adicionar coluna user_id se não existir
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE SET NULL;

-- Criar índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

-- Atualizar vendas existentes (opcional - apenas se houver dados)
-- Se você tem vendas sem user_id, pode definir um valor padrão ou deixar NULL
-- UPDATE public.sales SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- RLS Policies para sales

-- Policy: Vendedores veem apenas suas próprias vendas
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

-- Policy: Apenas admins podem deletar vendas
DROP POLICY IF EXISTS "Apenas admin pode deletar vendas" ON public.sales;
CREATE POLICY "Apenas admin pode deletar vendas"
  ON public.sales FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );















