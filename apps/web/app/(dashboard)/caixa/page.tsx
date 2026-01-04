import { getServerClient } from '@/lib/supabase/server'
import { CaixaClient } from './CaixaClient'

export default async function CaixaPage() {
  const supabase = await getServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let status: 'open' | 'closed' = 'closed'

  // Consultar caixa aberto GLOBAL (sem filtro por usuário)
  const { data } = await supabase
    .from('cash_registers')
    .select('id')
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  status = data ? 'open' : 'closed'

  return <CaixaClient status={status} />
}
