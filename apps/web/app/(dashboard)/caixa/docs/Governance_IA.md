# Documento de Governança de IAs — Versão Consolidada v2.0

## 0. Propósito

Este documento estabelece uma governança clara, rígida e eficaz para operar com múltiplas IAs (ChatGPT, Claude, GenSpark, Cursor, Perplexity) no mesmo projeto, cobrindo todo o ciclo: arquitetura → plano → execução → validação. O objetivo é evitar retrabalho, decisões conflitantes, alterações fora de escopo e permitir que o Idealizador atue como estrategista e validador, enquanto as IAs executam funções bem delimitadas.

---

## 1. Princípios Fundamentais (Regras Não Negociáveis)

1. **Uma mudança por vez**: cada ciclo entrega um resultado verificável
2. **Evidência > opinião**: nenhuma hipótese vira ação sem logs/arquivos/erros
3. **Decisão centralizada**: só o Dono do Produto aprova o caminho (A/B/C)
4. **Plano antes de código**: ninguém codifica antes do plano numerado
5. **Sem refatorar por conta própria**: executor só faz o que está no plano
6. **Rastreabilidade**: tudo deve gerar rastro (diff, arquivos, prints, comandos)
7. **Critério de pronto obrigatório**: toda tarefa tem "como saber que resolveu"
8. **Orquestração centralizada**: nenhuma IA é acionada sem orientação explícita do ChatGPT

### Princípio Fundamental do Sistema
> **Você manda na ideia. ChatGPT manda no processo. As outras IAs obedecem.**

---

## 2. Papéis e Responsabilidades

### 2.1 Dono do Produto / Idealizador (Você) — Decisor Final

**Responsabilidades:**
- Define o objetivo do projeto
- Observa erros no console e repassa para o ChatGPT
- Valida se a lógica geral faz sentido
- Conversa com o ChatGPT e executa suas recomendações
- Autoriza ou bloqueia decisões finais (escolhe caminho A/B/C)
- Define critérios de aceitação em linguagem de negócio

**Não faz:**
- Não escreve código
- Não depura profundamente
- Não entra em detalhes técnicos sem querer
- Não valida tecnicalidades sem critérios objetivos
- Não decide arquitetura técnica sozinho

**Saídas obrigatórias:**
- Decisão clara: A / B / C
- Critério de aceitação objetivo (ex.: "tela carrega em < 2s e login funciona")
- Restrições explícitas (ex.: sem downtime, sem migrations)

---

### 2.2 ChatGPT — Representante Técnica & Orquestradora (Arquitetura + Orquestração + Auditoria)

**Justificativa da escolha:**
- Melhor capacidade de orquestração
- Mantém contexto longo
- Boa tradução entre linguagem humana e técnica
- Excelente para governança, checklist e tomada de decisão

**Responsabilidades:**
- Traduz ideias em tarefas técnicas estruturadas
- Consolida sinais: logs, erros, arquivos, prints, versões, ambiente
- Define hipótese principal e hipóteses alternativas
- Decide qual IA deve ser acionada em cada etapa
- Produz prompts oficiais para Claude / GenSpark / Cursor / Perplexity
- Diz explicitamente: "Agora peça à IA X para fazer Y"
- Audita resultados: valida com critérios e evidências
- Identifica problemas e direciona a IA competente
- Valida se respostas das outras IAs estão coerentes
- Impede que o Idealizador pule etapas
- Arquitetura de sistemas e planejamento de projetos
- Revisão lógica de código e diagnóstico de erros (nível conceitual)
- Trabalhar de forma componentizada
- Pedir confirmação de execução dos "passos 1, 2, 3..." Só então deverá passar para os próximos passos.
- Repassar pa as IAs aquilo qur for de suas atribuições, para evitar sobrecarga
- Falar sempre o passo a passo de como e onde devo colar os códigos

**Não faz:**
- Não executa mudanças no repositório (quem altera é o Cursor)
- Não inventa contexto: se não houver evidência, pede/organiza evidência
- Não é usado como motor de codificação pesada dentro do editor

**Saídas obrigatórias:**
- Diagnóstico com evidências consolidadas
- Hipótese principal + plano de validação
- Prompts oficiais para outras IAs
- Checklist de validação pós-correção
- Quebra de tarefas em etapas numeradas

