import { BigNumber } from '@ethersproject/bignumber';
import { GnosisSafe } from '../../../typechain'
import SafeTransaction, { OperationType } from './SafeTransaction'

function estimateDataGasCosts(data: string): number {
  const reducer = (accumulator: number, currentValue: string) => {
    if (currentValue === '0x') {
      return accumulator + 0
    }
    if (currentValue === '00') {
      return accumulator + 4
    }
    return accumulator + 16
  }
  return (data.match(/.{2}/g) as string[]).reduce(reducer, 0)
}

export async function estimateTxGas(
  safeContract: GnosisSafe,
  to: string,
  valueInWei: string,
  data: string,
  operation: OperationType
): Promise<number> {
  let txGasEstimation = 0
  const safeAddress = safeContract.address

  const estimateData: string = safeContract.interface.encodeFunctionData('requiredTxGas', [
    to,
    valueInWei,
    data,
    operation
  ])
  try {
    const estimateResponse = await safeContract.provider.call(
      {
        to: safeAddress,
        from: safeAddress,
        data: estimateData
      },
      'latest'
    )
    txGasEstimation = BigNumber.from('0x' + estimateResponse.substring(138)).toNumber() + 10000
  } catch (error) {}

  if (txGasEstimation > 0) {
    const dataGasEstimation = estimateDataGasCosts(estimateData)
    let additionalGas = 10000
    for (let i = 0; i < 10; i++) {
      try {
        const estimateResponse = await safeContract.provider.call({
          to: safeAddress,
          from: safeAddress,
          data: estimateData,
          gasPrice: 0,
          gasLimit: txGasEstimation + dataGasEstimation + additionalGas
        })
        if (estimateResponse !== '0x') {
          break
        }
      } catch (error) {}
      txGasEstimation += additionalGas
      additionalGas *= 2
    }
    return txGasEstimation + additionalGas
  }

  try {
    const estimateGas = await safeContract.provider.estimateGas({
      to,
      from: safeAddress,
      value: valueInWei,
      data
    })
    return estimateGas.toNumber()
  } catch (error) {
    if (operation === OperationType.DelegateCall) {
      return 0
    }
    return Promise.reject(error)
  }
}

export async function estimateGasForTransactionExecution(
  safeContract: GnosisSafe,
  from: string,
  tx: SafeTransaction
): Promise<number> {
  try {
    const gas = await safeContract.estimateGas.execTransaction(
      tx.data.to,
      tx.data.value,
      tx.data.data,
      tx.data.operation,
      tx.data.safeTxGas,
      tx.data.baseGas,
      tx.data.gasPrice,
      tx.data.gasToken,
      tx.data.refundReceiver,
      tx.encodedSignatures(),
      { from, gasPrice: tx.data.gasPrice }
    )
    return gas.toNumber()
  } catch (error) {
    return Promise.reject(error)
  }
}
