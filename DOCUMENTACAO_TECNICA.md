# Documentação Técnica - EloTech PDV

**Versão:** 1.0  
**Data:** 2024  
**Autor:** Análise Técnica de Arquitetura  
**Stack:** Next.js 14.0.4 (App Router) + React 18.2.0 + Supabase + TypeScript

---

## 1. Visão Geral da Arquitetura

### 1.1 Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 14.0.4 | Framework React com App Router |
| **React** | 18.2.0 | Biblioteca UI |
| **TypeScript** | 5.3.3 | Tipagem estática |
| **Supabase** | 2.89.0 | Backend (Auth + Database) |
| **@supabase/ssr** | 0.8.0 | Integração SSR com Next.js |
| **Tailwind CSS** | 3.4.0 | Estilização |
| **Radix UI** | Várias | Componentes acessíveis |
| **Lucide React** | 0.303.0 | Ícones |

### 1.2 Organização de Pastas

```
elotech-pdv/
├── app/                          # App Router (Next.js 14)
│   ├── (auth)/                   # Grupo de rotas públicas
│   │   ├── layout.tsx           # Layout para login/register
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/              # Grupo de rotas protegidas
│   │   ├── layout.tsx           # Layout vazio (providers no root)
│   │   ├── page.tsx             # Dashboard principal
│   │   ├── pdv/
│   │   ├── estoque/
│   │   └── vendas/
│   ├── layout.tsx               # Root Layout (Server Component)
│   ├── providers.tsx            # Providers globais (Client Component)
│   └── globals.css
├── components/
│   ├── auth/                    # Componentes de autenticação
│   ├── dashboard/               # Componentes do dashboard
│   ├── ui/                      # Componentes UI (shadcn/ui)
│   ├── ErrorBoundary.tsx
│   └── sidebar.tsx
├── contexts/                     # React Contexts
│   ├── AuthSessionContext.tsx   # ✅ ATIVO - Gerenciamento de sessão
│   ├── ProfileContext.tsx        # ✅ ATIVO - Profile do usuário
│   ├── PermissionContext.tsx    # ✅ ATIVO - Permissões baseadas em role
│   ├── AuthContext.tsx          # ⚠️ LEGADO - Não usado
│   └── AuthProvider.tsx         # ⚠️ LEGADO - Não usado
├── hooks/
│   ├── useAuth.ts               # Hook de compatibilidade
│   └── useProfile.ts            # Hook para carregar profile
├── lib/
│   ├── repositories/            # Repository Pattern
│   │   ├── index.ts            # Factory de repositórios
│   │   ├── AuthRepository.ts
│   │   ├── SupabaseAuthRepository.ts
│   │   ├── ProfileRepository.ts
│   │   ├── ProductRepository.ts
│   │   ├── SaleRepository.ts
│   │   └── cached/             # Cache de produtos
│   ├── supabase/               # Clientes Supabase
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Middleware client
│   ├── store.ts                # ⚠️ LEGADO - Store síncrono
│   ├── logger.ts               # Logger estruturado
│   └── utils.ts                # Utilitários
├── middleware.ts                # Next.js Middleware (proteção de rotas)
└── types/                       # TypeScript types
```

### 1.3 Princípios Arquiteturais

#### 1.3.1 Repository Pattern
- **Abstração de dados:** Interfaces (`AuthRepository`, `ProfileRepository`, etc.)
- **Implementações concretas:** `SupabaseAuthRepository`, `SupabaseProfileRepository`
- **Factory function:** `createRepositories()` centraliza criação
- **Cache:** `CachedProductRepository` para otimização

#### 1.3.2 Separação de Responsabilidades
- **AuthSessionContext:** Apenas sessão (user, session)
- **ProfileContext:** Apenas profile (dados do usuário)
- **PermissionContext:** Apenas permissões (baseado em role)

#### 1.3.3 State Machine
- **AuthSessionContext** usa reducer com estados explícitos:
  - `idle` → `loading` → `authenticated` | `unauthenticated` | `error`
- **Transições garantidas:** `INIT_COMPLETE` sempre finaliza inicialização

#### 1.3.4 Server/Client Separation
- **Server Components:** `app/layout.tsx`, páginas por padrão
- **Client Components:** `app/providers.tsx`, contexts, hooks
- **Boundary claro:** `'use client'` apenas onde necessário

---

## 2. Mapeamento de Páginas (App Router)

### 2.1 Estrutura de Rotas

| Rota | Arquivo | Tipo | Layout | Proteção |
|------|---------|------|--------|----------|
| `/` | `app/(dashboard)/page.tsx` | Client | Dashboard | ✅ Middleware |
| `/pdv` | `app/(dashboard)/pdv/page.tsx` | Client | Dashboard | ✅ Middleware |
| `/estoque` | `app/(dashboard)/estoque/page.tsx` | Client | Dashboard | ✅ Middleware |
| `/vendas` | `app/(dashboard)/vendas/page.tsx` | Client | Dashboard | ✅ Middleware |
| `/login` | `app/(auth)/login/page.tsx` | Client | Auth | ❌ Pública |
| `/register` | `app/(auth)/register/page.tsx` | Client | Auth | ❌ Pública |

### 2.2 Layouts Aplicados

#### 2.2.1 Root Layout (`app/layout.tsx`)
```typescript
// Server Component puro
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Características:**
- ✅ Server Component (sem `'use client'`)
- ✅ Import default de `providers.tsx`
- ✅ Estrutura mínima

#### 2.2.2 Providers (`app/providers.tsx`)
```typescript
// Client Component
export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AuthSessionProvider>
        <ProfileProvider>
          <PermissionProvider>
            <AuthGate>{children}</AuthGate>
          </PermissionProvider>
        </ProfileProvider>
      </AuthSessionProvider>
    </ErrorBoundary>
  );
}
```

**Hierarquia de Providers:**
1. **ErrorBoundary** - Captura erros globais
2. **AuthSessionProvider** - Estado de autenticação
3. **ProfileProvider** - Depende de `AuthSessionProvider`
4. **PermissionProvider** - Depende de `ProfileProvider`
5. **AuthGate** - Loading state durante inicialização

#### 2.2.3 Auth Layout (`app/(auth)/layout.tsx`)
```typescript
// Server Component
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

**Uso:** Apenas para rotas públicas (login, register)

#### 2.2.4 Dashboard Layout (`app/(dashboard)/layout.tsx`)
```typescript
// Server Component
export default function DashboardLayout({ children }) {
  return <>{children}</>;
}
```

**Observação:** Layout vazio. Providers e Sidebar estão no `DashboardWrapper`.

### 2.3 Componentes de Página

#### 2.3.1 Dashboard (`app/(dashboard)/page.tsx`)
- **Tipo:** Client Component
- **Wrapper:** `DashboardWrapper` (Sidebar + main)
- **Dependências:** `lib/store.ts` (legado)
- **Funcionalidade:** Estatísticas do dia (vendas, receita, produtos, estoque baixo)

