const http = require('http');

function testSimpleRoute() {
  console.log('Testando rota simples...');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('Status da resposta simples:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Resposta simples recebida, tamanho:', data.length);
      if (data.length < 200) {
        console.log('Conteúdo:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Erro na requisição simples:', e.message);
  });

  req.end();
}

function testApproval() {
  console.log('Testando aprovação da ordem de compra ID 1...');

  const postData = JSON.stringify({});

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/planejamento/ordem-compra/1/approve',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status da resposta:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Resposta completa recebida');
      try {
        const jsonData = JSON.parse(data);
        console.log('Dados JSON:', jsonData);
      } catch (e) {
        console.log('Resposta não-JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Erro na requisição:', e.message);
  });

  req.write(postData);
  req.end();
}

// Testar rota simples primeiro
testSimpleRoute();

// Aguardar um pouco e testar a aprovação
setTimeout(testApproval, 1000);