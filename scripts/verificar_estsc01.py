import mysql.connector

def verificar_dados():
    """Verifica os dados inseridos na tabela estoque_estsc01"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456789',
            database='datalake'
        )

        cursor = conn.cursor()

        # Contar total de registros
        cursor.execute('SELECT COUNT(*) FROM estoque_estsc01')
        total = cursor.fetchone()[0]
        print(f'Total de registros na tabela estoque_estsc01: {total}')

        # Mostrar primeiros 5 registros
        cursor.execute('SELECT id, localizacao, codigo, apelido, familia, cor, qtde FROM estoque_estsc01 LIMIT 5')
        rows = cursor.fetchall()

        print('\nPrimeiros 5 registros:')
        for row in rows:
            print(f'ID: {row[0]}, Localização: {row[1]}, Código: {row[2]}, Apelido: {row[3]}, Família: {row[4]}, Cor: {row[5]}, Qtde: {row[6]}')

        conn.close()

    except mysql.connector.Error as err:
        print(f"Erro ao verificar dados: {err}")

if __name__ == "__main__":
    verificar_dados()