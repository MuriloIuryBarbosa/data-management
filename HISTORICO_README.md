# Sistema de Histórico de Ordens de Compra

Este documento explica o sistema de auditoria implementado para rastrear todas as alterações feitas nas ordens de compra.

## Funcionalidades

- **Rastreamento Seletivo**: Registra apenas campos que sofreram alterações
- **Formatação Inteligente**: Valores formatados adequadamente (moeda, datas, status)
- **Labels Descritivos**: Nomes amigáveis para os campos alterados
- **Agrupamento Temporal**: Alterações do mesmo momento agrupadas
- **Interface Visual**: Timeline profissional com visual claro e intuitivo
- **Identificação de Usuário**: Rastreamento completo de quem fez cada alteração

## Estrutura do Banco de Dados

### Tabela: `ordem_compra_historico`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT AUTO_INCREMENT | Chave primária |
| `ordem_compra_id` | INT | FK para ordem_compra.id |
| `campo_alterado` | VARCHAR(100) | Nome do campo modificado |
| `valor_anterior` | TEXT | Valor antes da alteração |
| `valor_novo` | TEXT | Valor após a alteração |
| `usuario_id` | INT | ID do usuário que fez a alteração |
| `usuario_nome` | VARCHAR(255) | Nome do usuário |
| `data_alteracao` | DATETIME | Timestamp da alteração |
| `tipo_alteracao` | ENUM | Tipo: 'criacao', 'edicao', 'exclusao' |

## Campos Rastreados

O sistema registra alterações apenas quando há diferenças reais:

- `familia_id` → **Família**
- `tamanho_id` → **Tamanho**
- `cor_id` → **Cor**
- `sku` → **SKU**
- `quantidade` → **Quantidade**
- `unidade_medida` → **Unidade de Medida**
- `valor_compra_brl` → **Valor em R$** (formatado como moeda)
- `cotacao_dolar` → **Cotação do Dólar**
- `etd_planejado` → **ETD Planejado** (formatado como data)
- `etd_proposto` → **ETD Proposto** (formatado como data)
- `etd_real` → **ETD Real** (formatado como data)
- `status` → **Status** (com labels descritivos)

## Formatação de Valores

### Valores Numéricos
- **Quantidade**: Número inteiro
- **Valores**: Formatados como moeda brasileira (R$ X,XX)
- **Cotação**: Número decimal

### Datas
- **ETD**: Formatado como DD/MM/YYYY
- **Timestamp**: Data e hora completas

### Status
- `planejado` → **Planejado**
- `aprovado` → **Aprovado**
- `em_transito` → **Em Trânsito**
- `recebido` → **Recebido**
- `cancelado` → **Cancelado**

### Model
- `src/models/ordemCompraHistorico.ts`: Modelo para operações de histórico

### Controller
- `src/controllers/planejamentoController.ts`: Atualizado com logging de histórico

### Views
- `src/views/planejamento/ordem-compra/historico.ejs`: Interface de timeline

### Scripts de Teste
- `demonstrar_historico.js`: Mostra histórico formatado no console com exemplos reais
- `test_historico.js`: Testa criação com registro de histórico
- `test_update_historico.js`: Testa atualização com histórico
- `test_consulta_historico.js`: Testa visualização do histórico
- `verificar_historico_db.js`: Verifica estrutura do banco de dados

## Como Usar

### 1. Acessar o Histórico
- Em qualquer página de ordem de compra, clique no link "Ver Histórico"
- A timeline mostrará todas as alterações cronologicamente

### 2. Executar Testes

#### Verificar Banco de Dados
```bash
node verificar_historico_db.js
```

#### Demonstrar Histórico Melhorado
```bash
node demonstrar_historico.js
```

#### Testar Criação
```bash
node test_historico.js
```

#### Testar Atualização
```bash
node test_update_historico.js
```

#### Testar Consulta
```bash
node test_consulta_historico.js
```

### 3. Visualizar na Interface Web
1. Acesse `/planejamento/ordem-compra`
2. Clique em "Ver Histórico" em qualquer ordem
3. Visualize a timeline com todas as alterações

## Campos Rastreados

O sistema registra alterações em todos os campos da ordem de compra:
- `familia_id`
- `tamanho_id`
- `cor_id`
- `quantidade`
- `unidade_medida`
- `valor_compra_brl`
- `cotacao_dolar`
- `etd_planejado`
- `etd_proposto`
- `etd_real`

## Tipos de Alteração

- **criacao**: Quando uma nova ordem é criada
- **edicao**: Quando campos existentes são modificados
- **exclusao**: Quando uma ordem é removida (futuro)

## Benefícios

- **Clareza**: Mostra apenas alterações relevantes, sem poluir com campos não modificados
- **Legibilidade**: Formatação adequada para cada tipo de dado (moeda, datas, status)
- **Organização**: Agrupamento temporal das alterações por data/hora
- **Usabilidade**: Interface intuitiva e visualmente agradável
- **Auditoria**: Rastreamento completo e confiável de mudanças
- **Performance**: Não registra alterações desnecessárias, otimizando o banco de dados
- **Responsabilidade**: Identificação clara de quem fez cada alteração
- **Transparência**: Histórico visível para todos os usuários autorizados

## Próximos Passos

- - Adicionar notificações de alterações importantes
- Implementar histórico para outras entidades (estoque, usuários, etc.)

## Exemplo de Saída

```
🔍 Demonstrando Histórico Melhorado de Ordens de Compra

📊 Encontradas 1 ordens de compra com histórico:

🛒 Ordem #2 - SKU: FRONHA MICROTEC LISO 200 FIOS CORTTEX107586-DES3
📈 Total de alterações: 15
   📝 Últimas alterações:
      • Tamanho: 111 → 105
        👤 murilo.iury@corttex.com.br | 📅 16/09/2025 09:40
      • SKU: FRONHA MICROTEC LISO 200 FIOS CORTTEX102586-DES3 → FRONHA MICROTEC LISO 200 FIOS CORTTEX107586-DES3
        👤 murilo.iury@corttex.com.br | 📅 16/09/2025 09:40
      • Cotação USD: 6.39 → 800
        👤 murilo.iury@corttex.com.br | 📅 16/09/2025 09:40
      • ETD Planejado: 25/09/2025 → 24/09/2025
        👤 murilo.iury@corttex.com.br | 📅 16/09/2025 09:40
```

🎯 **Melhorias implementadas:**
- ✅ Mostra apenas campos alterados
- ✅ Formatação inteligente de valores (R$, datas, status)
- ✅ Labels descritivos para campos
- ✅ Agrupamento por data/hora
- ✅ Interface visual clara e intuitiva
- Adicionar filtros e busca no histórico
- Implementar exportação de relatórios de auditoria
- Adicionar notificações de alterações importantes