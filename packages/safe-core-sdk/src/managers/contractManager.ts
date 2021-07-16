import { ContractNetworksConfig, defaultContractNetworks } from '../configuration/contracts'
import GnosisSafeContract from '../contracts/GnosisSafe/GnosisSafeContract'
import MultiSendContract from '../contracts/MultiSend/MultiSendContract'
import EthAdapter from '../ethereumLibs/EthAdapter'

class ContractManager {
  #contractNetworks!: ContractNetworksConfig
  #safeContract!: GnosisSafeContract
  #multiSendContract!: MultiSendContract

  static async create(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ): Promise<ContractManager> {
    const contractManager = new ContractManager()
    await contractManager.init(ethAdapter, safeAddress, contractNetworks)
    return contractManager
  }

  async init(
    ethAdapter: EthAdapter,
    safeAddress: string,
    contractNetworks?: ContractNetworksConfig
  ): Promise<void> {
    const chainId = await ethAdapter.getChainId()
    const contractNetworksConfig = { ...defaultContractNetworks, ...contractNetworks }
    const contracts = contractNetworksConfig[chainId]
    if (!contracts) {
      throw new Error('Safe contracts not found in the current network')
    }
    this.#contractNetworks = contractNetworksConfig
    const { gnosisSafeContract, multiSendContract } = await ethAdapter.getSafeContracts(
      safeAddress,
      contracts
    )
    this.#safeContract = gnosisSafeContract
    this.#multiSendContract = multiSendContract
  }

  get contractNetworks(): ContractNetworksConfig {
    return this.#contractNetworks
  }

  get safeContract(): GnosisSafeContract {
    return this.#safeContract
  }

  get multiSendContract(): MultiSendContract {
    return this.#multiSendContract
  }
}

export default ContractManager
