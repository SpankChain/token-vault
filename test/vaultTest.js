'use strict'

import BigNumber from 'bignumber.js'
import {increaseTimeTo, duration} from './helpers/increaseTime'

let fs = require('fs')
let parse = require('csv-parse')
let async = require('async')
let path = require('path')
let loader = require('csv-load-sync')

const TokenVault = artifacts.require("./TokenVault.sol")
const Token = artifacts.require("./HumanStandardToken.sol")

let csvFile = '/token.csv'
let csv = loader(path.join(__dirname, csvFile))

let vault
let token

let tSupply = 1000000000000000000000000000
let name = 'SPANK'
let decimals = 18
let symbol = 'SPANK'

let endFreeze = Math.floor(new Date().getTime()/1000)+20000
let tokensInVault = 101399935000000000000000



contract('Timelock', function(accounts) {
  it("Vault & Token deployed", async function() {
    token = await Token.new(tSupply, name, decimals, symbol)
    vault = await TokenVault.new(endFreeze, token.address, tokensInVault)
    let _ts = await token.totalSupply.call()
    let _f = await vault.freezeEndsAt()
    let _t = await vault.token()
    let _a = await vault.tokensToBeAllocated()

    // assert totalSupply init to 0
    assert.equal(tSupply, _ts, "totalSupply not initilized correctly")
    assert.equal(endFreeze, _f, "vault freeze time not initilized correctly")
    assert.equal(token.address, _t, "vault token address not initilized correctly")
    assert.equal(tokensInVault, _a.toNumber(), "vault tokens amt not initilized correctly")
  })

  it("Loads the participants", async function() {

    for(let line of csv) {
      let wei = web3.toWei(parseFloat(line.amount, 'ether'))
      let address = line.address
      await vault.setInvestor(address, wei)    
    }

    let loaded = await vault.tokensAllocatedTotal()
    assert.equal(tokensInVault, loaded, "csv did not load correct amt of tokens")

  })

  it("Owner can lock a loaded vault", async function() {
    await token.transfer(vault.address, tokensInVault)
    await vault.lock()
    let locked = await vault.lockedAt()
    let state = await vault.getState()

    assert.equal(state, 2, "vault in incorrect state for post lock")

  })

  it("Token holder can't claim before vault time ends", async function() {
    await vault.claim()
    let claim = await vault.totalClaimed()
    assert.equal(claim, 0, "vault allowed a premature claim")
  })

  it("Token holder can claim after vault time ends", async function() {
    let newTime = Math.floor(new Date().getTime()/1000) + 20000
    await increaseTimeTo(newTime)
    await vault.claim()
    let claim = await vault.totalClaimed()
    assert.equal(claim, 189723600000000000000, "vault didnt allow a claim")
  })


  it("Non-Token holder can't claim", async function() {
    await vault.claim({from: accounts[2]})
    let claim = await vault.claimed(accounts[2])
    assert.equal(claim, 0, "vault allowed an unauthorized claim")
  })


})
