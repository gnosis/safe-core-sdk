import { Signer } from 'ethers'
import { ethers, web3 } from 'hardhat'
import { EthAdapter, EthersAdapter, Web3Adapter } from '../../src'

export async function getEthAdapter(signer: Signer): Promise<EthAdapter> {
  let ethAdapter: EthAdapter
  switch (process.env.ETH_LIB) {
    case 'web3':
      const signerAddress = await signer.getAddress()
      ethAdapter = new Web3Adapter({ web3, signerAddress })
      break
    case 'ethers':
      ethAdapter = new EthersAdapter({ ethers, signer })
      break
    default:
      throw new Error('Ethereum library not supported')
  }
  return ethAdapter
}
