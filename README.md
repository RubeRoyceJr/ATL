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
|CLAM            |[0xC250e9987A032ACAC293d838726C511E6E1C029d](https://polygonscan.com/address/0xC250e9987A032ACAC293d838726C511E6E1C029d)| Main Token Contract|
|sCLAM           |[0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67](https://polygonscan.com/address/0xAAc144Dc08cE39Ed92182dd85ded60E5000C9e67)| Staked Clam|
|Treasury       |[0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C](https://polygonscan.com/address/0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C)| OtterClam Treasury holds all the assets        |
|Staking |[0xC8B0243F350AA5F8B979b228fAe522DAFC61221a](https://polygonscan.com/address/0xC8B0243F350AA5F8B979b228fAe522DAFC61221a/)| Main Staking contract responsible for calling rebases every 28800 seconds|
|StakingHelper  |[0x76B38319483b570B4BCFeD2D35d191d3c9E01691](https://polygonscan.com/address/0x76B38319483b570B4BCFeD2D35d191d3c9E01691)| Helper Contract to Stake with 0 warmup |
|DAO            |[0x929A27c46041196e1a49C7B459d63eC9A20cd879](https://polygonscan.com/address/0x929A27c46041196e1a49C7B459d63eC9A20cd879)|Storage Wallet for DAO under MS |
|Staking Warm Up|[0x8b2943667957ec2ce851fd449b7a870f253ca1e7](https://polygonscan.com/address/0x8b2943667957ec2ce851fd449b7a870f253ca1e7)| Instructs the Staking contract when a user can claim sCLAM |


**Bonds**
- **_TODO_**: What are the requirements for creating a Bond Contract?
All LP bonds use the Bonding Calculator contract which is used to compute RFV.

|Contract       | Addresss                                                                                                            | Notes   |
|:-------------:|:-------------------------------------------------------------------------------------------------------------------:|-------|
|Bond Calculator|[0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E](https://polygonscan.com/address/0x651125e097D7e691f3Df5F9e5224f0181E3A4a0E)| |
|MAI bond|[0x603A74Fd527b85E0A1e205517c1f24aC71f5C263](https://polygonscan.com/address/0x603A74Fd527b85E0A1e205517c1f24aC71f5C263)| Main bond managing serve mechanics for CLAM/MAI|
|MAI/CLAM LP Bond|[0x706587BD39322A6a78ddD5491cDbb783F8FD983E](https://polygonscan.com/address/0x706587BD39322A6a78ddD5491cDbb783F8FD983E)| Manages mechhanism for thhe protocol to buy back its own liquidity from the pair. |


## Allocator Guide

The following is a guide for interacting with the treasury as a reserve allocator.

A reserve allocator is a contract that deploys funds into external strategies, such as Aave, Curve, etc.

Treasury Address: `0x8ce47D56EAa1299d3e06FF3E04637449fFb01C9C`

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
