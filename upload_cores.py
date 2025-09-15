#!/usr/bin/env python3
"""
Script para upload em massa de cores do arquivo CSV para MySQL
Arquivo: bases/cores/cores_mass_upload.csv
"""

import mysql.connector
import csv
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def connect_to_database():
    """Conecta ao banco de dados MySQL"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'data_management')
        )
        print("✅ Conectado ao banco de dados MySQL")
        return connection
    except mysql.connector.Error as err:
        print(f"❌ Erro ao conectar ao banco de dados: {err}")
        return None

def insert_cor(cursor, nome, legado):
    """Insere uma cor no banco de dados"""
    try:
        query = """
        INSERT INTO cores (nome, legado, ativo, created_at, updated_at)
        VALUES (%s, %s, 1, NOW(), NOW())
        """
        cursor.execute(query, (nome.strip(), legado.strip() if legado else None))
        return True
    except mysql.connector.Error as err:
        print(f"❌ Erro ao inserir cor '{nome}': {err}")
        return False

def main():
    """Função principal"""
    csv_file = 'bases/cores/cores_mass_upload.csv'

    # Verificar se o arquivo existe
    if not os.path.exists(csv_file):
        print(f"❌ Arquivo {csv_file} não encontrado!")
        return

    # Conectar ao banco de dados
    connection = connect_to_database()
    if not connection:
        return

    cursor = connection.cursor()

    try:
        # Ler arquivo CSV
        print(f"📖 Lendo arquivo {csv_file}...")
        with open(csv_file, 'r', encoding='utf-8') as file:
            # Detectar delimitador automaticamente
            sample = file.read(1024)
            file.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            print(f"🔍 Delimitador detectado: '{delimiter}'")

            csv_reader = csv.DictReader(file, delimiter=delimiter)

            # Verificar colunas disponíveis
            print(f"📋 Colunas encontradas: {csv_reader.fieldnames}")

            inserted_count = 0
            skipped_count = 0

            for row_num, row in enumerate(csv_reader, start=2):
                # Extrair dados (o CSV tem colunas 'Cor' e 'legado')
                nome = row.get('Cor') or row.get('nome')
                legado = row.get('legado')

                if not nome:
                    print(f"⚠️  Linha {row_num}: Nome da cor não encontrado, pulando...")
                    skipped_count += 1
                    continue

                if insert_cor(cursor, nome, legado):
                    inserted_count += 1
                    if inserted_count % 100 == 0:
                        print(f"✅ {inserted_count} cores inseridas...")
                else:
                    skipped_count += 1

        # Commit das alterações
        connection.commit()
        print("
✅ Upload concluído!"        print(f"📊 Total inserido: {inserted_count}")
        print(f"⏭️  Total pulado: {skipped_count}")

    except Exception as e:
        print(f"❌ Erro durante o processamento: {e}")
        connection.rollback()

    finally:
        cursor.close()
        connection.close()
        print("🔌 Conexão com banco de dados fechada")

if __name__ == "__main__":
    print("🚀 Iniciando upload em massa de cores...")
    main()
    print("🏁 Script finalizado!")