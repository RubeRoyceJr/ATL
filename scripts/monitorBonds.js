const { ethers } = require('hardhat')
const IUniswapV2Pair = require('./IUniswapV2Pair.json').abi

const CLAM_MAI_LP = '0x8094f4C9a4C8AD1FF4c6688d07Bd90f996C7CA21'
const priceFormatter = Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'usd',
})

async function main() {
  const OtterBondDepository = await ethers.getContractFactory(
    'OtterBondDepository'
  )
  const bonds = [
    { name: 'MAI', address: '0x28077992bFA9609Ae27458A766470b03D43dEe8A' },
    { name: 'CLAM-MAI', address: '0x79B47c03B02019Af78Ee0de9B0b3Ac0786338a0d' },
  ]

  for (const { name, address } of bonds) {
    const bond = OtterBondDepository.attach(address)
    await fetchBondInfo(name, bond)
    bond.on('BondPriceChanged', async () => {
      console.log('==== Bond price changed ====')
      await fetchBondInfo(name, bond)
    })
  }
}

async function fetchBondInfo(name, bond) {
  const marketPrice = Number(
    ethers.utils.formatUnits(await getMarketPrice(), 9)
  )
  const [terms, debtRatio, bondPrice, adjustment] = await Promise.all([
    bond.terms(),
    bond.standardizedDebtRatio(),
    bond.bondPriceInUSD(),
    bond.adjustment(),
  ])
  const price = Number(ethers.utils.formatEther(bondPrice))
  console.log(
    JSON.stringify(
      {
        name,
        marketPrice: priceFormatter.format(marketPrice),
        price: priceFormatter.format(price),
        bcv: terms[0].toString(),
        adjustment: `${
          adjustment[0] ? '+' : '-'
        }${adjustment[1].toString()} target: ${adjustment[2].toString()} buffer: ${adjustment[3].toString()}`,
        debtRatio:
          name === 'MAI'
            ? ethers.utils.formatUnits(debtRatio, 7) + '%'
            : ethers.utils.formatUnits(debtRatio, 16) + '%',
        ROI: Intl.NumberFormat('en', {
          style: 'percent',
          minimumFractionDigits: 2,
        }).format((marketPrice - price) / marketPrice),
      },
      null,
      2
    )
  )
}

async function getMarketPrice() {
  const signer = await ethers.getSigner()
  const lp = new ethers.Contract(CLAM_MAI_LP, IUniswapV2Pair, signer)
  const reserves = await lp.getReserves()
  const marketPrice = reserves[1].div(reserves[0])
  return marketPrice
}

main()
  // .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    // process.exit(1)
  })