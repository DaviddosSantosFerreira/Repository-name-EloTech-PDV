-- Migration: Configurar RLS para produtos
-- Execute este script no SQL Editor do Supabase Dashboard

-- Garantir que RLS está habilitado
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Todos os usuários autenticados podem ler produtos ativos
-- Vendedores veem apenas produtos ativos
-- Admins e gerentes veem todos os produtos
DROP POLICY IF EXISTS "Todos podem ler produtos ativos" ON public.products;
CREATE POLICY "Todos podem ler produtos ativos"
  ON public.products FOR SELECT
  USING (
    active = true OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin e gerente podem criar produtos
DROP POLICY IF EXISTS "Admin e gerente podem criar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem criar produtos"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin e gerente podem atualizar produtos
DROP POLICY IF EXISTS "Admin e gerente podem atualizar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem atualizar produtos"
  ON public.products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true
    )
  );

-- Policy: Apenas admin pode deletar produtos
DROP POLICY IF EXISTS "Apenas admin pode deletar produtos" ON public.products;
CREATE POLICY "Apenas admin pode deletar produtos"
  ON public.products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND active = true
    )
  );











