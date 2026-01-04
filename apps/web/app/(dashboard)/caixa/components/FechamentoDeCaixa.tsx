'use client'

import { useState, useEffect } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

type CashTotals = {
  expected_cash: number
  expected_pix: number
  expected_card: number
  expected_total: number
}

interface FechamentoDeCaixaProps {
  onClosed: () => void
}

export function FechamentoDeCaixa({ onClosed }: FechamentoDeCaixaProps) {
  const supabase = getBrowserClient()

  const [finalCash, setFinalCash] = useState('')
  const [finalPix, setFinalPix] = useState('')
  const [finalCard, setFinalCard] = useState('')

  const [sangriaAmount, setSangriaAmount] = useState('')
  const [sangriaNotes, setSangriaNotes] = useState('')

  const [totals, setTotals] = useState<CashTotals>({
    expected_cash: 0,
    expected_pix: 0,
    expected_card: 0,
    expected_total: 0,
  })

  useEffect(() => {
    const loadTotals = async () => {
      const result = await supabase.rpc('get_open_cash_totals')
      const data = result.data as CashTotals[] | null

      if (result.error) {
        console.error('Erro ao carregar totais:', result.error)
      } else if (data && data.length > 0) {
        setTotals(data[0])
      }
    }

    loadTotals()
  }, [supabase])

  const handleRegisterSangria = async () => {
    if (!sangriaAmount) return

    const { error } = await supabase.rpc(
      'register_cash_sangria',
      {
        p_amount: Number(sangriaAmount),
        p_notes: sangriaNotes,
      } as any
    )

    if (error) {
      console.error('Erro ao registrar sangria:', error)
      alert('Erro ao registrar sangria. Tente novamente.')
      return
    }

    // Recarrega totais após sangria
    const result = await supabase.rpc('get_open_cash_totals')
    const data = result.data as CashTotals[] | null

    if (result.error) {
      console.error('Erro ao recarregar totais:', result.error)
    } else if (data && data.length > 0) {
      setTotals(data[0])
    }

    setSangriaAmount('')
    setSangriaNotes('')
  }

  const handleClose = async () => {
    const { error } = await supabase.rpc(
      'close_cash_register',
      {
        p_final_cash: Number(finalCash),
        p_final_pix: Number(finalPix),
        p_final_card: Number(finalCard),
      } as any
    )

    // ⚠️ Loga o erro, mas NÃO trava a UI
    if (error) {
      console.error('Erro ao fechar caixa:', error)
    }

    // 🔥 SEMPRE muda a UI para "Abrir Caixa"
    onClosed()
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Fechamento de Caixa</h1>

      <h3>Totais Esperados</h3>
      <p>Dinheiro: R$ {totals.expected_cash.toFixed(2)}</p>
      <p>PIX: R$ {totals.expected_pix.toFixed(2)}</p>
      <p>Cartão: R$ {totals.expected_card.toFixed(2)}</p>
      <strong>Total: R$ {totals.expected_total.toFixed(2)}</strong>

      <h3 style={{ marginTop: 24 }}>Valores Contados</h3>

      <input
        type="number"
        placeholder="Dinheiro contado"
        value={finalCash}
        onChange={(e) => setFinalCash(e.target.value)}
      />
      <br />

      <input
        type="number"
        placeholder="PIX contado"
        value={finalPix}
        onChange={(e) => setFinalPix(e.target.value)}
      />
      <br />

      <input
        type="number"
        placeholder="Cartão contado"
        value={finalCard}
        onChange={(e) => setFinalCard(e.target.value)}
      />

      <h3 style={{ marginTop: 24 }}>Sangria</h3>

      <input
        type="number"
        placeholder="Valor da sangria"
        value={sangriaAmount}
        onChange={(e) => setSangriaAmount(e.target.value)}
      />
      <br />

      <input
        placeholder="Motivo da sangria"
        value={sangriaNotes}
        onChange={(e) => setSangriaNotes(e.target.value)}
      />

      <br /><br />

      <button onClick={handleRegisterSangria}>
        Registrar Sangria
      </button>

      <br /><br />

      <button onClick={handleClose}>
        Fechar Caixa
      </button>
    </div>
  )
}




