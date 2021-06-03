import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import {
  MasterCopyResponse,
  OwnerResponse,
  SafeBalanceResponse,
  SafeBalanceUsdResponse,
  SafeCollectibleResponse,
  SafeCreationInfoResponse,
  SafeDelegate,
  SafeDelegateDelete,
  SafeDelegateListResponse,
  SafeInfoResponse,
  SafeModuleTransactionListResponse,
  SafeMultisigConfirmationListResponse,
  SafeMultisigTransactionEstimate,
  SafeMultisigTransactionEstimateResponse,
  SafeMultisigTransactionListResponse,
  SafeMultisigTransactionResponse,
  SafeServiceInfoResponse,
  SignatureResponse,
  TokenInfoListResponse,
  TokenInfoResponse,
  TransferListResponse
} from './types/safeTransactionServiceTypes'

interface SafeTransactionService {
  // About
  getServiceInfo(): Promise<SafeServiceInfoResponse>
  getServiceMasterCopiesInfo(): Promise<MasterCopyResponse>

  // Data decoder
  decodeData(data: string): Promise<any>

  // Owners
  getSafesByOwner(ownerAddress: string): Promise<OwnerResponse>

  // Multisig transactions
  getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse>
  getTransactionConfirmations(safeTxHash: string): Promise<SafeMultisigConfirmationListResponse>
  confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse>

  // Safes
  getSafeInfo(safeAddress: string): Promise<SafeInfoResponse>
  getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse>
  addSafeDelegate(safeAddress: string, delegate: SafeDelegate): Promise<any>
  removeSafeDelegate(safeAddress: string, delegate: SafeDelegateDelete): Promise<any>

  // Transactions
  getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse>
  estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse>
  proposeTransaction(
    safeAddress: string,
    transaction: SafeTransactionData,
    transactionHash: string,
    signature: SafeSignature
  ): Promise<void>
  getIncomingTransactions(safeAddress: string): Promise<TransferListResponse>
  getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse>
  getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse>
  getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse>

  // Balances
  getBalances(safeAddress: string): Promise<SafeBalanceResponse[]>
  getUsdBalances(safeAddress: string): Promise<SafeBalanceUsdResponse[]>
  getCollectibles(safeAddress: string): Promise<SafeCollectibleResponse[]>

  // Tokens
  getTokens(): Promise<TokenInfoListResponse>
  getToken(tokenAddress: string): Promise<TokenInfoResponse>
}

export default SafeTransactionService