**Regra de Ouro:**
> Nenhuma IA é acionada sem orientação explícita do ChatGPT.

---

### 2.3 Claude — Arquiteto Sênior (Parecer + Qualidade de Código)

**Responsabilidades:**
- Entrega parecer arquitetural com caminho recomendado (A/B/C)
- Identifica riscos, trade-offs e decisões irreversíveis
- Sugere estratégia e pseudocódigo (alto nível)
- Cria código do zero quando solicitado
- Refatora código com qualidade
- Explica código em linguagem simples
- Revisa segurança e boas práticas

**Não faz:**
- Não decide arquitetura geral sozinho
- Não detalha "passo-a-passo executável" (isso é GenSpark)
- Não altera escopo definido
- Sempre recebe instruções via ChatGPT

**Saídas obrigatórias:**
- "Caminho A/B/C" + justificativa técnica
- Riscos identificados e mitigação
- Decisões irreversíveis e seus impactos
- Código limpo e bem documentado (quando aplicável)

---

### 2.4 GenSpark — Orquestrador (Plano Executável + Criatividade)

**Responsabilidades:**
- Converte parecer do Claude em plano técnico numerado
- Lista arquivos-alvo, dependências, ordem de execução
- Define critérios de pronto por etapa
- Define critérios de rollback
- Sugere abordagens diferentes e alternativas
- Cria ideias inovadoras
- Propõe melhorias ao design

**Não faz:**
- Não codifica diretamente
- Não muda escopo aprovado
- Não executa decisões finais sem validação
- Não altera fluxo aprovado

**Saídas obrigatórias:**
- Plano numerado detalhado (passo 1…N)
- Arquivos afetados por passo
- Critérios de pronto por passo
- Plano de rollback estruturado
- Alternativas criativas quando solicitado

---

### 2.5 Cursor — Executor Técnico (Mudanças de Código)

**Responsabilidades:**
- Executa **um passo por vez** do plano do GenSpark
- Escreve código diretamente no projeto
- Cria arquivos e pastas conforme especificado
- Corrige erros apontados
- Entrega diff/arquivos alterados, comandos rodados e resultado
- Mantém alterações mínimas e contidas
- Segue prompts detalhados fielmente

**Não faz:**
- Não refatora "aproveitando a oportunidade"
- Não muda arquitetura
- Não pula passos do plano
- Não toma decisões de arquitetura
- Não altera lógica sem autorização
- Não cria funcionalidades não solicitadas

**Filosofia:**
> Cursor executa, não pensa.

**Saídas obrigatórias:**
- Diff completo (ou lista de arquivos e alterações)
- Comandos executados (com resultados)
- Evidências: logs, prints, testes, build status
- Próximo passo sugerido: "pronto para passo X+1" ou "bloqueado por Y"

---

### 2.6 Perplexity — Pesquisador e Validador Externo

**Responsabilidades:**
- Pesquisa versões de frameworks e bibliotecas
- Identifica breaking changes
- Busca documentação oficial
- Verifica issues conhecidas (Next.js, Supabase, etc.)
- Compara tecnologias
- Valida se uma abordagem é atual
- Retorna links e conclusões baseadas em fontes

**Não faz:**
- Não decide arquitetura
- Não codifica
- Não cria código final
- Não toma decisões de design

**Saídas obrigatórias:**
- Resumo executivo
- Fontes com links válidos
- Implicações práticas da pesquisa

---

## 3. Fluxo Operacional Completo

### Ciclo Padrão
**Diagnóstico → Arquitetura → Decisão → Plano → Execução → Validação**

---

### ETAPA 1 — Triagem e Consolidação (ChatGPT)

**Entrada mínima obrigatória:**
- O que ocorreu (descrição objetiva)
- Como reproduzir (passo a passo)
- Logs/erro do console/terminal
- Ambiente: framework, versões, branch, sistema operacional
- Arquivos relevantes (paths)

**Processo:**
- Classifica o erro: Sintaxe / Lógica / Dependência / Ambiente
- Consolida todas as evidências
- Define estratégia de investigação

**Saída:**
- Hipótese principal
- 1-2 hipóteses alternativas
- Lista do que falta para confirmar
- Prompt oficial para Claude (parecer arquitetural)

---

### ETAPA 2 — Parecer Arquitetural (Claude)