#### 2.3.2 Login (`app/(auth)/login/page.tsx`)
- **Tipo:** Client Component
- **Componente:** `LoginForm`
- **Hook:** `useAuth()` (compatibilidade)

#### 2.3.3 Register (`app/(auth)/register/page.tsx`)
- **Tipo:** Client Component
- **Componente:** `RegisterForm`
- **Hook:** `useAuth()` (compatibilidade)

---

## 3. Layouts e Providers

### 3.1 Análise do `app/layout.tsx`

**Status:** ✅ **Correto**

**Características:**
- Server Component puro
- Sem metadata (pode ser adicionado)
- Sem fontes (pode ser adicionado)
- Estrutura mínima e limpa

**Riscos:**
- ⚠️ **Baixo:** Falta metadata para SEO
- ⚠️ **Baixo:** Falta configuração de fontes

### 3.2 Análise do `app/providers.tsx`

**Status:** ✅ **Correto após correção definitiva**

**Hierarquia:**
```
ErrorBoundary
└── AuthSessionProvider
    └── ProfileProvider
        └── PermissionProvider
            └── AuthGate
                └── {children}
```

**Responsabilidades:**

1. **ErrorBoundary**
   - Captura erros não tratados
   - Renderiza `ErrorFallback`
   - Loga erros via `logger`

2. **AuthSessionProvider**
   - Gerencia estado de sessão
   - Inicializa sessão na montagem
   - Escuta `onAuthStateChange`
   - Expõe `useAuthSession()`

3. **ProfileProvider**
   - Carrega profile do usuário autenticado
   - Depende de `user.id` do `AuthSessionProvider`
   - Expõe `useProfile()`

4. **PermissionProvider**
   - Calcula permissões baseado em `profile.role`
   - Depende de `ProfileProvider`
   - Expõe `usePermission()`

5. **AuthGate**
   - Mostra loading durante inicialização
   - **NÃO redireciona** (middleware faz isso)
   - Renderiza children quando pronto

**Riscos e Boas Práticas:**

✅ **Boas Práticas:**
- Hierarquia correta de dependências
- Export default (otimização de bundle)
- Client Component isolado
- `AuthGate` global (loading consistente)

⚠️ **Riscos Identificados:**

1. **AuthGate Global**
   - **Problema:** `AuthGate` está no root, afetando TODAS as rotas (incluindo públicas)
   - **Impacto:** Pode causar loading desnecessário em rotas públicas
   - **Solução Atual:** Funciona porque middleware redireciona antes
   - **Recomendação:** Considerar mover `AuthGate` apenas para rotas protegidas

2. **Dependência Circular Potencial**
   - `ProfileProvider` depende de `AuthSessionProvider`
   - `PermissionProvider` depende de `ProfileProvider`
   - **Status:** ✅ Sem problemas atuais, mas monitorar

3. **Re-renders em Cascata**
   - Mudança em `AuthSessionProvider` → re-render de `ProfileProvider` → re-render de `PermissionProvider`
   - **Mitigação:** Uso de `useMemo` e `useCallback` nos providers
   - **Status:** ✅ Otimizado

---

## 4. Autenticação

### 4.1 Fluxo Completo de Login/Logout

#### 4.1.1 Fluxo de Login

```
1. Usuário acessa /login
   ↓
2. Middleware verifica: rota pública → permite
   ↓
3. LoginForm renderiza
   ↓
4. Usuário preenche email/senha
   ↓
5. useAuth().signIn() chamado
   ↓
6. SupabaseAuthRepository.signIn()
   ↓
7. Supabase autentica
   ↓
8. onAuthStateChange dispara SIGNED_IN
   ↓
9. AuthSessionContext.updateSession() chamado
   ↓
10. Verificação idempotente (evita duplicação)
    ↓
11. dispatch({ type: 'AUTH_SUCCESS' })
    ↓
12. ProfileProvider detecta user.id mudou
    ↓
13. useProfile() carrega profile
    ↓
14. PermissionProvider calcula permissões
    ↓
15. Middleware redireciona para / (se estava em rota pública)
```

#### 4.1.2 Fluxo de Logout

```
1. Usuário clica em "Sair"
   ↓
2. useAuth().signOut() chamado
   ↓
3. SupabaseAuthRepository.signOut()
   ↓
4. onAuthStateChange dispara SIGNED_OUT
   ↓
5. AuthSessionContext.updateSession(null)
   ↓
6. dispatch({ type: 'AUTH_LOGOUT' })
   ↓
7. ProfileProvider: profile = null
   ↓
8. PermissionProvider: permissões = false
   ↓
9. router.push('/login')
```

### 4.2 AuthSessionContext (State Machine)

**Arquivo:** `contexts/AuthSessionContext.tsx`

**Estados:**
```typescript
type SessionState =
  | { type: 'idle' }                    // Estado inicial
  | { type: 'loading' }                  // Verificando sessão
  | { type: 'authenticated'; user: User; session: Session }
  | { type: 'unauthenticated' }          // Sem sessão
  | { type: 'error'; error: Error }      // Erro na inicialização
```

**Ações:**
```typescript
type SessionAction =
  | { type: 'SESSION_LOADING' }
  | { type: 'AUTH_SUCCESS'; user: User; session: Session }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_ERROR'; error: Error }
  | { type: 'INIT_COMPLETE' }  // 🔥 Garantia de finalização
```

**Transições:**
```
idle → SESSION_LOADING → loading
loading → AUTH_SUCCESS → authenticated
loading → AUTH_LOGOUT → unauthenticated
loading → AUTH_ERROR → error
loading → INIT_COMPLETE → authenticated | unauthenticated
```

**Correções Críticas Implementadas:**

1. **Idempotência de `updateSession`**
   - Verifica se já está autenticado com o mesmo usuário
   - Usa `currentUserIdRef` para evitar race conditions
   - Evita `AUTH_SUCCESS` duplicado

2. **Garantia de `INIT_COMPLETE`**
   - `initialize()` usa `try...catch...finally`
   - `INIT_COMPLETE` sempre disparado no `finally`
   - Reducer garante transição de `loading` → `authenticated` | `unauthenticated`

3. **Refs para Controle de Ciclo de Vida**
   - `mountedRef`: Previne updates após unmount
   - `initializedRef`: Previne múltiplas inicializações
   - `currentUserIdRef`: Rastreia usuário atual (idempotência)
   - `stateRef`: Acesso ao state sem re-renders

**Código Crítico:**
```typescript
const initialize = async () => {
  dispatch({ type: 'SESSION_LOADING' });
  try {
    const session = await repositories.auth.getSession();
    if (session?.user) {
      currentUserIdRef.current = session.user.id;
      dispatch({ type: 'AUTH_SUCCESS', user: session.user, session });
    } else {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  } catch (error) {
    dispatch({ type: 'AUTH_ERROR', error });
  } finally {
    // 🔥 GARANTIA ABSOLUTA
    if (mountedRef.current) {
      dispatch({ type: 'INIT_COMPLETE' });
    }
  }
};
```

