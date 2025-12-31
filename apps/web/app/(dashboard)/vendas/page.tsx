'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getSales } from '@/lib/supabase-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Receipt, CreditCard, Banknote } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Interface para vendas do Supabase
interface SaleItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface Sale {
  id: string
  sale_number: string
  total: number
  payment_method: string
  status: string
  created_at: string
  sale_items?: SaleItem[]
}

export default function VendasPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  useEffect(() => {
    loadSales()
  }, [])

  async function loadSales() {
    try {
      setLoading(true)
      const { data, error } = await getSales(100)
      
      if (error) {
        console.error('Erro ao carregar vendas:', error)
        setSales([])
      } else if (data) {
        const sortedSales = (data || []).map((sale: any) => ({
          ...sale,
          sale_items: sale.sale_items || [],
        })).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setSales(sortedSales as Sale[])
      } else {
        setSales([])
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    if (!searchQuery.trim()) return sales

    const query = searchQuery.toLowerCase()
    return sales.filter((sale) => {
      const saleItems = sale.sale_items || []
      return (
        sale.id?.toLowerCase().includes(query) ||
        sale.sale_number?.toLowerCase().includes(query) ||
        saleItems.some((item) =>
          item.product_name?.toLowerCase().includes(query)
        )
      )
    })
  }, [sales, searchQuery])

  const totalRevenue = useMemo(() => {
    if (!sales || sales.length === 0) return 0
    return sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  }, [sales])

  const totalSales = useMemo(() => {
    return sales?.length || 0
  }, [sales])

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Histórico de Vendas</h1>
          <p className="text-muted-foreground">
            Visualize todas as vendas realizadas
          </p>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Carregando vendas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Histórico de Vendas</h1>
        <p className="text-muted-foreground">
          Visualize todas as vendas realizadas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalRevenue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID da venda ou nome do produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhuma venda encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Forma de Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const saleItems = sale.sale_items || []
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-sm">
                        {sale.sale_number || sale.id}
                      </TableCell>
                      <TableCell>
                        {sale.created_at ? formatDate(new Date(sale.created_at)) : '-'}
                      </TableCell>
                      <TableCell>
                        {saleItems.length} item(s)
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sale.payment_method === 'cash' ? (
                            <>
                              <Banknote className="h-4 w-4" />
                              <span>Dinheiro</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4" />
                              <span>Cartão</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(sale.total || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="text-primary hover:underline text-sm"
                        >
                          Ver Detalhes
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda {selectedSale?.sale_number || selectedSale?.id}</DialogTitle>
            <DialogDescription>
              {selectedSale?.created_at ? formatDate(new Date(selectedSale.created_at)) : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Itens da Venda</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedSale.sale_items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name || '-'}</TableCell>
                        <TableCell>{item.quantity || 0}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.subtotal || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium">
                    {selectedSale.payment_method === 'cash' ? 'Dinheiro' : 'Cartão'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedSale.total || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
