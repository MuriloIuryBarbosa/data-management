# Sistema de Gerenciamento de Dados

Este é um sistema web para gerenciamento de dados desenvolvido com Node.js, TypeScript e arquitetura MVC.

## Funcionalidades

- **Autenticação**: Login, cadastro e recuperação de senha
- **Dashboard**: Página principal após login
- **Sistema de Papéis**: Controle de permissões por papel do usuário
- **Módulo de Cadastros**: Gerenciamento de Famílias, Tamanhos e Cores
- **Banco de Dados**: MySQL para desenvolvimento e produção

## Papéis de Usuário

O sistema possui três níveis de permissão:

- **Super Administrador**: Acesso total ao sistema (ex: murilo.iury@corttex.com.br)
- **Administrador**: Acesso avançado com permissões administrativas
- **Usuário**: Acesso básico ao sistema

### Usuário Super Administrador

O usuário `murilo.iury@corttex.com.br` é automaticamente configurado como Super Administrador ao se cadastrar no sistema.

## Pré-requisitos

- Node.js (versão 16 ou superior)
- MySQL Server (versão 8.0 ou superior)

## Configuração do MySQL

### 1. Instalar MySQL

**Windows:**
- Baixe e instale o MySQL Community Server de: https://dev.mysql.com/downloads/mysql/
- Ou use XAMPP que inclui MySQL: https://www.apachefriends.org/

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### 2. Configurar banco de dados

Execute o script SQL fornecido ou execute manualmente:

```bash
# Usando o script fornecido
mysql -u root -p < database-setup.sql

# Ou execute os comandos manualmente no MySQL
mysql -u root -p
```

O arquivo `database-setup.sql` contém todos os comandos necessários para:
- Criar o banco de dados `data_management`
- Criar um usuário dedicado para a aplicação
- Configurar as permissões necessárias

### 3. Configurar variáveis de ambiente

Edite o arquivo `.env` na raiz do projeto:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root  # ou 'app_user' se criou um usuário específico
DB_PASSWORD=  # sua senha do MySQL (deixe vazio se não há senha)
DB_NAME=data_management

# JWT Secret
JWT_SECRET=sua-chave-secreta-muito-segura-aqui

# Server Configuration
PORT=3000
```

## Instalação e Execução

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar migrações do banco
As tabelas serão criadas automaticamente quando o servidor iniciar pela primeira vez.

### 3. Executar o projeto
```bash
# Modo desenvolvimento (com hot reload)
npm run dev

# Ou compilar e executar
npm run build
npm start
```

O servidor será executado em `http://localhost:3000`

## Estrutura do Banco de Dados

O sistema utiliza as seguintes tabelas com padrão consistente:

### Colunas Padrão (todas as tabelas)
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `codigo_old` (VARCHAR(50)) - ID legado para rastreabilidade
- `nome_old` (VARCHAR(255)) - Nome antigo para rastreabilidade
- `legado` (TEXT) - Concatenação de código e nome nos padrões antigos
- `ativo` (TINYINT, DEFAULT 1) - Status ativo/inativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### Tabelas do Sistema

#### users
- `email` (VARCHAR(255), UNIQUE)
- `password` (VARCHAR(255))
- `name` (VARCHAR(255))
- `role` (VARCHAR(50))

#### familia
- `nome` (VARCHAR(255))
- `descricao` (TEXT)

#### tamanho
- `nome` (VARCHAR(255))
- `sigla` (VARCHAR(10))
- `ordem` (INT)

#### cor
- `nome` (VARCHAR(255))
- `codigo_hex` (VARCHAR(7))

## Desenvolvimento

### Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (com hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Executar versão compilada
npm start
```

### Estrutura do Projeto

```
src/
├── controllers/     # Controladores da aplicação
├── models/         # Modelos de dados e conexão com BD
├── routes/         # Definição das rotas
├── views/          # Templates EJS
├── middlewares/    # Middlewares personalizados
└── server.ts       # Ponto de entrada da aplicação

database-setup.sql  # Script de configuração do MySQL
.env.example        # Exemplo de variáveis de ambiente
```

### Troubleshooting

**Erro de conexão com MySQL:**
- Verifique se o MySQL Server está rodando
- Confirme as credenciais no arquivo `.env`
- Execute o script `database-setup.sql`

**Erro de compilação TypeScript:**
```bash
npm run build
```

**Porta já em uso:**
- Mude a porta no arquivo `.env`
- Ou mate o processo usando a porta 3000

**Problemas com permissões:**
- Execute o MySQL como administrador
- Verifique as permissões do usuário no banco

## Tecnologias Utilizadas

- **Backend**: Node.js + TypeScript + Express
- **Banco de Dados**: MySQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Frontend**: EJS Templates + Bootstrap
- **ORM**: MySQL2 (queries diretas)

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o projeto em modo desenvolvimento:
   ```bash
   npm run dev
   ```

3. Ou compile e execute:
   ```bash
   npm run build
   npm start
   ```

O servidor será executado na porta 3000.

## Estrutura do Projeto

- `src/controllers/`: Controladores da aplicação
- `src/models/`: Modelos de dados e conexão com banco
- `src/routes/`: Definição das rotas
- `src/views/`: Templates EJS
- `src/server.ts`: Ponto de entrada da aplicação

## Próximos Passos

- Implementar funcionalidades de gerenciamento de dados
- Migrar para MySQL em produção
- Adicionar validações mais robustas
- Implementar recuperação de senha com email