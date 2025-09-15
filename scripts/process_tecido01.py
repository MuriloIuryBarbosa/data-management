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

def criar_tabela_tecido01():
    """Cria a tabela estoque_tecido01 se não existir"""
    conn = conectar_banco()
    if not conn:
        return False

    try:
        cursor = conn.cursor()

        # Dropar tabela se existir para recriar com estrutura correta
        cursor.execute("DROP TABLE IF EXISTS estoque_tecido01")

        # Criar tabela com estrutura correta
        create_table_sql = """
        CREATE TABLE estoque_tecido01 (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tipo VARCHAR(20),
            produto VARCHAR(50),
            codigo_produto VARCHAR(50),
            entrada DATE,
            qualidade VARCHAR(10),
            metros DECIMAL(10,2),
            lancamento DATE,
            oper VARCHAR(20),
            peso DECIMAL(10,3),
            un VARCHAR(10),
            localizacao VARCHAR(20),
            nota VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """

        cursor.execute(create_table_sql)
        conn.commit()
        print("Tabela estoque_tecido01 criada/verificada com sucesso!")
        return True

    except mysql.connector.Error as err:
        print(f"Erro ao criar tabela: {err}")
        return False
    finally:
        if conn:
            conn.close()

def parse_line_tecido01(line):
    """
    Faz o parse de uma linha do arquivo tecido01.txt usando posições fixas
    """
    line = line.rstrip()

    # Ignorar linhas vazias, cabeçalhos, separadores e totais
    if not line.strip():
        return None

    if line.startswith('CORTTEX') or line.startswith('LOCALIZAC') or line.startswith('---') or 'TOTAL QUAL' in line:
        return None

    # Verificar se é uma linha de localização (padrão: 1.08.A.001 TLS)
    if len(line) > 10 and line[1] == '.' and 'TLS' in line:
        return None

    # Verificar se começa com tipo válido (TEC ACAB, etc.)
    if not (line.startswith('TEC ACAB') or line.startswith('TEC CRU') or line.startswith('MALHA') or line.startswith('FIAPO')):
        return None

    try:
        # Mapear campos por posições fixas baseado na análise da linha
        # TEC ACAB           2.855-72/0 080.6481-01 14/04/24          1 A               62,00       11/08/25      676           37,200      MT 1.08.A.001  559005

        tipo = line[0:10].strip()  # TEC ACAB
        produto = line[11:25].strip()  # 2.855-72/0
        codigo = line[26:40].strip()  # 080.6481-01

        # Data de entrada - posições aproximadas
        entrada_str = line[41:50].strip()
        entrada = None
        if entrada_str and '/' in entrada_str:
            try:
                # Converter formato DD/MM/YY para YYYY-MM-DD
                dia, mes, ano = entrada_str.split('/')
                entrada = f"20{ano}-{mes.zfill(2)}-{dia.zfill(2)}"
            except:
                entrada = None

        qualidade = line[51:55].strip()  # 1

        # Metros - procurar pelo padrão numérico após "A"
        metros_str = ""
        metros_start = line.find('A', 50) + 2
        if metros_start > 1:
            metros_end = line.find(',', metros_start)
            if metros_end == -1:
                metros_end = metros_start + 10
            metros_str = line[metros_start:metros_end + 3].strip()

        metros = None
        if metros_str:
            try:
                metros = float(metros_str.replace(',', '.'))
            except:
                metros = None

        # Data de lançamento
        lancamento_str = line[71:80].strip()
        lancamento = None
        if lancamento_str and '/' in lancamento_str:
            try:
                dia, mes, ano = lancamento_str.split('/')
                lancamento = f"20{ano}-{mes.zfill(2)}-{dia.zfill(2)}"
            except:
                lancamento = None

        oper = line[81:90].strip()  # 676

        # Peso
        peso_str = line[91:100].strip()
        peso = None
        if peso_str:
            try:
                peso = float(peso_str.replace(',', '.'))
            except:
                peso = None

        un = line[101:105].strip()  # MT

        localizacao = line[106:115].strip()  # 1.08.A.001

        nota = line[116:125].strip()  # 559005

        return {
            'tipo': tipo,
            'produto': produto,
            'codigo': codigo,
            'entrada': entrada,
            'qualidade': qualidade,
            'metros': metros,
            'lancamento': lancamento,
            'oper': oper,
            'peso': peso,
            'un': un,
            'localizacao': localizacao,
            'nota': nota
        }

    except Exception as e:
        print(f"Erro ao fazer parse da linha: {e}")
        print(f"Linha problemática: '{line}'")
        return None

def processar_tecido01():
    """Processa o arquivo tecido01.txt e insere no banco de dados"""
    arquivo_entrada = Path('bases/estoque/tecido01.txt')

    if not arquivo_entrada.exists():
        print(f"Arquivo {arquivo_entrada} não encontrado!")
        return

    # Criar tabela se necessário
    if not criar_tabela_tecido01():
        print("Erro ao criar/verificar tabela!")
        return

    conn = conectar_banco()
    if not conn:
        return

    try:
        cursor = conn.cursor()

        dados_inseridos = 0
        linhas_processadas = 0

        print("Iniciando processamento do arquivo tecido01.txt...")

        with open(arquivo_entrada, 'r', encoding='utf-8', errors='ignore') as f:
            for linha_num, line in enumerate(f, 1):
                linhas_processadas += 1

                # Mostrar progresso a cada 1000 linhas
                if linhas_processadas % 1000 == 0:
                    print(f"Processadas {linhas_processadas} linhas...")

                dados = parse_line_tecido01(line)

                if dados:
                    try:
                        insert_sql = """
                        INSERT INTO estoque_tecido01
                        (tipo, produto, codigo_produto, entrada, qualidade, metros, lancamento, oper, peso, un, localizacao, nota)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """

                        valores = (
                            dados['tipo'],
                            dados['produto'],
                            dados['codigo'],
                            dados['entrada'],
                            dados['qualidade'],
                            dados['metros'],
                            dados['lancamento'],
                            dados['oper'],
                            dados['peso'],
                            dados['un'],
                            dados['localizacao'],
                            dados['nota']
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
        conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    processar_tecido01()