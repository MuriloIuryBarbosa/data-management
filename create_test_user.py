import mysql.connector

# Conectar ao banco
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='123456789',
    database='datalake'
)
cursor = conn.cursor()

# Hash bcrypt para '123456' (gerado com node)
hashed_password = '$2b$10$UqJb1G04hZ/5kkyjkeNtG.teL.yxltXpHG9W8VHVbMUFBUnwLlCmu'

# Inserir usuário de teste
try:
    cursor.execute("""
        INSERT INTO users (email, password, name, role, created_at, updated_at)
        VALUES (%s, %s, %s, %s, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        name = VALUES(name),
        role = VALUES(role),
        updated_at = NOW()
    """, ('test@test.com', hashed_password, 'Test User', 'user'))
    conn.commit()
    print('Usuário de teste criado/atualizado: test@test.com / 123456')
except Exception as e:
    print(f'Erro: {e}')
finally:
    cursor.close()
    conn.close()