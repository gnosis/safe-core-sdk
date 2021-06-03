import { SafeSignature, SafeTransactionData } from '@gnosis.pm/safe-core-sdk-types'
import SafeTransactionService from './SafeTransactionService'
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
import { getTxServiceBaseUrl } from './utils'
import { HttpMethod, sendRequest } from './utils/httpRequests'

class SafeServiceClient implements SafeTransactionService {
  #txServiceBaseUrl: string

  constructor(txServiceUrl: string) {
    this.#txServiceBaseUrl = getTxServiceBaseUrl(txServiceUrl)
  }

  /**
   * Returns the information and configuration of the service.
   *
   * @returns The information and configuration of the service
   */
  async getServiceInfo(): Promise<SafeServiceInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/about`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of Safe master copies.
   *
   * @returns The list of Safe master copies
   */
  async getServiceMasterCopiesInfo(): Promise<MasterCopyResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/about/master-copies`,
      method: HttpMethod.Get
    })
  }

  /**
   * Decodes the specified Safe transaction data.
   *
   * @param data - The Safe transaction data
   * @returns The transaction data decoded
   * @throws "404 Cannot find function selector to decode data"
   * @throws "422 Invalid data"
   */
  async decodeData(data: string): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/data-decoder/`,
      method: HttpMethod.Post,
      body: { data }
    })
  }

  /**
   * Returns the list of Safes where the address provided is an owner.
   *
   * @param ownerAddress - The owner address
   * @returns The list of Safes where the address provided is an owner
   * @throws "422 Owner address checksum not valid"
   */
  async getSafesByOwner(ownerAddress: string): Promise<OwnerResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/owners/${ownerAddress}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns all the information of a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction
   * @returns The information of a Safe transaction
   */
  async getTransaction(safeTxHash: string): Promise<SafeMultisigTransactionResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of confirmations for a given a Safe transaction.
   *
   * @param safeTxHash - The hash of the Safe transaction
   * @returns The list of confirmations
   * @throws "400 Invalid data"
   */
  async getTransactionConfirmations(
    safeTxHash: string
  ): Promise<SafeMultisigConfirmationListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a confirmation for a Safe transaction.
   *
   * @param safeTxHash - Hash of the Safe transaction that will be confirmed
   * @param signature - Signature of the transaction
   * @returns
   * @throws "400 Malformed data"
   * @throws "422 Error processing data"
   */
  async confirmTransaction(safeTxHash: string, signature: string): Promise<SignatureResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/multisig-transactions/${safeTxHash}/confirmations/`,
      method: HttpMethod.Post,
      body: {
        signature
      }
    })
  }

  /**
   * Returns the information and configuration of the provided Safe address.
   *
   * @param safeAddress - The Safe address
   * @returns The information and configuration of the provided Safe address
   * @throws "404	Safe not found"
   * @throws "422 Checksum address validation failed/Cannot get Safe info"
   */
  async getSafeInfo(safeAddress: string): Promise<SafeInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of delegates for a given Safe address.
   *
   * @param safeAddress - The Safe address
   * @returns The list of delegates
   * @throws "400 Invalid data"
   * @throws "422 Invalid ethereum address"
   */
  async getSafeDelegates(safeAddress: string): Promise<SafeDelegateListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Adds a new delegate for a given Safe address. The signature is calculated by signing this hash: keccak(address + str(int(current_epoch / 3600))).
   *
   * @param safeAddress - The Safe address
   * @param delegate - The new delegate
   * @returns
   * @throws "400 Malformed data"
   * @throws "422 Invalid Ethereum address/Error processing data"
   */
  async addSafeDelegate(safeAddress: string, delegate: SafeDelegate): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/`,
      method: HttpMethod.Post,
      body: delegate
    })
  }

  /**
   * Removes a delegate for a given Safe address. The signature is calculated by signing this hash: keccak(address + str(int(current_epoch / 3600))).
   *
   * @param safeAddress - The Safe address
   * @param delegate - The delegate that will be removed
   * @returns
   * @throws "400 Malformed data"
   * @throws "422 Invalid Ethereum address/Error processing data"
   */
  async removeSafeDelegate(safeAddress: string, delegate: SafeDelegateDelete): Promise<any> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/delegates/${delegate.delegate}`,
      method: HttpMethod.Delete,
      body: delegate
    })
  }

  /**
   * Returns the creation information of a Safe.
   *
   * @param safeAddress - The Safe address
   * @returns The creation information of a Safe
   * @throws "404 Safe creation not found"
   * @throws "422	Owner address checksum not valid"
   * @throws "503 Problem connecting to Ethereum network"
   */
  async getSafeCreationInfo(safeAddress: string): Promise<SafeCreationInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/creation/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Estimates the safeTxGas for a given Safe multi-signature transaction.
   *
   * @param safeAddress - The Safe address
   * @param safeTransaction - The Safe transaction to estimate
   * @returns The safeTxGas for the given Safe transaction
   * @throws "400 Data not valid"
   * @throws "404 Safe not found"
   * @throws "422 Tx not valid"
   */
  async estimateSafeTransaction(
    safeAddress: string,
    safeTransaction: SafeMultisigTransactionEstimate
  ): Promise<SafeMultisigTransactionEstimateResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/estimations/`,
      method: HttpMethod.Post,
      body: safeTransaction
    })
  }

  /**
   * Creates a new multi-signature transaction with its confirmations and stores it in the Safe Transaction Service.
   *
   * @param safeAddress - The address of the Safe proposing the transaction
   * @param transaction - The transaction that is proposed
   * @param transactionHash - The hash of the Safe transaction
   * @param signature - The signature of an owner or delegate of the specified Safe
   * @returns The hash of the Safe transaction proposed
   * @throws "400 Invalid data"
   * @throws "422 Invalid ethereum address/User is not an owner/Invalid safeTxHash/Invalid signature/Nonce already executed/Sender is not an owner"
   */
  async proposeTransaction(
    safeAddress: string,
    transaction: SafeTransactionData,
    transactionHash: string,
    signature: SafeSignature
  ): Promise<void> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/`,
      method: HttpMethod.Post,
      body: {
        ...transaction,
        contractTransactionHash: transactionHash,
        sender: signature.signer,
        signature: signature.data
      }
    })
  }

  /**
   * Returns the history of incoming transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of incoming transactions
   * @throws "422 Safe address checksum not valid"
   */
  async getIncomingTransactions(safeAddress: string): Promise<TransferListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/incoming-transfers/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of module transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of module transactions
   * @throws "400 Invalid data"
   * @throws "422	Invalid ethereum address"
   */
  async getModuleTransactions(safeAddress: string): Promise<SafeModuleTransactionListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/module-transfers/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the history of multi-signature transactions of a Safe account.
   *
   * @param safeAddress - The Safe address
   * @returns The history of multi-signature transactions
   * @throws "400 Invalid data"
   * @throws "422 Invalid ethereum address"
   */
  async getMultisigTransactions(safeAddress: string): Promise<SafeMultisigTransactionListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/multisig-transactions/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.
   *
   * @param safeAddress - The Safe address
   * @param currentNonce - Current nonce of the Safe
   * @returns The list of transactions waiting for the confirmation of the Safe owners
   * @throws "400 Invalid data"
   * @throws "422 Invalid ethereum address"
   */
  async getPendingTransactions(
    safeAddress: string,
    currentNonce?: number
  ): Promise<SafeMultisigTransactionListResponse> {
    let nonce = currentNonce ? currentNonce : (await this.getSafeInfo(safeAddress)).nonce
    return sendRequest({
      url: `${
        this.#txServiceBaseUrl
      }/safes/${safeAddress}/multisig-transactions/?executed=false&nonce__gte=${nonce}`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the balances for Ether and ERC20 tokens of a Safe.
   *
   * @param safeAddress - The Safe address
   * @returns The balances for Ether and ERC20 tokens
   * @throws "404 Safe not found"
   * @throws "422 Safe address checksum not valid"
   */
  async getBalances(safeAddress: string): Promise<SafeBalanceResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/balances/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the balances for Ether and ERC20 tokens of a Safe with USD fiat conversion.
   *
   * @param safeAddress - The Safe address
   * @returns The balances for Ether and ERC20 tokens with USD fiat conversion
   * @throws "404 Safe not found"
   * @throws "422 Safe address checksum not valid"
   */
  async getUsdBalances(safeAddress: string): Promise<SafeBalanceUsdResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/balances/usd/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the collectives (ERC721 tokens) owned by the given Safe and information about them.
   *
   * @param safeAddress - The Safe address
   * @returns The collectives owned by the given Safe
   * @throws "404 Safe not found"
   * @throws "422 Safe address checksum not valid"
   */
  async getCollectibles(safeAddress: string): Promise<SafeCollectibleResponse[]> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/safes/${safeAddress}/collectibles/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the list of all the ERC20 tokens handled by the Safe.
   *
   * @returns The list of all the ERC20 tokens
   */
  async getTokens(): Promise<TokenInfoListResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/`,
      method: HttpMethod.Get
    })
  }

  /**
   * Returns the information of a given ERC20 token.
   *
   * @param tokenAddress - The token address
   * @returns The information of the given ERC20 token
   */
  async getToken(tokenAddress: string): Promise<TokenInfoResponse> {
    return sendRequest({
      url: `${this.#txServiceBaseUrl}/tokens/${tokenAddress}/`,
      method: HttpMethod.Get
    })
  }
}

export default SafeServiceClient
