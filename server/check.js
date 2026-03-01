const http = require('http');
setTimeout(() => {
  http.get('http://localhost:5000/', res => {
    console.log('status', res.statusCode);
    res.on('data', d => process.stdout.write(d));
    res.on('end', () => process.exit(0));
  }).on('error', e => { console.error('error', e.message); process.exit(1); });
}, 2000);
