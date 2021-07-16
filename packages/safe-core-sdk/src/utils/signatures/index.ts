import { SafeSignature } from '@gnosis.pm/safe-core-sdk-types'
import { bufferToHex, ecrecover, pubToAddress } from 'ethereumjs-util'
import EthAdapter from 'ethereumLibs/EthAdapter'
import { sameString } from '../../utils'
import { EthSignSignature } from './SafeSignature'

export function generatePreValidatedSignature(ownerAddress: string): SafeSignature {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01'

  return new EthSignSignature(ownerAddress, signature)
}

export function isTxHashSignedWithPrefix(
  txHash: string,
  signature: string,
  ownerAddress: string
): boolean {
  let hasPrefix
  try {
    const rsvSig = {
      r: Buffer.from(signature.slice(2, 66), 'hex'),
      s: Buffer.from(signature.slice(66, 130), 'hex'),
      v: parseInt(signature.slice(130, 132), 16)
    }
    const recoveredData = ecrecover(
      Buffer.from(txHash.slice(2), 'hex'),
      rsvSig.v,
      rsvSig.r,
      rsvSig.s
    )
    const recoveredAddress = bufferToHex(pubToAddress(recoveredData))
    hasPrefix = !sameString(recoveredAddress, ownerAddress)
  } catch (e) {
    hasPrefix = true
  }
  return hasPrefix
}

export function adjustVInSignature(signature: string, hasPrefix: boolean) {
  const V_VALUES = [0, 1, 27, 28]
  const MIN_VALID_V_VALUE = 27
  let signatureV = parseInt(signature.slice(-2), 16)
  if (!V_VALUES.includes(signatureV)) {
    throw new Error('Invalid signature')
  }
  if (signatureV < MIN_VALID_V_VALUE) {
    signatureV += MIN_VALID_V_VALUE
  }
  if (hasPrefix) {
    signatureV += 4
  }
  signature = signature.slice(0, -2) + signatureV.toString(16)
  return signature
}

export async function generateSignature(
  ethAdapter: EthAdapter,
  hash: string
): Promise<EthSignSignature> {
  const signerAddress = await ethAdapter.getSignerAddress()
  let signature = await ethAdapter.signMessage(hash, signerAddress)
  const hasPrefix = isTxHashSignedWithPrefix(hash, signature, signerAddress)
  signature = adjustVInSignature(signature, hasPrefix)
  return new EthSignSignature(signerAddress, signature)
}
