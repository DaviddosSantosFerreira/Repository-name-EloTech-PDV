'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getProducts, searchProducts, createSale } from '@/lib/supabase-store'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import type { SaleStatus } from '@/types/database'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Interface para produtos do Supabase
interface Product {
  id: string
  code: string
  name: string
  description?: string | null
  price: number
  stock: number
  min_stock: number
  category?: string | null
  active: boolean
}

interface CartItem {
  product: Product
  quantity: number
}

export default function PDVPage() {
  const { user } = useAuth() // Obter usuário logado
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery)
    } else {
      loadProducts()
    }
  }, [searchQuery])

  async function loadProducts() {
    setLoading(true)
    try {
      console.log('🔄 Carregando produtos do PDV (apenas ativos)...')
      
      // Primeiro, tentar buscar apenas produtos ativos
      let { data, error } = await getProducts(true) // Apenas produtos ativos
      
      // Se não encontrar produtos ativos, tentar buscar todos os produtos
      if (!error && (!data || data.length === 0)) {
        console.warn('⚠️ Nenhum produto ativo encontrado. Buscando todos os produtos...')
        const allProductsResult = await getProducts(false) // Todos os produtos
        if (!allProductsResult.error && allProductsResult.data) {
          data = allProductsResult.data
          console.log(`✅ Encontrados ${data.length} produtos (alguns podem estar inativos)`)
        }
      }
      
      if (error) {
        console.error('❌ Erro ao carregar produtos:', error)
        console.error('Detalhes:', error.message)
        setProducts([])
      } else if (data && Array.isArray(data)) {
        console.log(`✅ Produtos carregados no PDV: ${data.length}`)
        if (data.length === 0) {
          console.warn('⚠️ Nenhum produto encontrado no banco de dados')
        } else {
          console.log('📦 Primeiros produtos:', data.slice(0, 3))
        }
        setProducts(data)
      } else {
        console.warn('⚠️ Dados inválidos retornados:', data)
        setProducts([])
      }
    } catch (err) {
      console.error('❌ Erro inesperado ao carregar produtos:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) {
      loadProducts()
      return
    }

    setLoading(true)
    try {
      const { data, error } = await searchProducts(query)
      
      if (error) {
        console.error('Erro ao buscar produtos:', error)
        // Em caso de erro, mostrar todos os produtos
        loadProducts()
      } else if (data) {
        setProducts(data)
      } else {
        setProducts([])
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar produtos:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      alert('Produto sem estoque!')
      return
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          alert('Quantidade insuficiente em estoque!')
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null
            if (newQuantity > item.product.stock) {
              alert('Quantidade insuficiente em estoque!')
              return item
            }
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Carrinho vazio!')
      return
    }
    setShowCheckout(true)
  }

  const confirmCheckout = async () => {
    if (!paymentMethod) {
      alert('Selecione uma forma de pagamento!')
      return
    }

    try {
      // Verificar se há usuário logado
      if (!user) {
        alert('Erro: Usuário não autenticado. Faça login novamente.')
        return
      }

      // Gerar número da venda (timestamp)
      const saleNumber = `V${Date.now()}`
      
      // Preparar dados da venda (incluindo user_id)
      const saleData = {
        sale_number: saleNumber,
        total: subtotal,
        payment_method: paymentMethod,
        status: 'completed' as SaleStatus,
        user_id: user.id, // IMPORTANTE: Incluir user_id do usuário logado
      }

      // Preparar itens da venda (sale_id será adicionado pela função createSale)
      const saleItems = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
        sale_id: '', // Será preenchido pela função createSale
      } as any))

      // Salvar no Supabase
      const { data, error } = await createSale(saleData, saleItems)

      if (error) {
        console.error('Erro ao criar venda:', error)
        alert('Erro ao finalizar venda. Verifique o console.')
        return
      }

      alert(`Venda #${saleNumber} realizada com sucesso!`)
      setCart([])
      setShowCheckout(false)
      setPaymentMethod(null)
      loadProducts() // Recarregar produtos para atualizar estoque
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      alert('Erro ao finalizar venda. Verifique o console.')
    }
  }

  return (
    <div className="flex h-full">
      {/* Área Principal - Lista de Produtos */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">PDV - Frente de Caixa</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome ou código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(product)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Estoque: {product.stock}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Código: {product.code}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum produto encontrado
          </div>
        ) : null}
      </div>

      {/* Carrinho Lateral */}
      <div className="w-96 border-l bg-card">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Carrinho</h2>

          <div className="space-y-3 mb-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Carrinho vazio
              </p>
            ) : (
              cart.map((item) => (
                <Card key={item.product.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.price)} x {item.quantity}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-bold">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
              >
                Finalizar Venda
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialog de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
            <DialogDescription>
              Selecione a forma de pagamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                Total: {formatCurrency(subtotal)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="h-20 flex-col"
              >
                <Banknote className="h-6 w-6 mb-2" />
                Dinheiro
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="h-20 flex-col"
              >
                <CreditCard className="h-6 w-6 mb-2" />
                Cartão
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmCheckout} disabled={!paymentMethod}>
              Confirmar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


