'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { saleStore, productStore } from '@/lib/store'
import { DashboardStats } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { DashboardWrapper } from '@/components/dashboard/DashboardWrapper'

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  })

  useEffect(() => {
    async function loadStats() {
      try {
        // Atualizar cache antes de calcular stats
        const { refreshStores } = await import('@/lib/store')
        await refreshStores()

        const todaySales = saleStore.getToday()
        const allProducts = productStore.getAll()

        const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
        const lowStockProducts = allProducts.filter(p => p.stock < 10).length

        setStats({
          totalSales: todaySales.length,
          totalRevenue,
          totalProducts: allProducts.length,
          lowStockProducts,
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }

    loadStats()
  }, [])

  const statCards = [
    {
      title: 'Vendas Hoje',
      value: stats.totalSales,
      icon: TrendingUp,
      description: 'Total de vendas realizadas',
      color: 'text-blue-600',
    },
    {
      title: 'Faturamento',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: 'Receita total do dia',
      color: 'text-green-600',
    },
    {
      title: 'Produtos',
      value: stats.totalProducts,
      icon: Package,
      description: 'Total cadastrado',
      color: 'text-purple-600',
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      description: 'Produtos com estoque < 10',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumo das operações do dia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao EloTech PDV</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Sistema completo de ponto de venda para gerenciar suas vendas,
              estoque e relatórios de forma eficiente e profissional.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardWrapper>
      <DashboardContent />
    </DashboardWrapper>
  )
}


