import { BigNumber } from 'ethers'
import Contract from 'web3/eth/contract'
import { ContractNetworkConfig } from '../configuration/contracts'
import GnosisSafeWeb3Contract from '../contracts/GnosisSafe/GnosisSafeWeb3Contract'
import SafeAbiV120 from '../contracts/GnosisSafe/SafeAbiV1-2-0.json'
import MultiSendAbi from '../contracts/MultiSend/MultiSendAbi.json'
import MultiSendWeb3Contract from '../contracts/MultiSend/MultiSendWeb3Contract'
import { AbiItem } from '../types'
import { GnosisSafe } from '../types/typechain/web3-v1/GnosisSafe'
import { MultiSend } from '../types/typechain/web3-v1/MultiSend'
import EthAdapter, { EthAdapterTransaction, GnosisSafeContracts } from './EthAdapter'

export interface Web3AdapterConfig {
  /** web3 - Web3 library */
  web3: any
  /** signerAddress - Address of the signer */
  signerAddress: string
}

class Web3Adapter implements EthAdapter {
  #web3: any
  #signerAddress: string

  constructor({ web3, signerAddress }: Web3AdapterConfig) {
    if (!web3) {
      throw new Error('web3 property missing from options')
    }
    this.#web3 = web3
    this.#signerAddress = signerAddress
  }

  isAddress(address: string): boolean {
    return this.#web3.utils.isAddress(address)
  }

  async getBalance(address: string): Promise<BigNumber> {
    return BigNumber.from(await this.#web3.eth.getBalance(address))
  }

  async getChainId(): Promise<number> {
    return this.#web3.eth.getChainId()
  }

  async getSafeContracts(
    safeAddress: string,
    contracts: ContractNetworkConfig
  ): Promise<GnosisSafeContracts> {
    const safeContractCode = await this.getContractCode(safeAddress)
    if (safeContractCode === '0x') {
      throw new Error('Safe Proxy contract is not deployed in the current network')
    }
    const multiSendContractCode = await this.getContractCode(contracts.multiSendAddress)
    if (multiSendContractCode === '0x') {
      throw new Error('MultiSend contract is not deployed in the current network')
    }
    const safeContract = this.getContract(safeAddress, SafeAbiV120) as any as GnosisSafe
    const wrapperSafeContract = new GnosisSafeWeb3Contract(safeContract)
    const multiSendContract = this.getContract(
      contracts.multiSendAddress,
      MultiSendAbi
    ) as any as MultiSend
    const wrappedMultiSendContract = new MultiSendWeb3Contract(multiSendContract)
    return {
      gnosisSafeContract: wrapperSafeContract,
      multiSendContract: wrappedMultiSendContract
    }
  }

  getContract(address: string, abi: AbiItem[]): Contract {
    return new this.#web3.eth.Contract(abi, address)
  }

  async getContractCode(address: string): Promise<string> {
    return this.#web3.eth.getCode(address)
  }

  async getTransaction(transactionHash: string): Promise<any> {
    return this.#web3.eth.getTransaction(transactionHash)
  }

  async getSignerAddress(): Promise<string> {
    return this.#signerAddress
  }

  signMessage(message: string): Promise<string> {
    return this.#web3.eth.sign(message, this.#signerAddress)
  }

  estimateGas(transaction: EthAdapterTransaction, options?: string): Promise<number> {
    return this.#web3.eth.estimateGas(transaction, options)
  }

  call(transaction: EthAdapterTransaction): Promise<string> {
    return this.#web3.eth.call(transaction)
  }
}

export default Web3Adapter
