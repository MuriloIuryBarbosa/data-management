import mysql.connector

def verificar_banco():
    """Verifica as tabelas no banco de dados"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456789',
            database='datalake'
        )

        cursor = conn.cursor()

        # Mostrar todas as tabelas
        cursor.execute('SHOW TABLES')
        tables = cursor.fetchall()
        print('Tabelas no banco:')
        for table in tables:
            print(f'  - {table[0]}')

        # Verificar se a tabela estoque_estsc01 existe
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'datalake' AND table_name = 'estoque_estsc01'")
        if cursor.fetchone()[0] > 0:
            print('\nTabela estoque_estsc01 existe!')

            # Contar registros
            cursor.execute('SELECT COUNT(*) FROM estoque_estsc01')
            total = cursor.fetchone()[0]
            print(f'Registros em estoque_estsc01: {total}')
        else:
            print('\nTabela estoque_estsc01 NÃO existe!')

        conn.close()

    except mysql.connector.Error as err:
        print(f"Erro ao verificar banco: {err}")

if __name__ == "__main__":
    verificar_banco()