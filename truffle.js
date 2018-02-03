require('babel-register')
require('babel-polyfill')

var test = true
var rinkeby = true
var account

if(test){
  account = "0x01da6f5f5c89f3a83cc6bebb0eafc1f1e1c4a303"
  if(rinkeby){
    account = "0x1e8524370b7caf8dc62e3effbca04ccc8e493ffe"
  }
}

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      from: account,
      //gas: 4612388
      gas: 4612388
    },
    rinkeby: {
      host: "localhost", // Connect to geth on the specified
      port: 8545,
      from: account, // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas:  4612388 // Gas limit used for deploys
    }
  }
};

// module.exports = {
//   networks: {
//     ropsten: {
//       host: "127.0.0.1",
//       port: 8545,
//       network_id: "3",
//       from: account,
//       gas: 4700000
//     },
//     mainnet: {
//       host: "127.0.0.1",
//       port: 8545,
//       network_id: "1",
//       gas: 4700000
//     }
//   }
// };
