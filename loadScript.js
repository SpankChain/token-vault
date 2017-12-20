'use strict'

let path = require('path')
let loader = require('csv-load-sync')

const TokenVault = artifacts.require("./TokenVault.sol")
const Token = artifacts.require("./HumanStandardToken.sol")

let endFreeze = Math.floor(new Date().getTime()/1000)+20000
let tokensInVault = 101399935000000000000000
let tokenAddress = '0x105b93e9aba04a88d066e4bfb4b26d0182118503'
let vaultAddress = '0x7fdba4dcd8e15fc2ae9f6fa78bd08b14bb946e2d'

let csvFile = '/investors.csv'
let csv = loader(path.join(__dirname, csvFile))

module.exports = async function(cb) {
  let token = Token.at(tokenAddress)
  let vault = TokenVault.at(vaultAddress)

  console.log('Start loading vault...')
  for(let line of csv) {
    // todo: do a call to check if this address is already loaded incase of crash
    let wei = web3.toWei(parseFloat(line.amount, 'ether'))
    let address = line.address
    await vault.setInvestor(address, wei)
    console.log('loaded investor: '+address+' SPANK: '+wei)  
  }

  let loaded = await vault.tokensAllocatedTotal()
  console.log('Script finished loading: '+ loaded.toString(10) + ' Tokens')
  console.log('Transfering tokens to vault...')
  await token.transfer(vault.address, tokensInVault)
  console.log('Locking vault...')
  await vault.lock()
  let locked = await vault.lockedAt()
  let state = await vault.getState()
  console.log('Vault locked at: ' + locked)
};