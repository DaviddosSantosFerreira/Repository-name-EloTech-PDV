# Regras do Cursor - Governança de IAs

⚠️ **ATENÇÃO OBRIGATÓRIA**: Antes de qualquer alteração, consulte:
- [Governança de IAs](../docs/GOVERNANCA_IA.md)

## Regras Invioláveis para o Cursor

### NUNCA faça:
- ❌ Refatorar código sem estar no plano aprovado
- ❌ Pular etapas do plano numerado
- ❌ Alterar arquitetura por conta própria
- ❌ Criar funcionalidades não solicitadas
- ❌ Modificar múltiplos arquivos sem justificativa
- ❌ Executar sem checklist validado

### SEMPRE faça:
- ✅ Execute apenas UM passo do plano por vez
- ✅ Aguarde validação antes do próximo passo
- ✅ Documente todas as alterações (diff)
- ✅ Registre comandos executados
- ✅ Forneça evidências (logs, prints)
- ✅ Mantenha mudanças mínimas e contidas

### Fluxo Obrigatório:
1. Receber plano numerado do GenSpark
2. Executar passo N
3. Gerar diff + evidências
4. Aguardar validação do ChatGPT
5. Prosseguir para passo N+1 (se aprovado)

### Em caso de erro:
- STOP imediatamente
- Reportar ao ChatGPT
- NÃO tentar corrigir sozinho
- Aguardar análise e nova instrução

