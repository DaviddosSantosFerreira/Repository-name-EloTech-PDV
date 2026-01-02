'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  LogOut,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { useProfile } from '@/contexts/ProfileContext'
import { getRepositories } from '@/lib/repositories'

/* ===========================
   NAVEGAÇÃO LATERAL
   =========================== */
const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'PDV',
    href: '/pdv',
    icon: ShoppingCart,
  },
  {
    name: 'Caixa',
    href: '/caixa',
    icon: Wallet,
  },
  {
    name: 'Histórico Caixa',
    href: '/caixa/historico',
    icon: History,
  },
  {
    name: 'Estoque',
    href: '/estoque',
    icon: Package,
  },
  {
    name: 'Vendas',
    href: '/vendas',
    icon: History,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const { user } = useAuthSession()
  const { profile } = useProfile()

  console.log('[SIDEBAR] navigation:', navigation.map(i => i.href))

  const handleSignOut = async () => {
    try {
      const repositories = getRepositories()
      await repositories.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      alert('Erro ao fazer logout. Tente novamente.')
    }
  }

  /* ===========================
     NÃO RENDERIZA SEM USUÁRIO
     =========================== */
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">EloTech PDV</h1>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-1 p-4 flex flex-col">
        <div className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary font-semibold'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Usuário / Logout */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {profile?.full_name?.charAt(0).toUpperCase() ||
                user.email?.charAt(0).toUpperCase() ||
                'U'}
            </div>

            {/* Dados */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sair do sistema"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          © 2024 EloTech PDV
        </p>
      </div>
    </div>
  )
}
