#!/usr/bin/env node

/**
 * Script para importar dados dos arquivos de estoque para MySQL
 * Arquivos: bases/estoque/*.txt
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Carregar variáveis de ambiente
require('dotenv').config();

// Arquivos de estoque a serem processados
const arquivosEstoque = [
  { arquivo: 'confec01.txt', tabela: 'estoque_confec01' },
  { arquivo: 'estsc01.txt', tabela: 'estoque_estsc01' },
  { arquivo: 'fatex01.txt', tabela: 'estoque_fatex01' },
  { arquivo: 'tecido01.txt', tabela: 'estoque_tecido01' }
];

async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'data_management'
    });
    console.log('✅ Conectado ao banco de dados MySQL');
    return connection;
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    return null;
  }
}

async function limparTabela(connection, tabela) {
  try {
    await connection.execute(`DELETE FROM ${tabela}`);
    console.log(`🧹 Tabela ${tabela} limpa`);
  } catch (error) {
    console.error(`❌ Erro ao limpar tabela ${tabela}:`, error.message);
  }
}

async function processarArquivoEstoque(connection, arquivoInfo) {
  const { arquivo, tabela } = arquivoInfo;
  const caminhoArquivo = path.join(__dirname, 'bases', 'estoque', arquivo);

  console.log(`\n📂 Processando arquivo: ${arquivo}`);

  if (!fs.existsSync(caminhoArquivo)) {
    console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    return;
  }

  const fileStream = fs.createReadStream(caminhoArquivo);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let linhasProcessadas = 0;
  let linhasInseridas = 0;

  // Limpar tabela antes de inserir novos dados
  await limparTabela(connection, tabela);

  for await (const linha of rl) {
    linhasProcessadas++;

    // Pular linhas de cabeçalho e linhas vazias
    if (linhasProcessadas <= 5 || linha.trim() === '' || linha.includes('---') || linha.includes('TOTAL')) {
      continue;
    }

    try {
      let dados;

      if (tabela === 'estoque_tecido01') {
        // Processar linha do arquivo tecido01.txt
        dados = processarLinhaTecido01(linha);
      } else {
        // Processar linha dos outros arquivos (confec01, estsc01, fatex01)
        dados = processarLinhaEstoque(linha);
      }

      if (dados) {
        await inserirDadosEstoque(connection, tabela, dados);
        linhasInseridas++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${linhasProcessadas}:`, error.message);
    }

    // Mostrar progresso a cada 1000 linhas
    if (linhasProcessadas % 1000 === 0) {
      console.log(`📊 Progresso: ${linhasProcessadas} linhas processadas, ${linhasInseridas} inseridas`);
    }
  }

  console.log(`✅ Arquivo ${arquivo} processado: ${linhasInseridas} registros inseridos`);
}

function processarLinhaEstoque(linha) {
  // Exemplo de linha: "1.01.A.001 0700278 STEIN - 3110           1 000    5          42,00 MARROM CLA                 7530240001200 MT       8,400        8,900"

  const partes = linha.trim().split(/\s+/);

  if (partes.length < 15) {
    return null; // Linha não tem dados suficientes
  }

  return {
    localizacao: partes[0] || '',
    codigo: partes[1] || '',
    apelido: partes.slice(2, partes.length - 12).join(' ').trim(),
    qual: partes[partes.length - 12] || '',
    qmm: partes[partes.length - 11] || '',
    cor: partes[partes.length - 10] || '',
    qtde: parseFloat((partes[partes.length - 9] || '0').replace(',', '.')),
    desc_cor: partes[partes.length - 8] || '',
    tam: partes[partes.length - 7] || '',
    tamd: partes[partes.length - 6] || '',
    embalagem_vol: partes[partes.length - 5] || '',
    un: partes[partes.length - 4] || '',
    peso_liq: parseFloat((partes[partes.length - 3] || '0').replace(',', '.')),
    peso_bruto: parseFloat((partes[partes.length - 2] || '0').replace(',', '.'))
  };
}

function processarLinhaTecido01(linha) {
  // Exemplo de linha: "1.08.A.001 TLS       14321                ENTRADA         QUAL           M E T R O S     LANCAMENTO    OPER             PESO      UN LOCALIZAC.    NOTA"

  const partes = linha.trim().split(/\s+/);

  if (partes.length < 12) {
    return null; // Linha não tem dados suficientes
  }

  return {
    localizacao: partes[0] || '',
    tipo: partes[1] || '',
    produto: partes.slice(2, partes.length - 8).join(' ').trim(),
    entrada: partes[partes.length - 8] || null,
    qual: partes[partes.length - 7] || '',
    metros: parseFloat((partes[partes.length - 6] || '0').replace(',', '.')),
    lancamento: partes[partes.length - 5] || null,
    oper: partes[partes.length - 4] || '',
    peso: parseFloat((partes[partes.length - 3] || '0').replace(',', '.')),
    un: partes[partes.length - 2] || '',
    nota: partes[partes.length - 1] || ''
  };
}

async function inserirDadosEstoque(connection, tabela, dados) {
  let sql, values;

  if (tabela === 'estoque_tecido01') {
    sql = `INSERT INTO ${tabela} (localizacao, tipo, produto, entrada, qual, metros, lancamento, oper, peso, un, nota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      dados.localizacao,
      dados.tipo,
      dados.produto,
      dados.entrada,
      dados.qual,
      dados.metros,
      dados.lancamento,
      dados.oper,
      dados.peso,
      dados.un,
      dados.nota
    ];
  } else {
    sql = `INSERT INTO ${tabela} (localizacao, codigo, apelido, qual, qmm, cor, qtde, desc_cor, tam, tamd, embalagem_vol, un, peso_liq, peso_bruto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    values = [
      dados.localizacao,
      dados.codigo,
      dados.apelido,
      dados.qual,
      dados.qmm,
      dados.cor,
      dados.qtde,
      dados.desc_cor,
      dados.tam,
      dados.tamd,
      dados.embalagem_vol,
      dados.un,
      dados.peso_liq,
      dados.peso_bruto
    ];
  }

  await connection.execute(sql, values);
}

async function main() {
  console.log('🚀 Iniciando importação de dados de estoque...\n');

  const connection = await connectToDatabase();
  if (!connection) {
    process.exit(1);
  }

  try {
    for (const arquivoInfo of arquivosEstoque) {
      await processarArquivoEstoque(connection, arquivoInfo);
    }

    console.log('\n✅ Importação concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error.message);
  } finally {
    await connection.end();
    console.log('🔌 Conexão com banco de dados fechada');
  }
}

main().catch(console.error);