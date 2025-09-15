import os
import csv
import re
from pathlib import Path

def parse_line(line):
    """
    Parse uma linha de dados do arquivo TXT usando análise estrutural
    """
    # Debug: mostrar a linha e seu comprimento
    print(f"Linha: '{line}'")
    print(f"Comprimento: {len(line)}")
    
    if len(line.strip()) == 0:  # Linha vazia
        return None

    try:
        # Dividir por espaços múltiplos
        parts = re.split(r'\s+', line.strip())
        print(f"Partes encontradas: {len(parts)} - {parts}")
        
        if len(parts) < 14:
            print(f"Linha tem apenas {len(parts)} partes, esperado pelo menos 14")
            return None
        
        # Análise baseada na estrutura observada:
        # ['1.01.A.001', '0700278', 'STEIN', '-', '3110', '1', '000', '5', '42,00', 'MARROM', 'CLA', '7530240001200', 'MT', '8,400', '8,900']
        # localizacao, codigo, [apelido_parts], familia, qual, qmm, cor?, qtde, [desc_cor_parts], tam?, tamd?, embalagem_vol?, un, peso_liq, peso_bruto
        
        result = {}
        result['localizacao'] = parts[0]
        result['codigo'] = parts[1]
        
        # Apelido pode ter 2-4 partes (STEIN - 3110)
        if len(parts) >= 15:
            # Caso com 15 partes
            result['apelido'] = ' '.join(parts[2:6])  # STEIN - 3110
            result['familia'] = parts[6]
            result['qual'] = parts[7]
            result['qmm'] = parts[8]
            result['cor'] = parts[9]
            result['qtde'] = parts[10].replace(',', '.')
            result['desc_cor'] = ' '.join(parts[11:13])  # MARROM CLA
            result['tam'] = parts[13]
            result['tamd'] = parts[14] if len(parts) > 14 else ''
            result['embalagem_vol'] = parts[15] if len(parts) > 15 else ''
            result['un'] = parts[16] if len(parts) > 16 else ''
            result['peso_liq'] = parts[17].replace(',', '.') if len(parts) > 17 else ''
            result['peso_bruto'] = parts[18].replace(',', '.') if len(parts) > 18 else ''
        else:
            # Caso com 14 partes - ajustar mapeamento
            result['apelido'] = ' '.join(parts[2:5])  # STEIN - 3110 (sem o '1')
            result['familia'] = parts[5]
            result['qual'] = parts[6]
            result['qmm'] = parts[7]
            result['cor'] = parts[8]
            result['qtde'] = parts[9].replace(',', '.')
            result['desc_cor'] = ' '.join(parts[10:12])  # CAPUCCINO ou DES2207 A
            result['tam'] = parts[12]
            result['tamd'] = parts[13] if len(parts) > 13 else ''
            result['embalagem_vol'] = parts[14] if len(parts) > 14 else ''
            result['un'] = parts[15] if len(parts) > 15 else ''
            result['peso_liq'] = parts[16].replace(',', '.') if len(parts) > 16 else ''
            result['peso_bruto'] = parts[17].replace(',', '.') if len(parts) > 17 else ''
        
        print(f"Parseado: {result}")
        return result
        
    except (IndexError, ValueError) as e:
        print(f"Erro no parse: {e}")
        return None

def process_file(input_file, output_file):
    """
    Processa um arquivo TXT e converte para CSV
    """
    data_rows = []

    with open(input_file, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    # Pular cabeçalhos até chegar aos dados
    data_started = False

    for line in lines:
        line = line.rstrip()

        # Detectar início dos dados (linha após os cabeçalhos)
        if 'LOCALIZAC.' in line and 'CODIGO' in line:
            data_started = True
            continue

        # Pular linha separadora
        if data_started and '-' * 10 in line:
            continue

        # Processar dados
        if data_started and line.strip():
            print(f"Linha: {repr(line)}")
            print(f"Comprimento: {len(line)}")
            parsed = parse_line(line)
            if parsed:
                data_rows.append(parsed)
                print(f"Parseado: {parsed}")
            else:
                print("Falha no parse")
            break  # Só processar a primeira linha para debug

    # Salvar como CSV
    if data_rows:
        fieldnames = ['localizacao', 'codigo', 'apelido', 'familia', 'qual', 'qmm', 'cor',
                     'qtde', 'desc_cor', 'tam', 'tamd', 'embalagem_vol', 'un', 'peso_liq', 'peso_bruto']

        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data_rows)

        print(f"Processado {input_file} -> {output_file} ({len(data_rows)} linhas)")
        return len(data_rows)
    else:
        print(f"Nenhum dado encontrado em {input_file}")
        return 0

def main():
    # Diretório dos arquivos de entrada
    input_dir = Path('bases/estoque')
    output_dir = Path('bases/estoque_csv')

    # Criar diretório de saída se não existir
    output_dir.mkdir(exist_ok=True)

    # Arquivos a processar
    files_to_process = [
        'confec01.txt',
        'estsc01.txt',
        'fatex01.txt',
        'tecido01.txt'
    ]

    total_rows = 0

    for filename in files_to_process:
        input_file = input_dir / filename
        output_file = output_dir / filename.replace('.txt', '.csv')

        if input_file.exists():
            rows = process_file(input_file, output_file)
            total_rows += rows
        else:
            print(f"Arquivo não encontrado: {input_file}")

    print(f"\nProcessamento concluído! Total de {total_rows} linhas processadas.")
    print(f"Arquivos CSV salvos em: {output_dir}")

if __name__ == "__main__":
    main()