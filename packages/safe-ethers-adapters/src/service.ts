import { BigNumber } from "@ethersproject/bignumber";
import { SafeSignature, SafeTransaction, SafeTransactionDataPartial } from "@gnosis.pm/safe-core-sdk";
import axios, { AxiosInstance } from "axios";

export interface SafeTxDetails {
    transactionHash?: string
}

export class SafeService {

    serviceUrl: string
    network: AxiosInstance

    constructor(serviceUrl: string, network?: AxiosInstance) {
        this.serviceUrl = serviceUrl
        this.network = network ?? axios;
    }

    /**
     * Estimates a Safe transaction
     *
     * @param safe - Address of the Safe for which this transaction should be estimated
     * @param safeTx - Safe transaction that should be estimated for execution
     * @returns A big number representing the safeTxGas for the passed Safe transaction
     */
    async estimateSafeTx(safe: string, safeTx: SafeTransactionDataPartial): Promise<BigNumber> {
        const url = `${this.serviceUrl}/api/v1/safes/${safe}/multisig-transactions/estimations/`
        const resp = await this.network.post(url, safeTx)
        return BigNumber.from(resp.data.safeTxGas)
    }

    /**
     * Load details for a Safe transaction
     *
     * @param safeTxHash - Hash of the Safe transaction
     * @returns A `SafeTxDetails` object that contains the details of a Safe transaction
     */
    async getSafeTxDetails(safeTxHash: string): Promise<SafeTxDetails> {
        const url = `${this.serviceUrl}/api/v1/multisig-transactions/${safeTxHash}`
        const resp = await this.network.get<SafeTxDetails>(url)
        return resp.data
    }

    /**
     * Propose a new Safe transaction to the service
     *
     * @param safeAddress - Address of the Safe for which this transaction should be proposed
     * @param safeTxHash - Hash of the Safe transaction
     * @param safeTx - Safe transaction that should be proposed
     * @param signature - Signature of an owner or a delegate of an owner of the specified Safe to authorize the proposal
     * @returns The hash of the Safe transaction that has been proposed
     */
    async proposeTx(safeAddress: string, safeTxHash: string, safeTx: SafeTransaction, signature: SafeSignature): Promise<String> {
        const url = `${this.serviceUrl}/api/v1/safes/${safeAddress}/multisig-transactions/`
        const data = {
            ...safeTx.data,
            contractTransactionHash: safeTxHash,
            sender: signature.signer,
            signature: signature.data
        }
        const resp = await this.network.post(url, data)
        return resp.data
    }
}