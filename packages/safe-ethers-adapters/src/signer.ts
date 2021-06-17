import { BigNumber } from "@ethersproject/bignumber";
import { VoidSigner } from "@ethersproject/abstract-signer";
import { Provider, TransactionResponse, TransactionRequest, TransactionReceipt } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { Safe } from "@gnosis.pm/safe-core-sdk";
import { SafeTransactionData, OperationType } from "@gnosis.pm/safe-core-sdk/dist/src/utils/transactions/SafeTransaction";
import { SafeService } from "./service";
import { createLibAddress, createLibInterface, mapReceipt } from "./utils";

const sleep = (duration: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, duration))

export interface SafeTransactionResponse extends TransactionResponse {
    operation: OperationType
}

export interface SafeEthersSignerOptions {
    pollingDelay?: number
}

export interface SafeFactory extends Promise<Safe> {
    getAddress: () => string
}

export class SafeEthersSigner extends VoidSigner {

    readonly service: SafeService
    readonly safe: Safe | SafeFactory
    readonly options?: SafeEthersSignerOptions

    /**
     * Creates an instance of the SafeEthersSigner.
     * @param safe - Safe that should be used
     * @param service - Services to which the transactions should be proposed to
     * @param provider - (Optional) Provider that should be used for blockchain interactions. By default the provider from the signer is used.
     * @param options - (Optional) Additional options (e.g. polling delay when waiting for a transaction to be mined)
     * @returns The SafeEthersSigner instance
     */
    constructor(safe: Safe | SafeFactory, service: SafeService, provider?: Provider, options?: SafeEthersSignerOptions) {
        super(safe.getAddress(), provider)
        this.service = service
        this.safe = safe
        this.options = options
    }

    async buildTransactionResponse(safeTxHash: string, safeTx: SafeTransactionData): Promise<SafeTransactionResponse> {
        const connectedSafe = await this.safe;
        const connectedService = this.service;
        return {
            to: safeTx.to,
            value: BigNumber.from(safeTx.value),
            data: safeTx.data,
            operation: safeTx.operation,
            gasLimit: BigNumber.from(safeTx.safeTxGas),
            gasPrice: BigNumber.from(0),
            nonce: safeTx.nonce,
            chainId: await connectedSafe.getChainId(),
            hash: safeTxHash,
            from: this.address,
            confirmations: 0,
            wait: async (confirmations?: number): Promise<TransactionReceipt> => {
                while (true) {
                    try {
                        const txDetails = await connectedService.getSafeTxDetails(safeTxHash)
                        if (txDetails.transactionHash) {
                            this._checkProvider("sendTransaction")
                            const receipt = await this.provider!!.waitForTransaction(txDetails.transactionHash, confirmations)
                            return mapReceipt(receipt, safeTx)
                        }
                    } catch (e) {
                    }
                    await sleep(this.options?.pollingDelay ?? 5000)
                }
            }
        }
    }

    /**
     * Populates all fields in a transaction, signs it and sends it to the Safe transaction service
     *
     * @param transaction - The transaction what should be send
     * @returns A promise that resolves to a SafeTransactionReponse, that contains all the information of the transaction.
     */
    async sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<SafeTransactionResponse> {
        const tx = await transaction
        let operation = OperationType.Call
        let to = await tx.to
        let data = (await tx.data)?.toString() ?? "0x"
        let value = BigNumber.from(await tx.value ?? 0)
        if (!to) {
            to = createLibAddress
            data = createLibInterface.encodeFunctionData("performCreate", [value, data])
            value = BigNumber.from(0)
            operation = OperationType.DelegateCall
        }
        const baseTx = {
            to: to!!,
            data,
            value: value.toString(),
            operation
        }
        const safeTxGas = await this.service.estimateSafeTx(this.address, baseTx)
        const connectedSafe = await this.safe;
        const safeTx = await connectedSafe.createTransaction({
            ...baseTx,
            safeTxGas: safeTxGas.toNumber()
        })
        const safeTxHash = await connectedSafe.getTransactionHash(safeTx)
        const signature = await connectedSafe.signTransactionHash(safeTxHash)
        await this.service.proposeTx(this.address, safeTxHash, safeTx, signature)
        // TODO: maybe use original tx information
        return this.buildTransactionResponse(safeTxHash, safeTx.data)
    }
}