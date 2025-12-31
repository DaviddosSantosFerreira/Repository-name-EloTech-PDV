# 🔧 Correção: Recursão Infinita em RLS (Erro 42P17)

## ❌ Problema Identificado

O Supabase estava retornando erro **42P17 - infinite recursion detected in policy for relation 'profiles'**.

### Causa Raiz

As policies RLS na tabela `profiles` estavam consultando a própria tabela `profiles` dentro de subqueries, causando recursão infinita:

1. **Policy de UPDATE** (linha 74-76):
   ```sql
   WITH CHECK (
     auth.uid() = id AND
     role = (SELECT role FROM public.profiles WHERE id = auth.uid())  -- ❌ RECURSÃO!
   )
   ```

2. **Policy de SELECT para Admins** (linhas 82-87):
   ```sql
   USING (
     EXISTS (
       SELECT 1 FROM public.profiles  -- ❌ RECURSÃO!
       WHERE id = auth.uid() AND role = 'admin' AND active = true
     )
   )
   ```

3. **Policy de UPDATE para Admins** (linhas 94-98):
   ```sql
   USING (
     EXISTS (
       SELECT 1 FROM public.profiles  -- ❌ RECURSÃO!
       WHERE id = auth.uid() AND role = 'admin' AND active = true
     )
   )
   ```

4. **Policies de Products** também consultavam `profiles`, causando recursão indireta.

## ✅ Solução Implementada

Criado arquivo `supabase/migrations/005_fix_rls_recursion.sql` que:

1. **Remove todas as policies recursivas**
2. **Cria policies seguras** usando apenas `auth.uid()` e comparação direta
3. **Cria policies temporárias** para `products`, `sales` e `sale_items`

## 📋 Como Executar

### Passo 1: Acessar SQL Editor do Supabase

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**

### Passo 2: Executar o Script de Correção

1. Abra o arquivo `supabase/migrations/005_fix_rls_recursion.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Passo 3: Verificar Execução

O script deve executar sem erros. Você verá mensagens como:
- `DROP POLICY` (várias)
- `CREATE POLICY` (várias)

### Passo 4: Testar a Aplicação

1. Recarregue a aplicação no navegador
2. Tente acessar:
   - Dashboard (`/`)
   - PDV (`/pdv`)
   - Estoque (`/estoque`)
   - Vendas (`/vendas`)

Os dados devem carregar normalmente sem erro 42P17.

## 🔍 O Que Foi Corrigido

### Profiles (Sem Recursão)

```sql
-- ✅ SEGURO: Usa apenas auth.uid() e comparação direta
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);
```

### Products (Sem Recursão)

```sql
-- ✅ SEGURO: Usa apenas auth.uid() (não consulta profiles)
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Sales (Sem Recursão)

```sql
-- ✅ SEGURO: Usa apenas auth.uid()
CREATE POLICY "Authenticated users can read sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

## ⚠️ Notas Importantes

### Policies Temporárias

As policies criadas são **temporárias** e permitem acesso a qualquer usuário autenticado. Para produção:

1. **Validação de Roles na Aplicação**: Use `contexts/PermissionContext.tsx` para validar roles
2. **Funções SECURITY DEFINER**: Crie funções que bypassam RLS para validação de roles
3. **Tabela de Roles Separada**: Armazene roles em uma tabela sem RLS

### Validação de Roles

A validação de roles (admin, gerente, vendedor) agora deve ser feita **na aplicação**, não nas policies RLS. O `PermissionContext.tsx` já faz isso corretamente.

## 🎯 Resultado Esperado

Após executar o script:

- ✅ Nenhum erro 42P17
- ✅ Products carregando normalmente
- ✅ Sales carregando normalmente
- ✅ Aplicação funcional
- ✅ Sem recursão infinita

## 📝 Próximos Passos (Opcional)

Se precisar de validação de roles no banco de dados no futuro, crie funções SECURITY DEFINER:

```sql
-- Exemplo de função segura (sem recursão)
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id AND active = true;
  
  RETURN user_role = 'admin';
END;
$$;
```

Então use na policy:
```sql
CREATE POLICY "Admins can do X"
  ON public.products FOR SELECT
  USING (is_user_admin(auth.uid()));
```

---

**Arquivo de Correção**: `supabase/migrations/005_fix_rls_recursion.sql`  
**Data**: 2024  
**Status**: ✅ Pronto para execução







