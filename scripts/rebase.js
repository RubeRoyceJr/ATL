const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const stakingAddress = '0x4AdD658234f6b5FB217b7d3DB8d66932b2921547';
  const Staking = await ethers.getContractFactory("OtterStaking");
  const staking = Staking.attach(stakingAddress)
  const provider = deployer.provider;
  const block = await provider.getBlock()
  console.log("Chain id: " + (await provider.getNetwork()).chainId);
  console.log("Current block time: " + block.timestamp);

  let [length, number, endTime, distribute] = await staking.epoch();
  console.log(
    "Before rebase: ",
    JSON.stringify({
      length: length.toString(),
      number: number.toString(),
      endTime: endTime.toString(),
      distribute: distribute.toString(),
    })
  );
  await (await staking.rebase()).wait();

  [length, number, endTime, distribute] = await staking.epoch();
  console.log(
    "After rebase: ",
    JSON.stringify({
      length: length.toString(),
      number: number.toString(),
      endTime: endTime.toString(),
      distribute: distribute.toString(),
    })
  );
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
