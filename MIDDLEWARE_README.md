# 🔐 Middleware de Autenticação - Documentação

## 📋 O que foi implementado

### 1. `middleware.ts` (Raiz do projeto)
Middleware do Next.js que:
- ✅ Verifica autenticação em todas as rotas
- ✅ Redireciona usuários não autenticados para `/login`
- ✅ Redireciona usuários autenticados de `/login` e `/register` para `/`
- ✅ Preserva URL original ao redirecionar (query param `redirectedFrom`)

### 2. `lib/supabase-server.ts`
Cliente Supabase para uso em Server Components e Middleware:
- ✅ Usa cookies do Next.js
- ✅ Compatível com Server Components
- ✅ Suporta operações no servidor

### 3. `components/auth/ProtectedRoute.tsx`
Componente para proteger rotas baseado em roles:
- ✅ Verifica autenticação
- ✅ Valida roles/permissões
- ✅ Mostra loading state
- ✅ Redireciona automaticamente

### 4. `hooks/useAuth.ts`
Hook re-exportado para facilitar imports:
- ✅ Facilita uso: `import { useAuth } from '@/hooks/useAuth'`

---

## 🔄 Como funciona

### Fluxo de Autenticação:

1. **Usuário acessa rota protegida** (`/`, `/pdv`, etc)
   - Middleware verifica sessão
   - Se não autenticado → Redireciona para `/login?redirectedFrom=/rota`

2. **Usuário faz login**
   - LoginForm autentica via Supabase
   - AuthProvider atualiza estado
   - Redireciona para `/` (ou rota original)

3. **Usuário autenticado tenta acessar `/login`**
   - Middleware detecta autenticação
   - Redireciona para `/`

---

## 🛡️ Rotas Protegidas vs Públicas

### Rotas Públicas (não requerem auth):
- `/login`
- `/register`
- `/forgot-password`

### Rotas Protegidas (requerem auth):
- `/` (dashboard)
- `/pdv`
- `/estoque`
- `/vendas`
- Todas as outras rotas

---

## 🎯 Uso do ProtectedRoute

### Exemplo 1: Apenas autenticados
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MinhaPage() {
  return (
    <ProtectedRoute>
      <div>Conteúdo protegido</div>
    </ProtectedRoute>
  )
}
```

### Exemplo 2: Apenas admins
```tsx
<ProtectedRoute allowedRoles={['admin']}>
  <div>Conteúdo apenas para admin</div>
</ProtectedRoute>
```

### Exemplo 3: Admin ou Gerente
```tsx
<ProtectedRoute allowedRoles={['admin', 'gerente']}>
  <div>Conteúdo para admin ou gerente</div>
</ProtectedRoute>
```

---

## ⚙️ Configuração do Middleware

O middleware está configurado para rodar em todas as rotas exceto:
- `_next/static` (arquivos estáticos)
- `_next/image` (otimização de imagens)
- `favicon.ico`
- Arquivos de imagem (`.svg`, `.png`, `.jpg`, etc)

Isso é configurado no `config.matcher` do middleware.

---

## 🔍 Debugging

Se o middleware não estiver funcionando:

1. **Verificar variáveis de ambiente**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Verificar console do navegador**:
   - Erros de autenticação aparecem no console

3. **Verificar Network tab**:
   - Requests para `/login` quando redirecionado
   - Status 307 (Redirect) esperado

---

## 📝 Notas Importantes

1. **Cookies**: O middleware usa cookies para gerenciar sessão
2. **Server vs Client**: Middleware roda no servidor (Edge Runtime)
3. **Performance**: O middleware é executado antes de renderizar a página
4. **Redirects**: Usa 307 (Temporary Redirect) para preservar método HTTP

---

**Status**: ✅ Implementado e pronto para uso

