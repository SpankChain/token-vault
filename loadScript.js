'use strict'

let path = require('path')
let loader = require('csv-load-sync')

const TokenVault = artifacts.require("./TokenVault.sol")
const Token = artifacts.require("./HumanStandardToken.sol")

let endFreeze = Math.floor(new Date().getTime()/1000)+20000
let tokensInVault = 15641731623900000000000000
let tokenAddress = '0x112f37baab2ad28c9dd1c978f8cb4c65ac41b696'
let vaultAddress = '0xac56c6bacc042bb9569368539459d36594b654b6'

let csvFile = '/investors.csv'
let csv = loader(path.join(__dirname, csvFile))

module.exports = async function(cb) {
  let token = Token.at(tokenAddress)
  let vault = TokenVault.at(vaultAddress)
  let address

  console.log('Start loading vault...')
  for(let line of csv) {
    // call to check if this address is already loaded incase of crash
    let isLoaded = await vault.balances(line.address)
    address = line.address
    if(isLoaded == 0) {
      let wei = web3.toWei(parseFloat(line.amount, 'ether'))
      await vault.setInvestor(address, wei)
      console.log('loaded investor: '+address+' SPANK: '+wei)     
    } else {
      console.log('skipped investor: '+address+' Loaded SPANK: '+isLoaded)
    }  
  }

  let loaded = await vault.tokensAllocatedTotal()
  console.log('Script finished loading: '+ loaded.toString(10) + ' Tokens')

  let locked = await vault.lockedAt()

  if(locked.toNumber() == 0) {
    // don't transfer in load script for mainnet deploy, this will be done
    // by hand
    //console.log('Transfering tokens to vault...')
    //await token.transfer(vault.address, tokensInVault)
    console.log('Locking vault...')
    await vault.lock()
    let locked = await vault.lockedAt()
    let state = await vault.getState()
    console.log('Vault locked at: ' + locked)
  }
};
