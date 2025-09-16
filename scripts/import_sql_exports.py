import os
from dotenv import load_dotenv
import mysql.connector

# Carregar variáveis de ambiente do arquivo .env na raiz do projeto
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Configuração do banco de dados
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'datalake'),
}

try:
    # Conectar ao banco de dados
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # Diretório dos arquivos SQL
    sql_dir = os.path.join(os.path.dirname(__file__), 'sql_exports')

    # Processar cada arquivo .sql
    for file_name in os.listdir(sql_dir):
        if file_name.endswith('.sql'):
            file_path = os.path.join(sql_dir, file_name)
            print(f'Importando {file_name}...')

            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()

            # Extrair o nome da tabela do CREATE TABLE
            import re
            match = re.search(r'CREATE TABLE `([^`]+)`', sql_content)
            if match:
                table_name = match.group(1)
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS `{table_name}`")
                    print(f'Tabela {table_name} removida se existia.')
                except mysql.connector.Error as e:
                    print(f'Erro ao remover tabela {table_name}: {e}')

            # Executar múltiplas declarações SQL
            statements = sql_content.split(';')
            for stmt in statements:
                stmt = stmt.strip()
                if stmt:
                    try:
                        cursor.execute(stmt)
                    except mysql.connector.Error as e:
                        print(f'Erro na declaração: {e}')
                        continue

    # Confirmar mudanças
    conn.commit()
    print('Todos os arquivos SQL foram processados.')

except mysql.connector.Error as e:
    print(f'Erro de conexão ao banco de dados: {e}')

finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()
