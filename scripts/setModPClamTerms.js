const { ethers } = require('hardhat')

async function main() {
  const signer = await ethers.getSigner()

  const ExercisePreClam = await ethers.getContractFactory('ExercisePreClam')
  const exec = ExercisePreClam.attach(
    '0x0f9e7513c5e477c17759ffb65e41a557e5270ea2'
  )

  const PreOtterClamERC20 = await ethers.getContractFactory('PreOtterClamERC20')
  const pClam = PreOtterClamERC20.attach(
    '0xbee8ddfc4698478dd774c724275785b4b5156092'
  )

  // const terms = [
  //   { wallet: '0x63B0fB7FE68342aFad3D63eF743DE4A74CDF462B', maxAmount: 300000000, rate: 50000, },
  //   { wallet: '0xC99759630998A1c344822E6187b90aa63b425db4', maxAmount: 120, rate: 1000, },
  //   { wallet: '0x7482DCBFE25bfB5C1AC625B5bC3699810b3D910c', maxAmount: 70, rate: 1000, },
  //   { wallet: '0xab7Ed9fd5EA3d6529CE28aaff5959974A11CA77a', maxAmount: 100, rate: 1000, },
  //   { wallet: '0x10Cb685d725a895E63f36C96539f55380D269044', maxAmount: 100, rate: 1000, },
  //   { wallet: '0x913D97DAe24A2564B0b092fE99e0df5291a6C086', maxAmount: 50, rate: 1000, },
  //   { wallet: '0x9cc6350863367dD2B14eBe10a073E004ca722e4B', maxAmount: 120, rate: 1000, },
  //   { wallet: '0x522Ea58a06842817A18B1fC6E2311c3c24094181', maxAmount: 100, rate: 1000, },
  //   { wallet: '0xbf5928C1D26d956805bBBfb6986b445B737618DD', maxAmount: 120, rate: 1000, },
  //   { wallet: '0xC01e6A8df21c7Ae757b0bB8bba95200e8Ec6C518', maxAmount: 120, rate: 1000, },
  //   { wallet: '0x67dE004c376Be6a9c44f5EF9d0B4BB35165eA4F9', maxAmount: 120, rate: 1000, },
  // ]
  // await pClam.addApprovedSellers(terms.map(( {wallet} )=>wallet))
  // let nonce = await signer.getTransactionCount()
  // for (let {wallet,maxAmount,rate} of terms) {
  //   await exec.setTerms(wallet,  ethers.utils.parseEther(String(maxAmount)), rate, { nonce:nonce++ })
  //   console.log('set term: ',JSON.stringify({wallet,maxAmount: ethers.utils.parseEther(String(maxAmount)),rate}))
  // }

  console.log('done')
}

main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
