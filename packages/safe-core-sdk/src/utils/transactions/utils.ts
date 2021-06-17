import { pack as solidityPack } from '@ethersproject/solidity'
import { arrayify } from '@ethersproject/bytes'
import { GnosisSafe } from '../../../typechain'
import { ZERO_ADDRESS } from '../constants'
import { estimateTxGas } from './gas'
import {
  MetaTransactionData,
  OperationType,
  SafeTransactionData,
  SafeTransactionDataPartial
} from './SafeTransaction'

export function standardizeMetaTransactionData(
  tx: SafeTransactionDataPartial
): MetaTransactionData {
  const standardizedTxs: MetaTransactionData = {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation ?? OperationType.Call
  }
  return standardizedTxs
}

export async function standardizeSafeTransactionData(
  safeContract: GnosisSafe,
  tx: SafeTransactionDataPartial
): Promise<SafeTransactionData> {
  const standardizedTxs = {
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation ?? OperationType.Call,
    baseGas: tx.baseGas ?? 0,
    gasPrice: tx.gasPrice ?? 0,
    gasToken: tx.gasToken || ZERO_ADDRESS,
    refundReceiver: tx.refundReceiver || ZERO_ADDRESS,
    nonce: tx.nonce ?? (await safeContract.nonce()).toNumber()
  }
  const safeTxGas =
    tx.safeTxGas ??
    (await estimateTxGas(
      safeContract,
      standardizedTxs.to,
      standardizedTxs.value,
      standardizedTxs.data,
      standardizedTxs.operation
    ))
  return {
    ...standardizedTxs,
    safeTxGas
  }
}

function encodeMetaTransaction(tx: MetaTransactionData): string {
  const data = arrayify(tx.data)
  const encoded = solidityPack(
    ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
    [tx.operation, tx.to, tx.value, data.length, data]
  )
  return encoded.slice(2)
}

export function encodeMultiSendData(txs: MetaTransactionData[]): string {
  return '0x' + txs.map((tx) => encodeMetaTransaction(tx)).join('')
}
