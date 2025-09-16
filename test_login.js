const http = require('http');

const postData = 'email=test@test.com&password=123456';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Location:', res.headers.location || 'No redirect');

  if (res.statusCode === 302) {
    console.log('Login successful!');
  } else {
    console.log('Login failed');
  }

  res.on('data', (chunk) => {
    // console.log('Body:', chunk.toString());
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();