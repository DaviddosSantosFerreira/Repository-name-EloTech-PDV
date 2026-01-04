'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/lib/supabase/server'

export async function abrirCaixa(openingAmount: number) {
  if (openingAmount <= 0) {
    console.error('Valor inicial inválido:', openingAmount)
    return { ok: false, error: 'Valor inicial deve ser maior que zero' }
  }

  const supabase = await getServerClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    console.error('Usuário não autenticado ao abrir caixa')
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  // Inserir novo caixa
  const { data, error } = await supabase
    .from('cash_registers')
    .insert({
      opened_at: new Date().toISOString(),
      opened_by: auth.user.id,
      opening_amount: openingAmount,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao abrir caixa:', error)
    
    if (error.code === '23505') {
      return { 
        ok: false, 
        error: 'Já existe um caixa aberto no sistema. Feche-o antes de abrir um novo.' 
      }
    }
    
    return { ok: false, error: error.message || 'Erro ao abrir caixa' }
  }

  revalidatePath('/caixa')
  return { ok: true, data }
}

export async function fecharCaixa() {
  const supabase = await getServerClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    console.error('Usuário não autenticado ao fechar caixa')
    return { ok: false, error: 'UNAUTHORIZED' }
  }

  // Encontrar o caixa aberto GLOBAL (sem filtro por usuário)
  const { data: caixaAberto, error: findError } = await supabase
    .from('cash_registers')
    .select('id')
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (findError) {
    console.error('Erro ao encontrar caixa aberto:', findError)
    return { ok: false, error: findError.message }
  }

  if (!caixaAberto) {
    console.error('Nenhum caixa aberto encontrado')
    return { ok: false, error: 'Nenhum caixa aberto encontrado' }
  }

  // Fechar o caixa
  const { error: closeError } = await supabase
    .from('cash_registers')
    .update({
      closed_at: new Date().toISOString(),
    })
    .eq('id', caixaAberto.id)

  if (closeError) {
    console.error('Erro ao fechar caixa:', closeError)
    return { ok: false, error: closeError.message }
  }

  revalidatePath('/caixa')
  return { ok: true }
}
