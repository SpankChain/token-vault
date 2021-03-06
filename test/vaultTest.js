'use strict'

import {increaseTimeTo, duration} from './helpers/increaseTime'
const utils = require('./helpers/utils')


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
  console.log(accounts[0])
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

  it("Non-owner can't load the participants", async function() {
    await utils.assertThrowsAsync(
      () => vault.setInvestor(accounts[2], 1337, {from:accounts[1]}), 'VM Exception while processing transaction: revert')

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

  it("Non-Owner can't lock a loaded vault", async function() {
    await token.transfer(vault.address, tokensInVault)
    let vaultBalance = await token.balanceOf(vault.address)

    await utils.assertThrowsAsync(
      () => vault.lock({from: accounts[2]}), 'VM Exception while processing transaction: revert')

    let locked = await vault.lockedAt()
    let state = await vault.getState()

    assert.equal(vaultBalance, tokensInVault, "token did not register vault as owner of tokens")
    assert.equal(state, 1, "vault in incorrect state for pre lock")
    assert.equal(locked.toNumber(), 0, "vault in incorrect time for pre lock")

  })

  it("Owner can recover funds after failed lock", async function() {
    await vault.recoverFailedLock()
    let vaultBalance = await token.balanceOf(vault.address)

    assert.equal(vaultBalance, 0, "vault did not tranfer tokens back to owner")
  })

  it("Owner can lock a loaded vault", async function() {
    await token.transfer(vault.address, tokensInVault)
    await vault.lock()
    let locked = await vault.lockedAt()
    let state = await vault.getState()

    assert.equal(state, 2, "vault in incorrect state for post lock")
  })

  it("Owner can't recover tokens on a locked vault", async function() {
    await utils.assertThrowsAsync(
      () => vault.recoverFailedLock(), 'VM Exception while processing transaction: revert')

    let vaultBalance = await token.balanceOf(vault.address)

    assert.equal(vaultBalance, tokensInVault, "owner took locked funds")
  })

  it("Token holder can't claim before vault time ends", async function() {
    await utils.assertThrowsAsync(
      () => vault.claim(), 'VM Exception while processing transaction: revert')

    let claim = await vault.totalClaimed()
    assert.equal(claim, 0, "vault allowed a premature claim")
  })

  it("Token holder can claim after vault time ends", async function() {
    let newTime = Math.floor(new Date().getTime()/1000) + 20000
    await utils.increaseTimeTo(newTime)
    await vault.claim()
    let claim = await vault.totalClaimed()
    assert.equal(claim, 14962640000000000000000, "vault didnt allow a claim")
  })


  it("Non-Token holder can't claim", async function() {
    await utils.assertThrowsAsync(
      () => vault.claim({from: accounts[2]}), 'VM Exception while processing transaction: revert')

    let claim = await vault.claimed(accounts[2])
    assert.equal(claim, 0, "vault allowed an unauthorized claim")
  })
})