**Entrada:**
- Resumo consolidado do ChatGPT
- Evidências completas (logs/arquivos/contexto)

**Processo:**
- Análise técnica profunda
- Avaliação de riscos e trade-offs
- Identificação de decisões irreversíveis

**Saída:**
- Caminho A / B / C com justificativa detalhada
- Riscos de cada caminho
- Decisões irreversíveis e impactos
- Recomendação fundamentada

---

### ETAPA 3 — Decisão Estratégica (Você)

**Entrada:**
- Opções A/B/C apresentadas pelo Claude
- Recomendação do ChatGPT
- Análise de riscos

**Processo:**
- Avaliação estratégica
- Consideração de restrições de negócio
- Definição de critérios de sucesso

**Saída:**
- Decisão clara: "Segue caminho A" (ou B/C)
- Critério de aceitação objetivo
- Restrições explícitas (ex.: sem downtime, sem migrations)

---

### ETAPA 4 — Plano Executável (GenSpark)

**Entrada:**
- Caminho escolhido pelo Idealizador
- Critérios de aceitação definidos
- Restrições conhecidas

**Processo:**
- Decomposição em passos executáveis
- Mapeamento de dependências
- Definição de pontos de validação

**Saída:**
- Plano numerado detalhado
- Arquivos-alvo por passo
- Dependências mapeadas
- Critérios de pronto por etapa
- Plano de rollback estruturado

---

### ETAPA 5 — Execução Controlada (Cursor)

**Entrada:**
- Plano do GenSpark (passo específico)
- Prompt detalhado do ChatGPT

**Processo:**
- Execução de **um único passo**
- Aplicação da correção EXATA
- Sem refatorações extras
- Documentação das alterações

**Saída:**
- Alterações do passo executado
- Diff completo ou resumo estruturado
- Comandos executados
- Evidências (logs, prints, build status)
- Status: "pronto para passo X+1" ou "bloqueado por Y"

**Importante:** Aguarda validação do ChatGPT antes de prosseguir para o próximo passo.

---

### ETAPA 6 — Auditoria e Validação (ChatGPT)

**Entrada:**
- Diff do Cursor
- Logs de execução
- Instruções de como testar

**Processo:**
- Verificação de conformidade com o plano
- Análise de efeitos colaterais
- Validação de qualidade
- Checagem de critérios de pronto

**Saída:**
- Veredito: **Aprovado** / **Reprovado** / **Ajustes Necessários**
- Se aprovado: autoriza próximo passo (ou encerra)
- Se reprovado: indica correções necessárias
- Checklist final: "como sabemos que está resolvido"

---

### ETAPA 7 — Encerramento e Aceite (Você)

**Entrada:**
- Relatório final do ChatGPT
- Evidências de conclusão
- Validação completa

**Processo:**
- Verificação final: o erro sumiu?
- Confirmação de que critérios foram atendidos
- Validação de que não surgiram novos problemas

**Saída:**
- Aceite final (Sim/Não)
- Feedback sobre o processo
- Definição da próxima prioridade

---

## 4. CHECKLIST FIXO DE DECISÃO (ANTES DO CURSOR)

**Este checklist deve ser seguido SEMPRE antes de qualquer ação no Cursor.**

### Checklist Obrigatório:

1. ❓ **O objetivo está claro e escrito em uma frase?**
2. 🏗️ **A arquitetura já foi definida pela Representante Técnica?**
3. 🧠 **Qual IA pensou a solução?**
4. ✍️ **Qual IA vai escrever o código?**
5. 📁 **A estrutura de pastas foi definida?**
6. ⚠️ **Há riscos conhecidos (autenticação, banco, estado)?**
7. ✅ **Existe critério claro de sucesso?**
8. 🔄 **Existe ponto de rollback se der erro?**

### Regra Crítica:
> **Se qualquer resposta for "NÃO", NÃO abra o Cursor.**

---

## 5. FLUXO DE CORREÇÃO DE ERROS DO CONSOLE

### Regra Central:
> **Nenhum erro é corrigido diretamente no impulso.**

### Fluxo Oficial:

**Etapa 1 – Observação (Você)**
- Copia o erro completo do console
- Não tenta corrigir
- Não altera código
- Documenta contexto (o que estava fazendo)

**Etapa 2 – Análise (ChatGPT)**
- Classifica o erro: Sintaxe / Lógica / Dependência / Ambiente
- Identifica a causa raiz
- Define estratégia de correção
- Decide qual IA deve resolver

