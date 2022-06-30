const axios = require('axios');
const cron = require('node-cron');

const getAirDrop = (public_address) => {
  axios
    .post('https://api.devnet.solana.com/', {
      jsonrpc: '2.0',
      id: '74eb6fc9-7746-4840-89a4-2beb2792427a',
      method: 'requestAirdrop',
      params: [public_address, 2000000000],
    })
    .then((res) => {
      console.log(res.status);
      console.log(res.data);
    })
    .catch((error) => {
      console.error(error.message);
    });
};

const your_account = 'HygccArxQZvqtF7GS9SitF4g34FTNUUXWJ4F4WwH3kao';

cron.schedule('*/20 * * * * *', function () {
  getAirDrop(your_account);
});