### 4.3 AuthGate (Controle de Acesso)

**Arquivo:** `components/auth/AuthGate.tsx`

**Responsabilidades:**
- ✅ Mostrar loading durante `sessionLoading === true`
- ✅ Renderizar children quando pronto
- ❌ **NÃO redireciona** (middleware faz isso)
- ❌ **NÃO decide navegação**

**Código:**
```typescript
export function AuthGate({ children }) {
  const { sessionLoading } = useAuthSession();

  if (sessionLoading) {
    return <div>Inicializando sessão...</div>;
  }

  return <>{children}</>;
}
```

**Observação:** `AuthGate` está no root (`app/providers.tsx`), afetando todas as rotas. Funciona porque middleware redireciona antes, mas pode causar loading desnecessário em rotas públicas.

### 4.4 Integração com Supabase

#### 4.4.1 Clientes Supabase

**Browser Client** (`lib/supabase/client.ts`):
```typescript
export function getBrowserClient(): SupabaseClient {
  // Singleton para browser
}
```

**Server Client** (`lib/supabase/server.ts`):
```typescript
export function getServerClient(): SupabaseClient {
  // Criado por requisição (cookies)
}
```

**Middleware Client** (`lib/supabase/middleware.ts`):
```typescript
export function createServerClient(request: NextRequest) {
  // Cliente específico para middleware
}
```

#### 4.4.2 Repository Pattern

**Interface:**
```typescript
interface AuthRepository {
  getSession(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string, metadata?: Record<string, any>): Promise<User>;
  signOut(): Promise<void>;
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void;
}
```

**Implementação:**
```typescript
export function createSupabaseAuthRepository(supabase: SupabaseClient): AuthRepository {
  return {
    async getSession() { /* ... */ },
    async signIn() { /* ... */ },
    // ...
  };
}
```

**Factory:**
```typescript
export function getRepositories(): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories();
  }
  return repositoriesInstance;
}
```

### 4.5 Pontos Críticos Já Resolvidos

✅ **Resolvido:** `AUTH_SUCCESS` duplicado
- **Problema:** `updateSession` chamado duas vezes (manual + `onAuthStateChange`)
- **Solução:** Verificação idempotente com `currentUserIdRef`

✅ **Resolvido:** Loading infinito
- **Problema:** `INIT_COMPLETE` não era garantido
- **Solução:** `finally` block sempre dispara `INIT_COMPLETE`

✅ **Resolvido:** Race conditions
- **Problema:** State stale em callbacks
- **Solução:** Uso de `stateRef` e `currentUserIdRef`

✅ **Resolvido:** Provider ausente
- **Problema:** `useAuthSession` usado fora do provider
- **Solução:** Providers movidos para `app/providers.tsx` global

### 4.6 Riscos Futuros

⚠️ **Risco 1: Sessão Expirada**
- **Cenário:** Token expira durante uso
- **Impacto:** Usuário pode perder trabalho
- **Mitigação:** Implementar refresh automático (já configurado no Supabase)
- **Status:** Monitorar

⚠️ **Risco 2: Múltiplas Abas**
- **Cenário:** Usuário faz logout em uma aba
- **Impacto:** Outras abas podem ficar desatualizadas
- **Mitigação:** `onAuthStateChange` já sincroniza
- **Status:** ✅ Funcional

⚠️ **Risco 3: Network Interruption**
- **Cenário:** Conexão cai durante login
- **Impacto:** Estado pode ficar inconsistente
- **Mitigação:** `AUTH_ERROR` já trata erros
- **Status:** ✅ Funcional

---

## 5. Contextos e Hooks

### 5.1 Lista de Contexts

| Context | Arquivo | Status | Dependências |
|---------|---------|--------|--------------|
| `AuthSessionContext` | `contexts/AuthSessionContext.tsx` | ✅ Ativo | Nenhuma |
| `ProfileContext` | `contexts/ProfileContext.tsx` | ✅ Ativo | `AuthSessionContext` |
| `PermissionContext` | `contexts/PermissionContext.tsx` | ✅ Ativo | `ProfileContext` |
| `AuthContext` | `contexts/AuthContext.tsx` | ⚠️ Legado | Nenhuma |
| `AuthProvider` | `components/auth/AuthProvider.tsx` | ⚠️ Legado | Nenhuma |

### 5.2 Dependências Entre Contexts

```
AuthSessionContext (user, session)
    ↓
ProfileContext (profile)
    ↓
PermissionContext (permissions)
```

**Fluxo de Dados:**
1. `AuthSessionProvider` detecta `user.id`
2. `ProfileProvider` consome `user.id` via `useAuthSession()`
3. `useProfile(user.id)` carrega profile
4. `PermissionProvider` consome `profile.role` via `useProfile()`
5. Permissões calculadas baseado em `role`

### 5.3 Hooks Customizados

#### 5.3.1 `useAuthSession()`
**Arquivo:** `contexts/AuthSessionContext.tsx`

**Retorno:**
```typescript
{
  session: Session | null;
  user: User | null;
  sessionLoading: boolean;
  updateSession: (newSession: Session | null) => void;
}
```

**Uso:**
```typescript
const { user, session, sessionLoading } = useAuthSession();
```

#### 5.3.2 `useProfile()`
**Arquivo:** `contexts/ProfileContext.tsx`

