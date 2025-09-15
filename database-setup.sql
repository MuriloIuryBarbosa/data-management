-- Script de configuração inicial do banco de dados
-- Execute este script no MySQL para configurar o banco de dados

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS data_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE data_management;

-- Criar usuário da aplicação (opcional)
-- Substitua 'sua_senha_segura' por uma senha forte
CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';

-- Conceder todas as permissões para o usuário da aplicação
GRANT ALL PRIVILEGES ON data_management.* TO 'app_user'@'localhost';

-- Aplicar as mudanças de privilégios
FLUSH PRIVILEGES;

-- Opcional: Criar um usuário administrador adicional
-- CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin_password';
-- GRANT ALL PRIVILEGES ON data_management.* TO 'admin'@'localhost';
-- FLUSH PRIVILEGES;