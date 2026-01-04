# Arquitetura de Autenticação - EloTech PDV

## Estrutura de Pastas

```
lib/
  supabase/
    browser.ts      # Cliente para Client Components
    server.ts       # Cliente para Server Components

contexts/
  AuthContext.tsx   # Fonte única de verdade para autenticação

components/
  auth/
    AuthGate.tsx    # Guard global de rotas

app/
  layout.tsx        # Layout raiz com AuthProvider + AuthGate
  (auth)/
    layout.tsx      # Layout para páginas públicas
    login/
      page.tsx      # Página de login (simples)
    register/
      page.tsx      # Página de registro (simples)
  (dashboard)/
    layout.tsx      # Layout para páginas protegidas
```

## Fluxo de Autenticação

### 1. Inicialização (App Start)

```
RootLayout
  └─ AuthProvider
      └─ AuthGate
          └─ children
```

**AuthProvider:**
- Cria cliente Supabase (browser)
- Chama `getSession()` para restaurar sessão
- Configura `onAuthStateChange` listener
- Define `authLoading = false` após inicialização

**AuthGate:**
- Aguarda `authLoading === false`
- Verifica rota atual (pública/protegida)
- Redireciona se necessário:
  - Rota protegida sem user → `/login`
  - Rota pública com user → `/`

### 2. Login

```
User clica "Entrar"
  └─ LoginPage.handleSubmit()
      └─ AuthContext.signIn()
          └─ supabase.auth.signInWithPassword()
              └─ onAuthStateChange dispara
                  └─ AuthContext.updateAuthState()
                      └─ AuthGate detecta user
                          └─ Redireciona para /
```

### 3. Logout

```
User clica "Sair"
  └─ AuthContext.signOut()
      └─ supabase.auth.signOut()
          └─ onAuthStateChange dispara
              └─ AuthContext.updateAuthState(null)
                  └─ AuthGate detecta !user
                      └─ Redireciona para /login
```

## Garantias Implementadas

### ✅ Sem Loops de Redirecionamento
- `AuthGate` usa `useRef` para rastrear redirecionamentos
- Flag resetada apenas ao mudar de rota
- `router.replace` usado (não `push`)

### ✅ Loading Sempre Finaliza
- `authLoading` sempre definido como `false` em `finally`
- Nenhum timeout artificial
- Nenhum fallback que aborta loading

### ✅ Login Não Dispara Automaticamente
- Botão só entra em loading após submit real
- `actionLoading` separado de `authLoading`
- Nenhum `useEffect` que dispara login

### ✅ Sessão Restaurada Corretamente
- `getSession()` chamado uma única vez na inicialização
- `INITIAL_SESSION` ignorado no listener
- Estado sincronizado via `onAuthStateChange`

## Componentes Principais

### AuthProvider (`contexts/AuthContext.tsx`)

**Responsabilidades:**
- Gerenciar estado de autenticação (user, session, profile)
- Expor `authLoading` (apenas inicial)
- Expor `actionLoading` (para ações)
- Fornecer métodos: `signIn`, `signUp`, `signOut`

**Estados:**
- `user: User | null`
- `session: Session | null`
- `profile: Profile | null`
- `authLoading: boolean` (true apenas durante bootstrap)
- `actionLoading: boolean` (true durante ações)

### AuthGate (`components/auth/AuthGate.tsx`)

**Responsabilidades:**
- Mostrar loading durante verificação inicial
- Redirecionar rotas protegidas sem user
- Redirecionar rotas públicas com user
- Prevenir loops de redirecionamento

**Rotas Públicas:**
- `/login`
- `/register`

**Todas as outras rotas são protegidas**

### Clientes Supabase

**Browser** (`lib/supabase/browser.ts`):
- Usado em Client Components
- Acessa `process.env.NEXT_PUBLIC_*`
- Valida variáveis de ambiente

**Server** (`lib/supabase/server.ts`):
- Usado em Server Components
- Gerencia cookies via `next/headers`
- Async (usa `await cookies()`)

## Regras de Uso

### ✅ FAZER

1. Usar `useAuth()` para acessar estado de autenticação
2. Usar `AuthGate` no layout raiz (já implementado)
3. Usar `createBrowserClient()` em Client Components
4. Usar `createServerClient()` em Server Components
5. Deixar `AuthGate` gerenciar redirecionamentos

### ❌ NÃO FAZER

1. Criar lógica de auth duplicada em páginas
2. Usar `router.push` para redirecionamentos de auth
3. Acessar `process.env` diretamente fora de `lib/supabase/*`
4. Modificar `authLoading` manualmente
5. Criar timeouts ou fallbacks defensivos

## Testes de Validação

### ✅ Recarregar com Sessão Ativa
- Não deve mostrar "Carregando..." infinito
- Deve redirecionar para `/` automaticamente
- `authLoading` deve finalizar corretamente

### ✅ Acessar Rota Protegida Sem Auth
- Deve redirecionar para `/login`
- Não deve entrar em loop
- Deve mostrar formulário de login

### ✅ Login Bem-Sucedido
- Deve redirecionar para `/`
- Não deve disparar automaticamente
- Botão deve mostrar loading apenas após submit

### ✅ Logout
- Deve limpar estado
- Deve redirecionar para `/login`
- Não deve manter sessão

## Manutenção

### Adicionar Nova Rota Pública

Editar `components/auth/AuthGate.tsx`:
```typescript
const PUBLIC_ROUTES = ['/login', '/register', '/nova-rota'];
```

### Modificar Comportamento de Redirecionamento

Editar `components/auth/AuthGate.tsx` - lógica de redirecionamento está centralizada.

### Adicionar Novo Campo ao Profile

1. Atualizar tipo `Profile` em `types/database.ts`
2. `AuthContext` carrega automaticamente via `loadProfile()`













