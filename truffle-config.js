require('babel-register');
require('babel-polyfill');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const privateKeys = fs.readFileSync(".secret").toString().trim().split("\n");
const BSCSCANAPIKEY = fs.readFileSync(".bscscanapikey").toString().trim()
//console.log(privateKeys);
module.exports = {
  networks: {

    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 1000000000000000,
      gasPrice: 1
    },
     testnet: {
      provider: () => new HDWalletProvider(privateKeys, `https://data-seed-prebsc-1-s1.binance.org:8545`, 0, 2),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 1000000,
      gasPrice: 10000000000,
      gas: 10000000
    },
    bsc: {
      provider: () => new HDWalletProvider(prrivateKeys, `https://bsc-dataseed1.binance.org`),
      network_id: 56,
      confirmations: 10,
      timeoutBlocks: 200,
      gasPrice: 5000000000,
      skipDryRun: true
    },
  },
  contracts_directory: './src/contracts/',
  contracts_build_directory: './src/abis/',
  compilers: {
    solc: {
      version: "^0.8.4",
      optimizer: {
        enabled: true,
        runs: 100
      },
      evmVersion: "petersburg"
    }
  },
  plugins: [
    'truffle-plugin-verify',
    "truffle-contract-size"
  ],
  api_keys: {
    etherscan: BSCSCANAPIKEY
  }
  // truffle migrate --reset --network testnet && truffle run verify Bitstream --network testnet
  // truffle run contract-size
}
