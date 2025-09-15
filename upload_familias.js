#!/usr/bin/env node

/**
 * Script para upload em massa de famílias do arquivo CSV para MySQL
 * Arquivo: bases/familias/familias_mass_upload.csv
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Carregar variáveis de ambiente
require('dotenv').config();

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

async function insertFamilia(connection, nome, descricao, legado) {
  try {
    const query = `
      INSERT INTO familia (nome, descricao, legado, ativo, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `;
    await connection.execute(query, [
      nome.trim(),
      descricao ? descricao.trim() : null,
      legado ? legado.trim() : null
    ]);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao inserir família '${nome}':`, err.message);
    return false;
  }
}

async function processCSV() {
  const csvFile = 'bases/familias/familias_mass_upload.csv';

  // Verificar se o arquivo existe
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ Arquivo ${csvFile} não encontrado!`);
    return;
  }

  // Conectar ao banco de dados
  const connection = await connectToDatabase();
  if (!connection) return;

  try {
    console.log(`📖 Lendo arquivo ${csvFile}...`);

    const results = [];
    let insertedCount = 0;
    let skippedCount = 0;

    // Ler arquivo CSV
    const stream = fs.createReadStream(csvFile)
      .pipe(csv({ separator: ';' })) // Usar ponto e vírgula como separador
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`📊 Encontrados ${results.length} registros no CSV`);

        // Processar cada linha
        for (let i = 0; i < results.length; i++) {
          const row = results[i];

          // Extrair dados (o CSV tem colunas 'Codigo Familia', 'Familia' e 'legado')
          const nome = row.Familia || row.nome;
          const descricao = row['Codigo Familia'] || row.descricao;
          const legado = row.legado;

          if (!nome) {
            console.log(`⚠️  Linha ${i + 1}: Nome da família não encontrado, pulando...`);
            skippedCount++;
            continue;
          }

          if (await insertFamilia(connection, nome, descricao, legado)) {
            insertedCount++;
            if (insertedCount % 100 === 0) {
              console.log(`✅ ${insertedCount} famílias inseridas...`);
            }
          } else {
            skippedCount++;
          }
        }

        console.log('\n✅ Upload concluído!');
        console.log(`📊 Total inserido: ${insertedCount}`);
        console.log(`⏭️  Total pulado: ${skippedCount}`);

        await connection.end();
        console.log('🔌 Conexão com banco de dados fechada');
        process.exit(0);
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler arquivo CSV:', error.message);
        connection.end();
        process.exit(1);
      });

  } catch (error) {
    console.error('❌ Erro durante o processamento:', error.message);
    await connection.end();
    process.exit(1);
  }
}

// Executar o script
console.log('🚀 Iniciando upload em massa de famílias...');
processCSV();