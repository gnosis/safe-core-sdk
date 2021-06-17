import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { ContractTransaction } from '@ethersproject/contracts';
import { ContractNetworksConfig } from './configuration/contracts'
import { SafeSignature } from './utils/signatures/SafeSignature'
import SafeTransaction, { SafeTransactionDataPartial } from './utils/transactions/SafeTransaction'

export interface EthersSafeConfig {
  /** ethers - Ethers v5 library */
  ethers: any
  /** safeAddress - The address of the Safe account to use */
  safeAddress: string
  /** providerOrSigner - Ethers provider or signer */
  providerOrSigner?: Provider | Signer
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

export interface ConnectEthersSafeConfig {
  /** providerOrSigner - Ethers provider or signer */
  providerOrSigner: Provider | Signer
  /** safeAddress - The address of the Safe account to use */
  safeAddress?: string
  /** contractNetworks - Contract network configuration */
  contractNetworks?: ContractNetworksConfig
}

interface Safe {
  connect({ providerOrSigner, safeAddress, contractNetworks }: ConnectEthersSafeConfig): void
  getProvider(): Provider
  getSigner(): Signer | undefined
  getAddress(): string
  getMultiSendAddress(): string
  getContractVersion(): Promise<string>
  getNonce(): Promise<number>
  getOwners(): Promise<string[]>
  getThreshold(): Promise<number>
  getChainId(): Promise<number>
  getBalance(): Promise<BigNumber>
  getModules(): Promise<string[]>
  isModuleEnabled(moduleAddress: string): Promise<boolean>
  isOwner(ownerAddress: string): Promise<boolean>
  createTransaction(...safeTransactions: SafeTransactionDataPartial[]): Promise<SafeTransaction>
  createRejectionTransaction(nonce: number): Promise<SafeTransaction>
  getTransactionHash(safeTransaction: SafeTransaction): Promise<string>
  signTransactionHash(hash: string): Promise<SafeSignature>
  signTransaction(safeTransaction: SafeTransaction): Promise<void>
  approveTransactionHash(hash: string): Promise<ContractTransaction>
  getOwnersWhoApprovedTx(txHash: string): Promise<string[]>
  getEnableModuleTx(moduleAddress: string): Promise<SafeTransaction>
  getDisableModuleTx(moduleAddress: string): Promise<SafeTransaction>
  getAddOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction>
  getRemoveOwnerTx(ownerAddress: string, threshold?: number): Promise<SafeTransaction>
  getSwapOwnerTx(oldOwnerAddress: string, newOwnerAddress: string): Promise<SafeTransaction>
  getChangeThresholdTx(threshold: number): Promise<SafeTransaction>
  executeTransaction(safeTransaction: SafeTransaction): Promise<ContractTransaction>
}

export default Safe
