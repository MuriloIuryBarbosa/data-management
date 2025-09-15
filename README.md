# Sistema de Gerenciamento de Dados

Este é um sistema web para gerenciamento de dados desenvolvido com Node.js, TypeScript e arquitetura MVC.

## Funcionalidades

- **Autenticação**: Login, cadastro e recuperação de senha
- **Dashboard**: Página principal após login
- **Sistema de Papéis**: Controle de permissões por papel do usuário
- **Banco de Dados**: SQLite para prototipagem (preparado para MySQL em produção)

## Papéis de Usuário

O sistema possui três níveis de permissão:

- **Super Administrador**: Acesso total ao sistema (ex: murilo.iury@corttex.com.br)
- **Administrador**: Acesso avançado com permissões administrativas
- **Usuário**: Acesso básico ao sistema

### Usuário Super Administrador

O usuário `murilo.iury@corttex.com.br` é automaticamente configurado como Super Administrador ao se cadastrar no sistema.

## Como executar

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