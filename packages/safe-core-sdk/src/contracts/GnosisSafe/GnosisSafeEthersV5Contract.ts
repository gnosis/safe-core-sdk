import { SafeTransaction, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import { BigNumber, ContractTransaction } from 'ethers'
import { GnosisSafe, GnosisSafeInterface } from '../../types/typechain/ethers-v5/GnosisSafe'
import { EthersTransactionResult, TransactionOptions } from '../../utils/transactions/types'
import GnosisSafeContract from './GnosisSafeContract'

function toTxResult(
  transactionResponse: ContractTransaction,
  options?: TransactionOptions
): EthersTransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse
  }
}

class GnosisSafeEthersV5Contract implements GnosisSafeContract {
  constructor(public contract: GnosisSafe) {}

  async getVersion(): Promise<string> {
    return this.contract.VERSION()
  }

  getAddress(): string {
    return this.contract.address
  }

  async getNonce(): Promise<number> {
    return (await this.contract.nonce()).toNumber()
  }

  async getThreshold(): Promise<number> {
    return (await this.contract.getThreshold()).toNumber()
  }

  async getOwners(): Promise<string[]> {
    return this.contract.getOwners()
  }

  async isOwner(address: string): Promise<boolean> {
    return this.contract.isOwner(address)
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string> {
    return this.contract.getTransactionHash(
      safeTransactionData.to,
      safeTransactionData.value,
      safeTransactionData.data,
      safeTransactionData.operation,
      safeTransactionData.safeTxGas,
      safeTransactionData.baseGas,
      safeTransactionData.gasPrice,
      safeTransactionData.gasToken,
      safeTransactionData.refundReceiver,
      safeTransactionData.nonce
    )
  }

  async approvedHashes(ownerAddress: string, hash: string): Promise<BigNumber> {
    return this.contract.approvedHashes(ownerAddress, hash)
  }

  async approveHash(hash: string, options?: TransactionOptions): Promise<EthersTransactionResult> {
    const txResponse = await this.contract.approveHash(hash, options)
    return toTxResult(txResponse, options)
  }

  async getModules(): Promise<string[]> {
    return this.contract.getModules()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.contract.isModuleEnabled(moduleAddress)
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<EthersTransactionResult> {
    const txResponse = await this.contract.execTransaction(
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures(),
      options
    )
    return toTxResult(txResponse, options)
  }

  encode: GnosisSafeInterface['encodeFunctionData'] = (methodName: any, params: any): string => {
    return this.contract.interface.encodeFunctionData(methodName, params)
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: TransactionOptions
  ): Promise<number> {
    return (await (this.contract.estimateGas as any)[methodName](...params, options)).toNumber()
  }
}

export default GnosisSafeEthersV5Contract
