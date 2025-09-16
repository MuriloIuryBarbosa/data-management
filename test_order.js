const http = require('http');

const postData = 'familia_id=1&tamanho_id=1&cor_id=1&quantidade=100&unidade_medida=un&valor_compra_brl=50&cotacao_dolar=5&etd_planejado=2025-01-15&etd_proposto=&etd_real=';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/planejamento/ordem-compra',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'Cookie': 'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTgwMjQ4NjYsImV4cCI6MTc1ODAyODQ2Nn0.AHexvxINIOSSuj2oFIF4skBc1WhcT0EGSiXOTbMlncU'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Location:', res.headers.location || 'No redirect');

  let body = '';
  res.on('data', (chunk) => {
    body += chunk.toString();
  });

  res.on('end', () => {
    if (res.statusCode === 302) {
      console.log('Order created successfully!');
    } else {
      console.log('Order creation failed');
      console.log('Response body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();