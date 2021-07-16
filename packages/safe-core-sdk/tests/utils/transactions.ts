import { ContractReceipt } from 'ethers/lib/ethers'
import { TransactionReceipt } from 'web3-core/types'
import { EthAdapter, TransactionResult } from '../../src'

export async function waitSafeTxReceipt(
  txResult: TransactionResult
): Promise<ContractReceipt | TransactionReceipt | undefined> {
  const receipt: ContractReceipt | TransactionReceipt | undefined = txResult.promiEvent
    ? await new Promise(
        (resolve, reject) =>
          txResult.promiEvent &&
          txResult.promiEvent
            .on('confirmation', (_confirmationNumber: any, receipt: TransactionReceipt) =>
              resolve(receipt)
            )
            .catch(reject)
      )
    : txResult.transactionResponse && (await txResult.transactionResponse.wait())
  return receipt
}

export async function getTransaction(
  ethAdapter: EthAdapter,
  transactionHash: string
): Promise<any> {
  return ethAdapter.getTransaction(transactionHash)
}
