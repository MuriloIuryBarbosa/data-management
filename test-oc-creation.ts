const http = require('http');

const postData = JSON.stringify({
  ordemCompra: {
    fornecedor: "Teste Fornecedor",
    observacoes: "Teste de criação via API"
  },
  itens: [{
    familia_id: 1,
    tamanho_id: 1,
    cor_id: 1,
    quantidade: 10,
    unidade_medida: "un",
    valor_unitario_brl: 5.00,
    cotacao_dolar: 5.00,
    etd_planejado: "2025-12-31"
  }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/planejamento/ordem-compra',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Response:', data);
    } catch (e) {
      console.log('Raw response:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();