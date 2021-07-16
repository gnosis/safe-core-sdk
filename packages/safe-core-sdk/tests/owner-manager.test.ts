import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { deployments, waffle } from 'hardhat'
import Safe, { ContractNetworksConfig } from '../src'
import { SENTINEL_ADDRESS, ZERO_ADDRESS } from '../src/utils/constants'
import { getMultiSend, getSafeWithOwners } from './utils/setupContracts'
import { getEthAdapter } from './utils/setupEthAdapter'
import { getAccounts } from './utils/setupTestNetwork'
import { waitSafeTxReceipt } from './utils/transactions'

chai.use(chaiAsPromised)

describe('Safe owners manager', () => {
  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture()
    const accounts = await getAccounts()
    const chainId: number = (await waffle.provider.getNetwork()).chainId
    const contractNetworks: ContractNetworksConfig = {
      [chainId]: { multiSendAddress: (await getMultiSend()).address }
    }
    return {
      safe: await getSafeWithOwners([
        accounts[0].address,
        accounts[1].address,
        accounts[2].address
      ]),
      accounts,
      contractNetworks
    }
  })

  describe('getOwners', async () => {
    it('should return the list of Safe owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address, account2.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(2)
      chai.expect(owners[0]).to.be.eq(account1.address)
      chai.expect(owners[1]).to.be.eq(account2.address)
    })
  })

  describe('isOwner', async () => {
    it('should return true if an account is an owner of the connected Safe', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const isOwner = await safeSdk.isOwner(account1.address)
      chai.expect(isOwner).to.be.true
    })

    it('should return false if an account is not an owner of the connected Safe', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const isOwner = await safeSdk.isOwner(account2.address)
      chai.expect(isOwner).to.be.false
    })
  })

  describe('getAddOwnerTx', async () => {
    it('should fail if address is invalid', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getAddOwnerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getAddOwnerTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getAddOwnerTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is already an owner', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getAddOwnerTx(account1.address)
      await chai.expect(tx).to.be.rejectedWith('Address provided is already an owner')
    })

    it('should fail if the threshold is bigger than the number of owners', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 3
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners)
      const tx = safeSdk.getAddOwnerTx(account2.address, newThreshold)
      await chai.expect(tx).to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getAddOwnerTx(account2.address, 0)
      await chai.expect(tx).to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should add an owner and keep the same threshold', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const initialThreshold = await safeSdk.getThreshold()
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      const tx = await safeSdk.getAddOwnerTx(account2.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const finalThreshold = await safeSdk.getThreshold()
      chai.expect(initialThreshold).to.be.eq(finalThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(initialOwners.length + 1)
      chai.expect(owners[0]).to.be.eq(account2.address)
      chai.expect(owners[1]).to.be.eq(account1.address)
    })

    it('should add an owner and update the threshold', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 1
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      const tx = await safeSdk.getAddOwnerTx(account2.address, newThreshold)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk.getThreshold()).to.be.eq(newThreshold)
      const owners = await safeSdk.getOwners()
      chai.expect(owners.length).to.be.eq(2)
      chai.expect(owners[0]).to.be.eq(account2.address)
      chai.expect(owners[1]).to.be.eq(account1.address)
    })
  })

  describe('getRemoveOwnerTx', async () => {
    it('should fail if address is invalid', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getRemoveOwnerTx('0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to sentinel', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getRemoveOwnerTx(SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is equal to 0x address', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getRemoveOwnerTx(ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid owner address provided')
    })

    it('should fail if address is not an owner', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3, account4] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getRemoveOwnerTx(account4.address)
      await chai.expect(tx).to.be.rejectedWith('Address provided is not an owner')
    })

    it('should fail if the threshold is bigger than the number of owners', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const newThreshold = 3
      const numOwners = (await safeSdk.getOwners()).length
      chai.expect(newThreshold).to.be.gt(numOwners - 1)
      const tx = safeSdk.getRemoveOwnerTx(account1.address, newThreshold)
      await chai.expect(tx).to.be.rejectedWith('Threshold cannot exceed owner count')
    })

    it('should fail if the threshold is not bigger than 0', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getRemoveOwnerTx(account1.address, 0)
      await chai.expect(tx).to.be.rejectedWith('Threshold needs to be greater than 0')
    })

    it('should remove the first owner of a Safe and decrease the threshold', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
      const initialThreshold = await safeSdk1.getThreshold()
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      chai.expect(initialOwners[1]).to.be.eq(account2.address)
      chai.expect(initialOwners[2]).to.be.eq(account3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(account1.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const finalThreshold = await safeSdk1.getThreshold()
      chai.expect(initialThreshold - 1).to.be.eq(finalThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(account2.address)
      chai.expect(finalOwners[1]).to.be.eq(account3.address)
    })

    it('should remove any owner of a Safe and decrease the threshold', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({
        ethAdapter: ethAdapter3,
        contractNetworks
      })
      const initialThreshold = await safeSdk1.getThreshold()
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      chai.expect(initialOwners[1]).to.be.eq(account2.address)
      chai.expect(initialOwners[2]).to.be.eq(account3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(account2.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const finalThreshold = await safeSdk1.getThreshold()
      chai.expect(initialThreshold - 1).to.be.eq(finalThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(account1.address)
      chai.expect(finalOwners[1]).to.be.eq(account3.address)
    })

    it('should remove an owner and update the threshold', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
      const newThreshold = 1
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      chai.expect(initialOwners[1]).to.be.eq(account2.address)
      chai.expect(initialOwners[2]).to.be.eq(account3.address)
      const tx = await safeSdk1.getRemoveOwnerTx(account1.address, newThreshold)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      chai.expect(await safeSdk1.getThreshold()).to.be.eq(newThreshold)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(initialOwners.length - 1)
      chai.expect(finalOwners[0]).to.be.eq(account2.address)
      chai.expect(finalOwners[1]).to.be.eq(account3.address)
    })
  })

  describe('getSwapOwnerTx', async () => {
    it('should fail if old address is invalid', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx('0x123', account2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is invalid', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(account1.address, '0x123')
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is equal to sentinel', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(SENTINEL_ADDRESS, account2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is equal to sentinel', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(account1.address, SENTINEL_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is equal to 0x address', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(ZERO_ADDRESS, account2.address)
      await chai.expect(tx).to.be.rejectedWith('Invalid old owner address provided')
    })

    it('should fail if new address is equal to 0x address', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(account1.address, ZERO_ADDRESS)
      await chai.expect(tx).to.be.rejectedWith('Invalid new owner address provided')
    })

    it('should fail if old address is not an owner', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3, account4] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(account4.address, account2.address)
      await chai.expect(tx).to.be.rejectedWith('Old address provided is not an owner')
    })

    it('should fail if new address is already an owner', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const tx = safeSdk.getSwapOwnerTx(account1.address, account1.address)
      await chai.expect(tx).to.be.rejectedWith('New address provided is already an owner')
    })

    it('should replace the first owner of a Safe', async () => {
      const { accounts, contractNetworks } = await setupTests()
      const [account1, account2] = accounts
      const safe = await getSafeWithOwners([account1.address])
      const ethAdapter = await getEthAdapter(account1.signer)
      const safeSdk = await Safe.create({
        ethAdapter,
        safeAddress: safe.address,
        contractNetworks
      })
      const initialOwners = await safeSdk.getOwners()
      chai.expect(initialOwners.length).to.be.eq(1)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      const tx = await safeSdk.getSwapOwnerTx(account1.address, account2.address)
      const txResponse = await safeSdk.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const finalOwners = await safeSdk.getOwners()
      chai.expect(finalOwners.length).to.be.eq(1)
      chai.expect(finalOwners[0]).to.be.eq(account2.address)
    })

    it('should replace any owner of a Safe', async () => {
      const { safe, accounts, contractNetworks } = await setupTests()
      const [account1, account2, account3, account4] = accounts
      const ethAdapter1 = await getEthAdapter(account1.signer)
      const safeSdk1 = await Safe.create({
        ethAdapter: ethAdapter1,
        safeAddress: safe.address,
        contractNetworks
      })
      const ethAdapter2 = await getEthAdapter(account2.signer)
      const safeSdk2 = await safeSdk1.connect({ ethAdapter: ethAdapter2 })
      const ethAdapter3 = await getEthAdapter(account3.signer)
      const safeSdk3 = await safeSdk1.connect({ ethAdapter: ethAdapter3 })
      const initialOwners = await safeSdk1.getOwners()
      chai.expect(initialOwners.length).to.be.eq(3)
      chai.expect(initialOwners[0]).to.be.eq(account1.address)
      chai.expect(initialOwners[1]).to.be.eq(account2.address)
      chai.expect(initialOwners[2]).to.be.eq(account3.address)
      const tx = await safeSdk1.getSwapOwnerTx(account2.address, account4.address)
      await safeSdk2.signTransaction(tx)
      await safeSdk3.signTransaction(tx)
      const txResponse = await safeSdk1.executeTransaction(tx)
      await waitSafeTxReceipt(txResponse)
      const finalOwners = await safeSdk1.getOwners()
      chai.expect(finalOwners.length).to.be.eq(3)
      chai.expect(finalOwners[0]).to.be.eq(account1.address)
      chai.expect(finalOwners[1]).to.be.eq(account4.address)
      chai.expect(finalOwners[2]).to.be.eq(account3.address)
    })
  })
})