**Retorno:**
```typescript
{
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Uso:**
```typescript
const { profile, isLoading } = useProfile();
```

#### 5.3.3 `usePermission()`
**Arquivo:** `contexts/PermissionContext.tsx`

**Retorno:**
```typescript
{
  isAdmin: boolean;
  isGerente: boolean;
  isVendedor: boolean;
  hasPermission: (permission: string) => boolean;
}
```

**Uso:**
```typescript
const { isAdmin, hasPermission } = usePermission();
```

#### 5.3.4 `useAuth()` (Compatibilidade)
**Arquivo:** `hooks/useAuth.ts`

**Status:** ⚠️ **Wrapper de compatibilidade**

**Retorno:**
```typescript
{
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Uso:**
```typescript
const { user, profile, signOut } = useAuth();
```

**Observação:** Este hook é um wrapper sobre `useAuthSession()` e `useProfile()`. Mantido para compatibilidade com código legado (ex: `Sidebar`).

#### 5.3.5 `useProfile(userId)` (Hook Standalone)
**Arquivo:** `hooks/useProfile.ts`

**Status:** ✅ **Usado internamente por `ProfileContext`**

**Uso:**
```typescript
const { profile, isLoading, error } = useProfile(userId);
```

### 5.4 Possíveis Problemas de Re-renderização

#### 5.4.1 Cascata de Re-renders

**Cenário:**
```
AuthSessionProvider muda user
  → ProfileProvider re-renderiza
    → PermissionProvider re-renderiza
      → Todos os componentes que usam usePermission() re-renderizam
```

**Mitigação Atual:**
- ✅ `PermissionProvider` usa `useMemo` para `value`
- ✅ `hasPermission` usa `useCallback`
- ✅ `ProfileProvider` usa `useProfile` hook (otimizado)

**Status:** ✅ **Otimizado, mas monitorar em produção**

#### 5.4.2 Re-renders Desnecessários

**Risco:** Componentes que usam `useAuth()` podem re-renderizar quando `profile` muda, mesmo que não usem `profile`.

**Mitigação:**
- ⚠️ **Parcial:** `useAuth()` retorna objeto estável, mas `profile` pode mudar
- **Recomendação:** Migrar para `useAuthSession()` + `useProfile()` separadamente

---

## 6. Repositórios e Store

### 6.1 Padrão Repository Utilizado

**Estrutura:**
```
lib/repositories/
├── AuthRepository.ts              # Interface
├── SupabaseAuthRepository.ts      # Implementação (factory function)
├── ProfileRepository.ts           # Interface
├── SupabaseProfileRepository.ts   # Implementação (classe)
├── ProductRepository.ts           # Interface
├── SupabaseProductRepository.ts   # Implementação (classe)
├── SaleRepository.ts              # Interface
├── SupabaseSaleRepository.ts      # Implementação (classe)
├── cached/
│   └── ProductRepositoryCache.ts # Decorator de cache
└── index.ts                       # Factory
```

**Factory:**
```typescript
export function createRepositories(): Repositories {
  const supabase = getBrowserClient();
  const baseProductRepo = new SupabaseProductRepository(supabase);

  return {
    auth: createSupabaseAuthRepository(supabase),      // Factory function
    profile: new SupabaseProfileRepository(supabase),   // Classe
    product: new CachedProductRepository(baseProductRepo), // Com cache
    sale: new SupabaseSaleRepository(supabase),         // Classe
  };
}
```

### 6.2 Como `getRepositories()` Funciona

**Código:**
```typescript
let repositoriesInstance: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories();
  }
  return repositoriesInstance;
}
```

**Características:**
- ✅ Singleton por instância do módulo
- ✅ Lazy initialization
- ⚠️ **Risco:** Compartilhado entre todas as requisições no mesmo processo

**Observação:** Em ambiente browser, isso é aceitável. Em ambiente server (SSR), cada requisição deveria ter sua própria instância (não implementado).

### 6.3 Cache e Invalidação

#### 6.3.1 ProductRepository Cache

**Implementação:** `CachedProductRepository` (decorator)

**Características:**
- Cache em memória
- TTL configurável
- Invalidação manual

**Código:**
```typescript
class CachedProductRepository implements ProductRepository {
  private cache: Product[] | null = null;
  private lastFetch = 0;
  private ttl = 30000; // 30 segundos

  async getProducts(forceRefresh = false): Promise<Product[]> {
    const now = Date.now();
    if (!forceRefresh && this.cache && (now - this.lastFetch) < this.ttl) {
      return this.cache;
    }
    // Fetch e atualizar cache
  }
}
```

#### 6.3.2 Store Legado (`lib/store.ts`)

**Status:** ⚠️ **LEGADO - A ser migrado para React Query**

**Características:**
- Cache síncrono (`productsCache`, `salesCache`)
- Funções `refreshProductsCache()`, `refreshSalesCache()`
- Interface síncrona (`productStore.getAll()`, `saleStore.getToday()`)

**Uso Atual:**
- `app/(dashboard)/page.tsx` usa `saleStore` e `productStore`
- Requer chamada manual de `refreshStores()` antes de usar

**Riscos:**
- ⚠️ Cache pode estar desatualizado
- ⚠️ Não há invalidação automática
- ⚠️ Requer gerenciamento manual

**Recomendação:** Migrar para React Query ou SWR

### 6.4 Pontos de Falha Conhecidos

#### 6.4.1 Singleton Compartilhado

**Problema:** `getRepositories()` retorna singleton compartilhado.

**Impacto:**
- Em SSR, múltiplas requisições podem compartilhar estado
- Cache pode vazar entre usuários (se implementado incorretamente)

**Mitigação Atual:**
- ✅ Cache está em instâncias separadas (`CachedProductRepository`)
- ⚠️ **Risco:** Se cache fosse global, haveria vazamento

**Recomendação:** Implementar factory por requisição em SSR

#### 6.4.2 Falta de Invalidação Automática

**Problema:** Cache não invalida automaticamente quando dados mudam.

**Impacto:**
- Dados podem ficar desatualizados
- Requer refresh manual

**Mitigação:**
- ✅ TTL de 30 segundos no `CachedProductRepository`
- ⚠️ Store legado não tem TTL

**Recomendação:** Implementar invalidação baseada em eventos (ex: após criar/editar produto)

#### 6.4.3 Erro em Repositório Não Tratado

**Problema:** Erros em repositórios podem não ser tratados adequadamente.

**Impacto:**
- UI pode quebrar
- Erros podem ser silenciosos

**Mitigação:**
- ✅ `ErrorBoundary` captura erros de renderização
- ⚠️ Erros assíncronos podem não ser capturados

**Recomendação:** Implementar error handling consistente em todos os repositórios

---

## 7. Componentes Globais

### 7.1 ErrorBoundary

**Arquivo:** `components/ErrorBoundary.tsx`

**Características:**
- Class Component (requerido para Error Boundary)
- Captura erros em children
- Renderiza `ErrorFallback` em caso de erro
- Loga erros via `logger`

**Uso:**
```typescript
<ErrorBoundary>
  {children}
</ErrorBoundary>
```

**Localização:** `app/providers.tsx` (global)

**Riscos:**
- ⚠️ Não captura erros em:
  - Event handlers
  - Async code (setTimeout, promises)
  - Server Components
  - Durante SSR

**Recomendação:** Implementar error handling adicional para casos não cobertos

### 7.2 Sidebar

**Arquivo:** `components/sidebar.tsx`

**Características:**
- Client Component
- Usa `useAuth()` (compatibilidade)
- Navegação: Dashboard, PDV, Estoque, Vendas
- Menu de usuário com logout

**Dependências:**
- `useAuth()` → `useAuthSession()` + `useProfile()`
- `usePathname()` (Next.js)
- `useRouter()` (Next.js)

**Localização:** Renderizado em `DashboardWrapper`

**Riscos:**
- ⚠️ Depende de `useAuth()` (legado)
- ⚠️ Re-renderiza quando `profile` muda (mesmo que não use diretamente)

**Recomendação:** Migrar para `useAuthSession()` + `useProfile()` separadamente

### 7.3 Componentes que Dependem de Autenticação

| Componente | Arquivo | Dependência | Status |
|------------|---------|-------------|--------|
| `Sidebar` | `components/sidebar.tsx` | `useAuth()` | ⚠️ Legado |
| `LoginForm` | `components/auth/LoginForm.tsx` | `useAuth()` | ⚠️ Legado |
| `RegisterForm` | `components/auth/RegisterForm.tsx` | `useAuth()` | ⚠️ Legado |
| `AuthGuard` | `components/auth/AuthGuard.tsx` | `useAuth()` | ⚠️ Legado |
| `DashboardWrapper` | `components/dashboard/DashboardWrapper.tsx` | Nenhuma | ✅ OK |

**Observação:** Todos os componentes de autenticação usam `useAuth()` (wrapper de compatibilidade). Funcional, mas ideal seria migrar para hooks específicos.

---

## 8. Análise de Riscos Técnicos

### 8.1 Problemas Reais Já Identificados

#### 8.1.1 ✅ Resolvido: AUTH_SUCCESS Duplicado
- **Problema:** `updateSession` chamado duas vezes
- **Solução:** Idempotência com `currentUserIdRef`
- **Status:** ✅ Resolvido

#### 8.1.2 ✅ Resolvido: Loading Infinito
- **Problema:** `INIT_COMPLETE` não garantido
- **Solução:** `finally` block sempre dispara `INIT_COMPLETE`
- **Status:** ✅ Resolvido

#### 8.1.3 ✅ Resolvido: Provider Ausente
- **Problema:** `useAuthSession` usado fora do provider
- **Solução:** Providers movidos para `app/providers.tsx`
- **Status:** ✅ Resolvido

#### 8.1.4 ✅ Resolvido: ChunkLoadError
- **Problema:** Client Components no Server Component
- **Solução:** `app/providers.tsx` isolado como Client Component
- **Status:** ✅ Resolvido

### 8.2 O Que Pode Quebrar em Produção

#### 8.2.1 ⚠️ Risco Alto: AuthGate Global
**Problema:** `AuthGate` está no root, afetando todas as rotas.

**Cenário de Falha:**
- Usuário acessa rota pública (`/login`)
- `AuthGate` mostra loading
- Middleware redireciona (se autenticado)
- Mas loading pode aparecer brevemente

**Impacto:** UX ruim (loading desnecessário)

**Mitigação Atual:** Funciona porque middleware redireciona rápido

**Recomendação:** Mover `AuthGate` apenas para rotas protegidas

#### 8.2.2 ⚠️ Risco Médio: Singleton de Repositórios
**Problema:** `getRepositories()` retorna singleton compartilhado.

**Cenário de Falha:**
- Em SSR, múltiplas requisições compartilham instância
- Se cache fosse global, dados de um usuário vazariam para outro

**Impacto:** Vazamento de dados (se cache implementado incorretamente)

**Mitigação Atual:** Cache está em instâncias separadas

**Recomendação:** Implementar factory por requisição em SSR

#### 8.2.3 ⚠️ Risco Médio: Store Legado
**Problema:** `lib/store.ts` requer refresh manual.

**Cenário de Falha:**
- Componente usa `productStore.getAll()` sem chamar `refreshProductsCache()`
- Dados desatualizados são exibidos

**Impacto:** Dados incorretos na UI

**Mitigação Atual:** `app/(dashboard)/page.tsx` chama `refreshStores()` antes de usar

**Recomendação:** Migrar para React Query ou SWR

#### 8.2.4 ⚠️ Risco Baixo: Re-renders em Cascata
**Problema:** Mudança em `AuthSessionProvider` causa re-render em cascata.

**Cenário de Falha:**
- Login → `user` muda → `ProfileProvider` re-renderiza → `PermissionProvider` re-renderiza → todos os componentes que usam `usePermission()` re-renderizam

**Impacto:** Performance degradada em componentes pesados

**Mitigação Atual:** `useMemo` e `useCallback` nos providers

**Recomendação:** Monitorar em produção, considerar React.memo em componentes pesados

#### 8.2.5 ⚠️ Risco Baixo: Erros Assíncronos Não Capturados
**Problema:** `ErrorBoundary` não captura erros em async code.

**Cenário de Falha:**
- `useEffect` faz fetch → erro → não é capturado por `ErrorBoundary`
- UI pode quebrar silenciosamente

**Impacto:** Erros não tratados

**Mitigação Atual:** Hooks (`useProfile`) têm error handling próprio

**Recomendação:** Implementar error handling consistente em todos os hooks

### 8.3 Sugestões de Hardening

#### 8.3.1 Autenticação
- ✅ Implementar refresh automático de token (já configurado no Supabase)
- ⚠️ Adicionar retry logic para falhas de rede
- ⚠️ Implementar timeout para requisições de auth
- ⚠️ Adicionar logging de tentativas de login falhadas

#### 8.3.2 Repositórios
- ⚠️ Implementar factory por requisição em SSR
- ⚠️ Adicionar error handling consistente
- ⚠️ Implementar retry logic para falhas de rede
- ⚠️ Adicionar timeout para requisições

#### 8.3.3 Cache
- ⚠️ Implementar invalidação baseada em eventos
- ⚠️ Adicionar TTL ao store legado
- ⚠️ Implementar cache por usuário (se necessário)
- ⚠️ Adicionar métricas de hit/miss

#### 8.3.4 Error Handling
- ⚠️ Implementar error boundary específico para async errors
- ⚠️ Adicionar logging estruturado (Sentry, LogRocket)
- ⚠️ Implementar fallback UI para erros de rede
- ⚠️ Adicionar retry automático para erros recuperáveis

#### 8.3.5 Performance
- ⚠️ Implementar code splitting por rota
- ⚠️ Adicionar React.memo em componentes pesados
- ⚠️ Implementar virtualização para listas longas
- ⚠️ Adicionar métricas de performance (Web Vitals)

---

## 9. Recomendações Finais

### 9.1 Melhorias de Curto Prazo (1-2 semanas)

#### 9.1.1 Mover AuthGate para Rotas Protegidas
**Prioridade:** Média  
**Esforço:** Baixo  
**Impacto:** Melhora UX em rotas públicas

**Ação:**
```typescript
// app/providers.tsx - Remover AuthGate
<PermissionProvider>
  {children}  // Sem AuthGate
</PermissionProvider>

// app/(dashboard)/layout.tsx - Adicionar AuthGate
<AuthGate>
  {children}
</AuthGate>
```

#### 9.1.2 Adicionar Metadata ao Root Layout
**Prioridade:** Baixa  
**Esforço:** Baixo  
**Impacto:** Melhora SEO

**Ação:**
```typescript
export const metadata: Metadata = {
  title: 'EloTech PDV',
  description: 'Sistema de ponto de venda escalável e moderno',
};
```

#### 9.1.3 Implementar Error Handling Consistente
**Prioridade:** Alta  
**Esforço:** Médio  
**Impacto:** Melhora estabilidade

**Ação:**
- Adicionar try/catch em todos os repositórios
- Implementar error boundary para async errors
- Adicionar logging estruturado

#### 9.1.4 Limpar Código Legado
**Prioridade:** Baixa  
**Esforço:** Baixo  
**Impacto:** Reduz confusão

**Ação:**
- Remover `contexts/AuthContext.tsx` (não usado)
- Remover `components/auth/AuthProvider.tsx` (não usado)
- Marcar `lib/store.ts` como `@deprecated`

### 9.2 Melhorias Estruturais Futuras (1-3 meses)

#### 9.2.1 Migrar Store para React Query
**Prioridade:** Alta  
**Esforço:** Alto  
**Impacto:** Melhora gerenciamento de estado e cache

**Benefícios:**
- Cache automático
- Invalidação inteligente
- Retry automático
- Loading states gerenciados

**Ação:**
```bash
npm install @tanstack/react-query
```

#### 9.2.2 Implementar Factory por Requisição em SSR
**Prioridade:** Média  
**Esforço:** Médio  
**Impacto:** Previne vazamento de dados

**Ação:**
- Criar `getRepositoriesForRequest(requestId)`
- Usar em Server Components e Server Actions
- Manter singleton apenas em Client Components

#### 9.2.3 Migrar useAuth() para Hooks Específicos
**Prioridade:** Baixa  
**Esforço:** Médio  
**Impacto:** Reduz re-renders desnecessários

**Ação:**
- Substituir `useAuth()` por `useAuthSession()` + `useProfile()` em:
  - `Sidebar`
  - `LoginForm`
  - `RegisterForm`
  - `AuthGuard`

#### 9.2.4 Implementar Testes
**Prioridade:** Alta  
**Esforço:** Alto  
**Impacto:** Melhora confiabilidade

**Ação:**
- Testes unitários para repositórios
- Testes de integração para fluxos de auth
- Testes E2E para fluxos críticos

#### 9.2.5 Adicionar Monitoramento
**Prioridade:** Média  
**Esforço:** Médio  
**Impacto:** Melhora observabilidade

**Ação:**
- Integrar Sentry para error tracking
- Adicionar métricas de performance (Web Vitals)
- Implementar logging estruturado

---

## 10. Conclusão

### 10.1 Estado Atual do Sistema

**✅ Pontos Fortes:**
- Arquitetura bem estruturada (Repository Pattern, State Machine)
- Separação clara de responsabilidades
- Correções críticas implementadas (idempotência, INIT_COMPLETE)
- Providers organizados hierarquicamente
- TypeScript com tipagem forte

**⚠️ Pontos de Atenção:**
- Código legado ainda presente (`lib/store.ts`, `useAuth()`)
- `AuthGate` global pode causar loading desnecessário
- Falta de testes
- Falta de monitoramento

**❌ Problemas Críticos:**
- Nenhum identificado (todos os problemas críticos foram resolvidos)

### 10.2 Próximos Passos Recomendados

1. **Imediato:** Implementar error handling consistente
2. **Curto Prazo:** Mover `AuthGate` para rotas protegidas
3. **Médio Prazo:** Migrar store para React Query
4. **Longo Prazo:** Implementar testes e monitoramento

### 10.3 Observações Finais

O sistema está em um estado **estável e funcional**. As correções críticas implementadas (idempotência, INIT_COMPLETE, providers) resolveram os problemas principais. As melhorias sugeridas são principalmente para **hardening** e **manutenibilidade**, não para correção de bugs críticos.

**Recomendação:** Priorizar melhorias de curto prazo (error handling, mover AuthGate) antes de investir em refatorações maiores (React Query, testes).

---

**Fim do Documento**




o next.config.js está assim:  # 📚 Documentação Técnica - EloTech PDV

## 📋 Índice

1. [Objetivo do Sistema](#objetivo-do-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Instalação e Configuração](#instalação-e-configuração)
6. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
7. [Estrutura de Pastas](#estrutura-de-pastas)

---

## 🎯 Objetivo do Sistema

O **EloTech PDV** é um sistema completo de Ponto de Venda (PDV) desenvolvido para gerenciar operações de venda, estoque e relatórios de forma eficiente e profissional. O sistema permite:

- **Gestão de Vendas**: Realizar vendas através de uma interface moderna de frente de caixa
- **Controle de Estoque**: Gerenciar produtos, estoque mínimo e categorias
- **Histórico de Vendas**: Consultar e analisar todas as vendas realizadas
- **Dashboard**: Visualizar métricas e estatísticas em tempo real
- **Autenticação e Autorização**: Sistema de login com diferentes níveis de acesso (admin, gerente, vendedor)

---

## 🛠️ Stack Tecnológico

### Frontend

- **Next.js 14** (App Router) - Framework React para produção
- **React 18.2.0** - Biblioteca JavaScript para interfaces
- **TypeScript 5.3.3** - Superset do JavaScript com tipagem estática
- **Tailwind CSS 3.4.0** - Framework CSS utilitário
- **Shadcn/UI** - Componentes UI baseados em Radix UI
- **Lucide React** - Biblioteca de ícones moderna

### Backend & Banco de Dados

- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL (banco de dados)
  - Autenticação integrada
  - Row Level Security (RLS)
  - API REST automática
- **@supabase/ssr 0.8.0** - Integração Supabase com Next.js SSR
- **@supabase/supabase-js 2.89.0** - Cliente JavaScript do Supabase

### Bibliotecas de UI

- **@radix-ui/react-dialog** - Componentes de diálogo acessíveis
- **@radix-ui/react-label** - Componentes de label
- **@radix-ui/react-select** - Componentes de seleção
- **@radix-ui/react-separator** - Separadores visuais
- **@radix-ui/react-slot** - Sistema de slots para composição
- **@radix-ui/react-tabs** - Componentes de abas

### Utilitários

- **class-variance-authority** - Gerenciamento de variantes de classes
- **clsx** - Utilitário para construção de classes CSS
- **tailwind-merge** - Merge de classes Tailwind

### Desenvolvimento

- **ESLint** - Linter para JavaScript/TypeScript
- **Autoprefixer** - Adiciona prefixos CSS automaticamente
- **PostCSS** - Processador CSS

---

## 🗄️ Estrutura do Banco de Dados

O banco de dados utiliza **PostgreSQL** hospedado no Supabase. A estrutura é composta por 4 tabelas principais:

### 1. Tabela `profiles`

Armazena informações dos usuários do sistema, vinculada à tabela `auth.users` do Supabase.

**Campos:**
- `id` (UUID, PK) - ID do usuário (referência a `auth.users.id`)
- `email` (TEXT) - Email do usuário
- `full_name` (TEXT, nullable) - Nome completo
- `role` (ENUM) - Papel do usuário: `'admin' | 'gerente' | 'vendedor'`
- `active` (BOOLEAN) - Status ativo/inativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Relacionamentos:**
- `id` → `auth.users.id` (1:1)

### 2. Tabela `products`

Armazena informações dos produtos disponíveis para venda.

**Campos:**
- `id` (UUID, PK) - ID único do produto
- `code` (TEXT) - Código de barras ou código interno
- `name` (TEXT) - Nome do produto
- `description` (TEXT, nullable) - Descrição do produto
- `price` (DECIMAL) - Preço de venda
- `stock` (INTEGER) - Quantidade em estoque
- `min_stock` (INTEGER) - Estoque mínimo (padrão: 5)
- `category` (TEXT, nullable) - Categoria do produto
- `image_url` (TEXT, nullable) - URL da imagem do produto
- `active` (BOOLEAN) - Produto ativo/inativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Relacionamentos:**
- `id` → `sale_items.product_id` (1:N)

### 3. Tabela `sales`

Armazena informações das vendas realizadas.

**Campos:**
- `id` (UUID, PK) - ID único da venda
- `sale_number` (TEXT) - Número da venda (ex: "V1234567890")
- `total` (DECIMAL) - Valor total da venda
- `payment_method` (ENUM) - Forma de pagamento: `'cash' | 'card' | 'pix'`
- `status` (ENUM) - Status da venda: `'pending' | 'completed' | 'cancelled'`
- `notes` (TEXT, nullable) - Observações da venda
- `user_id` (UUID, nullable, FK) - ID do usuário que realizou a venda
- `created_at` (TIMESTAMP) - Data e hora da venda
- `updated_at` (TIMESTAMP) - Data de atualização

**Relacionamentos:**
- `id` → `sale_items.sale_id` (1:N)
- `user_id` → `profiles.id` (N:1)

### 4. Tabela `sale_items`

Armazena os itens de cada venda (produtos vendidos).

**Campos:**
- `id` (UUID, PK) - ID único do item
- `sale_id` (UUID, FK) - ID da venda (referência a `sales.id`)
- `product_id` (UUID, FK) - ID do produto (referência a `products.id`)
- `product_name` (TEXT) - Nome do produto no momento da venda (snapshot)
- `quantity` (INTEGER) - Quantidade vendida
- `unit_price` (DECIMAL) - Preço unitário no momento da venda
- `subtotal` (DECIMAL) - Subtotal do item (quantity × unit_price)
- `created_at` (TIMESTAMP) - Data de criação

**Relacionamentos:**
- `sale_id` → `sales.id` (N:1)
- `product_id` → `products.id` (N:1)

### Diagrama de Relacionamentos

```
auth.users (Supabase)
    │
    │ 1:1
    ▼
profiles
    │
    │ 1:N
    ▼
sales ──── 1:N ──── sale_items ──── N:1 ──── products
```

---

## 🔄 Fluxo de Funcionamento

### Fluxo de Venda de um Produto

#### 1. **Acesso ao Sistema**
```
Usuário acessa /login
  ↓
AuthProvider verifica sessão existente
  ↓
Se autenticado → redireciona para /
Se não autenticado → exibe formulário de login
```

#### 2. **PDV - Frente de Caixa** (`/pdv`)

**2.1. Busca de Produtos**
```
Usuário digita no campo de busca
  ↓
searchProducts(query) é chamado
  ↓
Query no Supabase: products WHERE (name ILIKE query OR code ILIKE query) AND active = true
  ↓
Produtos são exibidos em grid
```

**2.2. Adicionar ao Carrinho**
```
Usuário clica em um produto
  ↓
Sistema verifica:
  - Produto tem estoque disponível?
  - Produto já está no carrinho?
  ↓
Se sim → incrementa quantidade
Se não → adiciona novo item ao carrinho
  ↓
Carrinho lateral é atualizado
```

**2.3. Gerenciamento do Carrinho**
```
Usuário pode:
  - Aumentar quantidade (+)
  - Diminuir quantidade (-)
  - Remover item (🗑️)
  ↓
Subtotal é recalculado automaticamente
```

**2.4. Finalização da Venda**
```
Usuário clica em "Finalizar Venda"
  ↓
Modal de checkout é exibido
  ↓
Usuário seleciona forma de pagamento:
  - Dinheiro (cash)
  - Cartão (card)
  - PIX (pix)
  ↓
Usuário confirma a venda
  ↓
createSale() é executado:
  1. Cria registro em sales
  2. Cria registros em sale_items
  3. Atualiza estoque dos produtos (decrementa stock)
  ↓
Venda é finalizada com sucesso
  ↓
Carrinho é limpo
  ↓
Lista de produtos é recarregada (estoque atualizado)
```

### Fluxo de Gestão de Estoque (`/estoque`)

**1. Listagem de Produtos**
```
Página carrega
  ↓
getProducts() busca todos os produtos
  ↓
Produtos são exibidos em tabela
```

**2. Criar Produto**
```
Usuário clica em "Novo Produto"
  ↓
Modal de formulário é exibido
  ↓
Usuário preenche:
  - Código
  - Nome
  - Descrição (opcional)
  - Preço
  - Estoque inicial
  - Estoque mínimo
  - Categoria (opcional)
  ↓
createProduct() é chamado
  ↓
Produto é criado no Supabase
  ↓
Lista é atualizada
```

**3. Editar Produto**
```
Usuário clica em "Editar" em um produto
  ↓
Modal é preenchido com dados atuais
  ↓
Usuário modifica campos
  ↓
updateProduct() é chamado
  ↓
Produto é atualizado no Supabase
  ↓
Lista é atualizada
```

**4. Excluir Produto**
```
Usuário clica em "Excluir"
  ↓
Confirmação é solicitada
  ↓
deleteProduct() é chamado
  ↓
Produto é deletado (ou marcado como inactive)
  ↓
Lista é atualizada
```

### Fluxo de Histórico de Vendas (`/vendas`)

**1. Listagem de Vendas**
```
Página carrega
  ↓
getSales(100) busca últimas 100 vendas
  ↓
Vendas são ordenadas por data (mais recente primeiro)
  ↓
Estatísticas são calculadas:
  - Total de vendas
  - Receita total
```

**2. Visualizar Detalhes**
```
Usuário clica em uma venda
  ↓
getSaleById(id) busca venda com itens
  ↓
Modal exibe:
  - Informações da venda
  - Lista de itens vendidos
  - Forma de pagamento
  - Data e hora
```

### Fluxo de Dashboard (`/`)

**1. Carregamento de Estatísticas**
```
Página carrega
  ↓
getSales() busca vendas do dia
  ↓
getProducts() busca todos os produtos
  ↓
Estatísticas são calculadas:
  - Total de vendas do dia
  - Faturamento total
  - Total de produtos cadastrados
  - Produtos com estoque baixo (< min_stock)
  ↓
Cards informativos são exibidos
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 18.x ou superior
- **npm** ou **yarn**
- Conta no **Supabase** (gratuita)
- Editor de código (VS Code recomendado)

### Passo 1: Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd EloTech-pdv
```

### Passo 2: Instalar Dependências

```bash
npm install
```

### Passo 3: Configurar Supabase

**3.1. Criar Projeto no Supabase**

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta ou faça login
3. Clique em "New Project"
4. Preencha:
   - Nome do projeto
   - Senha do banco de dados
   - Região (escolha a mais próxima)
5. Aguarde a criação do projeto (2-3 minutos)

**3.2. Obter Credenciais**

1. No painel do Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave pública)

**3.3. Criar Tabelas no Banco de Dados**

Execute os seguintes SQL no **SQL Editor** do Supabase:

```sql
-- Tabela profiles (vinculada ao auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'gerente', 'vendedor')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock INTEGER NOT NULL DEFAULT 5 CHECK (min_stock >= 0),
  category TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE,
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'pix')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela sale_items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**3.4. Configurar Row Level Security (RLS)**

Execute no SQL Editor:

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para products (todos podem ver produtos ativos)
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (active = true);

-- Políticas para sales (usuários veem apenas suas vendas)
CREATE POLICY "Users can view own sales" ON sales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sales" ON sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para sale_items (usuários veem itens de suas vendas)
CREATE POLICY "Users can view items of own sales" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create items for own sales" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );
```

**3.5. Criar Trigger para Profile Automático**

Execute no SQL Editor:

```sql
-- Função para criar profile automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'vendedor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função após inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Passo 4: Configurar Variáveis de Ambiente

**4.1. Criar arquivo `.env.local`**

Na raiz do projeto, crie o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

**Substitua:**
- `https://seu-projeto.supabase.co` pela URL do seu projeto Supabase
- `sua-chave-anon-publica` pela chave anon/public do Supabase

### Passo 5: Executar o Projeto

```bash
# Modo desenvolvimento
npm run dev

# O servidor estará disponível em:
# http://localhost:3000
```

### Passo 6: Criar Primeiro Usuário

1. Acesse `http://localhost:3000/register`
2. Preencha o formulário de registro
3. O usuário será criado automaticamente no Supabase
4. O profile será criado automaticamente via trigger
5. Faça login com as credenciais criadas

### Passo 7: Criar Produtos de Teste

1. Após fazer login, acesse `/estoque`
2. Clique em "Novo Produto"
3. Preencha os dados e salve
4. Repita para criar alguns produtos de teste

---

## 🔐 Arquitetura de Autenticação

### Componentes Principais

**1. AuthProvider (`contexts/AuthContext.tsx`)**
- Fonte única de verdade para autenticação
- Gerencia estado de `user`, `session`, `profile`
- Controla `authLoading` (apenas durante bootstrap)
- Expose métodos: `signIn`, `signUp`, `signOut`

**2. AuthGate (`components/auth/AuthGate.tsx`)**
- Proteção global de rotas
- Redireciona rotas protegidas sem user → `/login`
- Redireciona rotas públicas com user → `/`
- Previne loops de redirecionamento

**3. Cliente Supabase Singleton (`lib/supabase/client.ts`)**
- Instância única do cliente Supabase
- Reutilizado em toda a aplicação
- Nunca recriado durante renders

### Fluxo de Autenticação

```
App Inicia
  ↓
AuthProvider monta
  ↓
getSession() restaura sessão existente
  ↓
onAuthStateChange() escuta mudanças
  ↓
authLoading = false (sempre finaliza)
  ↓
AuthGate verifica:
  - Se authLoading === false
  - Se user existe
  - Se rota é pública/protegida
  ↓
Redireciona se necessário
  ↓
App renderiza normalmente
```

### Rotas Públicas

- `/login` - Página de login
- `/register` - Página de registro

### Rotas Protegidas

- `/` - Dashboard
- `/pdv` - Frente de caixa
- `/estoque` - Gestão de estoque
- `/vendas` - Histórico de vendas

---

## 📁 Estrutura de Pastas

```
EloTech-pdv/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout raiz (AuthProvider + AuthGate)
│   ├── globals.css              # Estilos globais
│   ├── (auth)/                  # Grupo de rotas públicas
│   │   ├── layout.tsx           # Layout para páginas de auth
│   │   ├── login/
│   │   │   └── page.tsx         # Página de login
│   │   └── register/
│   │       └── page.tsx         # Página de registro
│   └── (dashboard)/             # Grupo de rotas protegidas
│       ├── layout.tsx           # Layout do dashboard (Sidebar)
│       ├── page.tsx             # Dashboard principal
│       ├── pdv/
│       │   └── page.tsx         # Página PDV
│       ├── estoque/
│       │   └── page.tsx         # Página de estoque
│       └── vendas/
│           └── page.tsx         # Página de vendas
│
├── components/                   # Componentes React
│   ├── auth/
│   │   └── AuthGate.tsx        # Guard de rotas
│   ├── providers/
│   │   └── AuthProviderWrapper.tsx
│   ├── sidebar.tsx              # Barra lateral de navegação
│   └── ui/                      # Componentes Shadcn/UI
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── table.tsx
│
├── contexts/
│   └── AuthContext.tsx          # Context de autenticação
│
├── hooks/
│   └── useAuth.ts               # Hook para usar AuthContext
│
├── lib/
│   ├── supabase/
│   │   ├── browser.ts           # Cliente Supabase para browser
│   │   ├── server.ts            # Cliente Supabase para server
│   │   └── client.ts            # Cliente singleton
│   ├── supabase-store.ts        # Funções de acesso ao banco
│   └── utils.ts                 # Funções utilitárias
│
├── types/
│   └── database.ts              # Tipos TypeScript do banco
│
├── .env.local                   # Variáveis de ambiente (não versionado)
├── next.config.js               # Configuração do Next.js
├── package.json                 # Dependências do projeto
├── tailwind.config.ts           # Configuração do Tailwind
└── tsconfig.json                # Configuração do TypeScript
```

---

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (http://localhost:3000)

# Produção
npm run build        # Cria build de produção
npm start            # Inicia servidor de produção

# Qualidade
npm run lint         # Executa ESLint
```

---

## 📝 Notas Importantes

### Segurança

- **Row Level Security (RLS)** está habilitado em todas as tabelas
- Usuários só podem ver/modificar seus próprios dados
- Produtos ativos são visíveis para todos os usuários autenticados
- Vendas são vinculadas ao `user_id` do usuário logado

### Performance

- Cliente Supabase é singleton (não recriado)
- Queries são otimizadas com índices
- Componentes são memoizados quando necessário

### Escalabilidade

- Arquitetura preparada para crescimento
- Separação clara de responsabilidades
- Código modular e reutilizável

---

## 🐛 Troubleshooting

### Problema: "Supabase não está configurado"

**Solução:**
1. Verifique se o arquivo `.env.local` existe na raiz
2. Confirme que as variáveis estão corretas
3. Reinicie o servidor após criar/modificar `.env.local`

### Problema: "Erro ao carregar produtos"

**Solução:**
1. Verifique se as tabelas foram criadas no Supabase
2. Confirme que RLS está configurado corretamente
3. Verifique se há produtos cadastrados no banco

### Problema: "Erro de autenticação"

**Solução:**
1. Verifique se o trigger `handle_new_user` foi criado
2. Confirme que a tabela `profiles` existe
3. Verifique os logs do Supabase para erros

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Supabase
3. Consulte a documentação do Next.js e Supabase

---

**Última atualização:** 2024
**Versão:** 0.1.0






