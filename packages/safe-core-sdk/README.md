# Safe Core SDK

[![NPM Version](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-core-sdk.svg)](https://badge.fury.io/js/%40gnosis.pm%2Fsafe-core-sdk)
[![GitHub Release](https://img.shields.io/github/release/gnosis/safe-core-sdk.svg?style=flat)](https://github.com/gnosis/safe-core-sdk/releases)
[![GitHub](https://img.shields.io/github/license/gnosis/safe-core-sdk)](https://github.com/gnosis/safe-core-sdk/blob/main/LICENSE.md)
[![Coverage Status](https://coveralls.io/repos/github/gnosis/safe-core-sdk/badge.svg?branch=main)](https://coveralls.io/github/gnosis/safe-core-sdk?branch=main)

Software development kit that facilitates the interaction with the [Gnosis Safe contracts](https://github.com/gnosis/safe-contracts).

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

A Safe account with three owners and threshold equal three will be used as the starting point for this example but any Safe configuration is valid. Let's start defining the three owners and the Safe address.

```js
import { ethers } from 'ethers'

const web3Provider = // ...
const provider = new ethers.providers.Web3Provider(web3Provider)
const owner1 = provider.getSigner(0)
const owner2 = provider.getSigner(1)
const owner3 = provider.getSigner(2)

// Existing Safe address (e.g. Safe created via https://app.gnosis-safe.io)
// Where owner1, owner2 and owner3 are the Safe owners
const safeAddress = '0x<safe_address>'
```

### 1. Set up the SDK using `Ethers` or `Web3`

If the app integrating the SDK is using `Ethers` `v5`, create an instance of the `EthersAdapter`.

```js
import { ethers } from 'ethers'
import { EthersAdapter } from '@gnosis.pm/safe-core-sdk'

const ethAdapterOwner1 = new EthersAdapter({
  ethers,
  signer: owner1
})
```

If the app integrating the SDK is using `Web3` `v1`, create an instance of the `Web3Adapter`.

```js
import Web3 from 'web3'
import { Web3Adapter } from '@gnosis.pm/safe-core-sdk'

const ethAdapterOwner1 = new Web3Adapter({
  web3,
  signerAddress: await owner1.getAddress()
})
```

Create an instance of the Safe Core SDK calling the method `create` from the `Safe` class and passing a `safeAddress` and an instance of the `EthAdapter` class (`EthersAdapter` or `Web3Adapter` depending on the library used by the app). The signer connected to the Safe will be the one selected when the `ethAdapter` was instantiated, in this case, `owner1`.

```js
import Safe from '@gnosis.pm/safe-core-sdk'

const safeSdk = await Safe.create({ ethAdapter: ethAdapterOwner1, safeAddress })
```

### 2. Create a Safe transaction

```js
import { SafeTransactionDataPartial } from '@gnosis.pm/safe-core-sdk'

const transactions: SafeTransactionDataPartial[] = [{
  to: '0x<address>',
  value: '<eth_value_in_wei>',
  data: '0x<data>'
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
```

Before executing this transaction, it must be signed by the owners and this can be done off-chain or on-chain. In this example `owner1` will sign it off-chain, `owner2` will sign it on-chain and `owner3` will execute it (the executor also signs the transaction transparently).

### 2.a. Off-chain signatures

The `owner1` account signs the transaction off-chain.

```js
const owner1Signature = await safeSdk.signTransaction(safeTransaction)
```

Because the signature is off-chain, there is no interaction with the contract and the signature becomes available at `safeTransaction.signatures`.

### 2.b. On-chain signatures

To connect `owner2` to the Safe we need to create a new instance of the class `EthAdapter` passing to its constructor the owner we would like to connect. After `owner2` account is connected to the SDK as a signer the transaction hash will be approved on-chain.

```js
const ethAdapterOwner2 = new EthersAdapter({ ethers, signer: owner2 })
const safeSdk2 = await safeSdk.connect({ ethAdapter: ethAdapterOwner2, safeAddress })
const txHash = await safeSdk2.getTransactionHash(safeTransaction)
const approveTxResponse = await safeSdk2.approveTransactionHash(txHash)
await approveTxResponse.wait()
```

### 3. Transaction execution

Lastly, `owner3` account is connected to the SDK as a signer and executor of the Safe transaction to execute it.

```js
const ethAdapterOwner3 = new EthersAdapter({ ethers, signer: owner3 })
const safeSdk3 = await safeSdk2.connect({ ethAdapter: ethAdapterOwner3, safeAddress })
const executeTxResponse = await safeSdk3.executeTransaction(safeTransaction)
await executeTxResponse.wait()
```

All the signatures used to execute the transaction are now available at `safeTransaction.signatures`.

## API Reference

### create
Returns an instance of the Safe Core SDK connected to the `safeAddress`.

```js
const safeSdk = await Safe.create({ ethAdapter, safeAddress })
```

The property `contractNetworks` can be added to provide the Safe contract addresses in case the SDK is used in a network where the Safe contracts are not deployed.

```js
const contractNetworks: ContractNetworksConfig = {
  [chainId]: {
    multiSendAddress: '0x<multisend_address>'
  }
}
const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
```

### connect

Returns a new instance of the Safe Core SDK connected to the `safeAddress`.

```js
const safeSdk2 = await safeSdk.connect({ ethAdapter, safeAddress })
```

The property `contractNetworks` can be added to provide the Safe contract addresses in case the SDK is used in a network where the Safe contracts are not deployed.

```js
const contractNetworks: ContractNetworksConfig = {
  [chainId]: {
    multiSendAddress: '0x<multisend_address>'
  }
}
const safeSdk = await Safe.create({ ethAdapter, safeAddress, contractNetworks })
```

### getAddress

Returns the address of the current Safe Proxy contract.

```js
const address = safeSdk.getAddress()
```

### getContractVersion

Returns the Safe Master Copy contract version.

```js
const contractVersion = await safeSdk.getContractVersion()
```

### getOwners

Returns the list of Safe owner accounts.

```js
const owners = await safeSdk.getOwners()
```

### getNonce

Returns the Safe nonce.

```js
const nonce = await safeSdk.getNonce()
```

### getThreshold

Returns the Safe threshold.

```js
const threshold = await safeSdk.getThreshold()
```

### getChainId

Returns the chainId of the connected network.

```js
const chainId = await safeSdk.getChainId()
```

### getBalance

Returns the ETH balance of the Safe.

```js
const balance = await safeSdk.getBalance()
```

### getModules

Returns the list of addresses of all the enabled Safe modules.

```js
const modules = await safeSdk.getModules()
```

### isModuleEnabled

Checks if a specific Safe module is enabled for the current Safe.

```js
const isEnabled = await safeSdk.isModuleEnabled(moduleAddress)
```

### isOwner

Checks if a specific address is an owner of the current Safe.

```js
const isOwner = await safeSdk.isOwner(address)
```

### createTransaction

Returns a Safe transaction ready to be signed by the owners and executed. Batched transactions are allowed if more than one transaction is added to the array of transactions.

Each of the transactions provided as input to this function must be an object with the following properties:

* `to`: Required.
* `data`: Required.
* `value`: Required.
* `operation`: Optional. `OperationType.Call` (0) is the default value.
* `safeTxGas`: Optional. The right gas estimation is the default value.
* `baseGas`: Optional. 0 is the default value.
* `gasPrice`: Optional. 0 is the default value.
* `gasToken`: Optional. 0x address is the default value.
* `refundReceiver`: Optional. 0x address is the default value.
* `nonce`: Optional. The current Safe nonce is the default value.

Read more about the [Safe transaction properties](https://docs.gnosis.io/safe/docs/contracts_tx_execution/).

```js
const transactions: SafeTransactionDataPartial[] = [
  {
    to: '0x<address>',
    data: '0x<data>',
    value: '<eth_value_in_wei>'
  },
  // ...
]
const safeTransaction = await safeSdk.createTransaction(...transactions)
```

### createRejectionTransaction

Returns a Safe transaction ready to be signed by the owners that invalidates the pending Safe transaction/s with a specific nonce.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction =  await safeSdk.createTransaction(...transactions)
const rejectionTransaction = await safeSdk.createRejectionTransaction(safeTransaction.data.nonce)
```

### getTransactionHash

Returns the transaction hash of a Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
```

### signTransactionHash

Signs a hash using the current owner account.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const signature = await safeSdk.signTransactionHash(txHash)
```

### signTransaction

Adds the signature of the current owner to the Safe transaction object.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
await safeSdk.signTransaction(safeTransaction)
```

### approveTransactionHash

Approves a hash on-chain using the current owner account.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const txResponse = await safeSdk.approveTransactionHash(txHash)
await txResponse.wait()
```

### getOwnersWhoApprovedTx

Returns a list of owners who have approved a specific Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txHash = await safeSdk.getTransactionHash(safeTransaction)
const owners = await safeSdk.getOwnersWhoApprovedTx(txHash)
```

### getEnableModuleTx

Returns a Safe transaction ready to be signed that will enable a Safe module.

```js
const safeTransaction = await safeSdk.getEnableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

### getDisableModuleTx

Returns a Safe transaction ready to be signed that will disable a Safe module.

```js
const safeTransaction = await safeSdk.getDisableModuleTx(moduleAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

### getAddOwnerTx

Returns the Safe transaction to add an owner and update the threshold.

```js
const safeTransaction = await safeSdk.getAddOwnerTx(newOwnerAddress, newThreshold)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

If `threshold` is not provided, the current threshold will not change.

```js
const safeTransaction = await safeSdk.getAddOwnerTx(newOwnerAddress)
```

### getRemoveOwnerTx

Returns the Safe transaction to remove an owner and update the threshold.

```js
const safeTransaction = await safeSdk.getRemoveOwnerTx(ownerAddress, newThreshold)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

If `threshold` is not provided, the current threshold will be decreased by one.

```js
const safeTransaction = await safeSdk.getRemoveOwnerTx(ownerAddress)
```

### getSwapOwnerTx

Returns the Safe transaction to replace an owner of the Safe with a new one.

```js
const safeTransaction = await safeSdk.getSwapOwnerTx(oldOwnerAddress, newOwnerAddress)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

### getChangeThresholdTx

Returns the Safe transaction to change the threshold.

```js
const safeTransaction = await safeSdk.getChangeThresholdTx(newThreshold)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

### executeTransaction

Executes a Safe transaction.

```js
const transactions: SafeTransactionDataPartial[] = [{
  // ...
}]
const safeTransaction = await safeSdk.createTransaction(...transactions)
const txResponse = await safeSdk.executeTransaction(safeTransaction)
await txResponse.wait()
```

Optionally, `gasLimit` and `gasPrice` values can be passed as execution options, avoiding the gas estimation.

```
const options: TransactionOptions = {
  gasLimit: 123456,
  gasPrice: 123 // Optional parameter.
}
const txResponse = await safeSdk.executeTransaction(safeTransaction, options)
```

## License

This library is released under MIT.

## Contributors

- Germán Martínez ([germartinez](https://github.com/germartinez))
