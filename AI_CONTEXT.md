# AI Context - EloTech PDV

> 📚 **Documentação Técnica Completa:** Para análise detalhada da arquitetura, mapeamento de rotas, análise de riscos e recomendações, veja [DOCUMENTACAO_TECNICA.md](./DOCUMENTACAO_TECNICA.md)  
> 🔍 **Auditoria Arquitetural:** Para análise crítica de inconsistências, decisões arriscadas, acoplamento excessivo e melhorias de alto impacto, veja [AUDITORIA_ARQUITETURAL.md](./AUDITORIA_ARQUITETURAL.md)

## 📋 Índice

1. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
2. [Correções Críticas Implementadas](#correções-críticas-implementadas)
3. [Estrutura de Providers](#estrutura-de-providers)
4. [Repository Pattern](#repository-pattern)
5. [Estrutura de Layouts](#estrutura-de-layouts)
6. [Componentes UI](#componentes-ui)
7. [Hooks e Compatibilidade](#hooks-e-compatibilidade)
8. [Store e Cache](#store-e-cache)
9. [Configuração do Projeto](#configuração-do-projeto)

---

## 🏗️ Arquitetura de Autenticação

### Contextos Hierárquicos

```
AuthSessionProvider (base)
  └── ProfileProvider (depende de AuthSessionProvider)
      └── PermissionProvider (depende de ProfileProvider)
```

### Fluxo de Autenticação

#### 1. Inicialização
```
RootLayout (Server Component)
  └── Providers (Client Component)
      └── AuthSessionProvider
          ├── Restaura sessão via getSession()
          ├── Configura onAuthStateChange listener
          └── Atualiza estado via updateSession (idempotente)
```

#### 2. Login
```
User → signIn() → Supabase Auth → onAuthStateChange → updateSession → AUTH_SUCCESS (único)
```

#### 3. Logout
```
User → signOut() → Supabase Auth → onAuthStateChange → updateSession(null) → AUTH_LOGOUT
```

### AuthSessionContext

**Arquivo:** `contexts/AuthSessionContext.tsx`

**Responsabilidades:**
- Gerenciar estado de sessão (session, user, sessionLoading)
- Escutar mudanças de autenticação via `onAuthStateChange`
- Expor `updateSession` para atualização manual
- Garantir que `AUTH_SUCCESS` ocorre apenas uma vez por login

**Estados:**
- `idle` → `loading` → `authenticated` / `unauthenticated` / `error`
- `INIT_COMPLETE` sempre finaliza: se `authenticated` mantém, senão vai para `unauthenticated`

**Correções Críticas Implementadas:**

1. **Inicialização Garantida:**
   - `INIT_COMPLETE` sempre despachado no `finally` do `initialize()`
   - Nunca fica preso em `loading`
   - Não depende do listener para finalizar

2. **updateSession Idempotente:**
   - Verifica se já está autenticado com o mesmo usuário antes de despachar `AUTH_SUCCESS`
   - Usa `stateRef` para evitar closures stale
   - Atualiza `currentUserIdRef` síncronamente antes do dispatch

---

## 🔧 Correções Críticas Implementadas

### 1. Inicialização Garantida (Correção Pericial)

**Problema:**
- `initialize()` não garantia `INIT_COMPLETE`
- Podia ficar preso em estado `loading`
- Dependia do listener para finalizar

**Solução:**
```typescript
const initialize = async () => {
  dispatch({ type: 'SESSION_LOADING' });

  try {
    const { getRepositories } = await import('@/lib/repositories');
    const repositories = getRepositories();
    const session = await repositories.auth.getSession();

    if (session?.user) {
      dispatch({ type: 'AUTH_SUCCESS', user: session.user, session });
    } else {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  } catch (error) {
    dispatch({ type: 'AUTH_ERROR', error: ... });
  } finally {
    // 🔥 GARANTIA ABSOLUTA
    dispatch({ type: 'INIT_COMPLETE' });
  }
};
```

**Reducer:**
```typescript
case 'INIT_COMPLETE':
  return state.type === 'authenticated'
    ? state
    : { type: 'unauthenticated' };
```

**Garantias:**
- ✅ Nunca fica em `loading`
- ✅ Nunca trava
- ✅ Sempre finaliza a inicialização
- ✅ Não depende do listener

### 2. AUTH_SUCCESS Duplicado

**Problema:**
- `updateSession` chamado manualmente após `signIn`
- `onAuthStateChange` dispara `SIGNED_IN` logo em seguida
- Resultado: `AUTH_SUCCESS` disparado duas vezes

**Solução:**
```typescript
// Verificação idempotente em updateSession
const isSameUser = 
  (currentState.type === 'authenticated' && currentState.user.id === newSession.user.id) ||
  (currentUserIdRef.current === newSession.user.id);

if (isSameUser) {
  logger.debug('updateSession ignorado (mesmo usuário)');
  return; // Não despacha AUTH_SUCCESS novamente
}
```

**Arquitetura:**
- `stateRef` para ler state atual sem causar re-criação de função
- `currentUserIdRef` atualizado síncronamente antes do dispatch
- Função `updateSession` estável (não recria a cada render)

### 3. SupabaseAuthRepository Not a Constructor

**Problema:**
- `createRepositories` tentava usar `new SupabaseAuthRepository()`
- Mas `SupabaseAuthRepository` não era uma classe

**Solução:**
- Refatorado para **factory function**:
```typescript
export function createSupabaseAuthRepository(
  supabase: SupabaseClient<Database>
): AuthRepository {
  return {
    async getSession() { ... },
    async signIn() { ... },
    // ...
  };
}
```

### 4. Provider Ausente no App Router

**Problema:**
- `useAuthSession` usado no `Sidebar`
- Mas `AuthSessionProvider` não envolvia o layout do dashboard
- No App Router, providers não são herdados automaticamente

**Solução:**
- Providers movidos para `app/providers.tsx` (global)
- `DashboardWrapper` criado para lógica client do dashboard
- Layouts mantidos como Server Components

### 5. Loading Infinito no AuthGate

**Problema:**
- `AuthGate` envolvendo todas as rotas (públicas e protegidas)
- Causava `sessionLoading` infinito em rotas públicas

**Solução:**
- `AuthGate` removido do layout raiz
- `AuthGate` apenas no `DashboardWrapper` (rotas protegidas)
- Providers globais, `AuthGate` apenas onde necessário

### 6. ChunkLoadError app/layout

**Problema:**
- Client Components importados diretamente em `app/layout.tsx` (Server Component)
- Quebrava bundle do App Router

**Solução:**
- `app/layout.tsx` = Server Component puro
- `app/providers.tsx` = Client Component isolado
- Separação clara entre Server e Client Components

---

## 🎯 Estrutura de Providers

### app/providers.tsx

```typescript
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthSessionProvider } from '@/contexts/AuthSessionContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { PermissionProvider } from '@/contexts/PermissionContext';
import { AuthGate } from '@/components/auth/AuthGate';

export default function Providers({ children }: { children: React.ReactNode }) {
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

**Características:**
- Client Component (`'use client'`)
- Export default (não named export)
- Hierarquia completa de providers
- `AuthGate` global (gerencia loading para todas as rotas)
- `ErrorBoundary` global (captura erros em toda a aplicação)

### ProfileProvider

**Arquivo:** `contexts/ProfileContext.tsx`

**Responsabilidades:**
- Carregar profile do usuário autenticado
- Depende de `AuthSessionContext` (precisa de `user.id`)
- Expor `useProfile()` hook

### PermissionProvider

**Arquivo:** `contexts/PermissionContext.tsx`

**Responsabilidades:**
- Calcular permissões baseado no `profile.role`
- Depende de `ProfileContext`
- Expor `usePermission()` hook

### DashboardWrapper

**Arquivo:** `components/dashboard/DashboardWrapper.tsx`

**Responsabilidades:**
- Envolver páginas do dashboard com layout (Sidebar + main)
- Providers já estão no `app/providers.tsx` global
- Apenas estrutura visual do dashboard

**Uso:**
```typescript
export default function Dashboard() {
  return (
    <DashboardWrapper>
      <DashboardContent />
    </DashboardWrapper>
  );
}
```

**Estrutura:**
```typescript
<div className="flex h-screen overflow-hidden">
  <Sidebar />
  <main className="flex-1 overflow-y-auto bg-background">
    {children}
  </main>
</div>
```

---

## 📦 Repository Pattern

### Estrutura

```
lib/repositories/
├── AuthRepository.ts (interface)
├── SupabaseAuthRepository.ts (factory function)
├── ProfileRepository.ts (interface)
├── SupabaseProfileRepository.ts (classe)
├── ProductRepository.ts (interface)
├── SupabaseProductRepository.ts (classe)
├── SaleRepository.ts (interface)
├── SupabaseSaleRepository.ts (classe)
└── index.ts (factory)
```

### Factory de Repositórios

**Arquivo:** `lib/repositories/index.ts`

```typescript
export function createRepositories(): Repositories {
  const supabase = getBrowserClient();
  const baseProductRepo = new SupabaseProductRepository(supabase);

  return {
    auth: createSupabaseAuthRepository(supabase), // Factory function
    profile: new SupabaseProfileRepository(supabase), // Classe
    product: new CachedProductRepository(baseProductRepo), // Com cache
    sale: new SupabaseSaleRepository(supabase), // Classe
  };
}
```

**Singleton:**
```typescript
export function getRepositories(): Repositories {
  if (!repositoriesInstance) {
    repositoriesInstance = createRepositories();
  }
  return repositoriesInstance;
}
```

### SupabaseAuthRepository

**Implementação:** Factory function (não classe)

```typescript
export function createSupabaseAuthRepository(
  supabase: SupabaseClient<Database>
): AuthRepository {
  return {
    async getSession(): Promise<Session | null> { ... },
    async signIn(email: string, password: string): Promise<User> { ... },
    async signUp(...): Promise<User> { ... },
    async signOut(): Promise<void> { ... },
    onAuthStateChange(callback): () => void { ... },
  };
}
```

---

## 📐 Estrutura de Layouts

### app/layout.tsx (Server Component)

```typescript
import './globals.css';
import Providers from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
- Server Component puro (sem `'use client'`)
- Import default (não named import)
- Estrutura mínima e limpa
- Toda lógica client isolada no `Providers`

### app/(dashboard)/layout.tsx (Server Component)

```typescript
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Características:**
- Server Component puro
- Sem lógica client
- Apenas passa `children` adiante
- Lógica client fica no `DashboardWrapper`

### app/(auth)/layout.tsx

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
```

---

## 🎨 Componentes UI

### Componentes Criados

Todos os componentes seguem o padrão **shadcn/ui**:

1. **Card** (`components/ui/card.tsx`)
   - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

2. **Button** (`components/ui/button.tsx`)
   - Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
   - Tamanhos: `default`, `sm`, `lg`, `icon`

3. **Input** (`components/ui/input.tsx`)
   - Input estilizado com foco e estados

4. **Label** (`components/ui/label.tsx`)
   - Label usando Radix UI

5. **Table** (`components/ui/table.tsx`)
   - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

6. **Dialog** (`components/ui/dialog.tsx`)
   - Dialog completo com overlay e animações

### Utilitários

**Arquivo:** `lib/utils.ts`

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}
```

---

## 🪝 Hooks e Compatibilidade

### useAuth (Hook de Compatibilidade)

**Arquivo:** `hooks/useAuth.ts`

**Responsabilidades:**
- Wrapper sobre `AuthSessionContext` para manter compatibilidade
- Integra `useProfile` para carregar profile
- Expor interface compatível com código legado

**Interface:**
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

### useProfile

**Arquivo:** `hooks/useProfile.ts`

**Responsabilidades:**
- Carregar profile do usuário de forma assíncrona
- Gerenciar estados de loading e error
- Cancelar requisições se componente desmontar

### useAuthSession

**Arquivo:** `contexts/AuthSessionContext.tsx`

**Responsabilidades:**
- Acesso direto ao contexto de sessão
- Retorna: `session`, `user`, `sessionLoading`, `updateSession`

---

## 💾 Store e Cache

### lib/store.ts

**Status:** ⚠️ LEGADO (será migrado para React Query)

**Características:**
- Wrapper síncrono sobre repositórios assíncronos
- Cache local com TTL de 30 segundos
- **NÃO** cria repositórios automaticamente
- **NÃO** executa `setInterval` no client
- Cache deve ser atualizado manualmente pelos componentes

**Uso:**
```typescript
// Atualizar cache antes de usar
const { refreshStores } = await import('@/lib/store');
await refreshStores();

// Usar store síncrono
const products = productStore.getAll();
const todaySales = saleStore.getToday();
```

**API:**
```typescript
export const productStore = {
  getAll(): Product[];
  async refresh(): Promise<void>;
  getById(id: string): Product | undefined;
  getByCode(code: string): Product | undefined;
};

export const saleStore = {
  getAll(): Sale[];
  async refresh(): Promise<void>;
  getToday(): Sale[];
  getById(id: string): Sale | undefined;
};
```

---

## ⚙️ Configuração do Projeto

### package.json

**Dependências Principais:**
- `next: 14.0.4`
- `react: ^18.2.0`
- `@supabase/ssr: ^0.8.0`
- `@supabase/supabase-js: ^2.89.0`
- `tailwindcss: ^3.4.0`
- `typescript: ^5.3.3`

**Componentes UI:**
- `@radix-ui/*` (Dialog, Dropdown, Label, Select, etc.)
- `lucide-react` (ícones)
- `class-variance-authority` (variantes)
- `clsx` e `tailwind-merge` (utilitários)

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "moduleResolution": "bundler",
    "jsx": "preserve"
  }
}
```

### tailwind.config.js

- Configurado com variáveis CSS para temas
- Suporte a dark mode
- Animações configuradas

### postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 🔐 Segurança e Middleware

### middleware.ts

**Responsabilidades:**
- Verificar sessão em todas as requisições
- Redirecionar rotas protegidas sem autenticação
- Redirecionar rotas públicas com autenticação

**Rotas Públicas:**
- `/login`
- `/register`
- `/forgot-password`

**Todas as outras rotas são protegidas**

---

## 📝 Regras de Uso

### ✅ FAZER

1. Usar `useAuth()` para acessar estado de autenticação
2. Usar `DashboardWrapper` nas páginas do dashboard
3. Usar `getRepositories()` para acessar repositórios
4. Atualizar cache do store manualmente quando necessário
5. Manter layouts como Server Components quando possível

### ❌ NÃO FAZER

1. Importar contextos diretamente em Server Components
2. Usar `'use client'` em layouts desnecessariamente
3. Criar repositórios fora da factory
4. Usar `setInterval` no store (já removido)
5. Duplicar lógica de autenticação

---

## 🧪 Testes de Validação

### ✅ Login
- Deve redirecionar para `/` após login bem-sucedido
- `AUTH_SUCCESS` deve ocorrer apenas uma vez
- Profile deve ser carregado automaticamente

### ✅ Logout
- Deve limpar estado
- Deve redirecionar para `/login`
- Não deve manter sessão

### ✅ Recarregar com Sessão Ativa
- Não deve mostrar "Carregando..." infinito
- Deve restaurar sessão automaticamente
- `sessionLoading` deve finalizar corretamente

### ✅ Acessar Rota Protegida Sem Auth
- Middleware deve redirecionar para `/login`
- Não deve entrar em loop
- Deve mostrar formulário de login

---

## 🚀 Próximos Passos

### Migrações Pendentes

1. **Store → React Query**
   - Migrar `lib/store.ts` para React Query
   - Melhor gerenciamento de cache
   - Invalidação automática

2. **Componentes Dashboard**
   - Atualizar todas as páginas para usar `DashboardWrapper`
   - `/pdv`, `/estoque`, `/vendas`

3. **Metadata**
   - Adicionar metadata dinâmica por página
   - SEO otimizado

4. **Error Handling**
   - Integrar Sentry ou similar
   - Error boundaries mais granulares

---

## 📚 Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [shadcn/ui](https://ui.shadcn.com/)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Última atualização:** 2024-12-30
**Versão:** 1.0.0
