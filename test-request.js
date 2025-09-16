const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001, // Porta alterada
    path: '/teste-minimo',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.on('data', (chunk) => {
        console.log('Response data:', chunk.toString().substring(0, 200) + '...');
    });

    res.on('end', () => {
        console.log('Response ended');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();