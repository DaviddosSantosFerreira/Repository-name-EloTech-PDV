# 📋 PLANO DETALHADO - FASE 1: AUTENTICAÇÃO E AUTORIZAÇÃO

## 🎯 OBJETIVO
Implementar sistema completo de autenticação com Supabase Auth, incluindo login, registro, recuperação de senha, roles de usuário e proteção de rotas.

---

## 📁 ARQUIVOS A SEREM CRIADOS

### 1. Estrutura de Autenticação
```
app/
├── (auth)/                      # Grupo de rotas de autenticação (não mostra sidebar)
│   ├── layout.tsx              # Layout sem sidebar para auth
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── register/
│   │   └── page.tsx            # Página de registro
│   └── forgot-password/
│       └── page.tsx            # Página de recuperação de senha
│
├── (dashboard)/                 # Grupo de rotas protegidas (com sidebar)
│   ├── layout.tsx              # Layout com sidebar e verificação de auth
│   ├── page.tsx                # Dashboard (mover de app/page.tsx)
│   ├── pdv/
│   │   └── page.tsx            # PDV (mover de app/pdv/page.tsx)
│   ├── estoque/
│   │   └── page.tsx            # Estoque (mover de app/estoque/page.tsx)
│   └── vendas/
│       └── page.tsx            # Vendas (mover de app/vendas/page.tsx)
│
└── middleware.ts                # Middleware Next.js para proteção de rotas
```

### 2. Componentes de Autenticação
```
components/
├── auth/
│   ├── AuthProvider.tsx        # Context Provider para auth
│   ├── LoginForm.tsx           # Formulário de login
│   ├── RegisterForm.tsx        # Formulário de registro
│   ├── ForgotPasswordForm.tsx  # Formulário de recuperação
│   └── ProtectedRoute.tsx      # HOC para proteger componentes (opcional)
│
└── layout/
    └── UserMenu.tsx            # Menu do usuário no header (avatar, logout)
```

### 3. Biblioteca de Autenticação
```
lib/
├── auth.ts                     # Funções de autenticação (login, logout, register)
├── permissions.ts              # Funções de verificação de roles e permissões
└── supabase-client.ts          # Cliente Supabase para client components (novo)
```

### 4. Tipos TypeScript
```
types/
└── auth.ts                     # Tipos para User, Profile, Role, etc.
```

### 5. Scripts SQL para Supabase
```
supabase/
└── migrations/
    ├── 001_create_profiles.sql        # Criar tabela profiles
    ├── 002_update_sales_user_id.sql   # Adicionar user_id em sales
    └── 003_setup_rls_policies.sql     # Configurar RLS policies
```

---

## 📝 ARQUIVOS A SEREM MODIFICADOS

### 1. Arquivos Existentes a Modificar
```
app/
└── layout.tsx                  # Simplificar (remover sidebar, apenas provider)

components/
└── sidebar.tsx                 # Adicionar verificação de roles, ocultar itens baseado em permissões

lib/
└── supabase.ts                 # Atualizar para suportar auth (persistSession: true)

lib/
└── supabase-store.ts           # Adicionar user_id nas vendas, atualizar queries com RLS

package.json                    # Não precisa adicionar dependências (Supabase já instalado)
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### 1. Tabela `profiles`
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'vendedor', 'gerente')) DEFAULT 'vendedor',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS Policies para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil (exceto role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Apenas admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. Atualizar Tabela `sales`
```sql
-- Adicionar coluna user_id
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users;

-- RLS Policy: Vendedores veem apenas suas vendas
CREATE POLICY "Vendedores veem apenas suas vendas"
  ON sales FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- RLS Policy: Apenas usuários autenticados podem criar vendas
