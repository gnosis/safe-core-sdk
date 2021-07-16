import { SafeTransaction, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import { BigNumber } from 'ethers'
import { PromiEvent, TransactionReceipt } from 'web3-core/types'
import { GnosisSafe } from '../../types/typechain/web3-v1/GnosisSafe'
import { TransactionOptions, Web3TransactionResult } from '../../utils/transactions/types'
import GnosisSafeContract from './GnosisSafeContract'

function toTxResult(
  promiEvent: PromiEvent<TransactionReceipt>,
  options?: TransactionOptions
): Promise<Web3TransactionResult> {
  return new Promise((resolve, reject) =>
    promiEvent
      .once('transactionHash', (hash: string) => resolve({ hash, promiEvent, options }))
      .catch(reject)
  )
}

class GnosisSafeWeb3Contract implements GnosisSafeContract {
  constructor(public contract: GnosisSafe) {}

  async getVersion(): Promise<string> {
    return this.contract.methods.VERSION().call()
  }

  getAddress(): string {
    return this.contract.options.address
  }

  async getNonce(): Promise<number> {
    return Number(await this.contract.methods.nonce().call())
  }

  async getThreshold(): Promise<number> {
    return Number(await this.contract.methods.getThreshold().call())
  }

  async getOwners(): Promise<string[]> {
    return this.contract.methods.getOwners().call()
  }

  async isOwner(address: string): Promise<boolean> {
    return this.contract.methods.isOwner(address).call()
  }

  async getTransactionHash(safeTransactionData: SafeTransactionData): Promise<string> {
    return this.contract.methods
      .getTransactionHash(
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
      .call()
  }

  async approvedHashes(ownerAddress: string, hash: string): Promise<BigNumber> {
    return BigNumber.from(await this.contract.methods.approvedHashes(ownerAddress, hash).call())
  }

  async approveHash(hash: string, options?: TransactionOptions): Promise<Web3TransactionResult> {
    const txResponse = this.contract.methods.approveHash(hash).send(options)
    return toTxResult(txResponse, options)
  }

  async getModules(): Promise<string[]> {
    return this.contract.methods.getModules().call()
  }

  async isModuleEnabled(moduleAddress: string): Promise<boolean> {
    return this.contract.methods.isModuleEnabled(moduleAddress).call()
  }

  async execTransaction(
    safeTransaction: SafeTransaction,
    options?: TransactionOptions
  ): Promise<Web3TransactionResult> {
    const txResponse = this.contract.methods
      .execTransaction(
        safeTransaction.data.to,
        safeTransaction.data.value,
        safeTransaction.data.data,
        safeTransaction.data.operation,
        safeTransaction.data.safeTxGas,
        safeTransaction.data.baseGas,
        safeTransaction.data.gasPrice,
        safeTransaction.data.gasToken,
        safeTransaction.data.refundReceiver,
        safeTransaction.encodedSignatures()
      )
      .send(options)
    return toTxResult(txResponse, options)
  }

  encode(methodName: string, params: any[]): string {
    return (this.contract.methods as any)[methodName](...params).encodeABI()
  }

  async estimateGas(
    methodName: string,
    params: any[],
    options: TransactionOptions
  ): Promise<number> {
    return Number(await (this.contract.methods as any)[methodName](...params).estimateGas(options))
  }
}

export default GnosisSafeWeb3Contract
