'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/supabase-store'

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

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    min_stock: '5',
    category: '',
  })

  // Carregar produtos ao montar o componente
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const { data, error } = await getProducts()
      
      if (error) {
        console.error('Erro ao carregar produtos:', error)
        // Se houver erro, definir produtos como array vazio
        setProducts([])
        // Não mostrar alert para não ser invasivo, apenas log
      } else if (data) {
        setProducts(data)
      } else {
        // Se não houver data nem error, definir como array vazio
        setProducts([])
      }
    } catch (err) {
      console.error('Erro inesperado ao carregar produtos:', err)
      setProducts([])
    } finally {
      // Garantir que o loading sempre seja finalizado
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      min_stock: product.min_stock.toString(),
      category: product.category || '',
    })
    setIsDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    const { error } = await deleteProduct(id)
    
    if (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Verifique o console.')
    } else {
      alert('Produto excluído com sucesso!')
      loadProducts()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const productData = {
      code: formData.code,
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      min_stock: parseInt(formData.min_stock),
      category: formData.category || null,
      active: true, // Garantir que produtos sejam criados como ativos
    }

    if (editingProduct) {
      // Atualizar produto existente
      const { error } = await updateProduct(editingProduct.id, productData)
      
      if (error) {
        console.error('Erro ao atualizar produto:', error)
        alert('Erro ao atualizar produto. Verifique o console.')
      } else {
        alert('Produto atualizado com sucesso!')
        loadProducts()
        handleCloseDialog()
      }
    } else {
      // Criar novo produto
      const { error } = await createProduct(productData)
      
      if (error) {
        console.error('Erro ao criar produto:', error)
        alert('Erro ao criar produto. Verifique o console.')
      } else {
        alert('Produto criado com sucesso!')
        loadProducts()
        handleCloseDialog()
      }
    }
  }

  function handleCloseDialog() {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      price: '',
      stock: '',
      min_stock: '5',
      category: '',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Estoque</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)}>
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Preço *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="min_stock">Estoque Mínimo</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="text-gray-400" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div>
                  <div className="text-lg">{product.name}</div>
                  <div className="text-sm text-gray-500 font-normal">
                    Código: {product.code}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {product.description}
                </p>
              )}
              {product.category && (
                <p className="text-sm text-gray-500 mb-2">
                  Categoria: {product.category}
                </p>
              )}
              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {product.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-semibold ${
                      product.stock <= product.min_stock
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {product.stock} un.
                  </p>
                  {product.stock <= product.min_stock && (
                    <p className="text-xs text-red-500">Estoque baixo!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Nenhum produto encontrado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}