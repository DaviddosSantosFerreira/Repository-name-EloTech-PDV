'use client'

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

interface AberturaDeCaixaProps {
  onOpened: () => void
}

type OpenCashRegisterResponse = {
  success: boolean
  message?: string
  cash_register_id?: string
}

export function AberturaDeCaixa({ onOpened }: AberturaDeCaixaProps) {
  const supabase = getBrowserClient()

  const [initialAmount, setInitialAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    if (!initialAmount) {
      alert('Informe o valor inicial do caixa')
      return
    }

    setLoading(true)

    // ⬇️ chamada RPC SEM generic
    const { data, error } = await supabase.rpc(
        'open_cash_register',
        {
          p_initial_amount: Number(initialAmount),
        } as any
      )
      

    setLoading(false)

    if (error) {
      console.error('Erro ao abrir caixa:', error)
      alert(error.message)
      return
    }

    // ⬇️ tipagem explícita APÓS a chamada
    const result = data as OpenCashRegisterResponse | null

    if (!result || !result.success) {
      alert(result?.message || 'Erro ao abrir caixa')
      return
    }

    // ✅ sucesso real
    onOpened()
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Abertura de Caixa</h1>

      <input
        type="number"
        placeholder="Valor inicial"
        value={initialAmount}
        onChange={(e) => setInitialAmount(e.target.value)}
      />

      <br /><br />

      <button onClick={handleOpen} disabled={loading}>
        {loading ? 'Abrindo...' : 'Abrir Caixa'}
      </button>
    </div>
  )
}




