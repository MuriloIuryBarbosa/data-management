const http = require('http');

// Teste de atualização de ordem de compra com histórico
const postData = 'familia_id=1&tamanho_id=1&cor_id=1&quantidade=150&unidade_medida=un&valor_compra_brl=55&cotacao_dolar=5&etd_planejado=2025-01-20&etd_proposto=&etd_real=';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/planejamento/ordem-compra/1', // Atualizar ordem com ID 1
  method: 'PUT',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTgwMjQ4NjYsImV4cCI6MTc1ODAyODQ2Nn0.AHexvxINIOSSuj2oFIF4skBc1WhcT0EGSiXOTbMlncU'
  }
};

console.log('Testando atualização de ordem de compra com registro de histórico...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 302) {
      console.log('✅ Ordem de compra atualizada com sucesso!');
      console.log('🔄 Redirecionando para:', res.headers.location);
    } else {
      console.log('❌ Falha na atualização:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.write(postData);
req.end();