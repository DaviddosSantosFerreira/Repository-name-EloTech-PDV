# AI Context - EloTech PDV

> 📚 **Documentação Técnica Completa:** Para análise detalhada da arquitetura, mapeamento de rotas, análise de riscos e recomendações, veja [DOCUMENTACAO_TECNICA.md](./DOCUMENTACAO_TECNICA.md)  
> 🔍 **Auditoria Arquitetural:** Para análise crítica de inconsistências, decisões arriscadas, acoplamento excessivo e melhorias de alto impacto, veja [AUDITORIA_ARQUITETURAL.md](./AUDITORIA_ARQUITETURAL.md)  
> 🤖 **Governança de IAs:** Para protocolos de uso de múltiplas IAs, veja [apps/web/app/(dashboard)/caixa/docs/Governance_IA.md](./apps/web/app/(dashboard)/caixa/docs/Governance_IA.md)

## 📋 Índice

1. [Estrutura Real do Projeto](#estrutura-real-do-projeto)
2. [Configuração de Ambiente](#configuração-de-ambiente)
3. [Arquitetura de Autenticação](#arquitetura-de-autenticação)
4. [Módulo /caixa - Estado Atual e Decisões](#módulo-caixa---estado-atual-e-decisões)
5. [Correções Críticas Implementadas](#correções-críticas-implementadas)
6. [Estrutura de Providers](#estrutura-de-providers)
7. [Repository Pattern](#repository-pattern)
8. [Estrutura de Layouts](#estrutura-de-layouts)
9. [Componentes UI](#componentes-ui)
10. [Hooks e Compatibilidade](#hooks-e-compatibilidade)
11. [Store e Cache](#store-e-cache)
12. [Configuração do Projeto](#configuração-do-projeto)
13. [Governança de IAs](#governança-de-ias)
14. [Próximos Passos Imediatos](#próximos-passos-imediatos)

---

## 🏗️ Estrutura Real do Projeto

### ⚠️ IMPORTANTE: Monorepo com Next.js em `/apps/web`

**O projeto está estruturado como monorepo. O Next.js roda APENAS em `/apps/web`.**

### Estrutura Confirmada (Verificada por Inspeção)

```
EloTech-pdv/                          ← Raiz do repositório
 └─ apps/
    └─ web/                           ← APENAS AQUI roda o Next.js
       ├─ package.json                ← package.json válido
       ├─ middleware.ts               ← middleware do Next.js
       ├─ .env.local                  ← Variáveis de ambiente (deve estar AQUI)
       ├─ next.config.js
       ├─ tsconfig.json
       ├─ app/                        ← App Router do Next.js
       │  ├─ layout.tsx
       │  ├─ (dashboard)/
       │  │  ├─ layout.tsx
       │  │  ├─ page.tsx
       │  │  └─ caixa/
       │  │     ├─ page.tsx          ← Server Component
       │  │     ├─ CaixaClient.tsx   ← Client Component
       │  │     ├─ components/
       │  │     │  ├─ AberturaDeCaixa.tsx
       │  │     │  └─ FechamentoDeCaixa.tsx
       │  │     └─ historico/
       │  │        └─ page.tsx
       │  └─ (auth)/
       │     ├─ login/
       │     └─ register/
       ├─ components/
       ├─ contexts/
       ├─ hooks/
       ├─ lib/
       │  ├─ repositories/
       │  └─ supabase/
       │     ├─ browser.ts
       │     ├─ server.ts
       │     └─ middleware.ts
       └─ types/
```

### Comandos Corretos para Desenvolvimento

```bash
# ✅ CORRETO: Executar de dentro de apps/web
cd apps/web
npm run dev

# ❌ ERRADO: Executar da raiz do projeto
npm run dev  # Isso falhará - package.json não existe na raiz
```

### Erros Comuns Resolvidos

**Erro: "Cannot find module" ou "Your project's URL and Key are required"**
- **Causa:** Executar `npm run dev` fora do diretório `/apps/web`
- **Solução:** Sempre executar de dentro de `apps/web`
- **Verificação:** `package.json` existe APENAS em `apps/web/package.json`

**Erro: Variáveis de ambiente não carregadas**
- **Causa:** `.env.local` não está no mesmo nível de `package.json`
- **Solução:** `.env.local` deve estar em `apps/web/.env.local`
- **Next.js carrega `.env.local` apenas do diretório raiz do projeto (onde está package.json)**

---

## 🔐 Configuração de Ambiente (Supabase)

### Variáveis Obrigatórias

**Arquivo:** `apps/web/.env.local` (deve estar no mesmo nível do `package.json`)

```env
# URLs e Chaves Públicas (Client/Browser)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Service Role Key (APENAS Server-Side)
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### Diferença Crítica: Anon Key vs Service Role Key

**NEXT_PUBLIC_SUPABASE_ANON_KEY (Client/Browser):**
- ✅ Pode ser exposta no cliente (usa `NEXT_PUBLIC_`)
- ✅ Respeita RLS (Row Level Security)
- ✅ Usado em: Client Components, hooks, browser
- ✅ Seguro para uso público (RLS protege os dados)

**SUPABASE_SERVICE_ROLE_KEY (Server Only):**
- ❌ **NUNCA expor no cliente** (não usar `NEXT_PUBLIC_`)
- ❌ Bypassa RLS (acesso completo ao banco)
- ✅ Usado apenas em: Server Components, Server Actions, API Routes
- ⚠️ Se exposta, permite acesso total ao banco (risco crítico de segurança)

### Erro Crítico Resolvido

**Sintoma:**
```
Error: Variáveis de ambiente do Supabase não configuradas. 
Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Causa:**
- `.env.local` não estava no diretório correto (`apps/web/.env.local`)
- Next.js só carrega `.env.local` do diretório raiz do projeto (onde está `package.json`)

**Solução:**
- Mover `.env.local` para `apps/web/.env.local`
- Garantir que está no mesmo nível de `package.json`

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

## 💰 Módulo /caixa - Estado Atual e Decisões

### Estado Atual (Data: 2025-01-02)

**Tabelas Envolvidas:**
- `cash_registers` - Registros de abertura/fechamento de caixa
- `cash_movements` - Movimentações financeiras do caixa (sangrias, etc.)

**Funções RPC Existentes:**
- `open_cash_register(p_initial_amount NUMERIC)` - Abre um novo caixa
- `close_cash_register(p_final_cash NUMERIC, p_final_pix NUMERIC, p_final_card NUMERIC)` - Fecha o caixa

**RLS (Row Level Security):**
- ✅ RLS ativas e corrigidas para `cash_registers`
- ✅ Policies baseadas em `opened_by = auth.uid()`
- ✅ Usuários só acessam seus próprios caixas

### Erros Enfrentados e Resolvidos

#### 1. Overload de Funções RPC
**Problema:** Conflito de assinaturas em funções RPC do Supabase
**Solução:** Remover funções antigas antes de criar novas (DROP FUNCTION IF EXISTS)

#### 2. Tipagem `never` no Supabase Client
**Problema:** TypeScript inferia tipo `never` para tabelas não tipadas
**Causa:** Tabela `cash_registers` não estava no tipo `Database`
**Solução:** Adicionar tabela ao tipo `Database` ou usar casts apropriados

#### 3. UI Não Atualizava Após Abertura do Caixa
**Problema:** Client Component com `useEffect` + `router.refresh()` não sincronizava estado
**Tentativas Frustradas:**
- ❌ `router.refresh()` após mutação
- ❌ `window.location.reload()` (solução temporária, não ideal)
- ❌ Estado gerenciado no client

**Conclusão Técnica:**
> **Client Components + useEffect + router.refresh NÃO resolvem sincronização crítica de estado server-side.**

### Decisão Arquitetural Final (Validada pela Manus AI)

**Data da Decisão:** 2025-01-02  
**Validado por:** Manus AI (Auditor Arquitetural)

**Problema:**
Estado "Caixa Aberto/Fechado" é crítico e deve estar sincronizado com o banco. Client Components não garantem sincronização confiável.

**Solução Aprovada:**
✅ **Server Component como fonte de verdade**  
✅ **Server Actions para mutações**  
✅ **Revalidação obrigatória com `revalidatePath()`**

**Arquitetura Implementada:**

```typescript
// apps/web/app/(dashboard)/caixa/page.tsx (Server Component)
export default async function CaixaPage() {
  const supabase = await getServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // ✅ Fonte de verdade no SERVER
  let status: 'open' | 'closed' = 'closed'
  
  if (user) {
    const { data } = await supabase
      .from('cash_registers')
      .select('id')
      .is('closed_at', null)
      .eq('opened_by', user.id)
      .limit(1)
    
    status = data && data.length > 0 ? 'open' : 'closed'
  }
  
  // ✅ Passa estado inicial para Client Component
  return <CaixaClient initialStatus={status} />
}
```

```typescript
// apps/web/app/(dashboard)/caixa/CaixaClient.tsx (Client Component)
'use client'

export function CaixaClient({ initialStatus }: { initialStatus: 'open' | 'closed' }) {
  // ✅ Apenas UI e interações
  // ✅ Estado crítico vem do server
  return <div>...</div>
}
```

**Próxima Etapa (Em Andamento):**
- Criar Server Actions:
  - `abrirCaixaAction`
  - `fecharCaixaAction`
- Usar `revalidatePath('/caixa')` após mutações
- Remover toda lógica de estado crítico do client

### Estrutura Atual do Módulo /caixa

```
apps/web/app/(dashboard)/caixa/
├── page.tsx                    ← Server Component (fonte de verdade)
├── CaixaClient.tsx             ← Client Component (UI apenas)
└── components/
    ├── AberturaDeCaixa.tsx     ← Componente de abertura (legado, será substituído)
    └── FechamentoDeCaixa.tsx   ← Componente de fechamento (legado, será substituído)
```

**Nota:** Componentes em `components/` são legados da tentativa anterior com Client Components puros. Serão migrados para usar Server Actions.

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

### 7. Erro de Estrutura do Projeto (Monorepo)

**Problema:**
- Executar `npm run dev` da raiz do projeto
- `package.json` não existe na raiz
- Variáveis de ambiente não carregadas

**Solução:**
- Documentar que projeto é monorepo
- Next.js roda APENAS em `apps/web`
- `.env.local` deve estar em `apps/web/.env.local`

---

## 🎯 Estrutura de Providers

### app/providers.tsx

```typescript
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthSessionProvider } from '@/contexts/AuthSessionContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { PermissionProvider } from '@/contexts/PermissionContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthSessionProvider>
        <ProfileProvider>
          <PermissionProvider>
            {children}
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
- `ErrorBoundary` global (captura erros em toda a aplicação)
- **Nota:** `AuthGate` removido (estava causando problemas)

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

**Localização:** `apps/web/package.json`

**Dependências Principais:**
- `next: 14.0.4`
- `react: ^18.2.0`
- `@supabase/ssr: ^0.8.0`
- `@supabase/supabase-js: ^2.89.0`
- `tailwindcss: ^3.4.0`
- `typescript: ^5.3.3`
- `node: 24.x` (engines)

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

**Localização:** `apps/web/middleware.ts`

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

## 🤖 Governança de IAs

**Documento Completo:** [apps/web/app/(dashboard)/caixa/docs/Governance_IA.md](./apps/web/app/(dashboard)/caixa/docs/Governance_IA.md)

### Papéis Definidos

**ChatGPT — Orquestrador Técnico & Representante Técnica**
- Responsabilidades:
  - Traduz ideias em tarefas técnicas estruturadas
  - Orquestra uso de outras IAs
  - Arquitetura de sistemas e planejamento
  - Revisão lógica de código
  - Validação de resultados
- **Regra de Ouro:** Nenhuma IA é acionada sem orientação explícita do ChatGPT

**Manus AI — Auditor Arquitetural**
- Responsabilidades:
  - Auditoria arquitetural
  - Root Cause Analysis
  - Validação de decisões técnicas
- **Última Atuação:** Validação da decisão de usar Server Components + Server Actions para módulo /caixa

**Claude — Arquiteto Sênior**
- Responsabilidades:
  - Parecer arquitetural com caminhos recomendados (A/B/C)
  - Identificação de riscos e trade-offs
  - Código do zero quando solicitado
  - Refatoração com qualidade

**Cursor — Executor Técnico**
- Responsabilidades:
  - Execução de código (um passo por vez)
  - Criar arquivos e pastas conforme especificado
  - Correções diretas no projeto
  - Entrega de diffs e evidências
- **Filosofia:** "Cursor executa, não pensa"

**Perplexity — Pesquisador e Validador Externo**
- Responsabilidades:
  - Pesquisa de versões e breaking changes
  - Validação de documentação oficial
  - Verificação de issues conhecidas

### Fluxo Operacional

**Ciclo Padrão:**
```
Diagnóstico (ChatGPT) 
  → Arquitetura (Claude/Manus) 
  → Decisão (Você) 
  → Plano (GenSpark) 
  → Execução (Cursor) 
  → Validação (ChatGPT)
```

---

## 📝 Regras de Uso

### ✅ FAZER

1. Executar `npm run dev` APENAS de dentro de `apps/web`
2. Colocar `.env.local` APENAS em `apps/web/.env.local`
3. Usar `useAuth()` para acessar estado de autenticação
4. Usar `DashboardWrapper` nas páginas do dashboard
5. Usar `getRepositories()` para acessar repositórios
6. Atualizar cache do store manualmente quando necessário
7. Manter layouts como Server Components quando possível
8. Usar Server Components como fonte de verdade para estado crítico
9. Usar Server Actions para mutações que precisam de revalidação

### ❌ NÃO FAZER

1. Executar `npm run dev` da raiz do projeto
2. Colocar `.env.local` fora de `apps/web/`
3. Importar contextos diretamente em Server Components
4. Usar `'use client'` em layouts desnecessariamente
5. Criar repositórios fora da factory
6. Usar `setInterval` no store (já removido)
7. Duplicar lógica de autenticação
8. Tentar sincronizar estado crítico apenas no client (use Server Components + Server Actions)
9. Usar `window.location.reload()` como solução permanente (usar `revalidatePath()`)

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

### ✅ Estrutura do Projeto
- Next.js deve rodar apenas em `apps/web`
- `.env.local` deve estar em `apps/web/.env.local`
- Variáveis de ambiente devem ser carregadas corretamente

---

## 📌 Próximos Passos Imediatos

### 1. Finalizar Implementação do Módulo /caixa

**Status:** Em andamento (Server Component criado, Server Actions pendentes)

**Tarefas:**
1. ✅ Criar Server Component (`page.tsx`) como fonte de verdade
2. ✅ Criar Client Component (`CaixaClient.tsx`) para UI
3. ⏳ Criar Server Actions:
   - `abrirCaixaAction` - Abre caixa e revalida
   - `fecharCaixaAction` - Fecha caixa e revalida
4. ⏳ Implementar `revalidatePath('/caixa')` após mutações
5. ⏳ Remover componentes legados (`AberturaDeCaixa.tsx`, `FechamentoDeCaixa.tsx`)
6. ⏳ Testar fluxo completo: Abrir → UI atualiza → Fechar → UI retorna

**Critério de Sucesso:**
- UI alterna corretamente entre "Abrir Caixa" e "Fechar Caixa"
- Sem necessidade de `window.location.reload()`
- Estado sempre sincronizado com o banco

### 2. Correções Backend (Supabase)

**Status:** Pendente

**Tarefas:**
1. ⏳ Executar migration `010_fix_cash_register_close_function.sql`
2. ⏳ Validar função `close_cash_register` funcionando corretamente
3. ⏳ Testar RLS policies de `cash_registers`
4. ⏳ Verificar se `cash_movements` precisa de correções de RLS

### 3. Migrações Pendentes (Médio Prazo)

1. **Store → React Query**
   - Migrar `lib/store.ts` para React Query
   - Melhor gerenciamento de cache
   - Invalidação automática

2. **Componentes Dashboard**
   - Atualizar todas as páginas para usar `DashboardWrapper` consistentemente
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
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [shadcn/ui](https://ui.shadcn.com/)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Última atualização:** 2025-01-02  
**Versão:** 2.0.0  
**Status:** ✅ Ativo e Operacional
