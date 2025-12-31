# 🔧 CORREÇÃO: Coluna user_id não existe na tabela sales

## ❌ Erro
```
ERROR: 42703: column "user_id" does not exist
```

---

## ✅ SOLUÇÃO RÁPIDA (Copie e Cole no Supabase SQL Editor)

```sql
-- Adicionar coluna user_id se não existir
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
```

**Apenas copie essas 5 linhas acima, cole no SQL Editor do Supabase e execute!**

---

## 📝 Passos para Executar

1. ✅ Abra o **Supabase Dashboard** (https://app.supabase.com)
2. ✅ Vá em **SQL Editor** no menu lateral
3. ✅ Clique em **New Query** ou abra um query existente
4. ✅ **Cole o script acima** (as 5 linhas)
5. ✅ Clique em **Run** ou pressione `Ctrl+Enter` (ou `Cmd+Enter` no Mac)
6. ✅ Verifique se aparece **"Success"** em verde

---

## ✅ Verificação (Opcional)

Para confirmar que a coluna foi criada, execute este query:

```sql
-- Verificar se a coluna user_id existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales' 
AND column_name = 'user_id';
```

**Resultado esperado**: Deve retornar uma linha mostrando:
- `column_name`: `user_id`
- `data_type`: `uuid`

---

## 🔍 Causa do Problema

Este erro ocorre quando:
- A tabela `sales` foi criada **antes** de executar a migration que adiciona `user_id`
- Ou a migration `002_update_sales_user_id.sql` **não foi executada**
- Ou a tabela foi criada manualmente sem incluir a coluna `user_id`

---

## ⚠️ Importante

- ✅ Se você já tem dados na tabela `sales`, os registros existentes terão `user_id = NULL` (isso é normal)
- ✅ Novas vendas terão o `user_id` preenchido automaticamente
- ✅ Este script é **seguro** e pode ser executado múltiplas vezes sem problemas
- ✅ O `IF NOT EXISTS` garante que não haverá erro se a coluna já existir

---

## 📁 Arquivo de Correção

O script completo também está salvo em: `CORRECAO_USER_ID_SQL.sql`

---

**Após executar o script, o erro deve desaparecer!** ✅
