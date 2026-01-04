# SNAPSHOT TÉCNICO - EloTech-PDV
**Data da Análise:** 2025-01-01  
**Objetivo:** Auditoria Arquitetural - Estado Atual do Sistema

---

## 1. ESTRUTURA DE ROTAS (App Router)

### Rotas relacionadas a `/caixa`

#### 1.1 Rota Principal: `/caixa`
- **Arquivo:** `apps/web/app/(dashboard)/caixa/page.tsx`
- **URL Acessível:** `http://[domain]/caixa`
- **Status:** ✅ Rota ativa e acessível
- **Características:**
  - Client Component (`'use client'`)
  - Renderização dinâmica forçada (`export const dynamic = 'force-dynamic'`)
  - Renderização condicional baseada em estado do caixa (aberto/fechado)

#### 1.2 Rota de Histórico: `/caixa/historico`
- **Arquivo:** `apps/web/app/(dashboard)/caixa/historico/page.tsx`
- **URL Acessível:** `http://[domain]/caixa/historico`
- **Status:** ✅ Rota ativa e acessível
- **Características:**
  - Client Component (`'use client'`)
  - Exibe relatório diário de fechamentos de caixa
  - Usa RPC: `get_daily_cash_report`

#### 1.3 Resumo de Rotas
```
/caixa                 → apps/web/app/(dashboard)/caixa/page.tsx
/caixa/historico       → apps/web/app/(dashboard)/caixa/historico/page.tsx
```

---

## 2. LAYOUTS ENVOLVIDOS

### 2.1 Root Layout (`app/layout.tsx`)
```typescript
// Estrutura Mínima
- Aplica Providers (ErrorBoundary, AuthSession, Profile, Permission)
- Sem guards ou redirects
- Apenas wrappers de contexto
```

**Conteúdo:**
- Importa `globals.css`
- Renderiza `<Providers>{children}</Providers>`
- Estrutura HTML básica (`<html lang="pt-BR">`)

**Impacto no Render:**
- Não interrompe renderização
- Apenas fornece contexto React

---

### 2.2 Dashboard Layout (`app/(dashboard)/layout.tsx`)
```typescript
export default function DashboardLayout({ children }) {
  return <>{children}</>;
}
```

**Características:**
- Layout vazio (apenas fragment)
- Sem guards ou condições
- Não aplica `DashboardWrapper` (isso é feito individualmente nas páginas)

**Impacto no Render:**
- Nenhum bloqueio ou interrupção
- Layout transparente

---

### 2.3 Componente DashboardWrapper
- **Localização:** `apps/web/components/dashboard/DashboardWrapper.tsx`
- **Uso:** Apenas na página principal `/` (dashboard)
- **Status na rota `/caixa`:** ❌ NÃO USADO
  - A página `/caixa` renderiza SEM sidebar ou layout wrapper
  - Renderização direta e sem estrutura de dashboard

---

## 3. MIDDLEWARE (`apps/web/middleware.ts`)

### 3.1 Configuração do Matcher
```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
]
```
- Intercepta todas as rotas exceto arquivos estáticos

### 3.2 Lógica de Autenticação

**Rotas Públicas:**
- `/login`
- `/register`
- `/forgot-password`

**Comportamento:**

1. **Usuário NÃO autenticado + Rota protegida:**
   - ✅ REDIRECT para `/login?redirect=[pathname]`

2. **Usuário autenticado + Rota pública:**
   - ✅ REDIRECT para `/` (dashboard)

3. **Usuário autenticado + Rota protegida:**
   - ✅ Permite acesso (retorna `NextResponse.next()`)

### 3.3 Impacto na Rota `/caixa`
- Rota protegida (não está em `publicRoutes`)
- Requer autenticação via Supabase Session
- Se não autenticado: redirect para `/login?redirect=/caixa`
- Se autenticado: permite acesso

---

## 4. PÁGINA ATUAL DO CAIXA

### 4.1 Arquivo Ativo
**`apps/web/app/(dashboard)/caixa/page.tsx`** (217 linhas)

### 4.2 Características Técnicas

