import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import { SafeEthersSigner, SafeTxDetails } from '../src/'
import sinon from 'sinon'
import { BigNumber } from '@ethersproject/bignumber'
import { getCreateCallDeployment } from '@gnosis.pm/safe-deployments'
import { VoidSigner } from '@ethersproject/abstract-signer'

chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('SafeEthersSigner', () => {
  describe('sendTransaction', async () => {
    it('should submit contract interaction to sevice', async () => {
      const txData = {
        to: "to_address",
        value: "0x42",
        data: "0xbaddad42"
      }
      const parsedTxData = {
        to: 'to_address',
        data: '0xbaddad42',
        value: '66',
        operation: 0
      }
      const safeTxData = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTx = { data: safeTxData }
      const signature = { signer: "some_signer", data: "some_signature" }
      const safe: any = {
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
        createTransaction: sinon.fake.returns(safeTx),
        getTransactionHash: sinon.fake.returns("some_transaction_hash"),
        signTransactionHash: sinon.fake.returns(signature)
      }
      const service: any = {
        estimateSafeTx: sinon.fake.returns(BigNumber.from(1337)),
        proposeTx: sinon.fake.returns("some_data")
      }
      const signer = new SafeEthersSigner(safe, service)

      // TODO check response
      await signer.sendTransaction(txData)
      chai.expect(service.estimateSafeTx).to.have.been.calledWith(
        "some_safe_address",
        parsedTxData
      )
      chai.expect(service.proposeTx).to.have.been.calledWith(
        "some_safe_address",
        "some_transaction_hash",
        safeTx,
        signature
      )
    })

    it('should submit contract creation to sevice', async () => {
      const createLibAddress = getCreateCallDeployment()
      const txData = {
        value: "0x42",
        data: "0xbaddad42"
      }
      const parsedTxData = {
        to: createLibAddress!!.defaultAddress,
        data: '0x4c8c9ea1000000000000000000000000000000000000000000000000000000000000004200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004baddad4200000000000000000000000000000000000000000000000000000000',
        value: "0",
        operation: 1
      }
      const safeTxData = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTx = { data: safeTxData }
      const signature = { signer: "some_signer", data: "some_signature" }
      const safe: any = {
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
        createTransaction: sinon.fake.returns(safeTx),
        getTransactionHash: sinon.fake.returns("some_transaction_hash"),
        signTransactionHash: sinon.fake.returns(signature)
      }
      const service: any = {
        estimateSafeTx: sinon.fake.returns(BigNumber.from(1337)),
        proposeTx: sinon.fake.returns("some_data")
      }
      const signer = new SafeEthersSigner(safe, service)

      // TODO check response
      await signer.sendTransaction(txData)
      chai.expect(service.estimateSafeTx).to.have.been.calledWith(
        "some_safe_address",
        parsedTxData
      )
      chai.expect(service.proposeTx).to.have.been.calledWith(
        "some_safe_address",
        "some_transaction_hash",
        safeTx,
        signature
      )
    })
  })
  
  describe('buildTransactionResponse', async () => {
    it('should be able to handle Safe tx without logs', async () => {
      const parsedTxData = {
        to: 'to_address',
        data: '0xbaddad42',
        value: '66',
        operation: 0
      }
      const safeTxData: any = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTxDetails: SafeTxDetails = {
        transactionHash: "some_eth_tx_hash"
      }

      const getSafeTxDetails = sinon.stub();
      getSafeTxDetails.onCall(0).throws();
      getSafeTxDetails.onCall(1).returns({});
      getSafeTxDetails.returns(safeTxDetails);

      const safe: any = { 
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
      }
      const service: any = { getSafeTxDetails }
      const provider: any = { 
        waitForTransaction: sinon.fake.returns({ transactionHash: "some_eth_tx_hash" ,logs: []})
      }
      const signer = new SafeEthersSigner(safe, service, provider, { pollingDelay: 1 })

      const response = await signer.buildTransactionResponse("some_safe_tx_hash", safeTxData)
      chai.expect(response.operation).to.be.equals(0)
      const receipt = await response.wait()
      chai.expect(receipt.transactionHash).to.be.equals("some_eth_tx_hash")
      chai.expect(receipt.status).to.be.equals(0)
      chai.expect(receipt.contractAddress).to.be.undefined
      chai.expect(service.getSafeTxDetails).to.have.been.calledWith(
        "some_safe_tx_hash"
      )
    })

    it('should map success log of Safe tx', async () => {
      const parsedTxData = {
        to: 'to_address',
        data: '0xbaddad42',
        value: '66',
        operation: 0
      }
      const safeTxData: any = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTxDetails: SafeTxDetails = {
        transactionHash: "some_eth_tx_hash"
      }
      const safe: any = { 
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
      }
      const service: any = { 
        getSafeTxDetails : sinon.fake.returns(safeTxDetails)
      }
      // ExecutionSuccess event (see https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol#L49)
      const logs = [
        {
          topics: [
            "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e"
          ],
          data: "0x0b74276407da686d2d73c6e83f0d238e5fc94917d787df25259f6a7cd8d97e9f0000000000000000000000000000000000000000000000000000000000000000"
        }
      ]
      const provider: any = { 
        waitForTransaction: sinon.fake.returns({ transactionHash: "some_eth_tx_hash" ,logs})
      }
      const signer = new SafeEthersSigner(safe, service, provider, { pollingDelay: 1 })

      const response = await signer.buildTransactionResponse("some_safe_tx_hash", safeTxData)
      chai.expect(response.operation).to.be.equals(0)
      const receipt = await response.wait()
      chai.expect(receipt.transactionHash).to.be.equals("some_eth_tx_hash")
      chai.expect(receipt.status).to.be.equals(1)
      chai.expect(receipt.contractAddress).to.be.undefined
      chai.expect(service.getSafeTxDetails).to.have.been.calledWith(
        "some_safe_tx_hash"
      )
    })

    it('should map failure log of Safe tx', async () => {
      const parsedTxData = {
        to: 'to_address',
        data: '0xbaddad42',
        value: '66',
        operation: 0
      }
      const safeTxData: any = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTxDetails: SafeTxDetails = {
        transactionHash: "some_eth_tx_hash"
      }
      const safe: any = { 
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
      }
      const service: any = { 
        getSafeTxDetails : sinon.fake.returns(safeTxDetails)
      }
      // ExecutionFailure event (see https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol#L48)
      const logs = [
        {
          topics: [
            "0x23428b18acfb3ea64b08dc0c1d296ea9c09702c09083ca5272e64d115b687d23"
          ],
          data: "0x0b74276407da686d2d73c6e83f0d238e5fc94917d787df25259f6a7cd8d97e9f0000000000000000000000000000000000000000000000000000000000000000"
        }
      ]
      const provider: any = { 
        waitForTransaction: sinon.fake.returns({ transactionHash: "some_eth_tx_hash" ,logs})
      }
      const signer = new SafeEthersSigner(safe, service, provider, { pollingDelay: 1 })

      const response = await signer.buildTransactionResponse("some_safe_tx_hash", safeTxData)
      chai.expect(response.operation).to.be.equals(0)
      const receipt = await response.wait()
      chai.expect(receipt.transactionHash).to.be.equals("some_eth_tx_hash")
      chai.expect(receipt.status).to.be.equals(0)
      chai.expect(receipt.contractAddress).to.be.undefined
      chai.expect(service.getSafeTxDetails).to.have.been.calledWith(
        "some_safe_tx_hash"
      )
    })

    it('should not fail for creation tx without creation log', async () => {
      const createLibDeployment = getCreateCallDeployment()
      const parsedTxData = {
        to: createLibDeployment!!.defaultAddress,
        data: '0xbaddad42',
        value: '0',
        operation: 1
      }
      const safeTxData: any = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTxDetails: SafeTxDetails = {
        transactionHash: "some_eth_tx_hash"
      }
      const safe: any = { 
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
      }
      const service: any = { 
        getSafeTxDetails : sinon.fake.returns(safeTxDetails)
      }
      // ExecutionSuccess event (see https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol#L49)
      const logs = [
        {
          topics: [
            "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e"
          ],
          data: "0x0b74276407da686d2d73c6e83f0d238e5fc94917d787df25259f6a7cd8d97e9f0000000000000000000000000000000000000000000000000000000000000000"
        }
      ]
      const provider: any = { 
        waitForTransaction: sinon.fake.returns({ transactionHash: "some_eth_tx_hash" ,logs})
      }
      const signer = new SafeEthersSigner(safe, service, provider, { pollingDelay: 1 })

      const response = await signer.buildTransactionResponse("some_safe_tx_hash", safeTxData)
      chai.expect(response.operation).to.be.equals(1)
      const receipt = await response.wait()
      chai.expect(receipt.transactionHash).to.be.equals("some_eth_tx_hash")
      chai.expect(receipt.status).to.be.equals(1)
      chai.expect(receipt.contractAddress).to.be.undefined
      chai.expect(service.getSafeTxDetails).to.have.been.calledWith(
        "some_safe_tx_hash"
      )
    })

    it('should map creation tx', async () => {
      const createLibDeployment = getCreateCallDeployment()
      const parsedTxData = {
        to: createLibDeployment!!.defaultAddress,
        data: '0xbaddad42',
        value: '0',
        operation: 1
      }
      const safeTxData: any = {
        ...parsedTxData,
        safeTxGas: BigNumber.from(1337)
      }
      const safeTxDetails: SafeTxDetails = {
        transactionHash: "some_eth_tx_hash"
      }
      const safe: any = { 
        getAddress: sinon.fake.returns("some_safe_address"),
        getChainId: sinon.fake.returns(1),
      }
      const service: any = { 
        getSafeTxDetails : sinon.fake.returns(safeTxDetails)
      }
      // ExecutionSuccess event (see https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/GnosisSafe.sol#L49)
      // and
      // ContractCreation event (see https://github.com/gnosis/safe-contracts/blob/v1.3.0/contracts/libraries/CreateCall.sol#L7)
      const logs = [
        {
          topics: [
            "0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e"
          ],
          data: "0x0b74276407da686d2d73c6e83f0d238e5fc94917d787df25259f6a7cd8d97e9f0000000000000000000000000000000000000000000000000000000000000000"
        },
        {
          topics: [
            "0x4db17dd5e4732fb6da34a148104a592783ca119a1e7bb8829eba6cbadef0b511"
          ],
          data: "0x000000000000000000000000e50c6391a6cb10f9b9ef599aa1c68c82dd88bd91"
        }
      ]
      const provider: any = { 
        waitForTransaction: sinon.fake.returns({ transactionHash: "some_eth_tx_hash" ,logs})
      }
      const signer = new SafeEthersSigner(safe, service, provider, { pollingDelay: 1 })

      const response = await signer.buildTransactionResponse("some_safe_tx_hash", safeTxData)
      chai.expect(response.operation).to.be.equals(1)
      const receipt = await response.wait()
      chai.expect(receipt.transactionHash).to.be.equals("some_eth_tx_hash")
      chai.expect(receipt.status).to.be.equals(1)
      chai.expect(receipt.contractAddress).to.be.equals("0xe50c6391a6cb10f9B9Ef599aa1C68C82dD88Bd91")
      chai.expect(service.getSafeTxDetails).to.have.been.calledWith(
        "some_safe_tx_hash"
      )
    })
  })
})
