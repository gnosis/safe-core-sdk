# Safe Service Client

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-service-client.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-service-client)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-service-client.svg?style=flat)](https://github.com/gnosis/safe-service-client/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/safe-core-sdk/badge.svg?branch=main)](https://coveralls.io/github/gnosis/safe-core-sdk?branch=main)

Software development kit that facilitates the interaction with the [Safe Transaction Service API](https://github.com/gnosis/safe-transaction-service).

## Installation

Install the package with yarn or npm:

```bash
yarn install
npm install
```

## Build

Build the package with yarn or npm:

```bash
yarn build
npm build
```

## Getting Started

TBD

```js
const await safeService = new await safeServiceClient('https://safe-transaction.gnosis.io')
```


## API Reference

### getServiceInfo

Returns the information and configuration of the service.

```js
const serviceInfo: SafeServiceInfoResponse = await safeService.getServiceInfo()
```

### getServiceMasterCopiesInfo

Returns the list of Safe master copies.

```js
const masterCopies: MasterCopyResponse = await safeService.getServiceMasterCopiesInfo()
```

### decodeData

Decodes the specified Safe transaction data.

```js
const decodedData = await safeService.decodeData(data)
```

### getSafesByOwner

Returns the list of Safes where the address provided is an owner.

```js
const safes: OwnerResponse = await safeService.getSafesByOwner(ownerAddress)
```

### getTransaction

Returns all the information of a Safe transaction.

```js
const tx: SafeMultisigTransactionResponse = await safeService.getTransaction(safeTxHash)
```

### getTransactionConfirmations

Returns the list of confirmations for a given a Safe transaction.

```js
const confirmations: SafeMultisigConfirmationListResponse = await safeService.getTransactionConfirmations(safeTxHash)
```

### confirmTransaction

Adds a confirmation for a Safe transaction.

```js
const signature: SignatureResponse = await safeService.confirmTransaction(safeTxHash, signature)
```

### getSafeInfo

Returns the information and configuration of the provided Safe address.

```js
const safeInfo: SafeInfoResponse = await safeService.getSafeInfo(safeAddress)
```

### getSafeDelegates

Returns the list of delegates for a given Safe address.

```js
const delegates: SafeDelegateListResponse = await safeService.getSafeDelegates(safeAddress)
```

### addSafeDelegate

Adds a new delegate for a given Safe address. The signature is calculated by signing this hash: keccak(address + str(int(current_epoch / 3600))).

```js
await safeService.addSafeDelegate(safeAddress, delegate)
```

### removeSafeDelegate

Removes a delegate for a given Safe address. The signature is calculated by signing this hash: keccak(address + str(int(current_epoch / 3600))).

```js
await safeService.removeSafeDelegate(safeAddress, delegate)
```

### getSafeCreationInfo

Returns the creation information of a Safe.

```js
const safeCreationInfo: SafeCreationInfoResponse = await safeService.getSafeCreationInfo(safeAddress)
```

### estimateSafeTransaction

Estimates the safeTxGas for a given Safe multi-signature transaction.

```js
const estimateTx: SafeMultisigTransactionEstimateResponse = await safeService.estimateSafeTransaction(safeAddress, safeTransaction)
```

### proposeTransaction

Creates a new multi-signature transaction and stores it in the Safe Transaction Service.

```js
await safeService.proposeTransaction(safeAddress, transaction, transactionHash, signature)
```

### getIncomingTransactions

Returns the history of incoming transactions of a Safe account.

```js
const incomingTxs: TransferListResponse = await safeService.getIncomingTransactions(safeAddress)
```

### getModuleTransactions

Returns the history of module transactions of a Safe account.

```js
const moduleTxs: SafeModuleTransactionListResponse = await safeService.getModuleTransactions(safeAddress)
```

### getMultisigTransactions

Returns the history of multi-signature transactions of a Safe account.

```js
const multisigTxs: SafeMultisigTransactionListResponse = await safeService.getMultisigTransactions(safeAddress)
```

### getPendingTransactions

Returns the list of multi-signature transactions that are waiting for the confirmation of the Safe owners.

```js
const pendingTxs: SafeMultisigTransactionListResponse = await safeService.getPendingTransactions(safeAddress)
```

```js
const pendingTxs: SafeMultisigTransactionListResponse = await safeService.getPendingTransactions(safeAddress, currentNonce)
```

### getBalances

Returns the balances for Ether and ERC20 tokens of a Safe.

```js
const balances: SafeBalanceResponse[] = await safeService.getBalances(safeAddress)
```

### getUsdBalances

Returns the balances for Ether and ERC20 tokens of a Safe with USD fiat conversion.

```js
const usdBalances: SafeBalanceUsdResponse[] = await safeService.getUsdBalances(safeAddress)
```

### getCollectibles

Returns the collectives (ERC721 tokens) owned by the given Safe and information about them.

```js
const collectibles: SafeCollectibleResponse[] = await safeService.getCollectibles(safeAddress)
```

### getTokens

Returns the list of all the ERC20 tokens handled by the Safe.

```js
const tokens: TokenInfoListResponse = await safeService.getTokens()
```

### getToken

Returns the information of a given ERC20 token.

```js
const token: TokenInfoResponse = await safeService.getToken(tokenAddress)
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
