-- Migration: Corrigir coluna user_id na tabela sales
-- Execute este script para adicionar user_id se não existir
-- Este script é idempotente (pode ser executado múltiplas vezes sem erro)

-- Verificar e adicionar coluna user_id se não existir
DO $$ 
BEGIN
  -- Verificar se a tabela sales existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sales'
  ) THEN
    -- Adicionar coluna user_id se não existir
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'sales' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE public.sales 
      ADD COLUMN user_id UUID REFERENCES auth.users ON DELETE SET NULL;
      
      -- Criar índice para performance
      CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
      
      RAISE NOTICE 'Coluna user_id adicionada à tabela sales';
    ELSE
      RAISE NOTICE 'Coluna user_id já existe na tabela sales';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabela sales não existe. Execute primeiro o script de criação das tabelas.';
  END IF;
END $$;

-- Garantir que o índice existe
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);














