// @dev. This script will deploy this V1.1 of Olympus. It will deploy the whole ecosystem except for the LP tokens and their bonds.
// This should be enough of a test environment to learn about and test implementations with the Olympus as of V1.1.
// Not that the every instance of the Treasury's function 'valueOf' has been changed to 'valueOfToken'...
// This solidity function was conflicting w js object property name

const assert = require("assert");
const { ethers } = require("hardhat");
const UniswapV2ABI = require("./IUniswapV2Factory.json").abi;
const IUniswapV2Pair = require("./IUniswapV2Pair.json").abi;
const IUniswapV2Router02 = require("./IUniswapV2Router02.json").abi;

async function main() {
  const [deployer, MockDAO] = await ethers.getSigners();

  // Deploy DAI
  const DAI = await ethers.getContractFactory("DAI");
  const dai = DAI.attach("0x19907af68A173080c3e05bb53932B0ED541f6d20");

  const DAIBond = await ethers.getContractFactory("OlympusBondDepository");
  const daiBond = DAIBond.attach("");
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
