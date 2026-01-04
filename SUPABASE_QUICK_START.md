# ⚡ SUPABASE QUICK START - Ordem de Execução dos Scripts

**Guia rápido para executar os scripts SQL na ordem correta**

---

## 📋 ORDEM DE EXECUÇÃO

Execute os scripts nesta ordem EXATA no SQL Editor do Supabase:

### 1️⃣ Tabelas Base (Executar primeiro)

1. **products** → `supabase/migrations/001_create_profiles.sql` (MAS IGNORE a parte de profiles, só execute a parte de products se não existir)
2. **sales** → Criar tabela sales (script na checklist completa)
3. **sale_items** → Criar tabela sale_items (script na checklist completa)

### 2️⃣ Autenticação e Profiles

4. **profiles** → `supabase/migrations/001_create_profiles.sql`
5. **Funções e Triggers** → Parte do script 001

### 3️⃣ RLS Policies

6. **RLS Profiles** → `supabase/migrations/001_create_profiles.sql` (parte final)
7. **RLS Products** → `supabase/migrations/003_setup_rls_products.sql`
8. **RLS Sales** → `supabase/migrations/002_update_sales_user_id.sql`
9. **RLS Sale Items** → Script na checklist completa

### 4️⃣ Atualizações

10. **user_id em sales** → `supabase/migrations/002_update_sales_user_id.sql`

---

## 🚀 SCRIPT CONSOLIDADO (Execute TUDO de uma vez)

**⚠️ ATENÇÃO**: Se preferir, execute este script consolidado completo:

```sql
-- ============================================
-- 1. CRIAR TABELAS BASE
-- ============================================

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  category TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);

-- Sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'pix')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);

-- Sale Items
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'vendedor', 'gerente')) DEFAULT 'vendedor' NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ============================================
-- 2. FUNÇÕES E TRIGGERS
-- ============================================

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::TEXT, 'vendedor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND active = true));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND active = true));

-- Products RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ler produtos ativos" ON public.products;
CREATE POLICY "Todos podem ler produtos ativos"
  ON public.products FOR SELECT
  USING (active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Admin e gerente podem criar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem criar produtos"
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Admin e gerente podem atualizar produtos" ON public.products;
CREATE POLICY "Admin e gerente podem atualizar produtos"
  ON public.products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Apenas admin pode deletar produtos" ON public.products;
CREATE POLICY "Apenas admin pode deletar produtos"
  ON public.products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND active = true));

-- Sales RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendedores veem apenas suas vendas" ON public.sales;
CREATE POLICY "Vendedores veem apenas suas vendas"
  ON public.sales FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Usuários autenticados podem criar vendas" ON public.sales;
CREATE POLICY "Usuários autenticados podem criar vendas"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins e gerentes podem atualizar vendas" ON public.sales;
CREATE POLICY "Admins e gerentes podem atualizar vendas"
  ON public.sales FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Apenas admin pode deletar vendas" ON public.sales;
CREATE POLICY "Apenas admin pode deletar vendas"
  ON public.sales FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND active = true));

-- Sale Items RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sale items" ON public.sale_items;
CREATE POLICY "Users can view sale items"
  ON public.sale_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.sales WHERE id = sale_items.sale_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true)))));

DROP POLICY IF EXISTS "Users can create sale items" ON public.sale_items;
CREATE POLICY "Users can create sale items"
  ON public.sale_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.sales WHERE id = sale_items.sale_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update sale items" ON public.sale_items;
CREATE POLICY "Admins can update sale items"
  ON public.sale_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente') AND active = true));

DROP POLICY IF EXISTS "Admins can delete sale items" ON public.sale_items;
CREATE POLICY "Admins can delete sale items"
  ON public.sale_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND active = true));
```

**✅ Execute este script completo no SQL Editor do Supabase!**

---

## 📝 DEPOIS DE EXECUTAR

1. ✅ Verifique se as 4 tabelas foram criadas (Table Editor)
2. ✅ Verifique se RLS está habilitado (execute o teste na checklist completa)
3. ✅ Configure variáveis de ambiente
4. ✅ Crie primeiro usuário admin

---

**Tempo estimado**: 5-10 minutos  
**Dificuldade**: ⭐⭐ (Médio)














