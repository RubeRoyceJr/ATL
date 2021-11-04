const { ethers } = require('hardhat')

async function main() {
  const signer = await ethers.getSigner()
  const MAIBond = await ethers.getContractFactory('OtterBondDepository')
  const maiBond = MAIBond.attach('0x28077992bFA9609Ae27458A766470b03D43dEe8A')

  const bcvCurrent = (await maiBond.terms())[0].toNumber()

  const add = true
  const adjustment = 3
  const bcvTarget = 150
  const buffer = 0
  const step = Math.ceil(Math.abs(bcvCurrent - bcvTarget) / adjustment)

  console.log(
    'adjust bond: ' +
      JSON.stringify(
        {
          add,
          adjustment,
          bcvCurrent,
          bcvTarget,
          step,
          buffer,
        },
        2
      )
  )
  await (
    await maiBond.setAdjustment(add, adjustment, bcvTarget, buffer)
  ).wait()

  const nonce = await signer.getTransactionCount()
  for (let i = 0; i < step; i++) {
    await maiBond.deposit(
      ethers.utils.parseEther('1'),
      ethers.utils.parseUnits('9999', 9),
      signer.address,
      { nonce: nonce + i }
    )
    console.log('adjust: ' + i)
  }

  console.log('done')
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
