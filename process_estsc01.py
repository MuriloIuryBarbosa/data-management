import mysql.connector
import os
from pathlib import Path

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

def criar_tabela_estsc01():
    """Cria a tabela estoque_estsc01 se não existir"""
    conn = conectar_banco()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        # Verificar se a tabela já tem dados
        try:
            cursor.execute("SELECT COUNT(*) FROM estoque_estsc01")
            count = cursor.fetchone()[0]
            if count > 0:
                print(f"Tabela estoque_estsc01 já tem {count} registros. Pulando processamento...")
                return True
        except mysql.connector.Error:
            # Tabela não existe, será criada
            pass

        # Dropar tabela se existir para recriar com estrutura correta
        cursor.execute("DROP TABLE IF EXISTS estoque_estsc01")

        # Criar tabela com estrutura idêntica ao fatex01
        create_table_sql = """
        CREATE TABLE estoque_estsc01 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            localizacao VARCHAR(20),
            codigo VARCHAR(20),
            apelido VARCHAR(50),
            familia VARCHAR(10),
            qual VARCHAR(10),
            qmm VARCHAR(10),
            cor VARCHAR(10),
            qtde DECIMAL(10,2),
            desc_cor VARCHAR(50),
            tam VARCHAR(10),
            tamd VARCHAR(10),
            embalagem_vol VARCHAR(50),
            un VARCHAR(10),
            peso_liq DECIMAL(10,3),
            peso_bruto DECIMAL(10,3),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """

        cursor.execute(create_table_sql)
        conn.commit()
        print("Tabela estoque_estsc01 criada/verificada com sucesso!")
        return True

    except mysql.connector.Error as err:
        print(f"Erro ao criar tabela: {err}")
        return False
    finally:
        if conn:
            conn.close()

def parse_line_estsc01(line):
    """
    Faz o parse de uma linha do arquivo estsc01.txt usando posições fixas
    (mesma estrutura do fatex01.txt)
    """
    line = line.rstrip()

    # Ignorar linhas vazias, cabeçalhos, separadores e totais
    if not line.strip():
        return None

    if line.startswith('CORTTEX') or line.startswith('MAPEAMENTO') or line.startswith('PERIODO') or line.startswith('LOCALIZAC') or line.startswith('---') or 'TOTAL' in line:
        return None

    # Verificar se é uma linha de localização válida (padrão: 1.01.A.001)
    if len(line) > 10 and line[1] == '.' and not line.startswith(' '):
        try:
            # Mapear campos por posições fixas baseado na análise da linha
            # Exemplo: 1.01.A.001 0700278 STEIN - 3110           1 000    5          42,00 MARROM CLA                 7530240001200 MT       8,400        8,900

            localizacao = line[0:10].strip()
            codigo = line[11:19].strip()
            apelido = line[20:44].strip()
            familia = line[45:47].strip()
            qual = line[48:51].strip()
            qmm = line[52:55].strip()
            cor = line[56:59].strip()
            qtde_str = line[60:69].strip()
            desc_cor = line[70:94].strip()
            tam = line[95:98].strip()
            tamd = line[99:103].strip()
            embalagem_vol = line[104:119].strip()
            un = line[120:122].strip()
            peso_liq_str = line[123:132].strip()
            peso_bruto_str = line[133:142].strip()

            # Converter valores numéricos
            qtde = None
            if qtde_str:
                try:
                    qtde = float(qtde_str.replace(',', '.'))
                except:
                    qtde = None

            peso_liq = None
            if peso_liq_str:
                try:
                    peso_liq = float(peso_liq_str.replace(',', '.'))
                except:
                    peso_liq = None

            peso_bruto = None
            if peso_bruto_str:
                try:
                    peso_bruto = float(peso_bruto_str.replace(',', '.'))
                except:
                    peso_bruto = None

            return {
                'localizacao': localizacao,
                'codigo': codigo,
                'apelido': apelido,
                'familia': familia,
                'qual': qual,
                'qmm': qmm,
                'cor': cor,
                'qtde': qtde,
                'desc_cor': desc_cor,
                'tam': tam,
                'tamd': tamd,
                'embalagem_vol': embalagem_vol,
                'un': un,
                'peso_liq': peso_liq,
                'peso_bruto': peso_bruto
            }

        except Exception as e:
            print(f"Erro ao fazer parse da linha: {e}")
            print(f"Linha problemática: '{line}'")
            return None
    else:
        return None

def processar_estsc01():
    """Processa o arquivo estsc01.txt e insere no banco de dados"""
    arquivo_entrada = Path('bases/estoque/estsc01.txt')

    if not arquivo_entrada.exists():
        print(f"Arquivo {arquivo_entrada} não encontrado!")
        return

    # Criar tabela se necessário
    if not criar_tabela_estsc01():
        print("Erro ao criar/verificar tabela!")
        return

    conn = conectar_banco()
    if not conn:
        return

    # Habilitar autocommit para commits automáticos
    conn.autocommit = True

    try:
        cursor = conn.cursor()

        dados_inseridos = 0
        linhas_processadas = 0

        print("Iniciando processamento do arquivo estsc01.txt...")

        with open(arquivo_entrada, 'r', encoding='utf-8', errors='ignore') as f:
            for linha_num, line in enumerate(f, 1):
                linhas_processadas += 1

                # Mostrar progresso a cada 1000 linhas
                if linhas_processadas % 1000 == 0:
                    print(f"Processadas {linhas_processadas} linhas...")

                dados = parse_line_estsc01(line)

                if dados:
                    try:
                        insert_sql = """
                        INSERT INTO estoque_confec01
                        (localizacao, codigo, apelido, familia, qual, qmm, cor, qtde, desc_cor, tam, tamd, embalagem_vol, un, peso_liq, peso_bruto)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """

                        valores = (
                            dados['localizacao'],
                            dados['codigo'],
                            dados['apelido'],
                            dados['familia'],
                            dados['qual'],
                            dados['qmm'],
                            dados['cor'],
                            dados['qtde'],
                            dados['desc_cor'],
                            dados['tam'],
                            dados['tamd'],
                            dados['embalagem_vol'],
                            dados['un'],
                            dados['peso_liq'],
                            dados['peso_bruto']
                        )

                        cursor.execute(insert_sql, valores)
                        dados_inseridos += 1

                    except mysql.connector.Error as err:
                        print(f"Erro ao inserir linha {linha_num}: {err}")
                        print(f"Dados: {dados}")

        conn.commit()
        print("\nProcessamento concluído!")
        print(f"Linhas processadas: {linhas_processadas}")
        print(f"Dados inseridos: {dados_inseridos}")

    except Exception as e:
        print(f"Erro durante processamento: {e}")
        # Não fazer rollback automático para preservar commits parciais
        # conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    processar_estsc01()