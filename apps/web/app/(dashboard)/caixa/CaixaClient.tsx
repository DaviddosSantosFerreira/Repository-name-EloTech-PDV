'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { abrirCaixa, fecharCaixa } from './actions'

type Props = {
  status: 'open' | 'closed'
}

export function CaixaClient({ status }: Props) {
  const router = useRouter()
  const [valorInicial, setValorInicial] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleAbrirCaixa() {
    const valor = Number(valorInicial)
    if (!valorInicial || valor <= 0) {
      return alert('Informe um valor inicial maior que zero')
    }

    startTransition(async () => {
      const result = await abrirCaixa(valor)
      if (result.ok) {
        router.refresh()
        setMostrarForm(false)
        setValorInicial('')
      } else {
        alert(`Erro: ${result.error}`)
      }
    })
  }

  async function handleFecharCaixa() {
    startTransition(async () => {
      const result = await fecharCaixa()
      if (result.ok) {
        router.refresh()
      } else {
        alert(`Erro: ${result.error}`)
      }
    })
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Controle de Caixa</h1>

      <p>
        Status atual: <strong>{status === 'open' ? 'ABERTO' : 'FECHADO'}</strong>
      </p>

      {status === 'closed' && (
        <div style={{ marginTop: 16 }}>
          {!mostrarForm && (
            <button 
              onClick={() => setMostrarForm(true)}
              style={{ padding: '8px 16px', cursor: 'pointer' }}
            >
              Abrir Caixa
            </button>
          )}

          {mostrarForm && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor inicial"
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
                disabled={pending}
                style={{ padding: '8px', width: '150px' }}
              />
              <button 
                onClick={handleAbrirCaixa} 
                disabled={pending}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                {pending ? 'Abrindo...' : 'Confirmar'}
              </button>
              <button
                onClick={() => {
                  setMostrarForm(false)
                  setValorInicial('')
                }}
                disabled={pending}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'open' && (
        <div style={{ marginTop: 16 }}>
          <button 
            onClick={handleFecharCaixa} 
            disabled={pending}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            {pending ? 'Fechando...' : 'Fechar Caixa'}
          </button>
        </div>
      )}
    </div>
  )
}
