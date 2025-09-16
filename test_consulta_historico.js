const http = require('http');

// Teste de consulta do histórico de uma ordem de compra
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/planejamento/ordem-compra/1/historico', // Histórico da ordem com ID 1
  method: 'GET',
  headers: {
    'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTgwMjQ4NjYsImV4cCI6MTc1ODAyODQ2Nn0.AHexvxINIOSSuj2oFIF4skBc1WhcT0EGSiXOTbMlncU'
  }
};

console.log('Testando consulta do histórico de ordem de compra...');

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Histórico consultado com sucesso!');
      console.log('📄 Conteúdo da página:', body.substring(0, 500) + '...');
    } else {
      console.log('❌ Falha na consulta:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.end();