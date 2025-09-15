#!/usr/bin/env python3
"""
EXPORTADOR DE TABELAS MYSQL PARA SQL
====================================

Script para exportar todas as tabelas do banco de dados MySQL para arquivos SQL separados.
Cada arquivo contém a estrutura da tabela (CREATE TABLE) e todos os dados (INSERT INTO).

Autor: GitHub Copilot
Data: 2025-09-15
"""

import mysql.connector
import os
from pathlib import Path
import datetime

def conectar_banco():
    """Conecta ao banco de dados MySQL"""
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='root',
            password='123456789',
            database='datalake'
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Erro ao conectar ao banco: {err}")
        return None

def obter_todas_tabelas(conn):
    """Obtém lista de todas as tabelas do banco"""
    try:
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tabelas = cursor.fetchall()
        return [tabela[0] for tabela in tabelas]
    except mysql.connector.Error as err:
        print(f"Erro ao obter tabelas: {err}")
        return []

def obter_estrutura_tabela(conn, tabela):
    """Obtém a estrutura CREATE TABLE de uma tabela"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SHOW CREATE TABLE {tabela}")
        resultado = cursor.fetchone()
        return resultado[1] if resultado else None
    except mysql.connector.Error as err:
        print(f"Erro ao obter estrutura da tabela {tabela}: {err}")
        return None

def obter_dados_tabela(conn, tabela):
    """Obtém todos os dados de uma tabela"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {tabela}")
        colunas = [desc[0] for desc in cursor.description]
        dados = cursor.fetchall()
        return colunas, dados
    except mysql.connector.Error as err:
        print(f"Erro ao obter dados da tabela {tabela}: {err}")
        return None, []

def escapar_valor_sql(valor):
    """Escapa valores para uso em SQL"""
    if valor is None:
        return 'NULL'
    elif isinstance(valor, str):
        # Escapa aspas simples e caracteres especiais
        return f"'{valor.replace(chr(39), chr(39)+chr(39))}'"
    elif isinstance(valor, datetime.datetime):
        return f"'{valor.strftime('%Y-%m-%d %H:%M:%S')}'"
    elif isinstance(valor, datetime.date):
        return f"'{valor.strftime('%Y-%m-%d')}'"
    else:
        return str(valor)

def criar_arquivo_sql(tabela, estrutura, colunas, dados, pasta_saida):
    """Cria arquivo SQL para uma tabela"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    nome_arquivo = f"{tabela}_{timestamp}.sql"
    caminho_arquivo = Path(pasta_saida) / nome_arquivo

    try:
        with open(caminho_arquivo, 'w', encoding='utf-8') as arquivo:
            # Cabeçalho
            arquivo.write(f"-- Exportação da tabela {tabela}\n")
            arquivo.write(f"-- Gerado em: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            arquivo.write("--\n\n")

            # Estrutura da tabela
            arquivo.write(f"-- Estrutura da tabela {tabela}\n")
            arquivo.write(f"{estrutura};\n\n")

            # Dados da tabela
            if dados:
                arquivo.write(f"-- Dados da tabela {tabela}\n")
                valores = []
                for linha in dados:
                    valores_linha = [escapar_valor_sql(valor) for valor in linha]
                    valores.append(f"({', '.join(valores_linha)})")

                # Quebrar em grupos de 1000 inserts para evitar arquivos muito grandes
                grupo_size = 1000
                for i in range(0, len(valores), grupo_size):
                    grupo = valores[i:i + grupo_size]
                    arquivo.write(f"INSERT INTO {tabela} ({', '.join(colunas)}) VALUES\n")
                    arquivo.write(",\n".join(grupo))
                    arquivo.write(";\n\n")

        return caminho_arquivo, len(dados)

    except Exception as e:
        print(f"Erro ao criar arquivo SQL para {tabela}: {e}")
        return None, 0

def main():
    """Função principal"""
    print("🔄 EXPORTADOR DE TABELAS MYSQL PARA SQL")
    print("=" * 50)
    print(f"📅 Data/Hora: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Conectar ao banco
    conn = conectar_banco()
    if not conn:
        print("❌ Falha na conexão com o banco de dados!")
        return

    try:
        # Criar pasta de saída
        pasta_saida = Path("scripts/sql_exports")
        pasta_saida.mkdir(exist_ok=True)

        # Obter todas as tabelas
        tabelas = obter_todas_tabelas(conn)
        if not tabelas:
            print("❌ Nenhuma tabela encontrada!")
            return

        print(f"Encontradas {len(tabelas)} tabelas: {', '.join(tabelas)}")
        print()

        # Processar cada tabela
        arquivos_criados = []
        total_registros = 0

        for i, tabela in enumerate(tabelas, 1):
            print(f"[{i}/{len(tabelas)}] Processando tabela: {tabela}")

            # Obter estrutura
            estrutura = obter_estrutura_tabela(conn, tabela)
            if not estrutura:
                print(f"  ⚠️  Não foi possível obter estrutura da tabela {tabela}")
                continue

            # Obter dados
            colunas, dados = obter_dados_tabela(conn, tabela)
            if colunas is None:
                print(f"  ⚠️  Não foi possível obter dados da tabela {tabela}")
                continue

            # Criar arquivo SQL
            caminho_arquivo, num_registros = criar_arquivo_sql(
                tabela, estrutura, colunas, dados, pasta_saida
            )

            if caminho_arquivo:
                print(f"  ✅ Arquivo criado: {caminho_arquivo.name}")
                print(f"     - {num_registros} registros exportados")
                arquivos_criados.append(caminho_arquivo.name)
                total_registros += num_registros
            else:
                print(f"  ❌ Falha ao criar arquivo para {tabela}")

        # Resumo final
        print("\n📊 RESUMO DA EXPORTAÇÃO:")
        print(f"   • Total de tabelas processadas: {len(tabelas)}")
        print(f"   • Arquivos SQL criados: {len(arquivos_criados)}")
        print(f"   • Localização dos arquivos: {pasta_saida}")

        if arquivos_criados:
            print("\n📁 ARQUIVOS CRIADOS:")
            for arquivo in arquivos_criados:
                print(f"   • {pasta_saida}/{arquivo}")

        print("\n✅ Exportação concluída!")
        print("\n💡 DICAS:")
        print("   • Os arquivos SQL podem ser usados para restaurar as tabelas")
        print("   • Execute os arquivos na ordem correta (estruturas primeiro)")
        print("   • Verifique os arquivos antes de usar em produção")

    except Exception as e:
        print(f"❌ Erro durante a exportação: {e}")

    finally:
        if conn:
            conn.close()
            print("\n🔌 Conexão com banco fechada.")

if __name__ == "__main__":
    main()