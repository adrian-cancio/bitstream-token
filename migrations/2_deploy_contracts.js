const Token = artifacts.require("Bitstream");
const BN = require('BN.js');

function tokens(n){
    return web3.utils.toWei(n,'ether');
}

module.exports = async function(deployer) {

    // Deploy Token
    await deployer.deploy(Token);
    const token = await Token.deployed();
}
/*
token = await Token.deployed()
bnbSwap = await BnbSwap.deployed()
balance = await token.balanceOf(bnbSwap.address)
*/