#### 4.2.1 Diretivas Next.js
```typescript
'use client'
export const dynamic = 'force-dynamic'
```
- Client Component obrigatório (usa hooks React)
- Renderização dinâmica forçada (evita cache estático)

#### 4.2.2 Estados do Componente
```typescript
const [loading, setLoading] = useState(true)
const [status, setStatus] = useState<CashStatus | null>(null)  // ⚠️ Inicial: null
```

**Estados Adicionais:**
- `initialAmount`, `finalCash`, `finalPix`, `finalCard`
- `sangriaAmount`, `sangriaNotes`
- `totals` (CashTotals)

#### 4.2.3 Query Supabase
```typescript
const { data: openCash, error } = await supabase
  .from('cash_registers')
  .select('id, status, opened_at, closed_at')
  .is('closed_at', null)  // ⚠️ Detecta caixa aberto via closed_at IS NULL
  .order('opened_at', { ascending: false })
  .limit(1)
```

**Lógica de Detecção:**
- Caixa ABERTO: `closed_at IS NULL`
- Caixa FECHADO: `closed_at IS NOT NULL` (ou nenhum registro retornado)

#### 4.2.4 Fluxo de Renderização Condicional

**1. Loading State:**
```typescript
if (loading || status === null) {
  return <p style={{ padding: 32 }}>Carregando caixa...</p>
}
```
- Renderiza enquanto: `loading === true` OU `status === null`
- Evita renderizar estado "fechado" antes de verificar banco

**2. Caixa Fechado:**
```typescript
if (status === 'closed') {
  return (
    // Formulário de abertura
    // Input: valor inicial
    // Botão: "Abrir Caixa" → RPC: open_cash_register
  )
}
```

**3. Caixa Aberto:**
```typescript
// Renderiza formulário de fechamento
// - Totais esperados
// - Valores contados (cash, pix, card)
// - Sangria
// - Botões: "Registrar Sangria" e "Fechar Caixa"
```

---

## 5. FLUXO DE RENDERIZAÇÃO COMPLETO

### 5.1 Navegação para `/caixa`

```
1. USUÁRIO NAVEGA PARA /caixa
   ↓
2. MIDDLEWARE INTERCEPTA
   ├─ Verifica session Supabase
   ├─ Se NÃO autenticado → REDIRECT /login?redirect=/caixa
   └─ Se autenticado → CONTINUA
   ↓
3. NEXT.JS APP ROUTER
   ├─ app/layout.tsx (Root)
   │  └─ Providers (ErrorBoundary, AuthSession, Profile, Permission)
   │     ↓
   ├─ app/(dashboard)/layout.tsx
   │  └─ Fragment vazio (transparente)
   │     ↓
   └─ app/(dashboard)/caixa/page.tsx
      └─ Componente CaixaPage (Client Component)
   ↓
4. RENDERIZAÇÃO INICIAL
   ├─ status = null
   ├─ loading = true
   └─ Render: "Carregando caixa..."
   ↓
5. useEffect EXECUTA (após mount)
   ├─ Query Supabase: cash_registers WHERE closed_at IS NULL
   ├─ Se encontrou registro:
   │  ├─ setStatus('open')
   │  ├─ RPC: get_open_cash_totals
   │  └─ setTotals(data)
   │  └─ setLoading(false)
   └─ Se NÃO encontrou:
      ├─ setStatus('closed')
      └─ setLoading(false)
   ↓
6. RE-RENDER BASEADO NO STATUS
   ├─ Se status === null OU loading === true
   │  └─ Render: "Carregando caixa..."
   ├─ Se status === 'closed'
   │  └─ Render: Formulário de Abertura
   └─ Se status === 'open'
      └─ Render: Formulário de Fechamento
```

### 5.2 Pontos de Interrupção Potenciais

#### ⚠️ 1. Middleware (Autenticação)
- **Risco:** Redirect para `/login` se não autenticado
- **Impacto:** Renderização interrompida antes de chegar ao componente

#### ⚠️ 2. Loading State
- **Duração:** Até query Supabase completar
- **Render:** "Carregando caixa..." (estado visual mínimo)
- **Não interrompe:** Apenas exibe estado de loading

