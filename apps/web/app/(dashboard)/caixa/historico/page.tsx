'use client'

import { useEffect, useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'

type CashReport = {
  cash_register_id: string
  opened_at: string
  closed_at: string | null
  initial_amount: number
  expected_amount: number
  final_amount: number
  diff_cash: number
  diff_pix: number
  diff_card: number
  diff_total: number
}

export default function CaixaHistoricoPage() {
  const supabase = getBrowserClient()

  const [data, setData] = useState<CashReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc('get_daily_cash_report')

      if (error) {
        setError('Erro ao carregar histórico do caixa.')
        setLoading(false)
        return
      }

      setData(data ?? [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <p>Carregando histórico...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  if (data.length === 0) {
    return <p>Nenhum fechamento encontrado.</p>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Histórico de Caixa</h1>

      <table border={1} cellPadding={8} style={{ marginTop: 16 }}>
        <thead>
          <tr>
            <th>Abertura</th>
            <th>Fechamento</th>
            <th>Inicial</th>
            <th>Esperado</th>
            <th>Final</th>
            <th>Diferença</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cash_register_id}>
              <td>{new Date(row.opened_at).toLocaleString()}</td>
              <td>
                {row.closed_at
                  ? new Date(row.closed_at).toLocaleString()
                  : '-'}
              </td>
              <td>R$ {Number(row.initial_amount).toFixed(2)}</td>
              <td>R$ {Number(row.expected_amount).toFixed(2)}</td>
              <td>R$ {Number(row.final_amount).toFixed(2)}</td>
              <td>R$ {Number(row.diff_total).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
