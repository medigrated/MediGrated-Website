const axios = require('axios');

axios.post('http://localhost:5000/api/reports/analyze')
  .catch(e => {
    console.log('error', e.message);
    if (e.toJSON) console.log('json', e.toJSON());
    else console.log(e);
  });