**Etapa 3 – Delegação Inteligente**
- **Claude**: quando o erro envolve lógica ou estrutura de código
- **Perplexity**: quando o erro envolve documentação, versão ou breaking changes
- **Cursor**: apenas quando já houver correção definida e aprovada

**Etapa 4 – Correção (Cursor)**
- Aplica a correção EXATA conforme especificado
- Sem refatorações extras
- Sem alterações de escopo

**Etapa 5 – Validação Dupla**
- **Você verifica**: O erro sumiu? Não surgiram novos erros?
- **ChatGPT valida**: A correção respeita a arquitetura? Está contida?
- Se falhar → retorna para Etapa 2

---

## 6. Padrões de Comunicação (Templates)

### 6.1 Template de Incidente

```
SINTOMA:
[Descreva o que está acontecendo de errado]

REPRODUÇÃO:
1) [Passo a passo exato para reproduzir]
2) [...]

ESPERADO:
[O que deveria acontecer]

ATUAL:
[O que está acontecendo]

LOGS/ERRO:
[Colar erro completo do console/terminal]

VERSÕES:
- Next.js: [versão]
- Node: [versão]
- Supabase: [versão]
- Outros: [...]

AMBIENTE:
- SO: [Windows/Mac/Linux]
- Branch: [nome do branch]

ARQUIVOS RELEVANTES:
[Paths dos arquivos envolvidos]
```

---

### 6.2 Template de Decisão

```
ESCOLHA: Caminho A / B / C

JUSTIFICATIVA:
[Por que essa escolha]

CRITÉRIO DE ACEITAÇÃO:
[Como saber que funcionou - objetivo e mensurável]

RESTRIÇÕES:
[Ex.: sem downtime, sem migrations, manter compatibilidade]
```

---

### 6.3 Template de Entrega do Cursor

```
PASSO DO PLANO: [número do passo]

ARQUIVOS ALTERADOS:
- [path/arquivo1.tsx]
- [path/arquivo2.ts]

DIFF/RESUMO:
[Resumo das alterações ou diff completo]

COMANDOS RODADOS:
$ [comando 1]
$ [comando 2]

RESULTADO:
[Build: ✅ / ❌]
[Testes: ✅ / ❌]
[Console: sem erros / erros encontrados]

EVIDÊNCIAS:
[Prints, logs relevantes]

PRÓXIMO:
Pronto para passo X+1? [Sim/Não]
Motivo: [explicação]
```

---

## 7. Critérios de "Pronto" (Definition of Done)

Uma correção ou funcionalidade só é considerada **pronta** quando:

1. ✅ **Reprodutibilidade**: O problema é reproduzível antes e não reproduzível depois
2. ✅ **Logs limpos**: Logs confirmam estado saudável (sem erros correlatos)
3. ✅ **Validação**: Existe validação mínima (teste manual guiado ou automatizado)
4. ✅ **Contenção**: Mudança ficou contida (sem refatoração extra)
5. ✅ **Documentação**: Causa raiz + fix + como evitar recorrência documentados
6. ✅ **Critério atendido**: Critério de aceitação definido foi cumprido
7. ✅ **Sem regressão**: Nenhum erro novo foi introduzido

---

## 8. Regras de Segurança e Controle

### Regras Invioláveis:

1. **Segregação de funções**: Nenhuma IA pode atuar fora de sua função definida
2. **Arbitragem centralizada**: Se duas IAs divergirem, ChatGPT decide
3. **Protocolo de erro**: Qualquer erro crítico → volta imediatamente para ChatGPT
4. **Aprovação de mudanças**: Mudanças grandes exigem nova aprovação do Idealizador
5. **Rastreabilidade total**: Toda ação deve gerar rastro auditável
6. **Evidências obrigatórias**: Nenhuma ação sem evidências concretas

---

## 9. "Linha Vermelha" — Quando Parar Imediatamente

**Parar e voltar uma etapa se acontecer qualquer um destes:**

🚨 Executor começou a refatorar sem estar no plano

🚨 Apareceu erro novo sem relação com a mudança

🚨 Mudança afetou muitos arquivos sem justificativa clara

🚨 Critério de pronto ficou subjetivo ("parece ok", "acho que funciona")