CREATE POLICY "Usuários autenticados podem criar vendas"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 3. Atualizar Tabela `products`
```sql
-- RLS Policy: Todos podem ler produtos ativos
CREATE POLICY "Todos podem ler produtos ativos"
  ON products FOR SELECT
  USING (active = true OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- RLS Policy: Apenas admin e gerente podem criar produtos
CREATE POLICY "Admin e gerente podem criar produtos"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- RLS Policy: Apenas admin e gerente podem atualizar produtos
CREATE POLICY "Admin e gerente podem atualizar produtos"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'gerente')
    )
  );

-- RLS Policy: Apenas admin pode deletar produtos
CREATE POLICY "Apenas admin pode deletar produtos"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 🔄 ORDEM DE IMPLEMENTAÇÃO

### ETAPA 1: Configuração Base do Supabase Auth
1. ✅ Atualizar `lib/supabase.ts` para suportar autenticação
2. ✅ Criar `lib/supabase-client.ts` para client components
3. ✅ Criar tipos em `types/auth.ts`

### ETAPA 2: Criar Estrutura de Rotas
4. ✅ Criar `app/(auth)/layout.tsx`
5. ✅ Criar `app/(auth)/login/page.tsx`
6. ✅ Criar `app/(dashboard)/layout.tsx`
7. ✅ Mover páginas existentes para `app/(dashboard)/`

### ETAPA 3: Componentes de Autenticação
8. ✅ Criar `components/auth/AuthProvider.tsx`
9. ✅ Criar `components/auth/LoginForm.tsx`
10. ✅ Criar `components/auth/RegisterForm.tsx`
11. ✅ Criar `lib/auth.ts` com funções de auth

### ETAPA 4: Banco de Dados
12. ✅ Criar tabela `profiles` no Supabase
13. ✅ Adicionar `user_id` em `sales`
14. ✅ Configurar RLS policies

### ETAPA 5: Middleware e Proteção
15. ✅ Criar `middleware.ts` para proteger rotas
16. ✅ Atualizar `app/layout.tsx` para usar AuthProvider
17. ✅ Criar hook `hooks/useAuth.ts`

### ETAPA 6: Permissões e Roles
18. ✅ Criar `lib/permissions.ts`
19. ✅ Atualizar `components/sidebar.tsx` com verificação de roles
20. ✅ Criar `components/layout/UserMenu.tsx`

### ETAPA 7: Integração com Vendas
21. ✅ Atualizar `lib/supabase-store.ts` para incluir user_id
22. ✅ Atualizar PDV para passar user_id na venda

### ETAPA 8: Página de Recuperação de Senha
23. ✅ Criar `app/(auth)/forgot-password/page.tsx`
24. ✅ Criar `components/auth/ForgotPasswordForm.tsx`

---

## 🔐 PERMISSÕES POR ROLE

### Admin
- ✅ Acesso total ao sistema
- ✅ CRUD completo de produtos
- ✅ Ver todas as vendas
- ✅ Gerenciar usuários
- ✅ Ver relatórios completos
- ✅ Deletar produtos

### Gerente
- ✅ Ver e editar produtos
- ✅ Ver todas as vendas
- ✅ Ver relatórios
- ✅ Criar vendas
- ❌ Não pode deletar produtos
- ❌ Não pode gerenciar usuários

### Vendedor
- ✅ Ver produtos (somente leitura)
- ✅ Criar vendas (PDV)
- ✅ Ver apenas suas próprias vendas
- ❌ Não pode editar/deletar produtos
- ❌ Não pode ver todas as vendas
- ❌ Não pode ver relatórios

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Funcionalidades Core
- [ ] Login funciona com email/senha
- [ ] Registro cria usuário e profile automaticamente
- [ ] Logout funciona corretamente
- [ ] Recuperação de senha funciona
- [ ] Middleware redireciona não autenticados para /login
- [ ] Usuários autenticados são redirecionados para /dashboard

### Banco de Dados
- [ ] Tabela profiles criada
- [ ] Trigger cria profile automaticamente
- [ ] RLS policies configuradas corretamente
- [ ] Coluna user_id adicionada em sales

### Permissões
- [ ] Admin vê todas as opções no sidebar
- [ ] Gerente vê opções limitadas
- [ ] Vendedor vê apenas PDV e suas vendas
- [ ] Vendedor não consegue acessar /estoque diretamente
- [ ] RLS bloqueia ações não permitidas

### UI/UX
- [ ] Header mostra nome do usuário
- [ ] Menu de usuário mostra role
- [ ] Botão de logout visível
- [ ] Sidebar adapta baseado em role
- [ ] Mensagens de erro claras
- [ ] Loading states durante auth

---

## 🚀 PRÓXIMOS PASSOS APÓS FASE 1

1. Testar todas as funcionalidades
2. Criar primeiro usuário admin manualmente no Supabase
3. Validar RLS policies
4. Documentar processo de criação de usuários
5. Preparar para FASE 2 (Performance)

---

## 📝 NOTAS IMPORTANTES

1. **Primeiro Admin**: Será criado manualmente no Supabase Dashboard, alterando o role na tabela profiles
2. **Segurança**: Sempre validar no servidor, não confiar apenas no cliente
3. **Sessões**: Usar `persistSession: true` para manter login
4. **Middleware**: Deve verificar autenticação antes de renderizar
5. **TypeScript**: Tipos devem refletir exatamente a estrutura do banco

---

**Status**: 📋 Plano criado, pronto para implementação
**Próximo passo**: Começar ETAPA 1 - Configuração Base do Supabase Auth















