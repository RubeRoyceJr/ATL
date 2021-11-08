# 🦦OtterClam Smart Contracts


##  🔧 Setting up Local Development
Required:
- [Node v14](https://nodejs.org/download/release/latest-v14.x/)
- [Git](https://git-scm.com/downloads)


Local Setup Steps:
1. git clone https://github.com/OlympusDAO/olympus-contracts.git
1. Install dependencies: `npm install`
    - Installs [Hardhat](https://hardhat.org/getting-started/) & [OpenZepplin](https://docs.openzeppelin.com/contracts/4.x/) dependencies
1. Compile Solidity: `npm run compile`
1. **_TODO_**: How to do local deployments of the contracts.


## 🤨 How it all works
![High Level Contract Interactions](./docs/box-diagram.png)

## Mainnet Contracts & Addresses

|Contract       | Addresss                                                                                                            | Notes   |
|:-------------:|:-------------------------------------------------------------------------------------------------------------------:|-------|
|CLAM            |[0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465](https://polygonscan.com/address/0x4d6A30EFBE2e9D7A9C143Fce1C5Bb30d9312A465)| Main Token Contract|
|sCLAM           |[0x3949F058238563803b5971711Ad19551930C8209](https://polygonscan.com/address/0x3949F058238563803b5971711Ad19551930C8209)| Staked Clam|
|Treasury       |[0xab328Ca61599974b0f577d1F8AB0129f2842d765](https://polygonscan.com/address/0xab328Ca61599974b0f577d1F8AB0129f2842d765)| OtterClam Treasury holds all the assets        |
|Staking |[0xcF2A11937A906e09EbCb8B638309Ae8612850dBf](https://polygonscan.com/address/0xcF2A11937A906e09EbCb8B638309Ae8612850dBf/)| Main Staking contract responsible for calling rebases every 28800 seconds|
|StakingHelper  |[0xe7bcBE1fB4F0EAe667feB64b007176Ac790675f2](https://polygonscan.com/address/0xe7bcBE1fB4F0EAe667feB64b007176Ac790675f2)| Helper Contract to Stake with 0 warmup |
|StakingHelper V2 |[0x22f587ecf472670c61aa4715d0b76d2fa40a9798](https://polygonscan.com/address/0x22f587ecf472670c61aa4715d0b76d2fa40a9798)| Helper Contract to Stake with 0 warmup |
|DAO            |[0x929A27c46041196e1a49C7B459d63eC9A20cd879](https://polygonscan.com/address/0x929A27c46041196e1a49C7B459d63eC9A20cd879)|Storage Wallet for DAO under MS |
|Staking Warm Up|[0x314de54E2B64E36F4B0c75079C7FB7f894750014](https://polygonscan.com/address/0x314de54E2B64E36F4B0c75079C7FB7f894750014)| Instructs the Staking contract when a user can claim sCLAM |


**Bonds**
- **_TODO_**: What are the requirements for creating a Bond Contract?
All LP bonds use the Bonding Calculator contract which is used to compute RFV.

|Contract       | Addresss                                                                                                            | Notes   |
|:-------------:|:-------------------------------------------------------------------------------------------------------------------:|-------|
|Bond Calculator|[0x47655e27667E5B4EC9EB70799f281524d031381c](https://polygonscan.com/address/0x47655e27667E5B4EC9EB70799f281524d031381c)| |
|MAI bond|[0x28077992bFA9609Ae27458A766470b03D43dEe8A](https://polygonscan.com/address/0x28077992bFA9609Ae27458A766470b03D43dEe8A)| Main bond managing serve mechanics for CLAM/MAI|
|MAI/CLAM LP Bond|[0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d](https://polygonscan.com/address/0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d)| Manages mechhanism for thhe protocol to buy back its own liquidity from the pair. |


## Allocator Guide

The following is a guide for interacting with the treasury as a reserve allocator.

A reserve allocator is a contract that deploys funds into external strategies, such as Aave, Curve, etc.

Treasury Address: `0xab328Ca61599974b0f577d1F8AB0129f2842d765`

**Managing**:
The first step is withdraw funds from the treasury via the "manage" function. "Manage" allows an approved address to withdraw excess reserves from the treasury.

*Note*: This contract must have the "reserve manager" permission, and that withdrawn reserves decrease the treasury's ability to mint new CLAM (since backing has been removed).

Pass in the token address and the amount to manage. The token will be sent to the contract calling the function.

```
function manage( address _token, uint _amount ) external;
```

Managing treasury assets should look something like this:
```
treasury.manage( MAI, amountToManage );
```

**Returning**:
The second step is to return funds after the strategy has been closed.
We utilize the `deposit` function to do this. Deposit allows an approved contract to deposit reserve assets into the treasury, and mint CLAM against them. In this case however, we will NOT mint any CLAM. This will be explained shortly.

*Note* The contract must have the "reserve depositor" permission, and that deposited reserves increase the treasury's ability to mint new CLAM (since backing has been added).


Pass in the address sending the funds (most likely the allocator contract), the amount to deposit, and the address of the token. The final parameter, profit, dictates how much CLAM to send. send_, the amount of CLAM to send, equals the value of amount minus profit.
```
function deposit( address _from, uint _amount, address _token, uint _profit ) external returns ( uint send_ );
```

To ensure no CLAM is minted, we first get the value of the asset, and pass that in as profit.
Pass in the token address and amount to get the treasury value.
```
function valueOfToken( address _token, uint _amount ) public view returns ( uint value_ );
```

All together, returning funds should look something like this:
```
treasury.deposit( address(this), amountToReturn, MAI, treasury.valueOfToken( MAI, amountToReturn ) );
```