🚨 Não existe reprodução clara do bug

🚨 IA pulou etapas do fluxo oficial

🚨 Decisão técnica tomada sem passar pelo ChatGPT

🚨 Código executado sem plano numerado aprovado

### Ação Imediata:
> **STOP → Voltar para ChatGPT → Reorganizar → Retomar**

---

## 10. Rotina Operacional do Dia a Dia

### Fluxo Resumido:

1. **Você** abre o chamado usando template de incidente
2. **ChatGPT** consolida evidências e escreve prompt para Claude
3. **Claude** devolve análise com opções A/B/C
4. **Você** responde "segue caminho X" + critério de aceitação
5. **ChatGPT** gera prompt para GenSpark criar plano numerado
6. **GenSpark** entrega plano executável detalhado
7. **Cursor** executa passo 1 e devolve diff + evidências
8. **ChatGPT** valida e libera passo 2 (ou solicita ajustes)
9. **Repetir** passos 7-8 até conclusão
10. **ChatGPT** faz relatório final
11. **Você** dá aceite e define próxima prioridade

---

## 11. Localização do Documento

### Opção Recomendada (Profissional):

Dentro do repositório do projeto:

```
./docs/GOVERNANCA_IA.md
```

Atualizar o README principal:

```
./README.md
```

Adicionar seção destacada:
```markdown
## 📌 Governança de IAs

Este projeto segue protocolos rigorosos de governança para uso de múltiplas IAs.
Consulte [docs/GOVERNANCA_IA.md](./docs/GOVERNANCA_IA.md) antes de qualquer alteração.
```

### Opcional (para Cursor):

Criar referência em:
```
./.cursor/rules.md
```

Com conteúdo:
```markdown
# Regras do Cursor

⚠️ **ATENÇÃO**: Antes de qualquer alteração, consulte:
- [Governança de IAs](../docs/GOVERNANCA_IA.md)

**Nunca**:
- Refatore sem estar no plano
- Pule etapas
- Altere arquitetura
- Crie funcionalidades não solicitadas
```

### Alternativa Multi-Projetos:

- **Master**: Notion/Google Docs com governança completa
- **Repos**: Cópia resumida + link para master em cada projeto

---

## 12. Resultado Esperado do Sistema

### Benefícios:

✅ **Menos confusão** entre funções das IAs

✅ **Menos retrabalho** por decisões precipitadas

✅ **Mais controle** sobre o processo de desenvolvimento

✅ **Rastreabilidade completa** de todas as decisões

✅ **Qualidade consistente** nas entregas

✅ **Você atua como estrategista real**, não como debugger

✅ **Execução previsível** e auditável

✅ **Redução drástica** de erros em cascata

---

## 13. Resumo Executivo

### Hierarquia de Comando:

```
IDEALIZADOR (Você)
    ↓ (define objetivo e valida)
CHATGPT (Representante Técnica)
    ↓ (orquestra e delega)
├── CLAUDE (Arquitetura)
├── GENSPARK (Planejamento)
├── PERPLEXITY (Pesquisa)
└── CURSOR (Execução)
```

### Fluxo em Uma Frase:
> **Ideia → Diagnóstico → Arquitetura → Decisão → Plano → Execução → Validação → Aceite**

### Regra de Ouro:
> **Ideia sem governança vira caos. Governança sem execução vira teoria. Este sistema equilibra os dois.**

---

**Status do Documento**: ✅ Ativo e Operacional

**Versão**: 2.0 (Consolidada)

**Última Atualização**: Dezembro 2025

---

## ANEXO: Perguntas Frequentes (FAQ)

**P: Posso pular direto para o Cursor se o problema parecer simples?**
R: Não. O checklist obrigatório deve ser seguido sempre.

**P: E se o ChatGPT demorar muito para responder?**
R: Melhor esperar do que criar débito técnico e retrabalho.

**P: Posso usar outra IA se achar que ela é melhor para a tarefa?**
R: Sim, mas apenas após discutir com o ChatGPT e obter aprovação.

**P: O que fazer se duas IAs sugerirem coisas totalmente opostas?**
R: ChatGPT arbitra. Se necessário, você toma a decisão final.

**P: Esse processo não é muito burocrático?**
R: É estruturado, não burocrático. A estrutura previne caos e economiza tempo.

---

**FIM DO DOCUMENTO**