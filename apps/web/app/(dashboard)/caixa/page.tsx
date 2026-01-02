'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

type CashStatus = 'open' | 'closed'

type CashTotals = {
  expected_cash: number
  expected_pix: number
  expected_card: number
  expected_total: number
}

type OpenCashRow = {
  id: string
}

export default function CaixaPage() {
  const supabase = getBrowserClient()

  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<CashStatus | null>(null)

  const [initialAmount, setInitialAmount] = useState('')

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
    const load = async () => {
      const { data: openCash, error } = await supabase
        .from('cash_registers')
        .select('id, status, opened_at, closed_at')
        .is('closed_at', null)
        .order('opened_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      const rows = (openCash ?? []) as OpenCashRow[]

      if (rows.length > 0) {
        setStatus('open')

        const result = await supabase.rpc('get_open_cash_totals')
        const data = result.data as CashTotals[] | null

        if (result.error) {
          console.error(result.error)
        } else if (data && data.length > 0) {
          setTotals(data[0])
        }
      } else {
        setStatus('closed')
      }

      setLoading(false)
    }

    load()
  }, [supabase])

  /* ===========================
     LOADING
     =========================== */
  if (loading || status === null) {
    return <p style={{ padding: 32 }}>Carregando caixa...</p>
  }

  /* ===========================
     CAIXA FECHADO → ABERTURA
     =========================== */
  if (status === 'closed') {
    return (
      <div style={{ padding: 32, maxWidth: 400 }}>
        <h1>Abertura de Caixa</h1>

        <input
          type="number"
          placeholder="Valor inicial em dinheiro"
          value={initialAmount}
          onChange={(e) => setInitialAmount(e.target.value)}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <button
          onClick={async () => {
            if (!initialAmount) return

            await supabase.rpc(
              'open_cash_register',
              { p_initial_amount: Number(initialAmount) } as any
            )

            window.location.reload()
          }}
        >
          Abrir Caixa
        </button>
      </div>
    )
  }

  /* ===========================
     CAIXA ABERTO → FECHAMENTO
     =========================== */
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

      <button
        onClick={async () => {
          if (!sangriaAmount) return

          await supabase.rpc(
            'register_cash_sangria',
            {
              p_amount: Number(sangriaAmount),
              p_notes: sangriaNotes,
            } as any
          )

          window.location.reload()
        }}
      >
        Registrar Sangria
      </button>

      <br /><br />

      <button
        onClick={async () => {
          await supabase.rpc(
            'close_cash_register',
            {
              p_final_cash: Number(finalCash),
              p_final_pix: Number(finalPix),
              p_final_card: Number(finalCard),
            } as any
          )

          window.location.reload()
        }}
      >
        Fechar Caixa
      </button>
    </div>
  )
}
