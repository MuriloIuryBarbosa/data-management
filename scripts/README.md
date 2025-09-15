# Scripts de Processamento de Dados de Estoque

Esta pasta contém os scripts Python desenvolvidos para processar os arquivos de dados de estoque TXT e inserir no banco de dados MySQL.

## Scripts de Processamento

### `process_tecido01.py`
- **Arquivo de entrada**: `bases/estoque/tecido01.txt`
- **Tabela de destino**: `estoque_tecido01`
- **Estrutura**: Campos específicos para tecido (tipo, produto, entrada, qualidade, metros, etc.)
- **Status**: ✅ Funcionando - 93.724 registros inseridos

### `process_fatex01.py`
- **Arquivo de entrada**: `bases/estoque/fatex01.txt`
- **Tabela de destino**: `estoque_fatex01`
- **Estrutura**: Campos padrão de estoque (localizacao, codigo, apelido, familia, qual, qmm, cor, qtde, desc_cor, tam, tamd, embalagem_vol, un, peso_liq, peso_bruto)
- **Status**: ✅ Funcionando - 355.266 registros inseridos

### `process_confec01.py`
- **Arquivo de entrada**: `bases/estoque/confec01.txt`
- **Tabela de destino**: `estoque_confec01`
- **Estrutura**: Mesma estrutura do fatex01
- **Status**: ✅ Funcionando - 41.746 registros inseridos

### `process_estsc01.py`
- **Arquivo de entrada**: `bases/estoque/estsc01.txt`
- **Tabela de destino**: `estoque_estsc01`
- **Estrutura**: Mesma estrutura do fatex01
- **Status**: ⚠️ Criado mas precisa de ajustes - Verificar inserção de dados

### `process_estoque.py`
- **Arquivo de entrada**: Vários arquivos TXT
- **Objetivo**: Processamento genérico (não funcionou devido às diferenças de estrutura)
- **Status**: ❌ Abandonado - Substituído por scripts específicos

## Scripts de Verificação

### `verificar_banco.py`
- **Função**: Verificar conexão com banco de dados e listar tabelas

### `verificar_estsc01.py`
- **Função**: Verificar dados inseridos na tabela `estoque_estsc01`

## Como Usar

1. Certifique-se de que o banco de dados MySQL está rodando
2. Configure as credenciais no script (host, user, password, database)
3. Execute o script desejado: `python scripts/process_[arquivo].py`

## Dependências

- `mysql.connector` - Para conexão com MySQL
- `pathlib` - Para manipulação de caminhos de arquivo

## Estrutura dos Dados

Todos os arquivos seguem o formato de texto fixo com posições específicas para cada campo. Os scripts fazem o parsing baseado em posições de caracteres para extrair os dados corretamente.

## Problemas Conhecidos

- `process_estsc01.py`: Dados não estão sendo inseridos corretamente (tabela vazia apesar do processamento indicar sucesso)