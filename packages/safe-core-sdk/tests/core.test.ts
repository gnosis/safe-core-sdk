import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'ethers'
import { deployments, waffle } from 'hardhat'
import Safe, { ContractNetworksConfig } from '../src'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe Core SDK', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      chainId: (await waffle.provider.getNetwork()).chainId,
      safe: await getSafeWithOwners([accounts[0].address, accounts[1].address]),
      accounts,
      contractNetworks
    }
  })

  describe('connect', async () => {
    it('should connect ethAdapter to Safe address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
      chai
        .expect(await safeSdk.getEthAdapter().getSignerAddress())
        .to.be.eq(await account1.signer.getAddress())

      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk.connect({ ethAdapter: ethAdapter2, contractNetworks })
      chai.expect(safeSdk2.getAddress()).to.be.eq(safe.address)
      chai
        .expect(await safeSdk2.getEthAdapter().getSignerAddress())
        .to.be.eq(await account2.signer.getAddress())

      const safe2 = await getSafeWithOwners([accounts[2].address])
      const safeSdk3 = await safeSdk2.connect({ safeAddress: safe2.address })
      chai.expect(safeSdk3.getAddress()).to.be.eq(safe2.address)
      chai
        .expect(await safeSdk3.getEthAdapter().getSignerAddress())
        .to.be.eq(await account2.signer.getAddress())
    })
  })

  describe('getContractVersion', async () => {
    it('should return the Safe contract version', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const contractVersion = await safeSdk.getContractVersion()
      chai.expect(contractVersion).to.be.eq('1.2.0')
    })
  })

  describe('getAddress', async () => {
    it('should return the Safe contract address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(safeSdk.getAddress()).to.be.eq(safe.address)
    })
  })

  describe('getEthAdapter', async () => {
    it('should return the connected EthAdapter', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai
        .expect(await safeSdk.getEthAdapter().getSignerAddress())
        .to.be.eq(await account1.signer.getAddress())
    })
  })

  describe('getNonce', async () => {
    it('should return the Safe nonce', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safe = await getSafeWithOwners([account1.address])
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getNonce()).to.be.eq(0)
      const tx = await safeSdk.createTransaction({
        to: account2.address,
        value: '0',
        data: '0x'
      })
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getNonce()).to.be.eq(1)
    })
  })

  describe('getChainId', async () => {
    it('should return the chainId of the current network', async () => {
      const { safe, accounts, chainId, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getChainId()).to.be.eq(chainId)
    })
  })

  describe('getBalance', async () => {
    it('should return the balance of the Safe contract', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(0)
      await account1.signer.sendTransaction({
        to: safe.address,
        value: BigNumber.from(`${1e18}`).toHexString()
      })
      chai.expect(await safeSdk.getBalance()).to.be.eq(BigNumber.from(`${1e18}`))
    })
  })
})
