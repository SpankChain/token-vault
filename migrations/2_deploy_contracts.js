const SpankToken = artifacts.require('./HumanStandardToken.sol')
const TokenVault = artifacts.require('./TokenVault.sol')

let token

let tSupply = 1000000000000000000000000000
let name = 'SPANK'
let decimals = 18
let symbol = 'SPANK'

let endFreeze = 1515112200 //Math.floor(new Date().getTime()/1000)+20000
let tokensInVault = 13641311623900000000000000

module.exports = function(deployer) {
  SpankToken.new(tSupply, name, decimals, symbol).then((res) => {
    token = res.address
    console.log('Spank Token: '+ token)
    TokenVault.new(endFreeze, token, tokensInVault).then((res) => {
      console.log('Token Vault: '+ res.address)
    })
  })
}
