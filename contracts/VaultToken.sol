import "./StandardToken.sol";
import "./HumanStandardToken.sol";
import "./TokenVault.sol";

pragma solidity ^0.4.18;

contract VaultToken is StandardToken {

    /* Public variables of the token */

    /*
    NOTE:
    The following variables are OPTIONAL vanities. One does not have to include them.
    They allow one to customise the token contract & in no way influences the core functionality.
    Some wallets/interfaces might not even bother to look at this information.
    */
    string public name;                   //fancy name: eg Simon Bucks
    uint8 public decimals;                //How many decimals to show. ie. There could 1000 base units with 3 decimals. Meaning 0.980 SBX = 980 base units. It's like comparing 1 wei to 1 ether.
    string public symbol;                 //An identifier: eg SBX
    string public version = 'H0.1';       //human 0.1 standard. Just an arbitrary versioning scheme.

    TokenVault public vault;
    HumanStandardToken public token;

    bool public vaultSet = false;

    function VaultToken(
        uint256 _initialAmount,
        string _tokenName,
        uint8 _decimalUnits,
        string _tokenSymbol,
        address _lockedToken
        ) {
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes

        require(_lockedToken != 0x0);
        token = HumanStandardToken(_lockedToken);
    }

    function setVaultAddress(address _tokenVault) returns(bool success) {
        // only once
        require(vaultSet == false);
        // check that the token contract has a vault balance
        require(token.balanceOf(_tokenVault) >= totalSupply);
        require(_tokenVault != 0x0);
        vault = TokenVault(_tokenVault);
        // check to be sure the token vault has allocated this contract tokens
        require(vault.balances(this) == totalSupply);
        vaultSet = true;
    }

    function claim() returns(bool success) {
        vault.claim();
        return true;
    }

    function redeem() returns(bool success) {
        uint256 _balance = balances[msg.sender];
        // it will throw if transfer fails
        transfer(0x0, _balance);
        totalSupply -= _balance;
        require(token.transfer(msg.sender, _balance));
        return true;
    }

    /* Approves and then calls the receiving contract */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);

        //call the receiveApproval function on the contract you want to be notified. This crafts the function signature manually so one doesn't have to include a contract in here just for this.
        //receiveApproval(address _from, uint256 _value, address _tokenContract, bytes _extraData)
        //it is assumed that when does this that the call *should* succeed, otherwise one would use vanilla approve instead.
        require(_spender.call(bytes4(bytes32(sha3("receiveApproval(address,uint256,address,bytes)"))), msg.sender, _value, this, _extraData));
        return true;
    }
}