#### ⚠️ 3. Erro na Query
- **Comportamento:** `console.error(error)` + `setLoading(false)`
- **Status:** Permanece `null` (nunca muda para 'open' ou 'closed')
- **Render:** Fica em "Carregando caixa..." indefinidamente
- **⚠️ BUG POTENCIAL:** Não há tratamento de erro visual

#### ⚠️ 4. Cache Estático (Resolvido)
- **Antes:** Página poderia ser cacheada estáticamente
- **Agora:** `export const dynamic = 'force-dynamic'` força renderização dinâmica
- **Status:** ✅ Resolvido

---

## 6. ANÁLISE COMPARATIVA

### 6.1 Diferença: Dashboard vs Caixa

| Aspecto | `/` (Dashboard) | `/caixa` |
|---------|----------------|----------|
| Layout Wrapper | ✅ Usa `DashboardWrapper` | ❌ Render direto |
| Sidebar | ✅ Presente | ❌ Ausente |
| Estrutura Visual | ✅ Layout completo | ❌ Apenas conteúdo |
| Auth Guard | ✅ Middleware apenas | ✅ Middleware apenas |

### 6.2 Estado Atual vs Estado Esperado

**Estado Atual (Confirmado):**
- ✅ Página `/caixa` renderiza sem DashboardWrapper
- ✅ Sem sidebar ou estrutura visual de dashboard
- ✅ Renderização dinâmica forçada (`force-dynamic`)
- ✅ Estado inicial `null` previne "ghost state"
- ✅ Query usa `closed_at IS NULL` para detectar caixa aberto

**Observações Arquiteturais:**
- Página de Caixa tem comportamento visual diferente das outras páginas do dashboard
- Ausência de wrapper pode indicar decisão arquitetural (ou omissão)
- Consistência visual pode ser afetada (sem sidebar/navegação)

---

## 7. DEPENDÊNCIAS E INTEGRAÇÕES

### 7.1 Supabase RPC Functions Usadas
- `get_open_cash_totals` - Retorna totais esperados do caixa aberto
- `open_cash_register` - Abre novo caixa
- `register_cash_sangria` - Registra sangria
- `close_cash_register` - Fecha caixa
- `get_daily_cash_report` - Relatório histórico (rota `/caixa/historico`)

### 7.2 Tabelas Supabase
- `cash_registers` - Tabela principal (detecta via `closed_at IS NULL`)
- Possível: `cash_movements` (RLS corrigido em migrations/008)

### 7.3 Contextos React
- `AuthSessionProvider` - Sessão de autenticação
- `ProfileProvider` - Dados do perfil
- `PermissionProvider` - Permissões/Roles
- `ErrorBoundary` - Captura erros React

---

## 8. CONCLUSÕES TÉCNICAS

### 8.1 Estado Atual Confirmado
✅ A página `/caixa` está funcionando com:
- Renderização dinâmica
- Detecção correta de estado (via `closed_at`)
- Estado inicial `null` prevenindo ghost state
- Middleware protegendo rota

### 8.2 Pontos de Atenção

1. **Tratamento de Erro:**
   - Query Supabase com erro resulta em estado "Carregando" indefinido
   - Sem feedback visual para usuário

2. **Inconsistência Visual:**
   - Página `/caixa` não usa `DashboardWrapper`
   - Outras páginas do dashboard usam wrapper + sidebar
   - Pode ser decisão arquitetural ou omissão

3. **Window.location.reload:**
   - Após ações (abrir/fechar caixa), usa `window.location.reload()`
   - Não usa Next.js router navigation
   - Pode causar perda de estado React

### 8.3 Verificações Finais

- ✅ Código fornecido pelo usuário está ativo no arquivo
- ✅ Rotas mapeadas corretamente
- ✅ Middleware funcionando
- ✅ Layouts identificados
- ✅ Fluxo de renderização documentado

---

**Documento gerado para auditoria arquitetural externa.**  
**Sem alterações aplicadas - Apenas análise descritiva do estado atual.**







