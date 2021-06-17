import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer';
import { GnosisSafe, MultiSend } from '../../typechain'
import MultiSendAbi from '../abis/MultiSendAbi.json'
import SafeAbiV120 from '../abis/SafeAbiV1-2-0.json'
import { ContractNetworksConfig, defaultContractNetworks } from '../configuration/contracts'

class ContractManager {
  #safeContract!: GnosisSafe
  #multiSendContract!: MultiSend

  static async create(
    ethers: any,
    safeAddress: string,
    chainId: number,
    currentProviderOrSigner: Provider | Signer,
    provider: Provider,
    contractNetworks?: ContractNetworksConfig
  ) {
    const safeSdk = new ContractManager()
    await safeSdk.init(
      ethers,
      safeAddress,
      chainId,
      currentProviderOrSigner,
      provider,
      contractNetworks
    )
    return safeSdk
  }

  async init(
    ethers: any,
    safeAddress: string,
    chainId: number,
    currentProviderOrSigner: Provider | Signer,
    provider: Provider,
    contractNetworks?: ContractNetworksConfig
  ) {
    const contractNetworksConfig = { ...defaultContractNetworks, ...contractNetworks }
    const contracts = contractNetworksConfig[chainId]
    if (!contracts) {
      throw new Error('Safe contracts not found in the current network')
    }

    const safeContractCode = await provider.getCode(safeAddress)
    if (safeContractCode === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    this.#safeContract = new ethers.Contract(safeAddress, SafeAbiV120, currentProviderOrSigner)

    const multiSendContractCode = await provider.getCode(contracts.multiSendAddress)
    if (multiSendContractCode === '0x') {
      throw new Error('MultiSend contract is not deployed in the current network')
    }
    this.#multiSendContract = new ethers.Contract(
      contracts.multiSendAddress,
      MultiSendAbi,
      currentProviderOrSigner
    )
  }

  get safeContract() {
    return this.#safeContract
  }

  get multiSendContract() {
    return this.#multiSendContract
  }
}

export default ContractManager
